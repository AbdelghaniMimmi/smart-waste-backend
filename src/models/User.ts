import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "admin" | "driver" | "agent";
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "driver", "agent"],
    default: "driver"
  }
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);