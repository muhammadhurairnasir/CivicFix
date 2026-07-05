import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/Report';
import redis from '@/lib/redis';
import { handleApiError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const swLat = parseFloat(searchParams.get('swLat') || '');
    const swLng = parseFloat(searchParams.get('swLng') || '');
    const neLat = parseFloat(searchParams.get('neLat') || '');
    const neLng = parseFloat(searchParams.get('neLng') || '');
    const zoom = parseInt(searchParams.get('zoom') || '10', 10);

    if (isNaN(swLat) || isNaN(swLng) || isNaN(neLat) || isNaN(neLng)) {
      return NextResponse.json(
        { error: 'Valid bounding box coordinates are required' },
        { status: 400 }
      );
    }

    const cacheKey = `clusters:bounds:${swLat.toFixed(2)},${swLng.toFixed(2)}:${neLat.toFixed(2)},${neLng.toFixed(2)}:z${zoom}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    await connectDB();

    const geoQuery = {
      isDeleted: false,
      location: {
        $geoWithin: {
          $box: [
            [swLng, swLat], // bottom-left [longitude, latitude]
            [neLng, neLat], // top-right [longitude, latitude]
          ],
        },
      },
    };

    if (zoom < 10) {
      // Return clustered data using aggregation
      const precision = zoom < 5 ? 0 : zoom < 8 ? 1 : 2; // Adjust decimal points to group by

      const clusters = await Report.aggregate([
        { $match: geoQuery },
        {
          $addFields: {
            gridLat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, precision] },
            gridLng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, precision] },
          },
        },
        {
          $group: {
            _id: { lat: '$gridLat', lng: '$gridLng' },
            count: { $sum: 1 },
            severity: { $push: '$severity' },
          },
        },
        {
          $project: {
            _id: 0,
            lat: '$_id.lat',
            lng: '$_id.lng',
            count: 1,
            // Approximation for dominant severity in a cluster (first found)
            severity: { $arrayElemAt: ['$severity', 0] },
          },
        },
      ]);

      const response = { type: 'clusters', data: clusters };
      await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
      return NextResponse.json(response);
    } else {
      // Zoom >= 10: return individual markers
      const markers = await Report.find(geoQuery)
        .select('location type severity status title createdAt')
        .limit(1000)
        .lean();

      const response = {
        type: 'markers',
        data: markers.map((m: any) => ({
          id: m._id,
          lat: m.location.coordinates[1],
          lng: m.location.coordinates[0],
          severity: m.severity,
          status: m.status,
          type: m.type,
          title: m.title,
        })),
      };

      await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
      return NextResponse.json(response);
    }
  } catch (error: any) {
    return handleApiError(error, 'Clusters API');
  }
}
