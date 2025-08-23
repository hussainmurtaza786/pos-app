import prisma from '@/prisma/client';
import { ProductInOrder } from '@/prisma/customTypes';


import { NextRequest, NextResponse } from 'next/server';
import * as yup from 'yup';

// -------------------------
// Types
// -------------------------
export interface ProductInOrderGetOutput {
  data: ProductInOrder;
}

const UpdateProductInOrderSchema = yup.object({
  id: yup.object({
    orderId: yup.number().required(),
    productId: yup.string().required(),
  }),
  inventoryId: yup.string().nullable(),
  returnOrderId: yup.number().nullable(),
  quantity: yup.number().required(),
  sellPrice: yup.number().required(),
});

export type ProductInOrderPostInput = yup.InferType<typeof UpdateProductInOrderSchema>;

export interface ProductInOrderPostOutput {
  data: ProductInOrder;
}

export interface ProductInOrderDeleteOutput {
  data: ProductInOrder;
}

// -------------------------
// GET: Get ProductInOrder by (orderId, productId)
// -------------------------
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // id format: "orderId-productId"
    const [orderIdStr, productId] = params.id.split("-");
    const orderId = parseInt(orderIdStr);

    const item = await prisma.productInOrder.findUnique({
      where: {
        orderId_productId: { orderId, productId },
      },
      include: {
        product: true,
        inventory: true,
        order: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'ProductInOrder not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item } as ProductInOrderGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

// -------------------------
// POST: Update ProductInOrder by composite key
// -------------------------
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [orderIdStr, productId] = params.id.split("-");
    const orderId = parseInt(orderIdStr);

    const { inventoryId, returnOrderId, quantity, sellPrice } =
      UpdateProductInOrderSchema.validateSync(
        { ...(await req.json()), id: { orderId, productId } },
        { stripUnknown: true, abortEarly: false }
      );

    const existing = await prisma.productInOrder.findUnique({
      where: { orderId_productId: { orderId, productId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "ProductInOrder not found" }, { status: 404 });
    }

    const updated = await prisma.productInOrder.update({
      where: { orderId_productId: { orderId, productId } },
      data: {
        inventoryId,
        quantity,
        sellPrice,
      },
    });

    return NextResponse.json({ data: updated } as ProductInOrderPostOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: 'Validation Error', message: error.errors[0] }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

// -------------------------
// DELETE: Delete ProductInOrder by composite key
// -------------------------
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [orderIdStr, productId] = params.id.split("-");
    const orderId = parseInt(orderIdStr);

    const deleted = await prisma.productInOrder.delete({
      where: { orderId_productId: { orderId, productId } },
    });

    return NextResponse.json({ data: deleted } as ProductInOrderDeleteOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: "API input error", message: error.errors[0] }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong", message: error.message }, { status: 500 });
  }
}
