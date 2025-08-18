import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import * as yup from 'yup';
import { Category } from '@prisma/client';

// -------------------------
// SCHEMAS
// -------------------------
const AddCategorySchema = yup.object({
  name: yup.string().required('Category name is required'),
});

// -------------------------
// TYPES
// -------------------------
export type CategoryPostInput = yup.InferType<typeof AddCategorySchema>;

export interface CategoryPostOutput {
  data: Category;
}

export interface CategoriesGetOutput {
  data: Category[];
}

const GetCategorySchema = yup.object({
  pageNumber: yup.number(),
  pageSize: yup.number(),
  search: yup.string(),
  searchField: yup.string().oneOf<keyof Category>(["id", 'name',]),
})
export type CategoriesGetInput = yup.InferType<typeof GetCategorySchema>
// -------------------------
// GET: Get all categories
// -------------------------
export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: categories } as CategoriesGetOutput, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// -------------------------
// POST: Create new category
// -------------------------
export async function POST(req: NextRequest) {
  try {
    const input = AddCategorySchema.validateSync(await req.json(), {
      abortEarly: false,
      stripUnknown: true,
    });

    const category = await prisma.category.create({
      data: {
        name: input.name,
      },
    });

    return NextResponse.json({ data: category } as CategoryPostOutput, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: 'Validation error', message: error.errors[0] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}
