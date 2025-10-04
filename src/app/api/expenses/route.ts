// app/api/expense/route.ts

import prisma from "@/prisma/client";
import { NextRequest } from "next/server";
import * as yup from "yup";
import { generateUniqueNumber, parseQueryParams } from "../utils";
import { verifyAuthorization } from "@/utils";
import { Expense } from "@prisma/client";

// =====================
// Validation Schemas
// =====================
const AddExpenseSchema = yup.object({
  reason: yup.string().nullable(),
  amount: yup.number().required("Amount is required"),
  description: yup.string().nullable(),
});
export type ExpensePutInput = yup.InferType<typeof AddExpenseSchema>;

export interface ExpensePutOutput {
  data: Expense;
}

export async function PUT(req: NextRequest) {
  try {
    const { reason, amount, } = AddExpenseSchema.validateSync(
      await req.json(),
      {
        stripUnknown: true,
        abortEarly: false,
      }
    );

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense: Expense = await prisma.expense.create({
      data: {
        id: `exp-${generateUniqueNumber()}`,
        reason,
        amount,
        userId: user.id,
      },
    });

    return Response.json({ data: expense } as ExpensePutOutput, {
      status: 201,
    });
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
// GET Expenses
// =====================
const GetExpensesSchema = yup.object({
  pageNumber: yup.number(),
  pageSize: yup.number(),
  search: yup.string(),
  searchField: yup.string().oneOf<keyof Expense>(["id", "reason"]),
});
export type ExpensesGetInput = yup.InferType<typeof GetExpensesSchema>;

export interface ExpensesGetOutput {
  data: {
    count: number;
    items: Expense[];
  };
}

export async function GET(req: NextRequest) {
  try {
    const {
      pageNumber = 1,
      pageSize = 10,
      search = "",
      searchField = "id",
    } = GetExpensesSchema.validateSync(parseQueryParams(req), {
      stripUnknown: true,
      abortEarly: false,
    });

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: { [k: string]: any } = { userId: user.id };

    if (search && searchField === "id") {
      where[searchField] = { contains: search.trim().toLowerCase() };
    } else if (search) {
      where[searchField] = { contains: search.trim(), mode: "insensitive" };
    }

    const [expenses, count] = await prisma.$transaction([
      prisma.expense.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        where,
        select: {
          id: true,
          reason: true,
          amount: true,
          createdAt: true,
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return Response.json(
      { data: { count, items: expenses } } as ExpensesGetOutput,
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
