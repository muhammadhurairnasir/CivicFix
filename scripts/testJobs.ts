import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Testing background jobs...');
  const { runAllJobs } = await import('../src/lib/jobs/index');
  await runAllJobs();
  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
