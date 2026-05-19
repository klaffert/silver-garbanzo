import Anthropic from '@anthropic-ai/sdk';
import { ReviewRequestSchema } from '@/lib/schemas';
import { buildPrompt } from '@/lib/prompts';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: Request) {

    // 0. Check rate limit
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // 1. Validate input 
    const body = await req.json();
    const parsed = ReviewRequestSchema.safeParse(body); // parse throws on failure, safeParse returns proper error

    if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Call Claude and stream back
    try {
        const client = new Anthropic();
        const stream = client.messages.stream({
                model: 'claude-haiku-4-5',
                max_tokens: 2000,
                messages: [{ role: 'user', content: buildPrompt(parsed.data) }],
        })

        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    if (
                        chunk.type === 'content_block_delta' &&
                        chunk.delta.type === 'text_delta'
                    ) {
                        controller.enqueue(new TextEncoder().encode(chunk.delta.text));
                    }
                }
                controller.close();
            }
        })
        return new Response(readable, { headers: { 'Content-Type': 'text/plain' } });
    } catch (err) {
        console.error('Anthropic error:', JSON.stringify(err, null, 2));
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}