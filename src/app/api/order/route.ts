import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import { generateUniqueNumber, parseQueryParams } from "../utils";
import { verifyAuthorization } from "@/utils";
import { Status, Prisma } from "@prisma/client";
import { Order } from "@/prisma/customTypes";

// =====================
// Validation Schemas
// =====================
const AddOrderSchema = yup.object({
  description: yup.string().nullable(),
  discount: yup.number().required(),
  amountReceived: yup.number().required(),
  status: yup.mixed<Status>(),
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
export type OrderPutInput = yup.InferType<typeof AddOrderSchema>;

// =====================
// API Types
// =====================
export interface OrderPutOutput {
  data: Order;
}
export interface OrdersGetOutput {
  data: { count: number; items: Order[] };
}

// =====================
// CREATE (PUT) with stock check + deduction
// =====================
export async function PUT(req: NextRequest) {
  try {
    const { description, discount, amountReceived, products, status } =
      AddOrderSchema.validateSync(await req.json(), {
        stripUnknown: true,
        abortEarly: false,
      });

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const productIds = products.map((p) => p.productId);
        const inventories = await tx.inventory.findMany({
          where: { createdById: user.id, productId: { in: productIds } },
          select: { id: true, productId: true, availableQuantity: true },
        });

        const byProduct = new Map<string, typeof inventories>();
        for (const inv of inventories) {
          const existing = byProduct.get(inv.productId) || [];
          existing.push(inv);
          byProduct.set(inv.productId, existing);
        }

        // validate availability — sum all batches per product
        for (const line of products) {
          const batches = byProduct.get(line.productId) || [];
          const totalAvailable = batches.reduce((sum, b) => sum + b.availableQuantity, 0);
          if (totalAvailable < line.quantity) {
            throw new Error(
              `OUT_OF_STOCK:${line.productId}:${totalAvailable}:${line.quantity}`
            );
          }
        }

        // deduct stock — use batches in order (FIFO)
        for (const line of products) {
          const batches = byProduct.get(line.productId) || [];
          let remaining = line.quantity;
          for (const batch of batches) {
            if (remaining <= 0) break;
            const deduct = Math.min(batch.availableQuantity, remaining);
            if (deduct > 0) {
              await tx.inventory.update({
                where: { id: batch.id },
                data: { availableQuantity: { decrement: deduct } },
              });
              remaining -= deduct;
            }
          }
        }

        // create order + items
        return tx.order.create({
          data: {
            id: `ord-${generateUniqueNumber()}`,
            description,
            discount,
            amountReceived,
            status: status as Status,
            createdById: user.id,
            ProductInOrder: {
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
            ProductInOrder: {
              include: {
                product: { include: { category: true } },
                inventory: true
              },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return Response.json({ data: order } as OrderPutOutput, { status: 201 });
  } catch (error: any) {
    if (typeof error?.message === "string" && error.message.startsWith("OUT_OF_STOCK:")) {
      const [, productId, available, requested] = error.message.split(":");
      return Response.json(
        {
          error: "Out of stock",
          message: `Product ${productId} has ${available} available, requested ${requested}.`,
        },
        { status: 409 }
      );
    }
    if (error.errors) {
      return Response.json(
        { error: "API input error", message: error.errors[0] },
        { status: 400 }
      );
    }
    return Response.json(
      { error: "Something went wrong", message: error.message },
      { status: 500 }
    );
  }
}

// =====================
// GET (Paginated)
// =====================
const GetOrdersSchema = yup.object({
  pageNumber: yup.number(),
  pageSize: yup.number(),
  search: yup.string(),
  searchField: yup.string().oneOf(["id", "description"]),
});
export type OrdersGetInput = yup.InferType<typeof GetOrdersSchema>;

export async function GET(req: NextRequest) {
  try {
    const { pageNumber = 1, pageSize = 10, search = "", searchField = "id" } =
      GetOrdersSchema.validateSync(parseQueryParams(req), {
        stripUnknown: true,
        abortEarly: false,
      });

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Record<string, any> = { createdById: user.id };

    if (search && searchField === "id") where[searchField] = { equals: search.trim() };
    else if (search) where[searchField] = { contains: search.trim(), mode: "insensitive" };

    const [orders, count] = await prisma.$transaction([
      prisma.order.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        include: {
          ProductInOrder: { include: { inventory: true, product: { include: { category: true } } } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return Response.json({ data: { count, items: orders } } as OrdersGetOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors)
      return Response.json({ error: "API input error", message: error.errors[0] }, { status: 400 });
    return Response.json({ error: "Something went wrong", message: error.message }, { status: 500 });
  }
}
