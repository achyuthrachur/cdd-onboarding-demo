import { NextResponse } from 'next/server';

// This value is baked in at BUILD TIME, not request time.
// If you see a new timestamp here, the deployment is fresh.
const BUILD_TIMESTAMP = new Date().toISOString();
const BUILD_ID = Math.random().toString(36).substring(2, 10);

export async function GET() {
  return NextResponse.json({
    buildTimestamp: BUILD_TIMESTAMP,
    buildId: BUILD_ID,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? 'unknown',
    deploymentUrl: process.env.VERCEL_URL ?? 'unknown',
    now: new Date().toISOString(),
  });
}
