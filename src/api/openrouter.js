// src/api/openrouter.js
// ─────────────────────────────────────────────
// OpenRouter API helper (Browser-safe)
// Used by Radeles.jsx and other AI pages
// ─────────────────────────────────────────────

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Ask OpenRouter (chat completion)
 * @param {string} prompt - User prompt
 * @param {string} model - OpenRouter model id
 * @returns {Promise<string>}
 */
export async function askOpenRouter(prompt, model = 'openai/gpt-3.5-turbo') {
  // Guard: missing key (prevents white screen + silent failures)
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ OpenRouter API key is missing');
    return 'AI service is not configured.';
  }

  if (!prompt || typeof prompt !== 'string') {
    return 'Invalid prompt.';
  }

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Deementum AI Calendar',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', response.status, errorText);
      return 'AI service failed to respond.';
    }

    const data = await response.json();

    return data?.choices?.[0]?.message?.content ?? '⚠️ Empty response from AI model.';
  } catch (err) {
    console.error('❌ OpenRouter request failed:', err);
    return 'Sorry, I couldn’t process your request.';
  }
}

// Alias (kept for backward compatibility)
export const callOpenRouter = askOpenRouter;
