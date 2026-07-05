import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ICommentDocument extends Document {
  reportId: Types.ObjectId;
  authorId: Types.ObjectId;
  text: string;
  isOfficial: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentModel extends Model<ICommentDocument> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CommentSchema = new Schema<ICommentDocument, ICommentModel>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Report reference is required'],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment must be at most 1000 characters'],
    },
    isOfficial: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

CommentSchema.index({ reportId: 1, createdAt: -1 });
CommentSchema.index({ authorId: 1 });
CommentSchema.index({ isDeleted: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Comment =
  (mongoose.models.Comment as ICommentModel) ||
  mongoose.model<ICommentDocument, ICommentModel>('Comment', CommentSchema);

export default Comment;
