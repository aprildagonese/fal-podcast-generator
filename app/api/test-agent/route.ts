import { NextResponse } from 'next/server';
import { queryAgent, buildPrompt } from '@/lib/gradient';
import { AgentResponse } from '@/lib/types';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    console.log(`Testing agent with date: ${today}`);
    const prompt = buildPrompt(today, 'full');
    const response = await queryAgent(prompt, 'full') as AgentResponse;

    return NextResponse.json({
      success: true,
      date: today,
      response: {
        title: response.title,
        topics: response.topics,
        sources: response.sources,
        scriptPreview: response.script.substring(0, 500) + '...',
        scriptLength: response.script.length,
      },
    });
  } catch (error: any) {
    console.error('Agent test error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
