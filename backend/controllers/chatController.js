const Watch = require('../models/Watch');

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini';

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .map((message) => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: String(message?.content || '').trim(),
    }))
    .filter((message) => message.content)
    .slice(-8);
}

function formatWatch(watch) {
  return `${watch.title} by ${watch.brand} (${watch.category}) - INR ${watch.price}`;
}

function buildFallbackReply(userMessage, watches) {
  const text = String(userMessage || '').toLowerCase();
  const allWatches = Array.isArray(watches) ? watches : [];

  const matchedCategory =
    ['luxury', 'sports', 'casual', 'smartwatch'].find((category) => text.includes(category)) || null;

  const matchedBrand =
    allWatches.find((watch) => text.includes(String(watch.brand || '').toLowerCase()))?.brand || null;

  const maxBudgetMatch = text.match(/(?:under|below|less than)\s*₹?\s*(\d+)/i);
  const minBudgetMatch = text.match(/(?:above|over|more than)\s*₹?\s*(\d+)/i);
  const maxBudget = maxBudgetMatch ? Number(maxBudgetMatch[1]) : null;
  const minBudget = minBudgetMatch ? Number(minBudgetMatch[1]) : null;

  let filtered = [...allWatches];

  if (matchedCategory) {
    filtered = filtered.filter((watch) => watch.category === matchedCategory);
  }

  if (matchedBrand) {
    filtered = filtered.filter((watch) => watch.brand === matchedBrand);
  }

  if (Number.isFinite(maxBudget)) {
    filtered = filtered.filter((watch) => Number(watch.price || 0) <= maxBudget);
  }

  if (Number.isFinite(minBudget)) {
    filtered = filtered.filter((watch) => Number(watch.price || 0) >= minBudget);
  }

  filtered.sort((left, right) => {
    const leftScore = Number(left.rating || 0) * 100 + Number(left.reviews || 0);
    const rightScore = Number(right.rating || 0) * 100 + Number(right.reviews || 0);
    return rightScore - leftScore;
  });

  const suggestions = filtered.slice(0, 3);

  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return 'Hello. Ask me about watch categories, brands, pricing, or recommendations for your budget.';
  }

  if (suggestions.length > 0) {
    return `Here are some options: ${suggestions.map(formatWatch).join('; ')}.`;
  }

  const featured = allWatches.slice(0, 3);
  if (featured.length > 0) {
    return `I could not find an exact match, but you can look at ${featured.map(formatWatch).join('; ')}.`;
  }

  return 'I can help with watch recommendations, categories, brands, pricing, and order questions.';
}

async function generateOpenAIReply(messages, watches) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const watchContext = watches.slice(0, 12).map(formatWatch).join('\n');
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You are CaliberWatch shopping assistant. Keep replies concise and helpful. Use the catalog context when relevant. Do not invent unavailable watches, discounts, policies, or order statuses.',
            },
          ],
        },
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: `Catalog context:\n${watchContext || 'No catalog context available.'}`,
            },
          ],
        },
        ...messages.map((message) => ({
          role: message.role,
          content: [{ type: 'input_text', text: message.content }],
        })),
      ],
      max_output_tokens: 220,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return String(data.output_text || '').trim() || null;
}

exports.chat = async (req, res) => {
  try {
    const messages = normalizeMessages(req.body?.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || '';

    if (!latestUserMessage) {
      return res.status(400).json({ message: 'A user message is required' });
    }

    const watches = await Watch.find()
      .select('title brand category price rating reviews')
      .sort({ rating: -1, reviews: -1, createdAt: -1 })
      .limit(24)
      .lean();

    let reply = null;
    try {
      reply = await generateOpenAIReply(messages, watches);
    } catch (error) {
      console.error('Chat AI fallback triggered:', error.message);
    }

    if (!reply) {
      reply = buildFallbackReply(latestUserMessage, watches);
    }

    res.json({
      reply,
      source: process.env.OPENAI_API_KEY && reply ? 'ai_or_fallback' : 'fallback',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate chat reply', error: error.message });
  }
};
