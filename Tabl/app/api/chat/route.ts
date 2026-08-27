import { NextRequest } from 'next/server';
import { getGeminiClient, GEMINI_CHAT_MODELS, AI_CONFIG, getSmartMenuSystemPrompt } from '@/lib/ai/config';
import { getLiveRestaurantContext } from '@/lib/firebase/menuService';
import { buildRestaurantKnowledgeBase } from '@/lib/ai/contextBuilder';

export const maxDuration = 30;

/**
 * High-speed grounded local menu fallback when upstream AI cloud endpoints
 * encounter temporary traffic spikes or 503 errors.
 */
function generateLocalContextFallback(lastQuery: string, menu: any[], deals: any[]): string {
  const query = (lastQuery || '').toLowerCase();

  // Vegetarian / Vegan query
  if (query.includes('veg') || query.includes('vegetarian') || query.includes('vegan')) {
    const vegItems = menu.filter((i) => (i.isVegetarian || i.isVegan) && i.isAvailable !== false);
    const under1000 = vegItems.filter((i) => i.price <= 1000);
    const list = under1000.length > 0 ? under1000 : vegItems;
    let out = `### 🥗 Vegetarian Options ${under1000.length > 0 ? 'Under Rs. 1,000' : ''}:\n\n`;
    list.slice(0, 4).forEach((item) => {
      out += `• **${item.name}** — **Rs. ${item.price}**\n  _${item.description}_\n  *(Category: ${item.category}${item.isVegan ? ' | 🌿 100% Vegan' : ''})*\n\n`;
    });
    out += `\n💡 *Tip: Click '+ Add to Cart' on the menu to order directly from your table!*`;
    return out;
  }

  // Deals and combos
  if (query.includes('deal') || query.includes('combo') || query.includes('offer')) {
    let out = `### 🏷️ Today's Active Deals & Specials:\n\n`;
    deals.forEach((d) => {
      out += `• **${d.title}** — **Rs. ${d.discountedPrice || d.price || 'Special'}**\n  _${d.description}_\n  *Code / Tag: \`${d.badge || 'PROMO'}\`*\n\n`;
    });
    return out;
  }

  // Spice level recommendations
  if (query.includes('spic') || query.includes('mild') || query.includes('hot')) {
    const mildItems = menu.filter((i) => i.isAvailable !== false && (i.spiceLevel === 0 || i.spiceLevel === 1));
    let out = `### 🌿 Mild & Savory Recommendations:\n\n`;
    mildItems.slice(0, 4).forEach((item) => {
      out += `• **${item.name}** — **Rs. ${item.price}** (${item.spiceLevel === 0 ? 'Mild / No Heat' : '🌶️ Gentle Spice'})\n  _${item.description}_\n\n`;
    });
    return out;
  }

  // General recommendation fallback
  const topItems = menu.filter((i) => i.isAvailable !== false).slice(0, 4);
  let out = `### 🍽️ Chef's Recommendations from Today's In-Stock Menu:\n\n`;
  topItems.forEach((item) => {
    out += `• **${item.name}** — **Rs. ${item.price}**\n  _${item.description}_\n\n`;
  });
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Valid messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch live restaurant context from Firestore / Cache
    const { menu, deals, info } = await getLiveRestaurantContext();

    // 2. Build structured Markdown knowledge base
    const knowledgeBase = buildRestaurantKnowledgeBase(menu, deals, info);

    // 3. Generate hardened anti-hallucination system prompt
    const systemPrompt = getSmartMenuSystemPrompt(knowledgeBase);

    // 4. Initialize Gemini client
    const ai = getGeminiClient();

    // 5. Format history for Gemini SDK
    const contents = messages
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid message content provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lastUserQuery = messages[messages.length - 1]?.content || '';

    // 6. Try models in cascade sequence for high resilience
    let activeStream: any = null;
    let lastError: any = null;

    for (const modelName of GEMINI_CHAT_MODELS) {
      try {
        const streamAttempt = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: AI_CONFIG.temperature,
          },
        });
        activeStream = streamAttempt;
        break; // Successfully acquired stream
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Chat] Model ${modelName} unavailable, cascading to next model...`);
      }
    }

    const encoder = new TextEncoder();

    // If cloud endpoints are unavailable, stream grounded local menu answer
    if (!activeStream) {
      console.warn('[AI Chat] Cloud models busy. Serving grounded fallback.', lastError);
      const fallbackText = generateLocalContextFallback(lastUserQuery, menu, deals);
      
      const fallbackStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(fallbackText));
          controller.close();
        },
      });

      return new Response(fallbackStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    // Stream live generated tokens from Gemini model
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of activeStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (streamErr: any) {
          console.error('[API /api/chat Stream Error]:', streamErr);
          const recoveryText = generateLocalContextFallback(lastUserQuery, menu, deals);
          controller.enqueue(encoder.encode('\n\n' + recoveryText));
          controller.close();
        }
      },
      cancel() {
        // Handle client abort / disconnect gracefully
        console.log('[API /api/chat] Client aborted stream');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
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
