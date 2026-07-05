import mongoose, { CallbackError, Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  ward?: string;
  phone?: string;
  avatar?: string;
  avatarPublicId?: string;
  fcmToken?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  refreshTokenHash?: string;
  notificationPreferences?: {
    email: {
      statusUpdates: boolean;
      comments: boolean;
      slaAlerts: boolean;
    };
    push: {
      statusUpdates: boolean;
      comments: boolean;
      slaAlerts: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): Omit<IUserDocument, 'password' | 'refreshTokenHash'>;
}

export interface IUserModel extends Model<IUserDocument> {
  // Static methods
  findByEmail(email: string): Promise<IUserDocument | null>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CITIZEN,
    },
    ward: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-().]{7,20}$/, 'Please provide a valid phone number'],
    },
    avatar: {
      type: String,
      trim: true,
    },
    avatarPublicId: {
      type: String,
      trim: true,
    },
    fcmToken: {
      type: String,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    notificationPreferences: {
      type: new Schema(
        {
          email: {
            statusUpdates: { type: Boolean, default: true },
            comments:      { type: Boolean, default: true },
            slaAlerts:     { type: Boolean, default: true },
          },
          push: {
            statusUpdates: { type: Boolean, default: true },
            comments:      { type: Boolean, default: false },
            slaAlerts:     { type: Boolean, default: true },
          },
        },
        { _id: false }
      ),
      default: () => ({
        email: { statusUpdates: true, comments: true, slaAlerts: true },
        push:  { statusUpdates: true, comments: false, slaAlerts: true },
      }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ ward: 1 });
UserSchema.index({ isActive: 1 });

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

UserSchema.pre(
  'save',
  async function (this: IUserDocument, next: (err?: CallbackError) => void) {
    if (!this.isModified('password')) return next();
    try {
      this.password = await bcrypt.hash(this.password, 12);
      next();
    } catch (err) {
      next(err as CallbackError);
    }
  },
);

// ─── Instance Methods ─────────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password as string);
};

UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.password;
  delete obj.refreshTokenHash;
  delete obj.fcmToken;
  return obj;
};

// ─── Static Methods ───────────────────────────────────────────────────────────

UserSchema.statics.findByEmail = function (
  email: string,
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase().trim() })
    .select('+password +refreshTokenHash')
    .exec();
};

// ─── Model ────────────────────────────────────────────────────────────────────

const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUserDocument, IUserModel>('User', UserSchema);

export default User;
