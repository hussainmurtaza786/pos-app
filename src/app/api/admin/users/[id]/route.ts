import { NextRequest } from 'next/server';
import prisma from '@/prisma/client';
import { verifyAuthorization } from '@/utils';

async function verifyAdmin(req: NextRequest) {
  const user = await verifyAuthorization(req);
  if (!user.id) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!currentUser || currentUser.userRole !== 'Admin') {
    return { error: Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }
  return { adminId: user.id };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdmin(req);
    if ('error' in auth) return auth.error;
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        userRole: true,
        isActive: true,
        banType: true,
        banReason: true,
        bannedAt: true,
        bannedBy: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true, products: true, expenses: true },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ data: user }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: 'Something went wrong', message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdmin(req);
    if ('error' in auth) return auth.error;
    const { id } = await params;
    const body = await req.json();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.userRole === 'Admin') {
      return Response.json({ error: 'Cannot modify another admin account' }, { status: 403 });
    }

    if (body.action === 'ban') {
      const updateData: any = {
        isActive: false,
        banType: body.banType || 'Permanent',
        banReason: body.banReason || null,
        bannedAt: new Date(),
        bannedBy: auth.adminId,
      };

      if (body.banType === 'Temporary' && body.banDurationDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + body.banDurationDays);
        updateData.banReason = `${body.banReason || 'No reason provided'} (expires: ${expiresAt.toLocaleDateString()})`;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, email: true, isActive: true, banType: true, banReason: true },
      });

      return Response.json({ data: updated }, { status: 200 });
    }

    if (body.action === 'unban') {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          isActive: true,
          banType: null,
          banReason: null,
          bannedAt: null,
          bannedBy: null,
        },
        select: { id: true, email: true, isActive: true },
      });

      return Response.json({ data: updated }, { status: 200 });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: 'Something went wrong', message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdmin(req);
    if ('error' in auth) return auth.error;
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.userRole === 'Admin') {
      return Response.json({ error: 'Cannot delete an admin account' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return Response.json({ data: { id, deleted: true } }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: 'Something went wrong', message: error.message }, { status: 500 });
  }
}
