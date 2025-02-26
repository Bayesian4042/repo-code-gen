import { NextRequest } from 'next/server';
import type { AgentResponse, ChatRequest } from '@/types/agent';

export async function POST(req: NextRequest) {
  const { message, user_id, intent, type = 'chat' } = await req.json() as ChatRequest;

  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, user_id, intent, type }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as AgentResponse;

    // If it's a base-repo type response, ensure the structure is correct
    if (data.type === 'base-repo' && data.repoStructure) {
      return Response.json({
        content: data.content,
        type: 'base-repo',
        repoStructure: data.repoStructure
      });
    }

    // For regular chat responses
    return Response.json({
      content: data.content,
      type: 'chat'
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return Response.json({ error: `Error processing request: ${error}` }, { status: 500 });
  }
}
