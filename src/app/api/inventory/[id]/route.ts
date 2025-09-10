import prisma from '@/prisma/client';
import { Inventory } from '@/prisma/customTypes';
import { NextRequest, NextResponse } from 'next/server';
import * as yup from 'yup';

// -------------------------
// Types
// -------------------------
export interface InventoryGetOutput {
  data: Inventory;
}
const UpdateInventorySchema = yup.object({
  id: yup.string().required(),
  productId: yup.string().required(),
  quantity: yup.number().required(),
  purchasePrice: yup.number().required(),
})

export type InventoryPostInput = yup.InferType<typeof UpdateInventorySchema>;

export interface InventoryPostOutput {
  data: Inventory;
}

export interface InventoryDeleteOutput {
  data: Inventory;
}

// -------------------------
// GET: Get inventory by ID
// -------------------------
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: {
        product: true,
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
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item } as InventoryGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

// -------------------------
// POST: Update inventory by ID
// -------------------------
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // const user = await verifyAuthorization(req.headers, ['Admin', 'Staff']);
    const { id: inventoryId } = await params;
    const { productId, purchasePrice, quantity, } =
      UpdateInventorySchema.validateSync({ ...(await req.json()), id: inventoryId }, { stripUnknown: true, abortEarly: false, });


    const existingInventory = await prisma.inventory.findUnique({ where: { id: inventoryId } });

    if (!existingInventory) {
      return Response.json({ error: "Inventory not found" }, { status: 404 });
    }
    const qtyDiff = quantity - existingInventory.purchasedQuantity;

    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        productId, purchasePrice,
        availableQuantity: existingInventory.availableQuantity + qtyDiff,
        purchasedQuantity: quantity,
      },
    });

    return NextResponse.json({ data: updated } as InventoryPostOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: 'Validation Error', message: error.errors[0] }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
  }
}

// -------------------------
// DELETE: Delete inventory by ID
// -------------------------
// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     // const user = await verifyAuthorization(req.headers, ['Admin', 'Staff']);
//     const { id } = await params;

//     // const existing = await prisma.inventory.findUnique({ where: { id: params.id } });
//     const inventory: Inventory = await prisma.inventory.delete({ where: { id } });

//     // if (!existing) {
//     //   return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
//     // }

//     const deleted = await prisma.inventory.delete({
//       where: { id: params.id },
//     });

//     return NextResponse.json({ data: deleted } as InventoryDeleteOutput, { status: 200 });
//   } catch (error: any) {
//     if (error.errors)
//       return Response.json({ error: "API input error", message: error.errors[0] }, { status: 400 });

//     return Response.json({ error: "Something went wrong", message: error.message }, { status: 500 });
//   }
// }


export interface InventoryDeleteOutput {
  data: Inventory
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // const user = await verifyAuthorization<'Admin'>(req.headers, ['Admin']);
    const { id } = await params;
    console.log("Inventory ID ===>", id);

    // if (user.access.Inventory.delete === false) {
    //     return Response.json({ error: "You are not authorized to access this API" }, { status: 403 });
    // }

    const inventory: Inventory = await prisma.inventory.delete({ where: { id } });

    return Response.json({ data: inventory } as InventoryDeleteOutput, { status: 201 });
  } catch (error: any) {
    if (error.errors)
      return Response.json({ error: "API input error", message: error.errors[0] }, { status: 400 });

    return Response.json({ error: "Something went wrong", message: error.message }, { status: 500 });
  }
}

