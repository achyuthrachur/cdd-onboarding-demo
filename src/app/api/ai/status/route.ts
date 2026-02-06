import { NextResponse } from 'next/server';

/**
 * GET /api/ai/status
 * Returns the status of AI API keys configured on the server.
 * This endpoint runs server-side and can access environment variables.
 */
export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  // Log for debugging (visible in Vercel logs)
  console.log('[AI Status] Checking API key configuration...');
  console.log('[AI Status] OPENAI_API_KEY present:', hasOpenAI);
  console.log('[AI Status] ANTHROPIC_API_KEY present:', hasAnthropic);

  if (hasOpenAI) {
    const keyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || '';
    console.log('[AI Status] OpenAI key prefix:', keyPrefix + '...');
  }

  // Determine active provider
  let activeProvider: 'openai' | 'anthropic' | 'none' = 'none';
  if (hasOpenAI) {
    activeProvider = 'openai';
  } else if (hasAnthropic) {
    // Anthropic not yet implemented, but we recognize it
    activeProvider = 'none'; // Change to 'anthropic' when implemented
  }

  return NextResponse.json({
    openai: hasOpenAI,
    anthropic: hasAnthropic,
    activeProvider,
    timestamp: new Date().toISOString(),
  });
}
