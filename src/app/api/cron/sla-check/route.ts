import { NextRequest, NextResponse } from 'next/server';
import { checkSlaBreaches, checkUpcomingBreaches } from '@/lib/jobs/slaWatcher';
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
    const breachResult = await checkSlaBreaches();
    const warningResult = await checkUpcomingBreaches();

    return NextResponse.json({
      success: true,
      data: {
        checked: breachResult.checked,
        breached: breachResult.breached,
        warned: warningResult.warned,
      }
    });
  } catch (error) {
    return handleApiError(error, 'Cron SLA Check');
  }
}
