import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import * as yup from 'yup';
import { Product } from '@prisma/client';
import { generateUniqueNumber } from '../utils';
import { Inventory } from '@/prisma/customTypes';

// -------------------------
// SCHEMAS
// -------------------------
const AddInventorySchema = yup.object({
  productId: yup.string().required(),
  name: yup.string().required(),
  description: yup.string().nullable(),
  quantity: yup.number().required(),
  purchasePrice: yup.number().required(),
});

const GetInventoriesSchema = yup.object({
    searchField: yup.string().oneOf<keyof Product>(['name', 'sku']),

});

// -------------------------
// TYPES
// -------------------------
export type InventoryPutInput = yup.InferType<typeof AddInventorySchema>;

export interface InventoryPutOutput {
  data: Inventory;
}

export type InventoriesGetInput = yup.InferType<typeof GetInventoriesSchema>;

export interface InventoriesGetOutput {
  data: {
    items: Inventory[];
    count: number;
  };
}

// -------------------------
// GET: All inventory (no pagination)
// -------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = GetInventoriesSchema.validateSync(
      Object.fromEntries(searchParams.entries()),
      { stripUnknown: true, abortEarly: false }
    );

    const { searchField } = input;

    const where: any = {};
    if (searchField) {
      where.name = { contains: searchField, mode: 'insensitive' };
    }

    const [items, count] = await prisma.$transaction([
      prisma.inventory.findMany({
        where,
        include: {
          product: true,
          createdBy: {
            select: { id: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    return NextResponse.json({ data: { items, count } } as InventoriesGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// -------------------------
// PUT: Create inventory
// -------------------------
export async function PUT(req: NextRequest) {
  try {
    const input = AddInventorySchema.validateSync(await req.json(), {
      abortEarly: false,
      stripUnknown: true,
    });

    // TODO: Replace below with actual logged-in user's ID
    const createdById = '50934ed1-cbe2-4603-b1ed-7255f93bfd80'; // e.g. from token or session

    const newInventory = await prisma.inventory.create({
      data: {
        id: `invtry-${generateUniqueNumber()}`,
        name: input.name,
        description: input.description ?? null,
        purchasedQuantity: input.quantity,
        availableQuantity: input.quantity,
        purchasePrice: input.purchasePrice,
        productId: input.productId ?? '22',
        createdById,
      },
    });

    return NextResponse.json({ data: newInventory } as InventoryPutOutput, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: 'Validation error', message: error.errors[0] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}
