import { NextRequest, NextResponse } from 'next/server';
import {
  generateSamplingRationale,
  SamplingRationaleConfig,
} from '@/lib/ai/sampling-rationale';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = body as SamplingRationaleConfig;

    // Validate required fields
    if (!config.populationSize || config.populationSize <= 0) {
      return NextResponse.json(
        { success: false, error: 'Population size is required and must be greater than 0' },
        { status: 400 }
      );
    }

    if (config.confidenceLevel === undefined || config.confidenceLevel <= 0 || config.confidenceLevel > 1) {
      return NextResponse.json(
        { success: false, error: 'Confidence level must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Generate the rationale
    const result = await generateSamplingRationale(config);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Sampling rationale error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
