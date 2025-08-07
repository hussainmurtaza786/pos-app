import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as yup from 'yup';
import bcrypt from 'bcryptjs';
import prisma from '@/prisma/client';
import { User } from '@prisma/client';

const LoginSchema = yup
  .object({
    email: yup.string().email().nullable(),
    phone: yup.string().matches(/^\+?\d{10,15}$/, 'Invalid phone number format'),
    password: yup.string().required(),
  })
  .test('emailOrPhone', 'Email or phone is required', (value) => {
    return !!value.email || !!value.phone;
  });

export type LoginInput = yup.InferType<typeof LoginSchema>;

export interface LoginOutput {
  data: {
    userDetails: Omit<User, 'password'>;
    token: string;
  };
}

interface UserJWT {
  id: string;
  email: string | null;
  type: 'Staff';
}

// ==========================
// 🔐 POST - Login Handler
// ==========================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, phone, password } = await LoginSchema.validate(body, {
      stripUnknown: true,
      abortEarly: false,
    });

    // ✅ Find user by email or phone
    const userDetails = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, userDetails.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const payload: UserJWT = {
      id: userDetails.id,
      email: userDetails.email,
      type: 'Staff',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '1d',
    });

    const { password: _, ...userWithoutPassword } = userDetails;

    return NextResponse.json(
      {
        data: {
          userDetails: userWithoutPassword,
          token,
        },
      } satisfies LoginOutput,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error?.errors || error.message },
      { status: 400 }
    );
  }
}
