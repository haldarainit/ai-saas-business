import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/lib/models/User";
import { getAuthenticatedUser } from "@/lib/get-auth-user";

export async function getCurrentUser(request?: Request): Promise<IUser | null> {
  const { userId, email } = await getAuthenticatedUser(request);

  if (!userId && !email) {
    return null;
  }

  await dbConnect();

  let user: IUser | null = null;

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId);
  }

  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase() });
  }

  return user;
}
