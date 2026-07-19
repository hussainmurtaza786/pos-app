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

    const [totalUsers, activeUsers, bannedUsers] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    const revenueResult = await prisma.order.aggregate({
      _sum: { amountReceived: true },
    });

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        userRole: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json({
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalRevenue: revenueResult._sum.amountReceived || 0,
        recentUsers,
      },
    }, { status: 200 });
  } catch (error: any) {
    return Response.json(
      { error: 'Something went wrong', message: error.message },
      { status: 500 }
    );
  }
}
