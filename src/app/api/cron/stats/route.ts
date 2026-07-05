import { NextRequest, NextResponse } from 'next/server';
import { aggregateWardStats, aggregateSummaryStats } from '@/lib/jobs/statsAggregator';
import { handleApiError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecretHeader = req.headers.get('cron_secret');
  
  const expectedSecret = process.env.CRON_SECRET;
  
  if (!expectedSecret) {
    return NextResponse.json({ success: false, error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const isValid = 
    authHeader === `Bearer ${expectedSecret}` || 
    cronSecretHeader === expectedSecret;

  if (!isValid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await aggregateWardStats();
    await aggregateSummaryStats();

    return NextResponse.json({
      success: true,
      message: 'Stats aggregated successfully',
    });
  } catch (error) {
    return handleApiError(error, 'Cron Stats Aggregator');
  }
}
