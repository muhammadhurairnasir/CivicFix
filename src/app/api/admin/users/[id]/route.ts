export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models';
import User from '@/models/User';
import { ApiResponse, UserRole, TicketStatus } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

// ─── PATCH /api/admin/users/[id] ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const body = await req.json() as {
      role?:     string;
      isActive?: boolean;
      ward?:     string;
    };

    // ── Cannot modify yourself via this endpoint ───────────────────────────────
    if (params.id === auth.user.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You cannot modify your own account via this endpoint' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(params.id).select('-password -refreshTokenHash -__v');
    if (!targetUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // ── Role change: super_admin only ─────────────────────────────────────────
    if (body.role !== undefined) {
      if (auth.user.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Only super_admin can change user roles' },
          { status: 403 }
        );
      }

      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(body.role as UserRole)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid role. Allowed: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }

      targetUser.role = body.role as UserRole;
    }

    // ── Deactivation ──────────────────────────────────────────────────────────
    if (body.isActive === false && targetUser.isActive) {
      targetUser.isActive = false;

      // Unassign active tickets from this crew member
      const activeStatuses = [
        TicketStatus.ASSIGNED,
        TicketStatus.DISPATCHED,
        TicketStatus.EN_ROUTE,
        TicketStatus.ACTIVE,
        TicketStatus.BLOCKED,
      ] as string[];

      const unassignResult = await Ticket.updateMany(
        { assignedTo: targetUser._id, status: { $in: activeStatuses } },
        { $unset: { assignedTo: '' }, $set: { status: TicketStatus.PENDING } }
      );

      if (unassignResult.modifiedCount > 0) {
        console.log(
          `[Admin Users] Unassigned ${unassignResult.modifiedCount} tickets from deactivated user ${params.id}`
        );
      }
    } else if (body.isActive === true) {
      targetUser.isActive = true;
    }

    // ── Ward update ───────────────────────────────────────────────────────────
    if (body.ward !== undefined) {
      targetUser.ward = body.ward;
    }

    await targetUser.save();

    // Re-fetch clean
    const updated = await User.findById(targetUser._id)
      .select('-password -refreshTokenHash -__v')
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User updated successfully',
      data: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Admin Update User');
  }
}

// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const user = await User.findById(params.id)
      .select('-password -refreshTokenHash -__v')
      .lean();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: user });
  } catch (error) {
    return handleApiError(error, 'Admin Get User');
  }
}
