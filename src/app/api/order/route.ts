import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import { parseQueryParams } from "../utils";
import { verifyAuthorization } from "@/utils";
import { Order, Status } from "@prisma/client";

// =====================
// Validation Schemas
// =====================
const AddOrderSchema = yup.object({
    description: yup.string().nullable(),
    discount: yup.number().required(),
    amountReceived: yup.number().required(),
    status: yup.mixed<Status>(),
    products: yup.array().of(
        yup.object({
            productId: yup.string().required(),
            quantity: yup.number().required(),
            sellPrice: yup.number().required(),
        })
    ).required().min(1, "At least one product is required"),
});
export type OrderPutInput = yup.InferType<typeof AddOrderSchema>;

// =====================
// API Types
// =====================
export interface OrderPutOutput {
    data: Order;
}



export interface OrdersGetOutput {
    data: {
        count: number;
        items: Order[];
    };
}

// =====================
// CREATE (PUT)
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

        const order = await prisma.order.create({
            data: {
                description,
                discount,
                amountReceived,
                status: status as Status,
                createdById: user.id,
                ProductInOrder: {
                    createMany: {
                        data: products.map(prod => ({
                            productId: prod.productId,
                            quantity: prod.quantity,
                            sellPrice: prod.sellPrice,
                        }))
                    }
                },

            },// include: { ProductInOrder: true }
        });

        return Response.json({ data: order } as OrderPutOutput, { status: 201 });
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

        const where: { [k: string]: any } = {};
        if (search && searchField === "id") {
            where[searchField] = { equals: Number(search.trim()) };
        } else if (search) {
            where[searchField] = { contains: search.trim(), mode: "insensitive" };
        }

        const [orders, count] = await prisma.$transaction([
            prisma.order.findMany({
                skip: (pageNumber - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                where,
                select: {
                    id: true,
                    description: true,
                    discount: true,
                    amountReceived: true,
                    status: true,
                    createdAt: true,
                },
            }),
            prisma.order.count({ where }),
        ]);

        return Response.json(
            { data: { count, items: orders } } as OrdersGetOutput,
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
