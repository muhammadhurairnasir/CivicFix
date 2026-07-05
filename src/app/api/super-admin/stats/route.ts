import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Report, Ticket } from '@/models';
import { getRedis } from '@/lib/redis';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const [
      usersByRole,
      totalReports,
      totalTickets,
      totalResolved
    ] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Report.countDocuments({ isDeleted: false }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'completed' })
    ]);

    const totalUsers = usersByRole.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    let storageUsed = 0;
    try {
      const usage = await cloudinary.api.usage();
      storageUsed = usage.storage?.usage || 0;
    } catch (err) {
      console.warn('[SuperAdmin Stats] Cloudinary API usage call failed:', err);
    }

    let activeSessionsCount = 0;
    const redis = getRedis();
    try {
      if (typeof redis.keys === 'function') {
        const keys = await redis.keys('auth:refresh:*');
        activeSessionsCount = keys.length;
      }
    } catch (err) {
      console.warn('[SuperAdmin Stats] Redis keys call failed:', err);
    }

    // Health Checks
    const health = {
      db: { status: 'degraded', ms: 0 },
      redis: { status: 'degraded', ms: 0 },
      storage: { status: storageUsed > 0 ? 'healthy' : 'degraded', ms: 0 }
    };

    const startDb = performance.now();
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        health.db.status = 'healthy';
        health.db.ms = Math.round(performance.now() - startDb);
      }
    } catch (e) {}

    const startRedis = performance.now();
    try {
      if (typeof redis.ping === 'function') {
        await redis.ping();
        health.redis.status = 'healthy';
        health.redis.ms = Math.round(performance.now() - startRedis);
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalReports,
        totalTickets,
        totalResolved,
        storageUsed,
        activeSessionsCount,
        systemHealth: health
      }
    });

  } catch (error: any) {
    console.error('[SuperAdmin Stats Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch platform stats' }, { status: 500 });
  }
}
