import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    console.log("Signup API called");
    await dbConnect();
    console.log("Database connected for signup");

    const { email, password, name } = await request.json();
    console.log("Signup attempt for email:", email);

    if (!email || !password) {
      console.log("Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    console.log("Existing user found:", !!existingUser);

    if (existingUser) {
      console.log("User already exists with email:", email.toLowerCase());
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Password hashed successfully");

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name?.trim() || null,
    });

    console.log("Attempting to save user...");
    const savedUser = await user.save();
    console.log("User saved successfully with ID:", savedUser._id);

    // Verify user was saved by finding it again
    const verifyUser = await User.findById(savedUser._id);
    console.log("User verification after save:", !!verifyUser);

    // Create JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data and token
    const userResponse = {
      id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      createdAt: savedUser.createdAt,
    };

    const response = NextResponse.json({
      message: "Account created successfully",
      user: userResponse,
      token,
    });

    // Set HTTP-only cookie with the token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("Signup response sent for user:", savedUser.email);
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
