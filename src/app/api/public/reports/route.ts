export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Report } from '@/models';
import { handleApiError } from '@/lib/apiHelpers';

/**
 * GET /api/public/reports
 * Public, unauthenticated endpoint. Returns last 3 non-draft reports
 * for the live feed panel on the homepage hero.
 * Only exposes safe, non-PII fields.
 */
export async function GET() {
  try {
    await connectDB();

    const reports = await Report.find({
      isDeleted: false,
      status: { $nin: ['draft', 'rejected'] },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('type address ward status severity createdAt')
      .lean();

    const safe = reports.map((r: any) => ({
      id:        r._id.toString(),
      type:      r.type as string,
      location:  r.ward ? `Ward ${r.ward}` : (r.address?.split(',')[0] ?? 'City'),
      status:    r.status as string,
      severity:  r.severity as string,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ success: true, data: safe }, {
      headers: {
        // Cache for 30 seconds on CDN, stale for 60
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Public Reports Feed');
  }
}
