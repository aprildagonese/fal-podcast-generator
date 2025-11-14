import { NextResponse } from 'next/server';
import { queryAgent, buildPrompt } from '@/lib/gradient';
import { generateAudio, downloadAudio } from '@/lib/fal';
import { uploadAudio } from '@/lib/spaces';
import { addEpisode } from '@/lib/metadata';
import { Episode, AgentResponse } from '@/lib/types';

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();

    // Step 1: Query Gradient Agent
    console.log('Step 1: Querying Gradient Agent...');
    const prompt = buildPrompt(today, 'full');
    const response = await queryAgent(prompt, 'full') as AgentResponse;

    if (!response.title || !response.topics || !response.sources) {
      throw new Error('Invalid agent response for full episode');
    }

    // Step 2: Generate audio via fal.ai
    console.log('Step 2: Generating audio with fal.ai...');
    const audioUrl = await generateAudio(response.script);

    // Step 3: Download the audio file
    console.log('Step 3: Downloading audio file...');
    const audioBuffer = await downloadAudio(audioUrl);

    // Step 4: Upload to DO Spaces
    console.log('Step 4: Uploading to DO Spaces...');
    const filename = `${today}-full-${timestamp}.mp3`;
    const spacesUrl = await uploadAudio(audioBuffer, filename);

    // Step 5: Calculate duration (approximate based on text length)
    // Average speaking rate: ~150 words per minute
    const wordCount = response.script.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);

    // Step 5: Save metadata
    console.log('Step 5: Saving episode metadata...');
    const episode: Episode = {
      id: `${today}-${timestamp}`,
      title: response.title,
      audioUrl: spacesUrl,
      duration: estimatedDuration,
      topics: response.topics,
      sources: response.sources,
      createdAt: new Date().toISOString(),
    };

    await addEpisode(episode);

    return NextResponse.json({
      success: true,
      episode,
    });
  } catch (error: any) {
    console.error('Episode generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
