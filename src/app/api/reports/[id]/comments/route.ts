export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Comment } from '@/models';
import { ApiResponse, PaginatedResponse } from '@/types';
import { z } from 'zod';
import { emitNewComment } from '@/lib/socket/emitters';
import { notifyNewComment } from '@/lib/notifications';

const commentSchema = z.object({
  text: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be at most 1000 characters')
    .trim(),
});

// ─── GET /api/reports/[id]/comments ──────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const report = await Report.findOne({ _id: params.id, isDeleted: false });
    if (!report) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const filter = { reportId: params.id, isDeleted: false };
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name avatar role')
        .lean(),
      Comment.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json<PaginatedResponse<unknown>>({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[GET Comments API] Error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to retrieve comments.' }, { status: 500 });
  }
}

// ─── POST /api/reports/[id]/comments ─────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsedData = commentSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation failed', errors: parsedData.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    await connectDB();

    const report = await Report.findOne({ _id: params.id, isDeleted: false }).populate('reporterId', 'name email');
    if (!report) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const isOfficial = ['admin', 'super_admin', 'crew'].includes(auth.user.role);

    const comment = new Comment({
      reportId: params.id,
      authorId: auth.user.userId,
      text: parsedData.data.text,
      isOfficial,
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'name avatar role')
      .lean();

    // Unified Notification (DB, Socket, Push, Email)
    await notifyNewComment(
      { _id: String(comment._id), text: comment.text, isOfficial: comment.isOfficial },
      { _id: String(auth.user.userId), name: (populatedComment?.authorId as any)?.name || 'Citizen' },
      {
        _id: String(report._id),
        title: report.title,
        ticketNumber: report.ticketNumber,
        reporterId: report.reporterId as any,
      }
    );

    // Emit real-time update
    emitNewComment(params.id, populatedComment);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Comment posted',
      data: populatedComment
    }, { status: 201 });

  } catch (error) {
    console.error('[POST Comment API] Error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to post comment.' }, { status: 500 });
  }
}
