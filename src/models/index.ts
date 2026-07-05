import mongoose, { Document, Model, Schema } from 'mongoose';

// ─── Counter Model (for atomic ticket number generation) ──────────────────────

export interface ICounterDocument extends Document {
  name: string;
  seq: number;
}

export interface ICounterModel extends Model<ICounterDocument> {}

const CounterSchema = new Schema<ICounterDocument, ICounterModel>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

CounterSchema.index({ name: 1 }, { unique: true });

export const Counter =
  (mongoose.models.Counter as ICounterModel) ||
  mongoose.model<ICounterDocument, ICounterModel>('Counter', CounterSchema);

// ─── Model Exports ────────────────────────────────────────────────────────────

export { default as User } from './User';
export { default as Report } from './Report';
export { default as Ticket } from './Ticket';
export { default as Upvote } from './Upvote';
export { default as Comment } from './Comment';
export { default as Notification } from './Notification';

// ─── Document Type Re-exports ─────────────────────────────────────────────────

export type { IUserDocument, IUserModel } from './User';
export type { IReportDocument, IReportModel, IReportPhoto, IReportMetadata } from './Report';
export type { ITicketDocument, ITicketModel, IRepairPhoto, ITicketNote } from './Ticket';
export type { IUpvoteDocument, IUpvoteModel } from './Upvote';
export type { ICommentDocument, ICommentModel } from './Comment';
export type {
  INotificationDocument,
  INotificationModel,
  NotificationChannel,
} from './Notification';
