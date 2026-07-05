import mongoose, { CallbackError, Document, Model, Schema, Types } from 'mongoose';
import { TicketPriority, TicketStatus } from '@/types';

// ─── SLA Configuration (hours → milliseconds) ─────────────────────────────────

const SLA_HOURS: Record<TicketPriority, number> = {
  [TicketPriority.URGENT]: 4,
  [TicketPriority.HIGH]:   24,
  [TicketPriority.MEDIUM]: 72,
  [TicketPriority.LOW]:    168,
};

// ─── Sub-document Interfaces ──────────────────────────────────────────────────

export interface IRepairPhoto {
  url: string;
  publicId: string;
  takenAt: Date;
  takenBy: Types.ObjectId;
}

export interface ITicketNote {
  text: string;
  author: Types.ObjectId;
  createdAt: Date;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ITicketDocument extends Document {
  reportId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedBy: Types.ObjectId;
  priority: TicketPriority;
  slaDeadline: Date;
  slaBreached: boolean;
  status: TicketStatus;
  repairPhotos: IRepairPhoto[];
  notes: ITicketNote[];
  estimatedCost?: number;
  actualCost?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketModel extends Model<ITicketDocument> {}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const RepairPhotoSchema = new Schema<IRepairPhoto>(
  {
    url:       { type: String, required: true },
    publicId:  { type: String, required: true },
    takenAt:   { type: Date,   default: () => new Date() },
    takenBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false },
);

const TicketNoteSchema = new Schema<ITicketNote>(
  {
    text:      { type: String, required: true, maxlength: 2000 },
    author:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const TicketSchema = new Schema<ITicketDocument, ITicketModel>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Report reference is required'],
      unique: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned-by reference is required'],
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      required: [true, 'Priority is required'],
    },
    slaDeadline: {
      type: Date,
      required: true,
    },
    slaBreached: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.PENDING,
    },
    repairPhotos: {
      type: [RepairPhotoSchema],
      default: [],
    },
    notes: {
      type: [TicketNoteSchema],
      default: [],
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
    },
    actualCost: {
      type: Number,
      min: [0, 'Actual cost cannot be negative'],
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

TicketSchema.virtual('isOverdue').get(function () {
  return !this.completedAt && new Date() > this.slaDeadline;
});

TicketSchema.virtual('slaTotalHours').get(function () {
  return SLA_HOURS[this.priority] ?? null;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

TicketSchema.index({ reportId: 1 },     { unique: true });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ slaDeadline: 1 });
TicketSchema.index({ slaBreached: 1 });

// ─── Pre-save: SLA Deadline Calculation ──────────────────────────────────────

TicketSchema.pre(
  'save',
  function (this: ITicketDocument, next: (err?: CallbackError) => void) {
    // Recalculate slaDeadline whenever priority changes or on new doc
    if (this.isNew || this.isModified('priority')) {
      const hours = SLA_HOURS[this.priority];
      const deadline = new Date();
      deadline.setTime(deadline.getTime() + hours * 60 * 60 * 1000);
      this.slaDeadline = deadline;
    }

    // Auto-mark SLA breached
    if (!this.completedAt && new Date() > this.slaDeadline) {
      this.slaBreached = true;
    }

    next();
  },
);

// ─── Model ────────────────────────────────────────────────────────────────────

const Ticket =
  (mongoose.models.Ticket as ITicketModel) ||
  mongoose.model<ITicketDocument, ITicketModel>('Ticket', TicketSchema);

export default Ticket;
