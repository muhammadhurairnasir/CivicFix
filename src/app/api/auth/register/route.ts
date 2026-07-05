export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { authRateLimit } from '@/lib/rateLimit';
import { generateSecureToken } from '@/lib/auth';
import { setEmailVerifyToken } from '@/lib/redis';
import { sendVerificationEmail } from '@/lib/email';
import { ApiResponse } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await authRateLimit(req);
    if (!rateLimit.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    const user = new User({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password, // hashed in pre-save hook
      phone: validatedData.phone,
    });

    await user.save();

    const verifyToken = generateSecureToken();
    await setEmailVerifyToken(validatedData.email, verifyToken, 86400); // 24h
    await sendVerificationEmail(validatedData.email, validatedData.name, verifyToken);

    return NextResponse.json<ApiResponse>(
      { 
        success: true, 
        message: 'Registration successful. Please check your email to verify your account.',
        data: { user: user.toSafeObject() }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation failed', errors: error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }
    return handleApiError(error, 'Register API');
  }
}
