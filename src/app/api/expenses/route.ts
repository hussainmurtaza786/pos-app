// app/api/expenses/route.ts
import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import type { Expense as PrismaExpense } from "@prisma/client";
import { verifyAuthorization } from "@/utils";

/** Local helper to read query params as an object */
function parseQueryParams(req: NextRequest) {
  return Object.fromEntries(req.nextUrl.searchParams.entries());
}

/* =========================
   Testing helpers
========================= */
// If your schema requires a userId, set an existing user UUID here or via env
// const TEST_USER_ID = process.env.TEST_USER_ID ?? "00000000-0000-0000-0000-000000000000";

/* =========================
   Validation Schemas
========================= */
const CreateSchema = yup.object({
  title: yup.string().required(),
  amount: yup.number().required(),
  description: yup.string().nullable(),
});
type CreateInput = yup.InferType<typeof CreateSchema>;
interface CreateOutput { data: PrismaExpense; }

const UpdateSchema = yup.object({
  id: yup.string().required(),
  title: yup.string().optional(),
  amount: yup.number().optional(),
  description: yup.string().nullable().optional(),
});
type UpdateInput = yup.InferType<typeof UpdateSchema>;
interface UpdateOutput { data: PrismaExpense; }

const ListSchema = yup.object({
  pageNumber: yup.number().default(1),
  pageSize: yup.number().default(10),
  search: yup.string().default(""),
  searchField: yup
    .string()
    .oneOf<keyof PrismaExpense>(["id", "reason", "description"])
    .default("reason"),
});
type ListInput = yup.InferType<typeof ListSchema>;
interface ListOutput {
  data: {
    count: number;
    items: Array<
      Pick<PrismaExpense, 'id'>
    >;
  };
}

/* =========================
   PUT / Create  (no auth)
========================= */
export async function PUT(req: NextRequest) {
  try {
    const raw = await req.json();
    const toValidate = {
      title: raw.title ?? raw.reason,
      amount: raw.amount,
      description: raw.description ?? null,
    };

    const { title, amount, description } = CreateSchema.validateSync(toValidate, {
      stripUnknown: true,
      abortEarly: false,
    });
    // const user = await verifyAuthorization(req);
    // if (!user.id) {
    //   window.location.reload()
    //   return Response.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    // console.log('user ==>', user.id)
    const user = '50934ed1-cbe2-4603-b1ed-7255f93bfd80'
    // If userId is not required in your schema, remove it from data
    const expense = await prisma.expense.create({
      data: { title, amount, description, userId: user } as any,
      select: {
        id: true, amount: true, description: true,
        createdAt: true, updatedAt: true, userId: true,
      },
    });

    return Response.json({ data: expense } as CreateOutput, { status: 201 });
  } catch (error: any) {
    if (error?.errors) {
      return Response.json({ error: "API input error", message: error.errors[0] }, { status: 400 });
    }
    return Response.json({ error: "Something went wrong", message: error?.message ?? "Unknown" }, { status: 500 });
  }
}

/* =========================
   GET / List (paged + search)  (no auth)
========================= */
export async function GET(req: NextRequest) {
  try {
    const { pageNumber, pageSize, search, searchField } = ListSchema.validateSync(
      parseQueryParams(req),
      { stripUnknown: true, abortEarly: false }
    );

    const where: Record<string, any> = {};
    if (search) {
      where[searchField] = { contains: search.trim(), mode: "insensitive" };
    }

    const [items, count] = await prisma.$transaction([
      prisma.expense.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        select: { id: true, amount: true, description: true, createdAt: true },
      }),
      prisma.expense.count({ where }),
    ]);

    return Response.json({ data: { count, items } } as ListOutput, { status: 200 });
  } catch (error: any) {
    if (error?.errors) {
      return Response.json({ error: "API input error", message: error.errors[0] }, { status: 400 });
    }
    return Response.json({ error: "Something went wrong", message: error?.message ?? "Unknown" }, { status: 500 });
  }
}

/* =========================
   PATCH / Update  (no auth)
========================= */
export async function PATCH(req: NextRequest) {
  try {
    const raw = await req.json();
    const toValidate = {
      id: raw.id,
      title: raw.title ?? raw.reason,
      amount: raw.amount,
      description: raw.description,
    };
    const { id, ...rest } = UpdateSchema.validateSync(toValidate, {
      stripUnknown: true,
      abortEarly: false,
    });

    const updated = await prisma.expense.update({
      where: { id },
      data: rest,
      select: { id: true, amount: true, description: true, createdAt: true, updatedAt: true },
    });

    return Response.json({ data: updated } as UpdateOutput, { status: 200 });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (error?.errors) {
      return Response.json({ error: "API input error", message: error.errors[0] }, { status: 400 });
    }
    return Response.json({ error: "Something went wrong", message: error?.message ?? "Unknown" }, { status: 500 });
  }
}

/* =========================
   DELETE / Remove (?id=)  (no auth)
========================= */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id) return Response.json({ error: "API input error", message: "id is required" }, { status: 400 });

    await prisma.expense.delete({ where: { id } });
    return Response.json({ data: { id } }, { status: 200 });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ error: "Something went wrong", message: error?.message ?? "Unknown" }, { status: 500 });
  }
}
// End of src/app/api/expenses/route.ts