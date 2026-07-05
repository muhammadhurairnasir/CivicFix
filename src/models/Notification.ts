import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { NotificationType } from '@/types';

// ─── Sent-via Channel Enum ────────────────────────────────────────────────────

export const NotificationChannel = {
  PUSH:  'push',
  EMAIL: 'email',
  SMS:   'sms',
} as const;
export type NotificationChannel =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

// ─── Interface ────────────────────────────────────────────────────────────────

export interface INotificationDocument extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  reportId?: Types.ObjectId;
  isRead: boolean;
  sentVia: NotificationChannel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationModel extends Model<INotificationDocument> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const NotificationSchema = new Schema<INotificationDocument, INotificationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      trim: true,
      maxlength: [500, 'Body must be at most 500 characters'],
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentVia: {
      type: [String],
      enum: Object.values(NotificationChannel),
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary query pattern: fetch unread notifications for a user
NotificationSchema.index({ userId: 1, isRead: 1 });
// TTL-friendly ordering for notification feed
NotificationSchema.index({ createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Notification =
  (mongoose.models.Notification as INotificationModel) ||
  mongoose.model<INotificationDocument, INotificationModel>(
    'Notification',
    NotificationSchema,
  );

export default Notification;
