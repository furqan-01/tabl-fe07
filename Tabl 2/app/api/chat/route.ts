import { NextRequest } from 'next/server';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { getGoogleAIProvider, AI_CONFIG, getSmartMenuSystemPrompt, GEMINI_CHAT_MODELS } from '@/lib/ai/config';
import { getLiveRestaurantContext } from '@/lib/firebase/menuService';
import { buildRestaurantKnowledgeBase } from '@/lib/ai/contextBuilder';
import { queryMenu } from '@/lib/ai/tools';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'GEMINI_API_KEY is not set in Netlify environment variables. Please add GEMINI_API_KEY in your Netlify Dashboard (Site configuration > Environment variables) and redeploy.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Valid messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Convert incoming UIMessages to ModelMessages
    const modelMessages = await convertToModelMessages(messages);

    // 2. Fetch live restaurant context from Firestore / Fallback Cache
    const { menu, deals, info } = await getLiveRestaurantContext();

    // 3. Build structured Markdown knowledge base
    const knowledgeBase = buildRestaurantKnowledgeBase(menu, deals, info);

    // 4. Generate grounded anti-hallucination system prompt with tool calling instructions
    const systemPrompt = getSmartMenuSystemPrompt(knowledgeBase);

    // 5. Initialize Google Generative AI Provider with API Key fallback
    const google = getGoogleAIProvider();

    // 6. Execute streamText with Vercel AI SDK and tool calling (up to 3 steps)
    const result = streamText({
      model: google(GEMINI_CHAT_MODELS[0]),
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        queryMenu,
      },
      stopWhen: stepCountIs(3),
      temperature: AI_CONFIG.temperature,
    });

    // 7. Return standard Vercel AI SDK UI Message Stream Response with anti-buffering headers
    return result.toUIMessageStreamResponse({
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('[API /api/chat POST] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while generating the assistant response.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

