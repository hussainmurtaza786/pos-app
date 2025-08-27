import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import { parseQueryParams } from "../utils";
import { ProductInOrder } from "@/prisma/customTypes";
import { verifyAuthorization } from "@/utils";

// =====================
// Validation Schemas
// =====================
const AddProductInOrderSchema = yup.object({
  orderId: yup.number().required(),
  productId: yup.string().required(),
  inventoryId: yup.string().nullable(),
  quantity: yup.number().required(),
  sellPrice: yup.number().required(),
});

export type ProductInOrderPutInput = yup.InferType<typeof AddProductInOrderSchema>;
export interface ProductInOrderPutOutput {
  data: ProductInOrder;
}

// =====================
// PUT → Add product to an order
// =====================
export async function PUT(req: NextRequest) {
  try {
    const { orderId, productId, inventoryId, quantity, sellPrice } =
      AddProductInOrderSchema.validateSync(await req.json(), {
        stripUnknown: true,
        abortEarly: false,
      });

    const productInOrder = await prisma.productInOrder.create({
      data: {
        orderId,
        productId,
        inventoryId,
        quantity,
        sellPrice,
      },
      include: {
        order: true,
        product: true,
        inventory: true,
      },
    });

    return Response.json({ data: productInOrder } as ProductInOrderPutOutput, { status: 201 });
  } catch (error: any) {
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
// GET → Get order history with product + order details
// =====================
const GetProductInOrdersSchema = yup.object({
  pageNumber: yup.number(),
  pageSize: yup.number(),
  search: yup.string(),
  searchField: yup.string().oneOf<keyof ProductInOrder>([
    "orderId",
    "productId",
    "inventoryId",
  ]),
});
export type ProductInOrdersGetInput = yup.InferType<typeof GetProductInOrdersSchema>;

export interface ProductInOrdersGetOutput {
  data: {
    count: number;
    items: any[];
  };
}

export async function GET(req: NextRequest) {
  try {
    const { pageNumber = 1, pageSize = 10, search = "", searchField = "orderId" } =
      GetProductInOrdersSchema.validateSync(parseQueryParams(req), {
        stripUnknown: true,
        abortEarly: false,
      });

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const where: { [k: string]: any } = {};
    const where: { [k: string]: any } = {
      createdById: user.id, // 🔑 filter by logged-in user
    };
    if (search && searchField === "orderId") {
      where[searchField] = Number(search);
    } else if (search) {
      where[searchField] = { contains: search.trim(), mode: "insensitive" };
    }

    const [productOrders, count] = await prisma.$transaction([
      prisma.productInOrder.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        include: {
          order: {
            select: {
              discount: true,
              amountReceived: true,
              status: true,
            },
          },
          product: {
            select: {
              sku: true,
              name: true,
              price: true,
            },
          },
          inventory: true,
        },
      }),
      prisma.productInOrder.count({ where }),
    ]);

    // add computed subtotal for each row
    const itemsWithSubtotal = productOrders.map((item) => ({
      ...item,
      subtotal: item.quantity * item.sellPrice,
    }));

    return Response.json(
      { data: { count, items: itemsWithSubtotal } } as ProductInOrdersGetOutput,
      { status: 200 }
    );
  } catch (error: any) {
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
