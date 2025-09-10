import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import { generateUniqueNumber, parseQueryParams } from "../utils";
import { verifyAuthorization } from "@/utils";
import { Inventory } from "@/prisma/customTypes";

// =====================
// Validation Schemas
// =====================
const AddInventorySchema = yup.object({
  productId: yup.string().required(),
  description: yup.string().nullable(),
  quantity: yup.number().required(),
  purchasePrice: yup.number().required(),
});
export type InventoryPutInput = yup.InferType<typeof AddInventorySchema>;

export interface InventoryPutOutput {
  data: Inventory;
}

export async function PUT(req: NextRequest) {
  try {
    const { productId, description, quantity, purchasePrice } =
      AddInventorySchema.validateSync(await req.json(), {
        stripUnknown: true,
        abortEarly: false,
      });

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory: Inventory = await prisma.inventory.create({
      data: {
        id: `inv-${generateUniqueNumber()}`,
        availableQuantity: quantity,
        purchasedQuantity: quantity,
        purchasePrice,
        description,
        productId,
        createdById: user.id,
      },
    });

    return Response.json({ data: inventory } as InventoryPutOutput, { status: 201 });
  } catch (error: any) {
    if (error.errors)
      return Response.json(
        { error: "API input error", message: error.errors[0] },
        { status: 400 }
      );

    return Response.json(
      { error: "Something went wrong", message: error.message },
      { status: 500 }
    );
  }
}

// =====================
// GET (now supports ?productId=...)
// =====================
const GetInventoriesSchema = yup.object({
  pageNumber: yup.number(),
  pageSize: yup.number(),
  search: yup.string(),
  searchField: yup.string().oneOf<keyof Inventory>(["id", "product"]),
  productId: yup.string().optional(), // 👈 added
});
export type InventoriesGetInput = yup.InferType<typeof GetInventoriesSchema>;

export interface InventoriesGetOutput {
  data: {
    count: number;
    items: Inventory[];
  };
}

export async function GET(req: NextRequest) {
  try {
    const {
      pageNumber = 1,
      pageSize = 10,
      search = "",
      searchField = "id",
      productId,
    } = GetInventoriesSchema.validateSync(parseQueryParams(req), {
      stripUnknown: true,
      abortEarly: false,
    });

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Record<string, any> = { createdById: user.id };

    if (productId) {
      where.productId = productId;
    } else if (search && searchField === "id") {
      where[searchField] = { contains: search.trim().toLowerCase() };
    } else if (search) {
      where[searchField] = { contains: search.trim(), mode: "insensitive" };
    }

    const [inventories, count] = await prisma.$transaction([
      prisma.inventory.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        select: {
          id: true,
          availableQuantity: true,
          purchasedQuantity: true,
          purchasePrice: true,
          description: true,
          productId: true,
          product: { select: { id: true, name: true, price: true } }, // expose price for sales
        },
      }),
      prisma.inventory.count({ where }),
    ]);

    return Response.json(
      { data: { count, items: inventories } } as InventoriesGetOutput,
      { status: 200 }
    );
  } catch (error: any) {
    if (error.errors)
      return Response.json(
        { error: "API input error", message: error.errors[0] },
        { status: 400 }
      );

    return Response.json(
      { error: "Something went wrong", message: error.message },
      { status: 500 }
    );
  }
}
