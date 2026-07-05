export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/Report';
import Ticket from '@/models/Ticket';
import { ApiResponse } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { ticketNumber: string } }
) {
  try {
    // If DB not configured, return a helpful dev-mode response
    const MONGODB_URI = process.env.MONGODB_URI ?? '';
    if (!MONGODB_URI || MONGODB_URI.includes('<')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Database not configured. Add a valid MONGODB_URI to .env.local to track reports.',
        },
        { status: 503 }
      );
    }

    await connectDB();
    const { ticketNumber } = params;

    const report = await Report.findOne({ ticketNumber, isDeleted: false })
      .select('-reporterId -isDeleted -metadata -__v')
      .lean();

    if (!report) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Report not found or has been deleted.' },
        { status: 404 }
      );
    }

    const ticket = await Ticket.findOne({ reportId: report._id })
      .select('status priority slaDeadline startedAt completedAt')
      .lean();

    // Do not return internal MongoDB _id fields in public responses
    const publicData = {
      ...report,
      _id: undefined,
      ticket: ticket ? {
        status: ticket.status,
        startedAt: ticket.startedAt,
        completedAt: ticket.completedAt,
      } : null,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: publicData,
    });
  } catch (error) {
    console.error('Track report error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
