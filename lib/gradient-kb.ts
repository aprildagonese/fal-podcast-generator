// Gradient Knowledge Base API integration
// Documentation: https://docs.digitalocean.com/products/gradient-ai-platform/

const GRADIENT_API_BASE = 'https://api.gradient.ai';
const GRADIENT_WORKSPACE_ID = process.env.GRADIENT_WORKSPACE_ID!;
const GRADIENT_KB_ID = process.env.GRADIENT_KB_ID!;
const GRADIENT_API_KEY = process.env.GRADIENT_API_KEY!;

export async function uploadDocumentToKB(
  content: string,
  filename: string
): Promise<string> {
  const url = `${GRADIENT_API_BASE}/api/workspaces/${GRADIENT_WORKSPACE_ID}/knowledge-bases/${GRADIENT_KB_ID}/documents`;

  console.log('Uploading to Gradient KB URL:', url);
  console.log('Workspace ID:', GRADIENT_WORKSPACE_ID);
  console.log('KB ID:', GRADIENT_KB_ID);
  console.log('API Key exists:', !!GRADIENT_API_KEY);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GRADIENT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: filename,
        content: content,
        metadata: {
          source: 'reddit-daily-sync',
          uploadedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gradient KB API error response:', errorText);
      throw new Error(`Gradient KB API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error: any) {
    console.error('Upload error details:', error);
    throw error;
  }
}

export async function deleteOldDocument(documentId: string): Promise<void> {
  const response = await fetch(
    `${GRADIENT_API_BASE}/api/workspaces/${GRADIENT_WORKSPACE_ID}/knowledge-bases/${GRADIENT_KB_ID}/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GRADIENT_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete document: ${response.statusText} - ${errorText}`);
  }
}
