import { agentDispatch, getProactiveSuggestion } from './command';

// ── LLM Bridge — connects to free AI APIs ────────────────────────────────────
        // Supports: Google Gemini 1.5 Flash (free), Groq (free), OpenRouter (free models)
        export const LLMBridge = {
            // Build the system prompt that gives the LLM full MOKHA context
            systemPrompt: (profileContext) => `You are MOKHA Agent — a friendly, expert AI assistant built into MOKHA FILM Prompt Builder. You are the PRIMARY conversational interface. When a user has an API key, you handle ALL conversation, questions, and creative requests directly.

You are warm, direct, and talk like a knowledgeable filmmaker friend — not a corporate bot. You understand typos, broken English, slang, and natural language. If someone says "yo make me a dark scene" you understand they want a dark/noir scene.${profileContext ? `\n\n${profileContext}` : ''}

You help with:
- Film projects, scenes, shots — creation, editing, analysis
- Director styles: Kubrick, Nolan, Fincher, Villeneuve, Tarantino, Spielberg, Lynch, Scorsese, Wes Anderson, Wong Kar-wai
- Moods: tense, epic, lonely, paranoid, romantic, dreamy, action, melancholic, mysterious, hopeful, cyberpunk, horror
- Camera: shot types, lenses, lighting, movements, film stocks, angles, transitions
- Story structure: 3-act, character arcs, inciting incidents, midpoints, climaxes
- Chain Mode: build shot sequences fast with inherited base parameters
- Shotify: compress prompts for specific AI platforms (Runway, Veo 3, KLING, Seedance)
- Continuity Lock: lock parameters across all shots
- Shot Sequence Templates: The Reveal, The Chase, The Confrontation, The Discovery, Hero Moment, The Nightmare
- Story Wizard 2.0: 12-step guided story development
- Genre DNA, Rhythm Analyzer, Prompt Mutation, Revision History
- Find & Replace across shots and projects
- Performance Settings: RAM, VRAM, CPU, rendering quality

PERSONALITY:
- Friendly, warm, encouraging — like a senior director mentoring a filmmaker
- Short answers unless detail is needed. Max 3-4 sentences normally.
- Use film terminology naturally but explain when needed
- Celebrate good ideas: "That's a strong premise" / "Nice — that's very Fincher"
- If something is unclear, ask one focused question

IMPORTANT:
- App actions (create shot, add scene, lock lighting, etc.) are handled by the rule engine — you don't need to execute them, just confirm them conversationally
- Stay in filmmaking/MOKHA context always
- Understand and respond to: typos, abbreviations, mixed languages, casual speech`,

            // Call Gemini (free tier — tries current models in order)
            callGemini: async (prompt, apiKey, history, onChunk, profileContext) => {
                // Only models confirmed on free tier as of 2025/2026
                const models = [
                    'gemini-2.5-flash-lite-preview-06-17',
                    'gemini-2.5-flash-lite',
                    'gemini-2.5-flash',
                    'gemini-2.5-pro',
                ];
                // Build conversation contents from history
                const contents = [];
                if (history?.length) {
                    history.forEach(m => {
                        contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] });
                    });
                }
                contents.push({ role: 'user', parts: [{ text: prompt }] });

                let lastErr = null;
                for (const model of models) {
                    try {
                        // Use streaming endpoint when onChunk callback provided
                        const endpoint = onChunk ? 'streamGenerateContent' : 'generateContent';
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${apiKey}${onChunk ? '&alt=sse' : ''}`;
                        const body = {
                            system_instruction: { parts: [{ text: LLMBridge.systemPrompt(profileContext) }] },
                            contents,
                            generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
                        };
                        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                        if (!res.ok) {
                            const err = await res.json();
                            lastErr = new Error(err.error?.message || `HTTP ${res.status}`);
                            if (res.status === 404 || (err.error?.message || '').includes('not found')) continue;
                            throw lastErr;
                        }
                        if (onChunk) {
                            // Stream SSE chunks
                            const reader = res.body.getReader();
                            const decoder = new TextDecoder();
                            let full = '';
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                const chunk = decoder.decode(value, { stream: true });
                                // Parse SSE lines
                                chunk.split('\n').forEach(line => {
                                    if (!line.startsWith('data: ')) return;
                                    const json = line.slice(6).trim();
                                    if (json === '[DONE]') return;
                                    try {
                                        const d = JSON.parse(json);
                                        const t = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
                                        if (t) { full += t; onChunk(t, full); }
                                    } catch {}
                                });
                            }
                            return full;
                        }
                        const data = await res.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text) return text;
                    } catch(e) {
                        if (e.message?.includes('not found') || e.message?.includes('not supported')) { lastErr = e; continue; }
                        throw e;
                    }
                }
                throw lastErr || new Error('No Gemini model available on this key. Check aistudio.google.com for available models.');
            },

            // Call Groq via OpenRouter proxy (avoids CORS issues from browser)
            // Groq direct API blocks browser requests — use OpenRouter which supports CORS
            callGroq: async (prompt, apiKey, history, onChunk, profileContext) => {
                // Try Groq direct first (works from localhost/HTTPS), fall back to note
                try {
                    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                            'Origin': location.origin || 'https://mokha.film'
                        },
                        body: JSON.stringify({
                            model: 'llama-3.1-8b-instant',
                            messages: [
                                { role: 'system', content: LLMBridge.systemPrompt(profileContext) },
                                { role: 'user', content: prompt }
                            ],
                            max_tokens: 400, temperature: 0.7
                        })
                    });
                    if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || `HTTP ${res.status}`); }
                    const data = await res.json();
                    return data.choices?.[0]?.message?.content || '';
                } catch(e) {
                    if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
                        throw new Error('Groq blocks direct browser requests (CORS). Use OpenRouter instead — it supports browsers. Get a free key at openrouter.ai');
                    }
                    throw e;
                }
            },

            // Call OpenRouter — supports CORS, streaming, history, and many free models
            callOpenRouter: async (prompt, apiKey, history, onChunk, modelOverride, profileContext) => {
                // Use the auto-free router first, then specific models as fallback
                // openrouter/free automatically picks a working free model
                const models = modelOverride ? [modelOverride] : [
                    'openrouter/auto',                          // auto-picks best available (uses credits)
                    'meta-llama/llama-3.3-70b-instruct:free',
                    'deepseek/deepseek-r1:free',
                    'google/gemma-3-12b-it:free',
                    'mistralai/mistral-7b-instruct:free',
                    'qwen/qwen-2.5-7b-instruct:free',
                    'meta-llama/llama-3.1-8b-instruct:free',
                ];
                // Build messages with history
                const messages = [{ role: 'system', content: LLMBridge.systemPrompt(profileContext) }];
                if (history?.length) history.forEach(m => messages.push({ role: m.role, content: m.content }));
                messages.push({ role: 'user', content: prompt });

                let lastErr = null;
                for (const model of models) {
                    try {
                        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`,
                                'HTTP-Referer': 'https://mokha.film',
                                'X-Title': 'MOKHA FILM'
                            },
                            body: JSON.stringify({ model, messages, max_tokens: 600, stream: !!onChunk })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            const msg = err.error?.message || `HTTP ${res.status}`;
                            // Skip to next model on availability errors
                            if (msg.includes('No endpoints') || msg.includes('not found') || msg.includes('Provider returned error') || res.status === 404 || res.status === 503) {
                                lastErr = new Error(msg); continue;
                            }
                            throw new Error(msg);
                        }
                        if (onChunk) {
                            const reader = res.body.getReader();
                            const decoder = new TextDecoder();
                            let full = '';
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                decoder.decode(value, { stream: true }).split('\n').forEach(line => {
                                    if (!line.startsWith('data: ')) return;
                                    const json = line.slice(6).trim();
                                    if (json === '[DONE]') return;
                                    try {
                                        const t = JSON.parse(json).choices?.[0]?.delta?.content || '';
                                        if (t) { full += t; onChunk(t, full); }
                                    } catch {}
                                });
                            }
                            return full;
                        }
                        const data = await res.json();
                        const text = data.choices?.[0]?.message?.content || '';
                        if (text) return text;
                    } catch(e) {
                        if (e.message?.includes('No endpoints') || e.message?.includes('not found') || e.message?.includes('Provider returned error')) { lastErr = e; continue; }
                        throw e;
                    }
                }
                throw lastErr || new Error('No free OpenRouter models available. Check openrouter.ai/models for current free models.');
            },

            // DeepSeek — via OpenRouter with R1 model (best reasoning)
            // Uses OpenRouter key — paste your OpenRouter key in the DeepSeek field OR OpenRouter field
            callDeepSeek: async (prompt, apiKey, history, onChunk, profileContext) => {
                if (!apiKey?.trim()) throw new Error('DeepSeek uses OpenRouter — paste your OpenRouter key in the DeepSeek or OpenRouter field.');
                return LLMBridge.callOpenRouter(prompt, apiKey, history, onChunk, 'deepseek/deepseek-r1:free', profileContext);
            },

            // Mistral — via their direct API (supports browser CORS)
            callMistral: async (prompt, apiKey, history, onChunk, profileContext) => {
                const messages = [{ role: 'system', content: LLMBridge.systemPrompt(profileContext) }];
                if (history?.length) history.forEach(m => messages.push({ role: m.role, content: m.content }));
                messages.push({ role: 'user', content: prompt });
                const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model: 'mistral-small-latest', messages, max_tokens: 600, stream: !!onChunk })
                });
                if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || `HTTP ${res.status}`); }
                if (onChunk) {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let full = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        decoder.decode(value, { stream: true }).split('\n').forEach(line => {
                            if (!line.startsWith('data: ')) return;
                            const json = line.slice(6).trim();
                            if (json === '[DONE]') return;
                            try { const t = JSON.parse(json).choices?.[0]?.delta?.content || ''; if (t) { full += t; onChunk(t, full); } } catch {}
                        });
                    }
                    return full;
                }
                const data = await res.json();
                return data.choices?.[0]?.message?.content || '';
            },

            // Main call — routes to the right provider with history + streaming
            call: async (prompt, provider, apiKey, history, onChunk, profileContext) => {
                if (!apiKey?.trim()) throw new Error('No API key set');
                let result;
                switch (provider) {
                    case 'gemini':     result = await LLMBridge.callGemini(prompt, apiKey.trim(), history, onChunk, profileContext); break;
                    case 'groq':       result = await LLMBridge.callGroq(prompt, apiKey.trim(), history, onChunk, profileContext); break;
                    case 'openrouter': result = await LLMBridge.callOpenRouter(prompt, apiKey.trim(), history, onChunk, profileContext); break;
                    case 'deepseek':   result = await LLMBridge.callDeepSeek(prompt, apiKey.trim(), history, onChunk, profileContext); break;
                    case 'mistral':    result = await LLMBridge.callMistral(prompt, apiKey.trim(), history, onChunk, profileContext); break;
                    default: throw new Error('Unknown provider');
                }
                LLMBridge.trackUsage(provider);
                return result;
            },

            // ── Quota tracking (localStorage-based daily counter) ──────────
            QUOTA_KEY: 'mokha_llm_quota',
            DAILY_LIMITS: {
                'gemini':      { rpm: 15,  rpd: 1000,  model: 'Gemini 2.5 Flash-Lite' },
                'openrouter':  { rpm: 20,  rpd: 200,   model: 'OpenRouter Free' },
                'groq':        { rpm: 30,  rpd: 14400, model: 'Groq Llama' },
                'deepseek':    { rpm: 20,  rpd: 200,   model: 'DeepSeek R1 (OpenRouter)' },
                'mistral':     { rpm: 5,   rpd: 500,   model: 'Mistral Small' },
            },

            loadQuota: () => {
                try {
                    const raw = JSON.parse(localStorage.getItem('mokha_llm_quota') || '{}');
                    const today = new Date().toDateString();
                    // Reset if it's a new day
                    if (raw.date !== today) return { date: today, counts: {}, minuteCounts: {}, minuteTs: {} };
                    return raw;
                } catch { return { date: new Date().toDateString(), counts: {}, minuteCounts: {}, minuteTs: {} }; }
            },

            saveQuota: (q) => {
                try { localStorage.setItem('mokha_llm_quota', JSON.stringify(q)); } catch {}
            },

            trackUsage: (provider) => {
                const q = LLMBridge.loadQuota();
                q.counts[provider] = (q.counts[provider] || 0) + 1;
                // Track per-minute (rolling 60s window)
                const now = Date.now();
                const minuteStart = q.minuteTs[provider] || 0;
                if (now - minuteStart > 60000) {
                    q.minuteCounts[provider] = 1;
                    q.minuteTs[provider] = now;
                } else {
                    q.minuteCounts[provider] = (q.minuteCounts[provider] || 0) + 1;
                }
                LLMBridge.saveQuota(q);
            },

            getQuotaStats: (provider) => {
                const q = LLMBridge.loadQuota();
                const limits = LLMBridge.DAILY_LIMITS[provider] || { rpm: 10, rpd: 100, model: provider };
                const used = q.counts[provider] || 0;
                const remaining = Math.max(0, limits.rpd - used);
                const pct = Math.min(100, Math.round((used / limits.rpd) * 100));
                // Time until midnight reset
                const now = new Date();
                const midnight = new Date(now); midnight.setHours(24,0,0,0);
                const msLeft = midnight - now;
                const hLeft = Math.floor(msLeft / 3600000);
                const mLeft = Math.floor((msLeft % 3600000) / 60000);
                const resetIn = hLeft > 0 ? `${hLeft}h ${mLeft}m` : `${mLeft}m`;
                return { used, remaining, pct, rpd: limits.rpd, rpm: limits.rpm, model: limits.model, resetIn };
            },

            // Load/save settings from localStorage
            loadSettings: () => {
                try { return JSON.parse(localStorage.getItem('mokha_llm_settings') || '{}'); } catch { return {}; }
            },
            saveSettings: (s) => {
                try { localStorage.setItem('mokha_llm_settings', JSON.stringify(s)); } catch {}
            },

            // ── Specialized prompts ────────────────────────────────────────

            // 1. Generate a rich shot subject from a brief description
            generateShotSubject: async (brief, platform, selections, apiKey, provider) => {
                const selStr = selections ? `Camera: ${selections.camera||'any'}, Lens: ${selections.lens||'any'}, Lighting: ${selections.lighting||'any'}, Movement: ${selections.movement||'any'}, Shot Type: ${selections.shotType||'any'}` : '';
                const prompt = `You are a professional cinematographer writing AI video prompts for ${platform || 'Runway'}.

Write a single rich, cinematic shot subject description for this brief: "${brief}"

${selStr ? `Current parameters: ${selStr}` : ''}

Rules:
- 2-4 sentences maximum
- Include: subject action, environment/atmosphere, lighting quality, emotional tone
- Use specific sensory details (textures, colors, sounds implied by visuals)
- Format for AI video generation — no camera instructions, just what's IN the frame
- Do NOT include camera/lens/movement instructions (those are separate parameters)
- Output ONLY the shot description, nothing else`;
                return LLMBridge.call(prompt, provider || 'gemini', apiKey);
            },

            // 2. Generate a complete 3-act story from one sentence
            generateFullStory: async (premise, apiKey, provider) => {
                const prompt = `You are a professional screenwriter. Generate a complete 3-act story structure from this premise: "${premise}"

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "genre": "Drama|Horror|Sci-Fi|Thriller / Crime|Action / War|Fantasy|Romance",
  "tone": "Dark & Gritty|Hopeful|Tense / Suspenseful|Melancholic|Cinematic|Comedic",
  "protagonist": "Name and one-line description",
  "act1": {
    "character": "Who is the protagonist and what do they want (2 sentences)",
    "world": "The world/setting established (2 sentences)",
    "incident": "The inciting incident that disrupts their world (2 sentences)"
  },
  "act2": {
    "obstacles": "The main obstacles and rising action (2 sentences)",
    "midpoint": "The midpoint reversal that changes everything (2 sentences)",
    "stakes": "What is now at risk — the personal stakes (2 sentences)"
  },
  "act3": {
    "climax": "The final confrontation (2 sentences)",
    "resolution": "How the conflict resolves (2 sentences)",
    "aftermath": "The new status quo / final image (1 sentence)"
  },
  "theme": "The central theme or message (1 sentence)",
  "centralConflict": "The core conflict in one sentence",
  "characters": [
    {"name": "Protagonist name", "motivation": "What they want", "fear": "What they fear"},
    {"name": "Antagonist name", "motivation": "What they want", "fear": "What they fear"}
  ]
}`;
                const raw = await LLMBridge.call(prompt, provider || 'gemini', apiKey);
                // Extract JSON from response
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error('Could not parse story JSON from AI response');
                return JSON.parse(jsonMatch[0]);
            },

            // 3. Enhance an existing shot subject for maximum AI video quality
            enhanceShot: async (subject, platform, selections, apiKey, provider) => {
                const selStr = selections ? `Shot Type: ${selections.shotType||'?'}, Camera: ${selections.camera||'?'}, Lighting: ${selections.lighting||'?'}, Movement: ${selections.movement||'?'}` : '';
                const prompt = `You are an expert AI video prompt engineer specializing in ${platform || 'Runway'}.

Enhance this shot description for maximum AI video generation quality:
"${subject}"

${selStr ? `Parameters: ${selStr}` : ''}

Rules:
- Keep the core subject and action
- Add rich atmospheric detail, lighting quality, texture, depth
- Add emotional subtext through visual elements
- Optimize specifically for ${platform || 'Runway'}'s strengths
- 3-5 sentences maximum
- Output ONLY the enhanced description, nothing else`;
                return LLMBridge.call(prompt, provider || 'gemini', apiKey);
            },

            // 4. Analyze images / storyboard → generate full story structure
            // images: array of { base64: string, mimeType: string, name: string }
            analyzeImages: async (images, userPrompt, apiKey) => {
                if (!images?.length) throw new Error('No images provided');

                // Build multimodal parts — text + images
                const parts = [];

                // System instruction as first text part
                parts.push({ text: `You are a professional screenwriter and cinematographer analyzing visual content to create a complete film story structure.

Analyze the provided image(s) carefully. They may be:
- A storyboard (sequence of panels showing a story)
- Reference images showing a visual style, mood, or setting
- Character sketches or concept art
- A single scene or location photo

${userPrompt ? `User instruction: "${userPrompt}"` : 'Generate a complete 3-act story structure inspired by these images.'}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, no code blocks):
{
  "imageDescription": "Brief description of what you see in the image(s) (2-3 sentences)",
  "genre": "Drama|Horror|Sci-Fi|Thriller / Crime|Action / War|Fantasy|Romance",
  "tone": "Dark & Gritty|Hopeful|Tense / Suspenseful|Melancholic|Cinematic|Comedic",
  "visualStyle": "Description of the visual style detected (lighting, color palette, mood)",
  "detectedCamera": "Camera/lens style detected if any (e.g. Wide angle, Close-up, etc.)",
  "detectedLighting": "Lighting style detected (e.g. Golden Hour, Low Key, etc.)",
  "act1": {
    "character": "Protagonist introduced based on visual cues (2 sentences)",
    "world": "The world/setting as seen in the images (2 sentences)",
    "incident": "Inciting incident suggested by the imagery (2 sentences)"
  },
  "act2": {
    "obstacles": "Rising action and obstacles suggested by the visuals (2 sentences)",
    "midpoint": "Midpoint reversal suggested by the imagery (2 sentences)",
    "stakes": "What is at stake based on visual tone (2 sentences)"
  },
  "act3": {
    "climax": "Final confrontation suggested by the imagery (2 sentences)",
    "resolution": "Resolution suggested by the visual narrative (2 sentences)",
    "aftermath": "Final image / new status quo (1 sentence)"
  },
  "theme": "Central theme suggested by the visuals (1 sentence)",
  "centralConflict": "Core conflict in one sentence",
  "shotSuggestions": [
    "Shot suggestion 1 based on image",
    "Shot suggestion 2 based on image",
    "Shot suggestion 3 based on image"
  ],
  "characters": [
    {"name": "Character name or description", "motivation": "What they want", "fear": "What they fear"}
  ]
}` });

                // Add each image as an inline_data part
                images.forEach(img => {
                    parts.push({
                        inline_data: {
                            mime_type: img.mimeType || 'image/jpeg',
                            data: img.base64
                        }
                    });
                });

                // Must use a vision-capable model — only free tier models
                const visionModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17'];
                let lastErr = null;

                for (const model of visionModels) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                        const body = {
                            contents: [{ parts }],
                            generationConfig: { maxOutputTokens: 1200, temperature: 0.6 }
                        };
                        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                        if (!res.ok) {
                            const err = await res.json();
                            lastErr = new Error(err.error?.message || `HTTP ${res.status}`);
                            if (res.status === 404 || (err.error?.message||'').includes('not found')) continue;
                            throw lastErr;
                        }
                        const data = await res.json();
                        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        // Extract JSON
                        const jsonMatch = raw.match(/\{[\s\S]*\}/);
                        if (!jsonMatch) throw new Error('Could not parse JSON from vision response');
                        return JSON.parse(jsonMatch[0]);
                    } catch(e) {
                        if (e.message?.includes('not found') || e.message?.includes('not supported')) { lastErr = e; continue; }
                        throw e;
                    }
                }
                throw lastErr || new Error('No vision-capable Gemini model available');
            },

            // 5. Transcribe audio blob → text via Gemini
            // audioBlob: Blob (webm/ogg/mp4), lang: 'en-US' | 'fr-FR'
            transcribeAudio: async (audioBlob, lang, apiKey) => {
                // Convert blob to base64
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(audioBlob);
                });

                const langName = lang === 'fr-FR' ? 'French' : 'English';
                const parts = [
                    { text: `Transcribe the following audio recording accurately in ${langName}. Return ONLY the transcribed text, nothing else. No punctuation corrections, no formatting, no explanation — just the exact words spoken.` },
                    { inline_data: { mime_type: audioBlob.type || 'audio/webm', data: base64 } }
                ];

                // Audio transcription — only free tier models
                const audioModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17'];
                let lastErr = null;

                for (const model of audioModels) {
                    try {
                        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                        const body = {
                            contents: [{ parts }],
                            generationConfig: { maxOutputTokens: 200, temperature: 0 }
                        };
                        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                        if (!res.ok) {
                            const err = await res.json();
                            lastErr = new Error(err.error?.message || `HTTP ${res.status}`);
                            if (res.status === 404 || (err.error?.message||'').includes('not found')) continue;
                            throw lastErr;
                        }
                        const data = await res.json();
                        const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
                        if (text) return text;
                    } catch(e) {
                        if (e.message?.includes('not found') || e.message?.includes('not supported')) { lastErr = e; continue; }
                        throw e;
                    }
                }
                throw lastErr || new Error('No audio-capable Gemini model available');
            }
        };

