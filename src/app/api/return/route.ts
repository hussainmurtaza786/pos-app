// /api/return/route.ts
import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import { parseQueryParams } from "../utils";
import { verifyAuthorization } from "@/utils";
import { Prisma } from "@prisma/client";
import { ReturnOrder } from "@/prisma/customTypes";

/* =====================
   Validation Schemas
===================== */
// Accept optional returnAmount (cash given back to customer).
// If missing or invalid, we will compute it from products on the server.
const AddReturnSchema = yup.object({
  description: yup.string().nullable(),
  returnAmount: yup.number().nullable(), // NEW
  products: yup
    .array()
    .of(
      yup.object({
        productId: yup.string().required(),
        quantity: yup.number().required(),
        sellPrice: yup.number().required(),
      })
    )
    .required()
    .min(1, "At least one product is required"),
});
export type ReturnPutInput = yup.InferType<typeof AddReturnSchema>;

/* =====================
   API Types
===================== */
export interface ReturnPutOutput {
  data: ReturnOrder;
}
export interface ReturnsGetOutput {
  data: { count: number; items: ReturnOrder[] };
}

/* =====================
   PUT / Create
   - Validates that returned qty ≤ sold qty
   - Increments inventory
   - Persists returnAmount (cash returned to customer)
===================== */
export async function PUT(req: NextRequest) {
  try {
    const { description, products, returnAmount } = AddReturnSchema.validateSync(
      await req.json(),
      { stripUnknown: true, abortEarly: false }
    );

    const user = await verifyAuthorization(req);
    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Compute subtotal from line items
    const computedSubtotal = products.reduce(
      (sum, p) => sum + Number(p.sellPrice || 0) * Number(p.quantity || 0),
      0
    );
    const finalReturnAmount =
      typeof returnAmount === "number" && returnAmount >= 0
        ? returnAmount
        : computedSubtotal;

    const returnOrder = await prisma.$transaction(
      async (tx) => {
        // VALIDATION: ensure requested return qty ≤ sold qty
        // sold qty per product = SUM(purchasedQuantity - availableQuantity)
        for (const line of products) {
          const invRows = await tx.inventory.findMany({
            where: { createdById: user.id, productId: line.productId },
            select: { purchasedQuantity: true, availableQuantity: true },
          });

          const sold = invRows.reduce(
            (s, r) => s + (r.purchasedQuantity - r.availableQuantity),
            0
          );

          if (line.quantity > sold) {
            throw new Error(
              `INVALID_RETURN:${line.productId}:${sold}:${line.quantity}`
            );
          }
        }

        // Increment available quantity across all inventories for that product+user
        for (const line of products) {
          await tx.inventory.updateMany({
            where: { createdById: user.id, productId: line.productId },
            data: { availableQuantity: { increment: line.quantity } },
          });
        }

        // Create the return order and line items
        return tx.returnOrder.create({
          data: {
            description,

            returnAmount: finalReturnAmount, // <- persist cash returned
            createdById: user.id,
            ReturnOrderProduct: {
              createMany: {
                data: products.map((p) => ({
                  productId: p.productId,
                  quantity: p.quantity,
                  sellPrice: p.sellPrice,
                })),
              },
            },
          },
          include: {
            ReturnOrderProduct: { include: { product: true } },
            createdBy: { select: { id: true, email: true, phone: true } },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return Response.json({ data: returnOrder } as ReturnPutOutput, {
      status: 201,
    });
  } catch (error: any) {
    if (
      typeof error?.message === "string" &&
      error.message.startsWith("INVALID_RETURN:")
    ) {
      const [, productId, available, requested] = error.message.split(":");
      return Response.json(
        {
          error: "Invalid return",
          message: `Product ${productId} was only sold in quantity ${available}, attempted to return ${requested}.`,
        },
        { status: 409 }
      );
    }
    if (error?.errors) {
      return Response.json(
        { error: "API input error", message: error.errors[0] },
        { status: 400 }
      );
    }
    return Response.json(
      { error: "Something went wrong", message: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/* =====================
   GET / List (Paginated)
===================== */
const GetReturnsSchema = yup.object({
  pageNumber: yup.number(),
  pageSize: yup.number(),
  search: yup.string(),
  // search by id (ReturnOrder.id) or description
  searchField: yup.string().oneOf(["id", "description"]),
});
export type ReturnsGetInput = yup.InferType<typeof GetReturnsSchema>;

export async function GET(req: NextRequest) {
  try {
    const {
      pageNumber = 1,
      pageSize = 10,
      search = "",
      searchField = "id",
    } = GetReturnsSchema.validateSync(parseQueryParams(req), {
      stripUnknown: true,
      abortEarly: false,
    });

    const user = await verifyAuthorization(req);
    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Record<string, any> = { createdById: user.id };
    if (search && searchField === "id") {
      where["id"] = { equals: Number(search.trim()) };
    } else if (search) {
      where[searchField] = { contains: search.trim(), mode: "insensitive" };
    }

    const [returns, count] = await prisma.$transaction([
      prisma.returnOrder.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        include: {
          ReturnOrderProduct: { include: { product: true } },
          createdBy: { select: { id: true, email: true, phone: true } },
        },
      }),
      prisma.returnOrder.count({ where }),
    ]);

    return Response.json(
      { data: { count, items: returns } } as ReturnsGetOutput,
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.errors) {
      return Response.json(
        { error: "API input error", message: error.errors[0] },
        { status: 400 }
      );
    }
    return Response.json(
      { error: "Something went wrong", message: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
