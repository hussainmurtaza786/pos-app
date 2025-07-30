import { User } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as yup from 'yup';
import bcrypt from 'bcryptjs';
import prisma from '@/prisma/client';
import { v4 as uuidv4 } from 'uuid';

const LoginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
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
  email: string;
  type: 'User';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.validateSync(body, {
      stripUnknown: true,
      abortEarly: false,
    });

    const userDetails = await prisma.user.findUnique({
      where: { email },
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
      type: 'User',
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
    return NextResponse.json({ error: 'Login failed' }, { status: 400 });
  }
}



// export async function PUT(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { email, password } = body;

//     if (!email || !password) {
//       return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const createdUser = await prisma.user.create({
//       data: {
//         id: uuidv4(),
//         email,
//         password: hashedPassword,
//       },
//     });

//     return NextResponse.json(
//       { message: 'User created successfully', user: { id: createdUser.id, email: createdUser.email } },
//       { status: 201 }
//     );
//   } catch (err: any) {
//     console.error('Error creating user:', err);
//     return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
//   }
// }