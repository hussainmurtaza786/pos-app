// GET: Fetch single item by ID
// PUT: Update item by ID
// DELETE: Delete item by ID

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const item = await prisma.inventory.findUnique({
            where: { id: params.id },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json(item, { status: 200 });
    } catch (err: any) {
        console.error('Error fetching item:', err);
        return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, description, quantity, price, cost, category, sku } = body;

        const updatedItem = await prisma.inventory.update({
            where: { id: params.id },
            data: {
                name,
                description,
                quantity,
                price,
                cost,
                category,
                sku,
            },
        });

        return NextResponse.json(updatedItem, { status: 200 });
    } catch (err: any) {
        console.error('Error updating item:', err);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        await prisma.inventory.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Item deleted' }, { status: 200 });
    } catch (err: any) {
        console.error('Error deleting item:', err);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
