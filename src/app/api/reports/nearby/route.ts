export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Report } from '@/models';
import { ApiResponse } from '@/types';
import { z } from 'zod';

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50000).default(5000), // meters
});

// ─── GET /api/reports/nearby ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const queryObj = Object.fromEntries(searchParams.entries());

    const parsedQuery = nearbyQuerySchema.safeParse(queryObj);
    if (!parsedQuery.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid coordinates or radius.', errors: parsedQuery.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const { lat, lng, radius } = parsedQuery.data;

    // MongoDB $geoNear aggregation
    const reports = await Report.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true,
          query: {
            isDeleted: false,
            status: { $ne: 'closed' }
          }
        }
      },
      {
        $limit: 100
      },
      {
        // Lookup reporter info similar to populate('reporterId', 'name avatar')
        $lookup: {
          from: 'users',
          localField: 'reporterId',
          foreignField: '_id',
          pipeline: [
            { $project: { name: 1, avatar: 1 } }
          ],
          as: 'reporter'
        }
      },
      {
        $unwind: {
          path: '$reporter',
          preserveNullAndEmptyArrays: true
        }
      },
      // Rename 'reporter' to 'reporterId' to match the standard Mongoose output format
      {
        $addFields: {
          reporterId: '$reporter'
        }
      },
      {
        $project: {
          reporter: 0
        }
      }
    ]);

    return NextResponse.json<ApiResponse>({ success: true, data: reports }, { status: 200 });

  } catch (error) {
    console.error('[GET Nearby Reports API] Error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to retrieve nearby reports.' }, { status: 500 });
  }
}
