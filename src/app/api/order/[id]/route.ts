import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { Order, Status } from "@prisma/client";

// -------------------------
// Types
// -------------------------
export interface OrderGetOutput {
  data: Order;
}

const UpdateOrderSchema = yup.object({
  id: yup.number().required(),
  description: yup.string().nullable(),
  discount: yup.number().required(),
  status: yup.mixed<Status>(),
  amountReceived: yup.number().required(),
});
export type OrderPostInput = yup.InferType<typeof UpdateOrderSchema>;

export interface OrderPostOutput {
  data: Order;
}
export interface OrderDeleteOutput {
  data: Order;
}

// -------------------------
// GET: Get order by ID
// -------------------------
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.order.findUnique({
      where: { id: Number(params.id) },
      include: {
        ProductInOrder: {
          include: {
            product: { include: { category: true } },
            inventory: true,
          }
        },

        createdBy: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: item } as OrderGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server Error", message: error.message },
      { status: 500 }
    );
  }
}

// -------------------------
// POST: Update order by ID
// -------------------------
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: orderId } = params;

    const data = UpdateOrderSchema.validateSync(
      { ...(await req.json()), id: Number(orderId) },
      { stripUnknown: true, abortEarly: false }
    );

    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId) },
    });
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        description: data.description,
        // discount: data.discount,
        // amountReceived: data.amountReceived,
        status: data.status as Status,
      },
      include: {
        ProductInOrder: {
          include: {
            product: {include: { category: true } },
            inventory: true,
          },
        },

        createdBy: {
          select: { id: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ data: updated } as OrderPostOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation Error", message: error.errors[0] },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Server Error", message: error.message },
      { status: 500 }
    );
  }
}

// -------------------------
// DELETE: Delete order by ID
// -------------------------
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ data: order } as OrderDeleteOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: "API input error", message: error.errors[0] },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong", message: error.message },
      { status: 500 }
    );
  }
}
