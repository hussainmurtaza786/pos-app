import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import { generateUniqueNumber, parseQueryParams } from "../utils";
// import { Product } from "@prisma/client";
import { verifyAuthorization } from "@/utils";
import { Product } from "@/prisma/customTypes";

// =====================
// Validation Schemas
// =====================
const AddProductSchema = yup.object({
  name: yup.string().required("Product name is required"),
  sku: yup.string().required("SKU is required"),
  description: yup.string().nullable(),
  price: yup.number().required("Price is required"),
  categoryId: yup.string().required("Category ID is required"),
});
export type ProductPutInput = yup.InferType<typeof AddProductSchema>;

export interface ProductPutOutput {
  data: Product;
}

export async function PUT(req: NextRequest) {
  try {
    const { name, sku, description, price, categoryId, } =
      AddProductSchema.validateSync(await req.json(), {
        stripUnknown: true,
        abortEarly: false,
      });
    const user = await verifyAuthorization(req);
    if (!user.id) {
      window.location.reload()
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.log('user ---->', user.id)
    const product: Product = await prisma.product.create({
      data: {
        id: `pro-${generateUniqueNumber()}`,
        name,
        sku,
        description,
        price,
        categoryId,
        createdById: user.id,
      },
    });

    return Response.json({ data: product } as ProductPutOutput, { status: 201 });
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
// GET Products
// =====================
const GetProductsSchema = yup.object({
  pageNumber: yup.number(),
  pageSize: yup.number(),
  search: yup.string(),
  searchField: yup.string().oneOf<keyof Product>(["id", "name", "sku"]),
});
export type ProductsGetInput = yup.InferType<typeof GetProductsSchema>;

export interface ProductsGetOutput {
  data: {
    count: number;
    items: Product[];
  };
}

export async function GET(req: NextRequest) {
  try {
    const { pageNumber = 1, pageSize = 10, search = "", searchField = "id" } =
      GetProductsSchema.validateSync(parseQueryParams(req), {
        stripUnknown: true,
        abortEarly: false,
      });

    const where: { [k: string]: any } = {};
    if (search && searchField === "id") {
      where[searchField] = { contains: search.trim().toLowerCase() };
    } else if (search) {
      where[searchField] = { contains: search.trim(), mode: "insensitive" };
    }

    const [products, count] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          description: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return Response.json(
      { data: { count, items: products } } as ProductsGetOutput,
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
