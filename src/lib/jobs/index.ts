import { checkSlaBreaches, checkUpcomingBreaches } from './slaWatcher';
import { aggregateWardStats, aggregateSummaryStats } from './statsAggregator';

export async function runAllJobs() {
  console.log('[Jobs] Starting all background jobs...');
  
  try {
    await checkSlaBreaches();
    await checkUpcomingBreaches();
    
    await aggregateWardStats();
    await aggregateSummaryStats();
    
    console.log('[Jobs] All background jobs completed successfully.');
  } catch (error) {
    console.error('[Jobs] Error running background jobs:', error);
    throw error;
  }
}
