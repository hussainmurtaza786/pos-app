import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import * as yup from 'yup';
import { Product } from '@prisma/client';
import { generateUniqueNumber } from '../utils';

// -------------------------
// SCHEMAS
// -------------------------
const AddProductSchema = yup.object({
  name: yup.string().required(),
  sku: yup.string().required(),
  description: yup.string().nullable(),
  price: yup.number().required(),
});

const GetProductsSchema = yup.object({
  search: yup.string().nullable().default(null),
});

// -------------------------
// TYPES
// -------------------------
export type ProductPutInput = yup.InferType<typeof AddProductSchema>;

export interface ProductPutOutput {
  data: Product;
}

export type ProductsGetInput = yup.InferType<typeof GetProductsSchema>;

export interface ProductsGetOutput {
  data: {
    items: Product[];
    count: number;
  };
}

// -------------------------
// GET: All products
// -------------------------
// -------------------------
// GET: All products (with search via name or sku)
// -------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = GetProductsSchema.validateSync(
      Object.fromEntries(searchParams.entries()),
      { stripUnknown: true, abortEarly: false }
    );

    const { search } = input;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, count] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, email: true, phone: true },
          },
          Category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ data: { items, count } } as ProductsGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}


// -------------------------
// PUT: Create product
// -------------------------
export async function PUT(req: NextRequest) {
  try {
    const input = AddProductSchema.validateSync(await req.json(), {
      abortEarly: false,
      stripUnknown: true,
    });

    const createdById = '50934ed1-cbe2-4603-b1ed-7255f93bfd80'; // replace with token-based ID later

    const newProduct = await prisma.product.create({
      data: {
        id: `prdct-${generateUniqueNumber()}`,
        name: input.name,
        sku: input.sku,
        description: input.description ?? null,
        price: input.price,
        createdById,
      },
    });

    return NextResponse.json({ data: newProduct } as ProductPutOutput, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.errors[0] },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}
