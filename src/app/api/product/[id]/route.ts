import prisma from '@/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import * as yup from 'yup';
import { Product } from '@prisma/client';

// -------------------------
// Types
// -------------------------
export interface ProductGetOutput {
  data: Product;
}

const UpdateProductSchema = yup.object({
  id: yup.string().required(),
  name: yup.string().required(),
  sku: yup.string().required(),
  description: yup.string().nullable(),
  price: yup.number().required(),
});

export type ProductPostInput = yup.InferType<typeof UpdateProductSchema>;

export interface ProductPostOutput {
  data: Product;
}

export interface ProductDeleteOutput {
  data: Product;
}

// -------------------------
// GET: Get product by ID
// -------------------------
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        Category: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item } as ProductGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

// -------------------------
// POST: Update product
// -------------------------
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const input = UpdateProductSchema.validateSync(await req.json(), {
      abortEarly: false,
      stripUnknown: true,
    });

    const existing = await prisma.product.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: input.name,
        sku: input.sku,
        description: input.description ?? '',
        price: input.price,
      },
    });

    return NextResponse.json({ data: updated } as ProductPostOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: 'Validation Error', message: error.errors[0] }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

// -------------------------
// DELETE: Delete product
// -------------------------
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.product.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const deleted = await prisma.product.delete({ where: { id: params.id } });

    return NextResponse.json({ data: deleted } as ProductDeleteOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}
