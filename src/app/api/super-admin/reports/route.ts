import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Report, Ticket, Comment, Upvote, Notification } from '@/models';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types';
import { v2 as cloudinary } from 'cloudinary';

// GET all reports (including soft-deleted ones)
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // We explicitly do NOT filter by isDeleted: false here, we want everything
    const [reports, total] = await Promise.all([
      Report.find()
        .populate('reporterId', 'name email avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments()
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('[SuperAdmin Reports GET Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// Hard Delete Report
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Report ID required' }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // 1. Delete photos from Cloudinary
    if (report.photos && report.photos.length > 0) {
      for (const photo of report.photos) {
        try {
          if (photo.publicId) {
             await cloudinary.uploader.destroy(photo.publicId);
          }
        } catch (err) {
          console.warn(`[Cloudinary] Failed to delete image ${photo.publicId}`, err);
        }
      }
    }

    // 2. Delete associated documents in parallel
    await Promise.all([
      Ticket.deleteMany({ reportId: report._id }),
      Comment.deleteMany({ reportId: report._id }),
      Upvote.deleteMany({ reportId: report._id }),
      Notification.deleteMany({ reportId: report._id }),
      Report.deleteOne({ _id: report._id })
    ]);

    return NextResponse.json({ success: true, message: 'Report hard deleted' });
  } catch (error: any) {
    console.error('[SuperAdmin Reports DELETE Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete report' }, { status: 500 });
  }
}
