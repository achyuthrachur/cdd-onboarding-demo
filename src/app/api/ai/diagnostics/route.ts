import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * GET /api/ai/diagnostics
 * Comprehensive diagnostic endpoint to debug OpenAI API key issues
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, unknown>,
  };

  // Check 1: Environment variable presence
  const hasKey = !!process.env.OPENAI_API_KEY;
  diagnostics.checks.envVarPresent = hasKey;

  if (hasKey) {
    const key = process.env.OPENAI_API_KEY!;

    // Check 2: Key format validation
    const keyPrefix = key.substring(0, 8);
    const keyLength = key.length;
    const startsWithSk = key.startsWith('sk-');

    diagnostics.checks.keyFormat = {
      prefix: keyPrefix + '...',
      length: keyLength,
      startsWithSk,
      expectedLength: keyLength >= 50, // OpenAI keys are typically 50+ chars
    };

    // Check 3: Key type detection
    let keyType = 'unknown';
    if (key.startsWith('sk-proj-')) {
      keyType = 'project';
    } else if (key.startsWith('sk-svcacct-')) {
      keyType = 'service-account';
    } else if (key.startsWith('sk-')) {
      keyType = 'legacy';
    }
    diagnostics.checks.keyType = keyType;

    // Check 4: Test actual API connection
    try {
      console.log('[Diagnostics] Testing OpenAI API connection...');
      const client = new OpenAI({ apiKey: key });

      // Make a minimal API call to test authentication
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      });

      diagnostics.checks.apiConnection = {
        success: true,
        model: response.model,
        responseId: response.id,
      };
      console.log('[Diagnostics] API connection successful');
    } catch (error) {
      const apiError = error as { status?: number; code?: string; message?: string };
      diagnostics.checks.apiConnection = {
        success: false,
        error: {
          status: apiError.status,
          code: apiError.code,
          message: apiError.message,
        },
      };
      console.error('[Diagnostics] API connection failed:', apiError);
    }
  } else {
    diagnostics.checks.error = 'OPENAI_API_KEY environment variable not found';
    console.error('[Diagnostics] No API key found in environment');
  }

  // Check 5: Server-side context
  diagnostics.checks.serverContext = {
    isServer: typeof window === 'undefined',
    hasProcess: typeof process !== 'undefined',
    hasEnv: typeof process.env !== 'undefined',
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
