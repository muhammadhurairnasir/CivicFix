import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getRedis } from '@/lib/redis';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    // 1. Next.js Version
    let nextVersion = 'Unknown';
    try {
      const pkgPath = path.join(process.cwd(), 'node_modules', 'next', 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        nextVersion = pkg.version;
      }
    } catch (e) {}

    // 2. Redis Info
    const redis = getRedis();
    let redisConnected = false;
    let redisKeyCount = 0;
    try {
      if (typeof redis.ping === 'function') {
        await redis.ping();
        redisConnected = true;
      }
      if (typeof redis.dbsize === 'function') {
        redisKeyCount = await redis.dbsize();
      } else if (typeof redis.keys === 'function') {
        redisKeyCount = (await redis.keys('*')).length;
      }
    } catch (e) {}

    // 3. MongoDB Info
    let mongoConnected = mongoose.connection.readyState === 1;
    let dbName = mongoose.connection.name;
    let collectionsCount = 0;
    try {
      if (mongoConnected && mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        collectionsCount = collections.length;
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: {
        nodeVersion: process.version,
        nextVersion,
        mongooseVersion: mongoose.version,
        uptime: process.uptime(), // seconds
        memoryUsage: process.memoryUsage(), // bytes
        environment: process.env.NODE_ENV || 'development',
        redis: {
          connected: redisConnected,
          keyCount: redisKeyCount,
        },
        mongodb: {
          connected: mongoConnected,
          dbName,
          collectionsCount,
        }
      }
    });

  } catch (error: any) {
    console.error('[SuperAdmin System GET Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch system info' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    const { job } = await req.json();
    
    if (job === 'sla-check') {
      const { checkSlaBreaches, checkUpcomingBreaches } = await import('@/lib/jobs/slaWatcher');
      const breachResult = await checkSlaBreaches();
      const warningResult = await checkUpcomingBreaches();
      return NextResponse.json({
        success: true,
        message: 'SLA Check completed',
        data: {
          checked: breachResult.checked,
          breached: breachResult.breached,
          warned: warningResult.warned,
        }
      });
    }

    if (job === 'stats-aggregate') {
      const { aggregateWardStats, aggregateSummaryStats } = await import('@/lib/jobs/statsAggregator');
      await aggregateWardStats();
      await aggregateSummaryStats();
      return NextResponse.json({
        success: true,
        message: 'Stats aggregation completed successfully',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown job type' }, { status: 400 });
  } catch (error: any) {
    console.error('[SuperAdmin Trigger Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to run job' }, { status: 500 });
  }
}
