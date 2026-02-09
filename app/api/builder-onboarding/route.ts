import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import { authOptions } from '@/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to get user email from either auth-token or NextAuth session
async function getAuthenticatedUserEmail(request: NextRequest): Promise<string | null> {
  // First, try auth-token cookie (traditional login)
  const token = request.cookies.get('auth-token')?.value;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      await dbConnect();
      const user = await User.findById(decoded.userId).lean() as IUser | null;
      if (user?.email) {
        return user.email;
      }
    } catch {
      // Token invalid, try NextAuth
    }
  }
  
  // Try NextAuth session (Google login)
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }
  
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const email = await getAuthenticatedUserEmail(req);
    
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email }).lean() as IUser | null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      builderOnboardingCompleted: user.builderOnboardingCompleted ?? false,
    });
  } catch (error: any) {
    console.error('[Builder Onboarding GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get onboarding status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await getAuthenticatedUserEmail(req);
    
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { completed } = await req.json();

    await dbConnect();
    
    const user = await User.findOneAndUpdate(
      { email },
      { builderOnboardingCompleted: completed === true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      builderOnboardingCompleted: user.builderOnboardingCompleted,
    });
  } catch (error: any) {
    console.error('[Builder Onboarding POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}
