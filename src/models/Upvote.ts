import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IUpvoteDocument extends Document {
  reportId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IUpvoteModel extends Model<IUpvoteDocument> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const UpvoteSchema = new Schema<IUpvoteDocument, IUpvoteModel>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Report reference is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Compound unique — one upvote per user per report
UpvoteSchema.index({ reportId: 1, userId: 1 }, { unique: true });

// ─── Model ────────────────────────────────────────────────────────────────────

const Upvote =
  (mongoose.models.Upvote as IUpvoteModel) ||
  mongoose.model<IUpvoteDocument, IUpvoteModel>('Upvote', UpvoteSchema);

export default Upvote;
