import { NextRequest } from 'next/server';
import prisma from '@/prisma/client';
import { verifyAuthorization } from '@/utils';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthorization(req);
    if (!user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!currentUser || currentUser.userRole !== 'Admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const pageNumber = Number(searchParams.get('pageNumber') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '50');

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'banned') {
      where.isActive = false;
    }

    const [items, count] = await prisma.$transaction([
      prisma.user.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          userRole: true,
          isActive: true,
          banType: true,
          banReason: true,
          bannedAt: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: { orders: true, products: true, expenses: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return Response.json({ data: { count, items } }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: 'Something went wrong', message: error.message },
      { status: 500 }
    );
  }
}