// ══════════════════════════════════════════════════════════════════════
        // VIDEO BRIDGE — Real-Time AI Video Preview
        // Supports: Runway ML, Kling AI, Pika Labs
        // ══════════════════════════════════════════════════════════════════════
        export const VideoBridge = {

            STORAGE_KEY: 'mokha_video_settings',

            loadSettings: () => {
                try { return JSON.parse(localStorage.getItem('mokha_video_settings') || '{}'); } catch { return {}; }
            },

            saveSettings: (s) => {
                try { localStorage.setItem('mokha_video_settings', JSON.stringify(s)); } catch {}
            },

            generateRunway: async (prompt, apiKey, opts = {}) => {
                const { duration = 5, ratio = '1280:720', model = 'gen4_turbo' } = opts;
                const submitRes = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' },
                    body: JSON.stringify({ model, promptText: prompt, duration, ratio, watermark: false })
                });
                if (!submitRes.ok) { const err = await submitRes.json(); throw new Error(err.message || `Runway error: HTTP ${submitRes.status}`); }
                const task = await submitRes.json();
                if (!task.id) throw new Error('Runway: no task ID returned');
                return VideoBridge._pollRunway(task.id, apiKey);
            },

            _pollRunway: async (taskId, apiKey, attempts = 0) => {
                if (attempts > 60) throw new Error('Runway: generation timed out after 5 minutes');
                await new Promise(r => setTimeout(r, 5000));
                const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' } });
                if (!res.ok) throw new Error(`Runway poll error: HTTP ${res.status}`);
                const data = await res.json();
                if (data.status === 'SUCCEEDED') return { url: data.output?.[0], provider: 'runway', taskId };
                if (data.status === 'FAILED') throw new Error(`Runway generation failed: ${data.failure || 'Unknown error'}`);
                return VideoBridge._pollRunway(taskId, apiKey, attempts + 1);
            },

            generateKling: async (prompt, apiKey, opts = {}) => {
                const { duration = 5, ratio = '16:9', model = 'kling-v1' } = opts;
                const submitRes = await fetch('https://api.klingai.com/v1/videos/text2video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model_name: model, prompt, duration: String(duration), aspect_ratio: ratio, cfg_scale: 0.5 })
                });
                if (!submitRes.ok) { const err = await submitRes.json(); throw new Error(err.message || `Kling error: HTTP ${submitRes.status}`); }
                const task = await submitRes.json();
                const taskId = task.data?.task_id;
                if (!taskId) throw new Error('Kling: no task ID returned');
                return VideoBridge._pollKling(taskId, apiKey);
            },

            _pollKling: async (taskId, apiKey, attempts = 0) => {
                if (attempts > 60) throw new Error('Kling: generation timed out');
                await new Promise(r => setTimeout(r, 5000));
                const res = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                if (!res.ok) throw new Error(`Kling poll error: HTTP ${res.status}`);
                const data = await res.json();
                const status = data.data?.task_status;
                if (status === 'succeed') return { url: data.data?.task_result?.videos?.[0]?.url, provider: 'kling', taskId };
                if (status === 'failed') throw new Error(`Kling generation failed: ${data.data?.task_status_msg || 'Unknown error'}`);
                return VideoBridge._pollKling(taskId, apiKey, attempts + 1);
            },

            generatePika: async (prompt, apiKey, opts = {}) => {
                const { duration = 3, ratio = '16:9' } = opts;
                const submitRes = await fetch('https://api.pika.art/v1/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ prompt, options: { duration, aspectRatio: ratio, frameRate: 24 } })
                });
                if (!submitRes.ok) { const err = await submitRes.json(); throw new Error(err.message || `Pika error: HTTP ${submitRes.status}`); }
                const task = await submitRes.json();
                const taskId = task.id || task.task_id;
                if (!taskId) throw new Error('Pika: no task ID returned');
                return VideoBridge._pollPika(taskId, apiKey);
            },

            _pollPika: async (taskId, apiKey, attempts = 0) => {
                if (attempts > 60) throw new Error('Pika: generation timed out');
                await new Promise(r => setTimeout(r, 4000));
                const res = await fetch(`https://api.pika.art/v1/tasks/${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                if (!res.ok) throw new Error(`Pika poll error: HTTP ${res.status}`);
                const data = await res.json();
                if (data.status === 'completed' || data.status === 'finished') return { url: data.video?.url || data.result_url, provider: 'pika', taskId };
                if (data.status === 'failed') throw new Error('Pika generation failed');
                return VideoBridge._pollPika(taskId, apiKey, attempts + 1);
            },

            generate: async (prompt, settings) => {
                const { provider, apiKey, duration, ratio } = settings;
                if (!apiKey?.trim()) throw new Error(`No ${provider} API key set. Add it in ⚙️ Settings → Video Preview.`);
                const opts = { duration: duration || 5, ratio: ratio || '16:9' };
                switch (provider) {
                    case 'runway': return VideoBridge.generateRunway(prompt, apiKey.trim(), opts);
                    case 'kling':  return VideoBridge.generateKling(prompt, apiKey.trim(), opts);
                    case 'pika':   return VideoBridge.generatePika(prompt, apiKey.trim(), opts);
                    default: throw new Error('Unknown video provider');
                }
            }
        };

// ══════════════════════════════════════════════════════════════════════
        // IMAGE BRIDGE — AI Image Generation via API
        // Supports: Gemini, OpenRouter (FLUX, SDXL), Mistral, OpenAI DALL-E,
        //           NanoBanana, Seedream, Stability AI
        // ══════════════════════════════════════════════════════════════════════
        export const ImageBridge = {

            STORAGE_KEY: 'mokha_image_settings',

            PROVIDERS: [
                { id: 'pollinations', label: 'Pollinations', color: 'text-lime-400',   desc: '🆓 FREE · No API key needed', url: 'https://pollinations.ai' },
                { id: 'openai',      label: 'DALL-E 3',      color: 'text-green-400',  desc: 'OpenAI · Best quality',    url: 'https://platform.openai.com/api-keys' },
                { id: 'stability',   label: 'Stability AI',  color: 'text-yellow-400', desc: 'SDXL · Fast & cheap',      url: 'https://platform.stability.ai/account/credits' },
                { id: 'openrouter',  label: 'fal.ai / FLUX', color: 'text-blue-400',   desc: 'FLUX Schnell · Fast',      url: 'https://fal.ai/dashboard/keys' },
                { id: 'mistral',     label: 'Mistral',       color: 'text-orange-400', desc: 'Pixtral vision',           url: 'https://console.mistral.ai/api-keys' },
                { id: 'gemini',      label: 'Gemini',        color: 'text-cyan-400',   desc: 'Imagen 3 · Google',        url: 'https://aistudio.google.com/apikey' },
                { id: 'nanobanana',  label: 'NanoBanana',    color: 'text-pink-400',   desc: 'Ultra cheap · Fast',       url: 'https://nanobanana.ai' },
                { id: 'seedream',    label: 'Seedream',      color: 'text-violet-400', desc: 'Seedream 3 · Cinematic',   url: 'https://platform.stepfun.com' },
            ],

            loadSettings: () => {
                try { return JSON.parse(localStorage.getItem('mokha_image_settings') || '{}'); } catch { return {}; }
            },

            saveSettings: (s) => {
                try { localStorage.setItem('mokha_image_settings', JSON.stringify(s)); } catch {}
            },

            // ── OpenAI DALL-E 3 ───────────────────────────────────────────────
            generateOpenAI: async (prompt, apiKey, opts = {}) => {
                const { size = '1792x1024', quality = 'standard' } = opts;
                const res = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality, response_format: 'url' })
                });
                if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || `OpenAI error: HTTP ${res.status}`); }
                const data = await res.json();
                return { url: data.data?.[0]?.url, provider: 'openai', revisedPrompt: data.data?.[0]?.revised_prompt };
            },

            // ── Stability AI (SDXL / SD3) ─────────────────────────────────────
            generateStability: async (prompt, apiKey, opts = {}) => {
                const { ratio = '16:9' } = opts;
                const ratioMap = { '16:9': { width: 1344, height: 768 }, '9:16': { width: 768, height: 1344 }, '1:1': { width: 1024, height: 1024 }, '4:3': { width: 1152, height: 896 } };
                const { width, height } = ratioMap[ratio] || ratioMap['16:9'];
                const res = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
                    body: JSON.stringify({ text_prompts: [{ text: prompt, weight: 1 }], cfg_scale: 7, width, height, steps: 30, samples: 1 })
                });
                if (!res.ok) { const err = await res.json(); throw new Error(err.message || `Stability error: HTTP ${res.status}`); }
                const data = await res.json();
                const b64 = data.artifacts?.[0]?.base64;
                if (!b64) throw new Error('Stability: no image returned');
                return { url: `data:image/png;base64,${b64}`, provider: 'stability' };
            },

            // ── OpenRouter → redirects to fal.ai FLUX (OpenRouter has no image endpoint) ──
            generateOpenRouter: async (prompt, apiKey, opts = {}) => {
                // OpenRouter doesn't support image generation directly.
                // We use fal.ai's FLUX API which accepts the same key format.
                // If user has a fal.ai key, use it; otherwise try Pollinations as fallback.
                const ratioMap = { '16:9': { width: 1344, height: 768 }, '9:16': { width: 768, height: 1344 }, '1:1': { width: 1024, height: 1024 }, '4:3': { width: 1152, height: 896 } };
                const { width, height } = ratioMap[opts.ratio || '16:9'] || ratioMap['16:9'];
                try {
                    // Try fal.ai FLUX Schnell (fast, cheap)
                    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${apiKey}` },
                        body: JSON.stringify({ prompt, image_size: { width, height }, num_images: 1, num_inference_steps: 4 })
                    });
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(`fal.ai error: HTTP ${res.status} — ${text.substring(0, 100)}`);
                    }
                    const data = await res.json();
                    const url = data.images?.[0]?.url;
                    if (!url) throw new Error('fal.ai: no image URL returned');
                    return { url, provider: 'openrouter' };
                } catch(e) {
                    // Fallback to Pollinations if fal.ai fails
                    console.warn('fal.ai failed, falling back to Pollinations:', e.message);
                    return ImageBridge.generatePollinations(prompt, opts);
                }
            },

            // ── Gemini Imagen 3 ───────────────────────────────────────────────
            generateGemini: async (prompt, apiKey, opts = {}) => {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: opts.ratio || '16:9' } })
                });
                if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || `Gemini Imagen error: HTTP ${res.status}`); }
                const data = await res.json();
                const b64 = data.predictions?.[0]?.bytesBase64Encoded;
                if (!b64) throw new Error('Gemini Imagen: no image returned');
                return { url: `data:image/png;base64,${b64}`, provider: 'gemini' };
            },

            // ── Mistral (via Pixtral — text-to-image via OpenRouter) ──────────
            generateMistral: async (prompt, apiKey, opts = {}) => {
                return ImageBridge.generateOpenRouter(prompt, apiKey, { ...opts, model: 'mistralai/pixtral-12b-2409' });
            },

            // ── NanoBanana ────────────────────────────────────────────────────
            generateNanoBanana: async (prompt, apiKey, opts = {}) => {
                const res = await fetch('https://api.nanobanana.ai/v1/images/generations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ prompt, model: 'nano-flux', width: 1344, height: 768 })
                });
                if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message || `NanoBanana error: HTTP ${res.status}`); }
                const data = await res.json();
                return { url: data.data?.[0]?.url || data.url, provider: 'nanobanana' };
            },

            // ── Seedream (StepFun) ────────────────────────────────────────────
            generateSeedream: async (prompt, apiKey, opts = {}) => {
                const res = await fetch('https://api.stepfun.com/v1/images/generations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model: 'step-1x-medium', prompt, n: 1, size: opts.size || '1792x1024' })
                });
                if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message || `Seedream error: HTTP ${res.status}`); }
                const data = await res.json();
                return { url: data.data?.[0]?.url, provider: 'seedream' };
            },

            // ── Universal generate ────────────────────────────────────────────
            // ── Pollinations.AI — completely FREE, no API key needed ─────────
            generatePollinations: async (prompt, opts = {}) => {
                const ratioMap = { '16:9': [1344, 768], '9:16': [768, 1344], '1:1': [1024, 1024], '4:3': [1152, 896] };
                const [width, height] = ratioMap[opts.ratio || '16:9'] || [1344, 768];
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`;
                // Pollinations returns the image directly at the URL — verify it loads
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Pollinations error: HTTP ${res.status}`);
                return { url, provider: 'pollinations' };
            },

            generate: async (prompt, settings) => {
                const { provider, apiKey, ratio, size } = settings;
                const opts = { ratio: ratio || '16:9', size: size || '1792x1024' };
                // Pollinations needs no API key
                if (provider === 'pollinations') return ImageBridge.generatePollinations(prompt, opts);
                if (!apiKey?.trim()) throw new Error(`No ${provider} API key set. Add it in ⚙️ API Keys settings.`);
                switch (provider) {
                    case 'openai':     return ImageBridge.generateOpenAI(prompt, apiKey.trim(), opts);
                    case 'stability':  return ImageBridge.generateStability(prompt, apiKey.trim(), opts);
                    case 'openrouter': return ImageBridge.generateOpenRouter(prompt, apiKey.trim(), opts);
                    case 'gemini':     return ImageBridge.generateGemini(prompt, apiKey.trim(), opts);
                    case 'mistral':    return ImageBridge.generateMistral(prompt, apiKey.trim(), opts);
                    case 'nanobanana': return ImageBridge.generateNanoBanana(prompt, apiKey.trim(), opts);
                    case 'seedream':   return ImageBridge.generateSeedream(prompt, apiKey.trim(), opts);
                    default: throw new Error('Unknown image provider');
                }
            }
        };

