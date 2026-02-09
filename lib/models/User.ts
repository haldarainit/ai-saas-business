import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  email: string;
  password?: string;
  name?: string;
  googleId?: string;
  authProvider?: "local" | "google";
  image?: string;
  onboardingCompleted?: boolean;
  builderOnboardingCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Not required for Google OAuth users
    },
    name: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    image: {
      type: String,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    builderOnboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Remove duplicate index - unique: true already creates an index
// UserSchema.index({ email: 1 })

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
