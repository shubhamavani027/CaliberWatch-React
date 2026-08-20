import React, { useEffect, useMemo, useRef, useState } from 'react';
import { chatAPI, watchAPI } from '../services/api';
import './ChatWidget.css';

const QUICK_PROMPTS = [
  'Best under 50000',
  'Recommend a luxury watch',
  'Compare sports and smartwatches',
];

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: 'Welcome to Caliber. I can recommend watches by budget, category, brand, or occasion.',
  },
];

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
}

function extractBudget(message) {
  const match =
    message.match(/(?:under|below|less than)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i) ||
    message.match(/₹\s*([\d,]+)/i) ||
    message.match(/rs\.?\s*([\d,]+)/i) ||
    message.match(/inr\s*([\d,]+)/i);

  if (!match) return null;

  const amount = Number(String(match[1]).replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : null;
}

function extractCategory(message) {
  if (message.includes('smart')) return 'smartwatch';
  if (message.includes('sport')) return 'sports';
  if (message.includes('luxury')) return 'luxury';
  if (message.includes('casual')) return 'casual';
  return null;
}

function buildLocalFallback(message, catalog) {
  const normalized = String(message || '').trim().toLowerCase();
  const budget = extractBudget(normalized);
  const category = extractCategory(normalized);

  const recommendations = catalog
    .filter((watch) => {
      const budgetMatch = budget ? Number(watch.price || 0) <= budget : true;
      const categoryMatch = category ? watch.category === category : true;
      const brandMatch = normalized.includes(String(watch.brand || '').toLowerCase());
      return (budgetMatch && categoryMatch) || brandMatch;
    })
    .sort((left, right) => Number(right.rating || 0) - Number(left.rating || 0) || Number(left.price || 0) - Number(right.price || 0))
    .slice(0, 3);

  if (recommendations.length) {
    const intro = category ? `Here are ${category} options worth a look:` : 'Here are a few watches I’d recommend:';
    return [
      intro,
      ...recommendations.map(
        (watch) =>
          `• ${watch.brand} ${watch.title} — ${formatPrice(watch.price)}. ${String(watch.description || '').trim()}`
      ),
      'Tell me your budget, style, or preferred brand and I can refine the shortlist.',
    ].join('\n');
  }

  if (normalized.includes('gift')) {
    return 'I can help with a gift pick. Share the budget and whether you want a luxury, casual, sports, or smartwatch option.';
  }

  return 'I can recommend watches by budget, category, brand, or occasion. Try “best watches under 50000” or “recommend a luxury watch for formal wear”.';
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const scrollRef = useRef(null);

  useEffect(() => {
    watchAPI
      .getAllWatches()
      .then((response) => {
        setCatalog(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        setCatalog([]);
      });
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, loading, open]);

  const trimmedDraft = useMemo(() => draft.trim(), [draft]);

  const sendMessage = async (messageOverride) => {
    const message = String(messageOverride ?? trimmedDraft).trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setDraft('');
    setOpen(true);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(nextMessages);
      setMessages((current) => [...current, { role: 'assistant', content: response.data.reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: buildLocalFallback(message, catalog) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cw-chatbot">
      {open && (
        <section className="cw-chatbot__panel" aria-label="AI shopping assistant">
          <header className="cw-chatbot__header">
            <div className="cw-chatbot__header-copy">
              <p className="cw-chatbot__eyebrow">AI Concierge</p>
              <h3 className="cw-chatbot__title">Caliber Watch Assistant</h3>
              <p className="cw-chatbot__subtitle">Ask for watch picks, comparisons, or budget advice.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="cw-chatbot__close">
              Close
            </button>
          </header>

          <div className="cw-chatbot__messages" ref={scrollRef}>
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`cw-chatbot__row ${
                  message.role === 'user' ? 'cw-chatbot__row--user' : 'cw-chatbot__row--assistant'
                }`}
              >
                <div
                  className={`cw-chatbot__bubble ${
                    message.role === 'user' ? 'cw-chatbot__bubble--user' : 'cw-chatbot__bubble--assistant'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              </article>
            ))}

            {loading && (
              <article className="cw-chatbot__row cw-chatbot__row--assistant">
                <div className="cw-chatbot__bubble cw-chatbot__bubble--assistant">
                  <p>Thinking...</p>
                </div>
              </article>
            )}
          </div>

          <div className="cw-chatbot__composer">
            <div className="cw-chatbot__prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => sendMessage(prompt)} className="cw-chatbot__prompt">
                  {prompt}
                </button>
              ))}
            </div>

            <form
              className="cw-chatbot__form"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={loading}
                placeholder="Ask for the best watch under 50000..."
                className="cw-chatbot__input"
              />
              <button type="submit" disabled={loading || !trimmedDraft} className="cw-chatbot__send">
                Send
              </button>
            </form>
          </div>
        </section>
      )}

      <button type="button" onClick={() => setOpen((current) => !current)} className="cw-chatbot__toggle">
        <span className="cw-chatbot__toggle-star">✦</span>
        {open ? 'Hide Concierge' : 'Ask Caliber'}
      </button>
    </div>
  );
}

export default ChatWidget;
