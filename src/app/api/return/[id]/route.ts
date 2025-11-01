// /api/return/[id]/route.ts
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { ReturnOrder } from "@prisma/client";

// -------------------------
// Types
// -------------------------
export interface ReturnGetOutput {
  data: ReturnOrder;
}

const UpdateReturnSchema = yup.object({
  id: yup.number().required(),
  description: yup.string().nullable(),
});
export type ReturnPostInput = yup.InferType<typeof UpdateReturnSchema>;

export interface ReturnPostOutput {
  data: ReturnOrder;
}
export interface ReturnDeleteOutput {
  data: ReturnOrder;
}

// -------------------------
// GET: Get return order by ID
// -------------------------
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.returnOrder.findUnique({
      where: { id: (params.id) }, // now using ReturnOrder.id
      include: {
        ReturnOrderProduct: {
          include: {
            product: true,
          },
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
      return NextResponse.json({ error: "Return order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: item } as ReturnGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server Error", message: error.message },
      { status: 500 }
    );
  }
}

// -------------------------
// POST: Update return order by ID
// -------------------------
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const data = UpdateReturnSchema.validateSync(
      { ...(await req.json()), id: Number(id) },
      { stripUnknown: true, abortEarly: false }
    );

    const existing = await prisma.returnOrder.findUnique({
      where: { id: (id) },
    });
    if (!existing) {
      return NextResponse.json({ error: "Return order not found" }, { status: 404 });
    }

    const updated = await prisma.returnOrder.update({
      where: { id: (id) },
      data: {
        description: data.description,
      },
      include: {
        ReturnOrderProduct: {
          include: { product: true },
        },
        createdBy: {
          select: { id: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ data: updated } as ReturnPostOutput, { status: 200 });
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
// DELETE: Delete return order by ID
// -------------------------
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const returnOrder = await prisma.returnOrder.delete({
      where: { id: (params.id) }, // using id now
    });

    return NextResponse.json({ data: returnOrder } as ReturnDeleteOutput, { status: 200 });
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
