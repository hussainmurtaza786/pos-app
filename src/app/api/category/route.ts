import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import * as yup from 'yup';
import { Category } from '@prisma/client';
import { verifyAuthorization } from '@/utils';

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
// export async function GET(_req: NextRequest) {
//   try {
//     const categories = await prisma.category.findMany({
//       orderBy: { name: 'asc' },
//     });

//     const user = await verifyAuthorization(req: NextRequest);
//     if (!user.id) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // const where: { [k: string]: any } = {};
//     const where: { [k: string]: any } = {
//       createdById: user.id, // 🔑 filter by logged-in user
//     };

//     return NextResponse.json({ data: categories } as CategoriesGetOutput, { status: 200 });
//   } catch (error: any) {
//     return NextResponse.json(
//       { error: 'Server Error', message: error.message },
//       { status: 500 }
//     );
//   }
// }
// -------------------------
// GET: Get all categories
// -------------------------
export async function GET(req: NextRequest) {   // ✅ use req instead of _req
  try {
    const user = await verifyAuthorization(req);
    if (!user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: {
        createdById: user.id,  // ✅ filter categories by logged-in user
      },
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

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: input.name,
        createdById: user.id
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



// -------------------------
// SCHEMA for PUT
// -------------------------
const UpdateCategorySchema = yup.object({
  id: yup.string().required("Category ID is required"),
  name: yup.string().required("Category name is required"),
});

export type CategoryPutInput = yup.InferType<typeof UpdateCategorySchema>;

export interface CategoryPutOutput {
  data: Category;
}

// -------------------------
// PUT: Update category
// -------------------------
export async function PUT(req: NextRequest) {
  try {
    const input = UpdateCategorySchema.validateSync(await req.json(), {
      abortEarly: false,
      stripUnknown: true,
    });

    const user = await verifyAuthorization(req);
    if (!user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // check if category exists and belongs to this user
    const existingCategory = await prisma.category.findUnique({
      where: { id: input.id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (existingCategory.createdById !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot update this category" },
        { status: 403 }
      );
    }

    // update
    const updatedCategory = await prisma.category.update({
      where: { id: input.id },
      data: { name: input.name },
    });

    return NextResponse.json({ data: updatedCategory } as CategoryPutOutput, { status: 200 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", message: error.errors[0] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server Error", message: error.message },
      { status: 500 }
    );
  }
}
