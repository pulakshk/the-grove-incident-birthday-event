export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (!(url.pathname === '/api/character' || url.pathname === '/character')) {
      return json({ error: 'Not found' }, 404, corsHeaders);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Missing GEMINI_API_KEY' }, 500, corsHeaders);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, corsHeaders);
    }

    const name = String(payload?.name || '').trim();
    const title = String(payload?.title || '').trim();
    if (name.length < 2 || title.length < 2) {
      return json({ error: 'name and title are required' }, 400, corsHeaders);
    }

    const vibe = String(payload?.vibe || 'balanced').trim();
    const trait = String(payload?.trait || '').trim();
    const lore = String(payload?.lore || '').trim();
    const knownContext = payload?.knownContext || null;

    const prompt = buildPrompt({ name, title, vibe, trait, lore, knownContext });

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      return json({ error: 'Gemini request failed', detail: errText.slice(0, 500) }, 502, corsHeaders);
    }

    const geminiData = await geminiResp.json();
    const text = extractText(geminiData);
    const parsed = tryParseJson(text);

    if (!parsed || typeof parsed !== 'object') {
      return json({ error: 'Could not parse model response', raw: text.slice(0, 300) }, 502, corsHeaders);
    }

    const character = normalizeCharacter(parsed, { name, title });
    return json({ character }, 200, corsHeaders);
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p?.text || '').join('\n').trim();
}

function tryParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeCharacter(raw, fallback) {
  const safe = (v, d) => {
    const s = String(v || '').trim();
    return s.length ? s : d;
  };

  return {
    alias: safe(raw.alias, 'The Last-Minute Legend'),
    role: safe(raw.role, `${fallback.title} - Unverified Witness`),
    bio: safe(raw.bio, `${fallback.name} arrived with suspiciously perfect timing.`),
    motive: safe(raw.motive, 'They want control over the version of events everyone believes.'),
    secret: safe(raw.secret, 'They know one fact that can overturn the room.'),
    clue: safe(raw.clue, 'A timestamped note that does not match the public story.'),
    drinkingCue: safe(raw.drinkingCue, 'Drink when someone says "alignment" without a metric.')
  };
}

function buildPrompt({ name, title, vibe, trait, lore, knownContext }) {
  return `You are writing one character dossier for a birthday mystery party called "The Grove Incident".

Return ONLY strict JSON with these exact keys:
{
  "alias": "",
  "role": "",
  "bio": "",
  "motive": "",
  "secret": "",
  "clue": "",
  "drinkingCue": ""
}

Constraints:
- Tone: witty, startup-aware, playful, not dark.
- Keep each field concise (1-3 sentences max).
- Use modern themes: AI tooling, prompt leaks, crypto treasury risk, analytics manipulation, growth experiments.
- Character should fit a 26-29 age-group Bangalore tech/social circle.
- Do not mention illegal activity directly.

Guest input:
- Name: ${name}
- Title: ${title}
- Vibe: ${vibe}
- Trait: ${trait || 'not provided'}
- Personal lore: ${lore || 'not provided'}
- Known context from host list: ${knownContext ? JSON.stringify(knownContext) : 'none'}

Make the role party-ready and fun for interactive play.`;
}