// ── TASK 4: runChain — sequential multi-step executor ────────────────────────
        export const runChain = (steps, appActions, convContext, callbacks, agentActionLogRef, setAgentActionLogFn, sessionMemoryRef, setSessionMemoryFn) => {
            let currentContext = { ...convContext };
            const results = [];

            const runStep = (i) => {
                if (i >= steps.length) {
                    const lastResult = results[results.length - 1];
                    const suggestion = getProactiveSuggestion(lastResult, appActions);
                    callbacks.onChainComplete(results, suggestion);
                    return;
                }
                callbacks.onStepStart(i);
                setTimeout(() => {
                    try {
                        const result = agentDispatch(steps[i], appActions, currentContext, agentActionLogRef, setAgentActionLogFn, sessionMemoryRef, setSessionMemoryFn);
                        if (result.contextUpdate) currentContext = { ...currentContext, ...result.contextUpdate };
                        if (result.snapshot) {
                            setAgentActionLogFn(prev => {
                                const entry = { id: Date.now() + i, ts: Date.now(), description: steps[i], snapshot: result.snapshot, resultText: result.text, featureId: 0 };
                                return [...prev.slice(-19), entry];
                            });
                        }
                        results.push(result);
                        callbacks.onStepDone(i, result);
                    } catch (err) {
                        callbacks.onStepError(i, err.message || 'Unknown error');
                        results.push({ text: `Error: ${err.message}`, type: 'error' });
                    }
                    runStep(i + 1);
                }, 350);
            };

            runStep(0);
        };

