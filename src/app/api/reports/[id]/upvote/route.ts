export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report, Upvote } from '@/models';
import { ApiResponse } from '@/types';
import mongoose from 'mongoose';
import { emitUpvoteUpdate } from '@/lib/socket/emitters';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const reportId = params.id;
    const userId = auth.user.userId;

    const report = await Report.findOne({ _id: reportId, isDeleted: false });
    if (!report) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // Atomic transaction for upvote
    const session = await mongoose.startSession();
    let upvoted = false;
    let newCount = report.upvoteCount;

    try {
      await session.withTransaction(async () => {
        const existingUpvote = await Upvote.findOne({ reportId, userId }).session(session);

        if (existingUpvote) {
          // Remove upvote
          await Upvote.deleteOne({ _id: existingUpvote._id }).session(session);
          
          const updatedReport = await Report.findByIdAndUpdate(
            reportId,
            { $inc: { upvoteCount: -1 } },
            { new: true, session }
          );
          
          upvoted = false;
          newCount = updatedReport?.upvoteCount || 0;
        } else {
          // Add upvote
          await Upvote.create([{ reportId, userId }], { session });
          
          const updatedReport = await Report.findByIdAndUpdate(
            reportId,
            { $inc: { upvoteCount: 1 } },
            { new: true, session }
          );
          
          upvoted = true;
          newCount = updatedReport?.upvoteCount || 0;
        }
      });
    } finally {
      await session.endSession();
    }

    // Emit real-time update
    emitUpvoteUpdate(reportId, newCount, upvoted);

    return NextResponse.json<ApiResponse<{ upvoted: boolean; upvoteCount: number }>>({
      success: true,
      message: upvoted ? 'Upvote added' : 'Upvote removed',
      data: { upvoted, upvoteCount: newCount }
    }, { status: 200 });

  } catch (error) {
    console.error('[Upvote API] Error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to toggle upvote.' }, { status: 500 });
  }
}
