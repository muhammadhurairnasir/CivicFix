import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Report, Ticket, Notification } from '@/models';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types';
import { deleteRefreshToken } from '@/lib/redis';
import { z } from 'zod';

const patchSchema = z.object({
  role: z.enum([UserRole.CITIZEN, UserRole.CREW, UserRole.ADMIN, UserRole.SUPER_ADMIN]).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  ward: z.string().optional(),
  name: z.string().min(2).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();
    const body = await req.json();
    const parsedData = patchSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const data = parsedData.data;
    const targetUser = await User.findById(params.id);

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent modifying own role or deactivating self
    const targetUserIdStr = String(targetUser._id);
    const isSelf = targetUserIdStr === auth.user.userId;
    if (isSelf && (data.role || data.isActive === false)) {
      return NextResponse.json({ success: false, error: 'Cannot modify your own role or deactivate yourself' }, { status: 403 });
    }

    const oldRole = targetUser.role;
    let roleChanged = false;

    if (data.role && data.role !== oldRole) {
      targetUser.role = data.role;
      roleChanged = true;
    }
    if (data.name) targetUser.name = data.name;
    if (data.ward) targetUser.ward = data.ward;
    if (data.isVerified !== undefined) targetUser.isVerified = data.isVerified;
    if (data.isActive !== undefined) targetUser.isActive = data.isActive;

    await targetUser.save();

    // Side effects
    if (roleChanged || data.isActive === false) {
      await deleteRefreshToken(targetUserIdStr);
    }

    if (data.isActive === false) {
      // Unassign active tickets if user is a crew member
      if (oldRole === UserRole.CREW || targetUser.role === UserRole.CREW) {
        await Ticket.updateMany(
          { assignedTo: targetUser._id, status: { $in: ['assigned', 'in_progress'] } },
          { $set: { assignedTo: null, status: 'open' } }
        );
      }
    }

    return NextResponse.json({ success: true, message: 'User updated' });
  } catch (error: any) {
    console.error('[SuperAdmin User PATCH Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();
    
    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const targetUserIdStr = String(targetUser._id);
    const isSelf = targetUserIdStr === auth.user.userId;
    if (isSelf) {
      return NextResponse.json({ success: false, error: 'Cannot delete yourself' }, { status: 403 });
    }

    // Side effects
    await Promise.all([
      // 1. Soft-delete their reports
      Report.updateMany({ reporterId: targetUser._id }, { $set: { isDeleted: true } }),
      
      // 2. Unassign their active tickets (if crew)
      Ticket.updateMany(
        { assignedTo: targetUser._id, status: { $in: ['assigned', 'in_progress'] } },
        { $set: { assignedTo: null, status: 'open' } }
      ),
      
      // 3. Delete their notifications
      Notification.deleteMany({ userId: targetUser._id }),
      
      // 4. Delete Redis refresh token
      deleteRefreshToken(targetUserIdStr),
      
      // 5. Finally, permanently delete the user
      User.deleteOne({ _id: targetUser._id })
    ]);

    return NextResponse.json({ success: true, message: 'User deleted permanently' });
  } catch (error: any) {
    console.error('[SuperAdmin User DELETE Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
