import { NextResponse } from 'next/server';
import { queryAgent, buildPrompt } from '@/lib/gradient';
import { generateAudio, downloadAudio } from '@/lib/fal';
import { uploadAudio } from '@/lib/spaces';
import { addTeaser } from '@/lib/metadata';
import { Teaser, TeaserAgentResponse } from '@/lib/types';

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();

    // Step 1: Query Gradient Agent for teaser
    console.log('Step 1: Querying Gradient Agent for teaser...');
    const prompt = buildPrompt(today, 'teaser');
    const response = await queryAgent(prompt, 'teaser') as TeaserAgentResponse;

    if (!response.script || !response.title) {
      throw new Error('Invalid agent response for teaser');
    }

    // Step 2: Generate audio via fal.ai
    console.log('Step 2: Generating teaser audio with fal.ai...');
    const audioUrl = await generateAudio(response.script);

    // Step 3: Download the audio file
    console.log('Step 3: Downloading audio file...');
    const audioBuffer = await downloadAudio(audioUrl);

    // Step 4: Upload to DO Spaces
    console.log('Step 4: Uploading to DO Spaces...');
    const filename = `${today}-teaser-${timestamp}.mp3`;
    const spacesUrl = await uploadAudio(audioBuffer, filename);

    // Step 5: Save metadata
    console.log('Step 5: Saving teaser metadata...');
    const teaser: Teaser = {
      id: `${today}-${timestamp}`,
      title: response.title,
      audioUrl: spacesUrl,
      duration: 5, // Teasers are ~5 seconds
      createdAt: new Date().toISOString(),
    };

    await addTeaser(teaser);

    return NextResponse.json({
      success: true,
      teaser,
      script: response.script,
    });
  } catch (error: any) {
    console.error('Teaser generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
