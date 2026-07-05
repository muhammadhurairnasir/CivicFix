import mongoose, { CallbackError, Document, Model, Schema, Types } from 'mongoose';
import { ReportStatus, ReportType, Severity } from '@/types';

// ─── Sub-document Interfaces ──────────────────────────────────────────────────

export interface IReportPhoto {
  url: string;
  publicId: string;
  uploadedAt: Date;
}

export interface IReportMetadata {
  deviceOS?: string;
  capturedAt?: Date;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IReportDocument extends Document {
  ticketNumber: string;
  reporterId: Types.ObjectId;
  title: string;
  description: string;
  type: ReportType;
  severity: Severity;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  ward: string;
  photos: IReportPhoto[];
  status: ReportStatus;
  upvoteCount: number;
  viewCount: number;
  isVerified: boolean;
  tags: string[];
  metadata: IReportMetadata;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportModel extends Model<IReportDocument> {}

// ─── Photo Sub-schema ─────────────────────────────────────────────────────────

const ReportPhotoSchema = new Schema<IReportPhoto>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

// ─── GeoJSON Location Schema ──────────────────────────────────────────────────

const LocationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) =>
          v.length === 2 &&
          v[0] >= -180 && v[0] <= 180 && // longitude
          v[1] >= -90  && v[1] <= 90,    // latitude
        message: 'Coordinates must be [longitude, latitude] within valid ranges.',
      },
    },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const ReportSchema = new Schema<IReportDocument, IReportModel>(
  {
    ticketNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: [true, 'Report type is required'],
    },
    severity: {
      type: String,
      enum: Object.values(Severity),
      required: [true, 'Severity is required'],
    },
    location: {
      type: LocationSchema,
      required: [true, 'Location is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address must be at most 300 characters'],
    },
    ward: {
      type: String,
      required: [true, 'Ward is required'],
      trim: true,
    },
    photos: {
      type: [ReportPhotoSchema],
      default: [],
      validate: {
        validator: (v: IReportPhoto[]) => v.length <= 10,
        message: 'A report may have at most 10 photos.',
      },
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.OPEN,
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      deviceOS: { type: String },
      capturedAt: { type: Date },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

ReportSchema.index({ location: '2dsphere' });
ReportSchema.index({ status: 1 });
ReportSchema.index({ severity: 1 });
ReportSchema.index({ ward: 1 });
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ ticketNumber: 1 }, { unique: true });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ isDeleted: 1, status: 1 }); // compound for soft-delete queries

// ─── Pre-save: Ticket Number Generation ──────────────────────────────────────

ReportSchema.pre(
  'save',
  async function (this: IReportDocument, next: (err?: CallbackError) => void) {
    if (!this.isNew || this.ticketNumber) return next();

    try {
      const Counter = mongoose.models.Counter as mongoose.Model<{
        name: string;
        seq: number;
      }>;

      const year = new Date().getFullYear();
      const counterName = `report-${year}`;

      const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      if (!counter) {
        return next(new Error('Failed to generate ticket number: counter unavailable'));
      }

      const padded = String(counter.seq).padStart(5, '0');
      this.ticketNumber = `RPT-${year}-${padded}`;
      next();
    } catch (err) {
      next(err as CallbackError);
    }
  },
);

// ─── Model ────────────────────────────────────────────────────────────────────

const Report =
  (mongoose.models.Report as IReportModel) ||
  mongoose.model<IReportDocument, IReportModel>('Report', ReportSchema);

export default Report;
