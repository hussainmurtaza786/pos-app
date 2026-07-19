// app/api/expense/[id]/route.ts

import prisma from '@/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import * as yup from 'yup';
import { Expense } from '@prisma/client';

export interface ExpenseGetOutput {
    data: Expense;
}

const UpdateExpenseSchema = yup.object({
    id: yup.string().required(),
    reason: yup.string().nullable(),
    amount: yup.number().required(),
});

export type ExpensePostInput = yup.InferType<typeof UpdateExpenseSchema>;

export interface ExpensePostOutput {
    data: Expense;
}

export interface ExpenseDeleteOutput {
    data: Expense;
}

export async function GET(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const item = await prisma.expense.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, email: true, phone: true },
                },
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ data: item } as ExpenseGetOutput, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const input = UpdateExpenseSchema.validateSync(await req.json(), {
            abortEarly: false,
            stripUnknown: true,
        });

        const existing = await prisma.expense.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        const updated = await prisma.expense.update({
            where: { id },
            data: { reason: input.reason, amount: input.amount },
        });

        return NextResponse.json({ data: updated } as ExpensePostOutput, { status: 200 });
    } catch (error: any) {
        if (error.errors) {
            return NextResponse.json({ error: 'Validation Error', message: error.errors[0] }, { status: 400 });
        }
        return NextResponse.json({ error: 'Server Error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.expense.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        const deleted = await prisma.expense.delete({ where: { id } });
        return NextResponse.json({ data: deleted } as ExpenseDeleteOutput, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Server Error', message: error.message ?? 'Something went wrong' }, { status: 500 });
    }
}
