import { FalTTSRequest, FalTTSResponse } from './types';

// Use DigitalOcean Inference API to access fal.ai models
const INFERENCE_API_URL = 'https://inference.do-ai.run/v1';
const MODEL_ACCESS_KEY = process.env.MODEL_ACCESS_KEY!;

const TTS_MODEL = 'fal-ai/elevenlabs/tts/multilingual-v2';
const DEFAULT_VOICE = 'Rachel';

/**
 * Generate audio from text using fal.ai TTS
 * This uses a polling mechanism:
 * 1. Submit the request → get request_id
 * 2. Poll the status endpoint until completed
 * 3. Retrieve the audio file URL
 */
export async function generateAudio(text: string): Promise<string> {
  // Step 1: Submit the TTS request
  console.log('Submitting TTS request...');
  const requestId = await submitTTSRequest(text);
  console.log('Got request ID:', requestId);

  // Step 2: Poll until complete
  console.log('Starting to poll for completion...');
  const result = await pollForCompletion(requestId);

  // Step 3: Return the audio URL
  console.log('TTS completed, result:', result);
  const audioUrl = result.output?.audio?.url;

  if (!audioUrl) {
    throw new Error('No audio URL in completed response');
  }

  return audioUrl;
}

async function submitTTSRequest(text: string): Promise<string> {
  const response = await fetch(`${INFERENCE_API_URL}/async-invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MODEL_ACCESS_KEY}`,
    },
    body: JSON.stringify({
      model_id: TTS_MODEL,
      input: {
        text,
        voice: DEFAULT_VOICE,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`fal.ai API error: ${response.statusText} - ${error}`);
  }

  const data = await response.json();

  if (!data.request_id) {
    throw new Error('No request_id returned from fal.ai');
  }

  return data.request_id;
}

async function pollForCompletion(
  requestId: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<FalTTSResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkStatus(requestId);
    console.log(`Poll attempt ${attempt + 1}/${maxAttempts}, status:`, status);

    if (status.status === 'COMPLETED') {
      console.log('TTS generation complete!');
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error(`TTS generation failed: ${status.error}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('TTS generation timed out');
}

async function checkStatus(requestId: string): Promise<FalTTSResponse> {
  const response = await fetch(`${INFERENCE_API_URL}/async-invoke/${requestId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MODEL_ACCESS_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Download the audio file from the URL and return as Buffer
 */
export async function downloadAudio(audioUrl: string): Promise<Buffer> {
  const response = await fetch(audioUrl);

  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
