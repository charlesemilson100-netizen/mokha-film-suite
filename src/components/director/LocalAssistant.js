import React, { useEffect, useRef, useState } from 'react';
import { DirectorBrainPanel } from './DirectorBrainPanel';
import { Icon } from '../ui/Icon';
import { agentDispatch, getProactiveSuggestion, parseIntentChain, resolveContext } from '../../engine/command';
import { LLMBridge, runChain } from '../../engine/llm';
import { DIRECTOR_PROFILE_KEY, PROFILE_QUESTIONS, buildProfileContext, buildSnapshot, loadAgentMemory, loadDirectorProfile, saveAgentMemory, saveDirectorProfile } from '../../engine/memory';
import { buildProjectSnapshot } from '../../engine/snapshot';

export const LocalAssistant = ({ currentView, activeInputTab, setShowStoryEngineModal, setShowPromptLibraryModal, appActions, videoSettings: videoSettingsProp, saveVideoSettings: saveVideoSettingsProp, imageSettings: imageSettingsProp, saveImageSettings: saveImageSettingsProp, brainMode, deepBrainEngineRef }) => {
            // Use passed props with fallback defaults
            const videoSettings = videoSettingsProp || { provider: 'runway', apiKey: '', duration: 5, ratio: '16:9' };
            const saveVideoSettings = saveVideoSettingsProp || (() => {});
            const imageSettings = imageSettingsProp || { provider: 'openai', apiKey: '', ratio: '16:9' };
            const saveImageSettings = saveImageSettingsProp || (() => {});
            const [isOpen, setIsOpen] = useState(false);
            const [isClosing, setIsClosing] = React.useState(false);
            const [input, setInput] = useState('');
            const [messages, setMessages] = useState([]);
            const messagesEndRef = useRef(null);
            // Feature #3 — Shot streak & session stats
            const [sessionShotCount, setSessionShotCount] = useState(0);
            const [sessionStats, setSessionStats] = useState({ lightingUsed: [], stylesUsed: [], camerasUsed: [] });
            // Feature #6 — Daily challenge
            const [dailyChallenge, setDailyChallenge] = useState(null);
            // Feature #13 — Session memory
            const [sessionMemory, setSessionMemory] = useState({ directorStyle: null, mood: null, projectName: null, lastShotSubject: null });
            // Tab state for header
            const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'challenge' | 'stats'

            // ── Agent-level state ──────────────────────────────────────────
            // Feature 1 — Task queue / progress
            const [taskQueue, setTaskQueue] = useState([]); // [{label, status:'pending'|'done'|'error'}]
            const [isRunningChain, setIsRunningChain] = useState(false);
            // Feature 3 — Conversation context for pronoun resolution
            const [convContext, setConvContext] = useState({});
            // Feature 5 — Agent action log for undo
            const [agentActionLog, setAgentActionLog] = useState([]);
            // Feature 15 — Cross-session memory
            const [crossSessionMemory] = useState(() => loadAgentMemory());
            // ── Director Profile Interview ─────────────────────────────────
            const [directorProfile, setDirectorProfile] = useState(() => loadDirectorProfile());
            const [profileInterview, setProfileInterview] = useState(null); // { step, answers }
            const isInterviewing = !!profileInterview;

            const startProfileInterview = () => {
                setProfileInterview({ step: 0, answers: {} });
                setMessages([{ sender: 'bot', text: PROFILE_QUESTIONS[0].q }]);
            };

            const handleProfileAnswer = (answer) => {
                if (!profileInterview) return false;
                const { step, answers } = profileInterview;
                const qKey = PROFILE_QUESTIONS[step].key;
                const newAnswers = { ...answers, [qKey]: answer.trim() };

                if (step < PROFILE_QUESTIONS.length - 1) {
                    const nextQ = PROFILE_QUESTIONS[step + 1];
                    const nextText = typeof nextQ.q === 'function'
                        ? nextQ.q(newAnswers.name || 'Director', newAnswers)
                        : nextQ.q;
                    setProfileInterview({ step: step + 1, answers: newAnswers });
                    setMessages(prev => [
                        ...prev,
                        { sender: 'user', text: answer },
                        { sender: 'bot', text: nextText }
                    ]);
                } else {
                    // Interview complete — save profile
                    const profile = { ...newAnswers, createdAt: new Date().toLocaleDateString() };
                    saveDirectorProfile(profile);
                    setDirectorProfile(profile);
                    setProfileInterview(null);
                    const name = profile.name || 'Director';
                    setMessages(prev => [
                        ...prev,
                        { sender: 'user', text: answer },
                        { sender: 'bot', text: `Perfect, ${name}! 🎬\n\nI've saved your Director Profile. From now on I'll address you by name and tailor my suggestions to your style and goals.\n\nYour profile:\n👤 ${name} · ${profile.level}\n🎭 Genres: ${profile.genre}\n🎯 Goal: ${profile.goal}\n✨ Inspired by: ${profile.inspiration}\n\nNow let's make something incredible. What are we building today?` }
                    ]);
                }
                return true; // handled
            };
            // Feature 16 — Last action explanation
            const [lastActionExplanation, setLastActionExplanation] = useState(null);

            // ── LLM API state ──────────────────────────────────────────────
            const [llmSettings, setLlmSettings] = useState(() => LLMBridge.loadSettings());
            const [llmTesting, setLlmTesting] = useState(false);
            const [llmTestResult, setLlmTestResult] = useState(null); // null | 'ok' | 'error'
            const [llmTestMsg, setLlmTestMsg] = useState('');
            const [llmTestingProvider, setLlmTestingProvider] = useState(null); // which provider is being tested

            // Get the API key for a specific provider (or active provider)
            const getKey = React.useCallback((provider) => {
                const p = provider || llmSettings.provider || 'gemini';
                const keys = llmSettings.keys || {};
                // DeepSeek uses OpenRouter key as fallback
                if (p === 'deepseek') return keys['deepseek'] || keys['openrouter'] || llmSettings.apiKey || '';
                return keys[p] || llmSettings.apiKey || ''; // fallback to legacy single key
            }, [llmSettings]);

            // Check if any provider has a key (for llmEnabled)
            const activeKey = getKey(llmSettings.provider || 'gemini');
            const llmEnabled = !!(llmSettings.enabled && activeKey.trim());

            // Count how many providers have keys (DeepSeek counts if OpenRouter key exists)
            const connectedCount = ['gemini','openrouter','deepseek','mistral','groq'].filter(p => {
                const keys = llmSettings.keys || {};
                if (p === 'deepseek') return !!(keys['deepseek'] || keys['openrouter']);
                return !!keys[p]?.trim();
            }).length;

            // ── Quota tracking state ───────────────────────────────────────
            const [quotaStats, setQuotaStats] = useState(() => LLMBridge.getQuotaStats(LLMBridge.loadSettings().provider || 'gemini'));

            // ── Conversation history for LLM context (last 10 turns) ──────
            const [llmHistory, setLlmHistory] = useState([]); // [{role:'user'|'assistant', content:string}]

            const pushLlmHistory = React.useCallback((role, content) => {
                setLlmHistory(prev => [...prev.slice(-18), { role, content }]); // keep last 10 pairs = 20 entries
            }, []);

            // Refresh quota display after every call and every 30s
            const refreshQuota = React.useCallback(() => {
                setQuotaStats(LLMBridge.getQuotaStats(llmSettings.provider || 'gemini'));
            }, [llmSettings.provider]);

            useEffect(() => {
                refreshQuota();
                const interval = setInterval(refreshQuota, 30000);
                return () => clearInterval(interval);
            }, [refreshQuota]);

            // ── Vision image state ─────────────────────────────────────────
            // pendingImages: [{ base64, mimeType, name, previewUrl }]
            const [pendingImages, setPendingImages] = useState([]);
            const imageInputRef = useRef(null);

            const saveLlmSettings = React.useCallback((patch) => {
                setLlmSettings(prev => {
                    const next = { ...prev, ...patch };
                    LLMBridge.saveSettings(next);
                    return next;
                });
            }, []);

            // ── Image loader — reads File → base64 ────────────────────────
            const loadImageFile = React.useCallback((file) => {
                return new Promise((resolve, reject) => {
                    if (!file.type.startsWith('image/')) { reject(new Error('Not an image')); return; }
                    if (file.size > 10 * 1024 * 1024) { reject(new Error('Image too large (max 10MB)')); return; }
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const dataUrl = e.target.result;
                        const base64 = dataUrl.split(',')[1];
                        resolve({ base64, mimeType: file.type, name: file.name, previewUrl: dataUrl });
                    };
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsDataURL(file);
                });
            }, []);

            const handleImageFiles = React.useCallback(async (files) => {
                const fileArr = Array.from(files).slice(0, 4); // max 4 images
                try {
                    const loaded = await Promise.all(fileArr.map(loadImageFile));
                    setPendingImages(prev => [...prev, ...loaded].slice(0, 4));
                } catch(e) {
                    setMessages(p => [...p, { sender: 'bot', text: `⚠️ ${e.message}`, isWarning: true }]);
                }
            }, [loadImageFile]);

            // ── Drag / Resize state ────────────────────────────────────────
            const [panelSize, setPanelSize] = useState({ w: 320, h: 520 });
            const [panelPos, setPanelPos] = useState(null); // null = default bottom-right anchor
            const [fabPos, setFabPos] = useState(null);     // null = default bottom-right anchor
            const dragRef = useRef(null);   // tracks active drag/resize operation
            const panelRef = useRef(null);
            const fabRef = useRef(null);

            // Generic pointer-drag helper — returns cleanup fn
            const startDrag = React.useCallback((e, onMove, onEnd) => {
                e.preventDefault();
                e.stopPropagation();
                const onPointerMove = (ev) => onMove(ev);
                const onPointerUp = (ev) => {
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);
                    if (onEnd) onEnd(ev);
                };
                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
            }, []);

            // Drag the panel by its header
            const onHeaderDragStart = React.useCallback((e) => {
                if (e.target.closest('button')) return; // don't drag when clicking header buttons
                const panel = panelRef.current;
                if (!panel) return;
                const rect = panel.getBoundingClientRect();
                const startX = e.clientX - rect.left;
                const startY = e.clientY - rect.top;
                startDrag(e,
                    (ev) => {
                        const x = Math.max(0, Math.min(window.innerWidth - rect.width, ev.clientX - startX));
                        const y = Math.max(0, Math.min(window.innerHeight - rect.height, ev.clientY - startY));
                        setPanelPos({ x, y });
                    }
                );
            }, [startDrag]);

            // Resize from the bottom-right corner handle
            const onResizeStart = React.useCallback((e) => {
                e.stopPropagation();
                const panel = panelRef.current;
                if (!panel) return;
                const rect = panel.getBoundingClientRect();
                const startX = e.clientX;
                const startY = e.clientY;
                const startW = rect.width;
                const startH = rect.height;
                startDrag(e,
                    (ev) => {
                        const w = Math.max(280, Math.min(window.innerWidth - (panelPos?.x || 0) - 8, startW + (ev.clientX - startX)));
                        const h = Math.max(360, Math.min(window.innerHeight - (panelPos?.y || 0) - 8, startH + (ev.clientY - startY)));
                        setPanelSize({ w, h });
                    }
                );
            }, [startDrag, panelPos]);

            // Drag the FAB button
            const onFabDragStart = React.useCallback((e) => {
                const fab = fabRef.current;
                if (!fab) return;
                const rect = fab.getBoundingClientRect();
                const startX = e.clientX - rect.left;
                const startY = e.clientY - rect.top;
                let moved = false;
                startDrag(e,
                    (ev) => {
                        moved = true;
                        const x = Math.max(0, Math.min(window.innerWidth - 56, ev.clientX - startX));
                        const y = Math.max(0, Math.min(window.innerHeight - 56, ev.clientY - startY));
                        setFabPos({ x, y });
                    },
                    () => { dragRef.current = moved; }
                );
            }, [startDrag]);

            const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            };

            // ── Tips of the Day database ───────────────────────────────────
            const TIPS_DB = [
                { cat: '🎬 Cinematography', tip: 'The 180° rule: keep the camera on one side of an imaginary line between characters to maintain spatial consistency.' },
                { cat: '🎬 Cinematography', tip: 'Dolly In on a Close-Up = intimacy. Dolly Out on a Wide Shot = isolation. Same move, opposite emotion.' },
                { cat: '🎬 Cinematography', tip: 'Dutch Angle signals psychological unease. Use it sparingly — overuse kills the effect.' },
                { cat: '🎬 Cinematography', tip: 'Shot duration: 3s for action, 4s for dialogue, 5s+ for atmosphere. Shorter = tension, longer = contemplation.' },
                { cat: '💡 Lighting', tip: 'Golden Hour lasts ~20 minutes. Villeneuve shot almost every exterior in Blade Runner 2049 during this window.' },
                { cat: '💡 Lighting', tip: 'Low Key lighting uses a single source with deep shadows. High Key uses multiple sources to eliminate shadows.' },
                { cat: '💡 Lighting', tip: 'Rim lighting separates your subject from the background — essential for dark scenes.' },
                { cat: '💡 Lighting', tip: 'Volumetric lighting (god rays) requires particles in the air — dust, smoke, fog. Without them, the rays won\'t be visible.' },
                { cat: '🎥 Camera', tip: '85mm is the "portrait lens" — matches the compression of the human eye at conversation distance. Perfect for faces.' },
                { cat: '🎥 Camera', tip: '14mm Ultra-Wide creates dramatic distortion at the edges. Great for environments, unsettling for faces.' },
                { cat: '🎥 Camera', tip: 'ARRI Alexa 65 = Hollywood gold standard. RED V-Raptor = sharp, clinical. Vintage 35mm = organic, warm grain.' },
                { cat: '🎥 Camera', tip: 'Handheld creates urgency and realism. Static/Tripod creates authority and control. The choice is always emotional.' },
                { cat: '📖 Story', tip: 'Every scene needs a Want (what the character is trying to do) and an Obstacle (what stops them). No obstacle = no scene.' },
                { cat: '📖 Story', tip: 'The Midpoint of Act 2 is where the protagonist shifts from reactive to proactive.' },
                { cat: '📖 Story', tip: 'The Inciting Incident should happen by page 10-15 in a 90-page script. Later = setup is too long.' },
                { cat: '📖 Story', tip: 'A great villain believes they\'re the hero of their own story. Give them a coherent worldview.' },
                { cat: '📖 Story', tip: '"Save the Cat": show your protagonist doing something likeable in the first 5 minutes so the audience roots for them.' },
                { cat: '🤖 AI Prompts', tip: 'Specificity beats length. "ARRI Alexa 65, 85mm, Golden Hour, Dolly In" outperforms a 200-word vague description.' },
                { cat: '🤖 AI Prompts', tip: 'Veo 3 is the only AI video model that generates synchronized audio natively. Use SFX and BGM fields for best results.' },
                { cat: '🤖 AI Prompts', tip: 'For character consistency, use the Character Library — the description is automatically injected into every prompt.' },
                { cat: '🤖 AI Prompts', tip: 'Negative prompts are powerful: "no artifacts, no extra fingers, no blurry background" dramatically improves output quality.' },
                { cat: '🤖 AI Prompts', tip: 'KLING excels at realistic human motion. Runway Gen-4 is best for stylized/artistic looks.' },
                { cat: '🎞 Film Stock', tip: 'Kodak Portra 400: warm skin tones, fine grain. Best for drama and romance.' },
                { cat: '🎞 Film Stock', tip: 'Fujifilm CineStill 800T: neon halos (halation) in highlights. Perfect for night city scenes.' },
                { cat: '🎞 Film Stock', tip: 'Ilford HP5: gritty black & white with strong contrast. The go-to for noir and psychological drama.' },
                { cat: '🎞 Film Stock', tip: 'ARRI LogC is a flat, neutral color profile — the "raw" look that colorists grade in post.' },
                { cat: '⚡ MOKHA Tips', tip: 'Chain commands: "create project Noir City, add 3 scenes, build tense shots in each" — all in one message.' },
                { cat: '⚡ MOKHA Tips', tip: '"analyze my project" gives a full audit: missing parameters, continuity breaks, platform flags, and estimated duration.' },
                { cat: '⚡ MOKHA Tips', tip: 'Director Rules are global instructions prepended to every shot. Enable "8K Quality" to improve all outputs at once.' },
                { cat: '⚡ MOKHA Tips', tip: '"steal this shot" loads a famous cinematic shot (Blade Runner, Parasite, Interstellar...) as a starting point.' },
                { cat: '⚡ MOKHA Tips', tip: 'The Story Engine\'s Emotional Arc Visualizer shows the tension curve of your story. Aim for rising tension with a peak at the climax.' },
            ];

            // ── Story Wizard state ─────────────────────────────────────────
            const [storyWizard, setStoryWizard] = useState(null); // null | { step, data }
            const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * 31));

            // ── Voice input state ──────────────────────────────────────────
            const [isListening, setIsListening] = useState(false);
            const [voiceLang, setVoiceLang] = useState('en-US'); // 'en-US' | 'fr-FR'
            const [voiceBars, setVoiceBars] = useState(new Array(20).fill(0)); // waveform bar heights
            const [interimText, setInterimText] = useState(''); // live partial transcript
            const [isTranscribing, setIsTranscribing] = useState(false); // Gemini transcription in progress
            const recognitionRef = useRef(null);
            const mediaRecorderRef = useRef(null); // for Gemini audio path
            const audioChunksRef = useRef([]);     // recorded audio chunks
            const audioCtxRef = useRef(null);
            const analyserRef = useRef(null);
            const micStreamRef = useRef(null);
            const waveAnimRef = useRef(null);
            const waveCanvasRef = useRef(null);

            // ── Command history (↑/↓ navigation) ──────────────────────────
            const [cmdHistory, setCmdHistory] = useState([]);
            const [historyIdx, setHistoryIdx] = useState(-1);

            // ── Last action diff ───────────────────────────────────────────
            const [lastDiff, setLastDiff] = useState(null);

            // ── Style fingerprint (learned from usage) ─────────────────────
            const styleFingerprint = React.useMemo(() => {
                const mem = loadAgentMemory();
                return mem.fingerprint || { lighting: {}, movement: {}, camera: {}, lens: {}, shotType: {}, duration: [] };
            }, []);

            const updateFingerprint = React.useCallback((selections) => {
                if (!selections) return;
                const fp = loadAgentMemory().fingerprint || { lighting: {}, movement: {}, camera: {}, lens: {}, shotType: {}, duration: [] };
                ['lighting','movement','camera','lens','shotType'].forEach(k => {
                    if (selections[k]) fp[k][selections[k]] = (fp[k][selections[k]] || 0) + 1;
                });
                if (selections.duration) fp.duration = [...(fp.duration || []).slice(-19), parseFloat(selections.duration) || 3];
                saveAgentMemory({ fingerprint: fp });
            }, []);

            // ── Voice input setup ──────────────────────────────────────────
            const stopVoice = React.useCallback(() => {
                if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    try { mediaRecorderRef.current.stop(); } catch {}
                }
                mediaRecorderRef.current = null;
                audioChunksRef.current = [];
                if (waveAnimRef.current) { cancelAnimationFrame(waveAnimRef.current); waveAnimRef.current = null; }
                if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
                if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
                analyserRef.current = null;
                setIsListening(false);
                setVoiceBars(new Array(20).fill(0));
                setInterimText('');
            }, []);

            const startVoice = React.useCallback(() => {
                if (isListening) { stopVoice(); return; }

                // ── Shared waveform visualizer (works in all modes) ────────
                const startWaveform = (stream) => {
                    micStreamRef.current = stream;
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        audioCtxRef.current = ctx;
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 64;
                        analyserRef.current = analyser;
                        ctx.createMediaStreamSource(stream).connect(analyser);
                        const BAR_COUNT = 20;
                        const dataArr = new Uint8Array(analyser.frequencyBinCount);
                        const drawWave = () => {
                            waveAnimRef.current = requestAnimationFrame(drawWave);
                            analyser.getByteFrequencyData(dataArr);
                            setVoiceBars(Array.from({ length: BAR_COUNT }, (_, i) =>
                                Math.min(1, (dataArr[Math.floor(i * dataArr.length / BAR_COUNT)] || 0) / 200)
                            ));
                        };
                        drawWave();
                    } catch {}
                };

                // ── MODE A: Gemini Audio Transcription (works on file://) ──
                // Preferred when API key is available — no HTTPS requirement
                if (llmEnabled) {
                    navigator.mediaDevices?.getUserMedia({ audio: true, video: false }).then(stream => {
                        startWaveform(stream);
                        setIsListening(true);
                        setInterimText(voiceLang === 'fr-FR' ? '🎤 Enregistrement... (Gemini)' : '🎤 Recording... (Gemini AI)');
                        audioChunksRef.current = [];

                        // Pick best supported format
                        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
                            : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
                            : MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg'
                            : 'audio/mp4';

                        const recorder = new MediaRecorder(stream, { mimeType });
                        mediaRecorderRef.current = recorder;

                        recorder.ondataavailable = e => { if (e.data?.size > 0) audioChunksRef.current.push(e.data); };

                        recorder.onstop = async () => {
                            const chunks = audioChunksRef.current;
                            audioChunksRef.current = [];
                            if (!chunks.length) return;

                            const audioBlob = new Blob(chunks, { type: mimeType });
                            // Minimum viable recording — skip if too short (< 0.5s ≈ < 5KB)
                            if (audioBlob.size < 5000) return;

                            setIsTranscribing(true);
                            setInterimText(voiceLang === 'fr-FR' ? '⏳ Transcription Gemini...' : '⏳ Gemini transcribing...');

                            try {
                                const transcript = await LLMBridge.transcribeAudio(audioBlob, voiceLang, getKey('gemini') || getKey(llmSettings.provider));
                                setInput(prev => (prev + ' ' + transcript).trim());
                                setInterimText('');
                                // Auto-submit after short delay
                                setTimeout(() => {
                                    const inputEl = document.getElementById('assistant-input');
                                    if (inputEl?.value.trim()) document.getElementById('assistant-submit-btn')?.click();
                                }, 600);
                            } catch(err) {
                                setInterimText('');
                                setMessages(p => [...p, { sender: 'bot', text: `⚠️ Transcription error: ${err.message}`, isWarning: true }]);
                            } finally {
                                setIsTranscribing(false);
                            }
                        };

                        recorder.start();
                        // Auto-stop after 30s max
                        setTimeout(() => {
                            if (mediaRecorderRef.current?.state === 'recording') stopVoice();
                        }, 30000);

                    }).catch(() => {
                        setMessages(p => [...p, { sender: 'bot', text: voiceLang === 'fr-FR'
                            ? '⚠️ Accès micro refusé.'
                            : '⚠️ Mic access denied. Allow microphone in browser settings.', isWarning: true }]);
                    });
                    return;
                }

                // ── MODE B: Web Speech API (fallback when no API key) ──────
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                const isSecureContext = window.isSecureContext
                    || location.protocol === 'https:'
                    || location.protocol === 'blob:'
                    || location.hostname === 'localhost'
                    || location.hostname === '127.0.0.1';

                if (!SR || !isSecureContext) {
                    navigator.mediaDevices?.getUserMedia({ audio: true, video: false }).then(stream => {
                        startWaveform(stream);
                        setIsListening(true);
                        setInterimText(voiceLang === 'fr-FR'
                            ? 'Mode micro actif — tapez votre commande\n\nAjoutez une clé Gemini dans ⚙️ pour la transcription automatique.'
                            : 'Mic active — type your command\n\nAdd a Gemini key in ⚙️ Settings for auto-transcription.');
                        setTimeout(() => stopVoice(), 30000);
                    }).catch(() => {
                        setMessages(p => [...p, { sender: 'bot', text: '⚠️ Mic access denied.', isWarning: true }]);
                    });
                    if (!llmEnabled) {
                        setMessages(p => [...p, { sender: 'bot', text: voiceLang === 'fr-FR'
                            ? '💡 Ajoutez une clé API Gemini dans ⚙️ pour activer la transcription vocale automatique — fonctionne même sur les fichiers locaux!'
                            : '💡 Add a Gemini API key in ⚙️ Settings to enable auto voice transcription — works even on local files!', isCoach: true }]);
                    }
                    return;
                }

                // Web Speech API — secure context available
                navigator.mediaDevices?.getUserMedia({ audio: true, video: false }).then(stream => {
                    startWaveform(stream);
                }).catch(() => {});

                const rec = new SR();
                rec.lang = voiceLang;
                rec.interimResults = true;
                rec.continuous = false;
                rec.maxAlternatives = 1;
                recognitionRef.current = rec;
                setIsListening(true);
                setInterimText('');

                rec.onresult = (e) => {
                    let interim = '', final = '';
                    for (let i = e.resultIndex; i < e.results.length; i++) {
                        const t = e.results[i][0].transcript;
                        if (e.results[i].isFinal) final += t; else interim += t;
                    }
                    if (final) { setInput(prev => (prev + ' ' + final).trim()); setInterimText(''); }
                    else setInterimText(interim);
                };

                rec.onend = () => {
                    stopVoice();
                    setTimeout(() => {
                        const inputEl = document.getElementById('assistant-input');
                        if (inputEl?.value.trim()) document.getElementById('assistant-submit-btn')?.click();
                    }, 800);
                };

                rec.onerror = (e) => {
                    stopVoice();
                    const msgs = {
                        'network': '⚠️ Network error. Add a Gemini API key in ⚙️ Settings for voice that works on local files.',
                        'not-allowed': '⚠️ Mic access denied. Click the mic icon in your browser address bar.',
                        'audio-capture': '⚠️ No microphone detected.',
                        'service-not-allowed': '⚠️ Voice blocked on local files. Add a Gemini key in ⚙️ Settings to fix this.',
                    };
                    const msg = msgs[e.error];
                    if (msg) setMessages(p => [...p, { sender: 'bot', text: msg, isWarning: true }]);
                    else if (e.error !== 'no-speech' && e.error !== 'aborted')
                        setMessages(p => [...p, { sender: 'bot', text: `⚠️ Voice error: ${e.error}.`, isWarning: true }]);
                };

                rec.start();
            }, [isListening, voiceLang, stopVoice, llmEnabled, llmSettings]);

            // ── Global keyboard shortcut: Ctrl+Space / Cmd+Space to open ──
            useEffect(() => {
                const handler = (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.code === 'Space' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isOpen) {
                            setIsOpen(true);
                            setTimeout(() => document.getElementById('assistant-input')?.focus(), 150);
                        } else {
                            document.getElementById('assistant-input')?.focus();
                        }
                    }
                };
                window.addEventListener('keydown', handler);
                return () => window.removeEventListener('keydown', handler);
            }, [isOpen]);

            // ── Open Director Brain event (from Cmd+D shortcut) ────────────
            useEffect(() => {
                const handler = () => {
                    setIsOpen(true);
                    setActiveTab('director');
                    setTimeout(() => document.getElementById('assistant-input')?.focus(), 150);
                };
                window.addEventListener('mokha:openDirectorBrain', handler);
                return () => window.removeEventListener('mokha:openDirectorBrain', handler);
            }, []);

            // ── Send-to-Agent event (from context menus) ───────────────────
            useEffect(() => {
                const handler = (e) => {
                    const text = e.detail?.text;
                    const label = e.detail?.label || 'prompt';
                    if (!text) return;
                    // Open panel and switch to chat
                    setIsOpen(true);
                    setActiveTab('chat');
                    setInput('');
                    // After panel opens, inject an acknowledgement message from the agent
                    // and show the received text as a user message
                    setTimeout(() => {
                        // Push the received content as a user message
                        setMessages(prev => [
                            ...prev,
                            {
                                sender: 'user',
                                text: `[Sent from editor]\n\n${text}`,
                                isAction: false,
                            },
                            {
                                sender: 'bot',
                                text: `✅ Got it! I've received your ${label}.\n\nWhat would you like me to do with it?\n\n• **Analyze** — I'll break down the cinematography, pacing, and style\n• **Enhance** — I'll suggest improvements and missing elements\n• **Rewrite** — Tell me a director style (e.g. "rewrite as Kubrick")\n• **Critique** — I'll give you honest director's notes\n• **Something else** — just tell me what you need`,
                                isAction: false,
                                isExplain: true,
                            }
                        ]);
                        // Focus the input so user can type their choice
                        setTimeout(() => document.getElementById('assistant-input')?.focus(), 100);
                    }, 250);
                };
                window.addEventListener('mokha:sendToAgent', handler);
                return () => window.removeEventListener('mokha:sendToAgent', handler);
            }, []);

            // ── Input history navigation (↑/↓ arrows) ─────────────────────
            const handleInputKeyDown = React.useCallback((e) => {
                if (e.key === 'ArrowUp' && cmdHistory.length > 0) {
                    e.preventDefault();
                    const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
                    setHistoryIdx(newIdx);
                    setInput(cmdHistory[cmdHistory.length - 1 - newIdx] || '');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIdx <= 0) { setHistoryIdx(-1); setInput(''); return; }
                    const newIdx = historyIdx - 1;
                    setHistoryIdx(newIdx);
                    setInput(cmdHistory[cmdHistory.length - 1 - newIdx] || '');
                }
            }, [cmdHistory, historyIdx]);

            useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

            // Context-Aware Initial Greeting
            // Feature #6 — Daily challenge on open
            useEffect(() => {
                if (isOpen && !dailyChallenge) {
                    const challenges = [
                        { text: "Build a scene using ONLY Close-Ups. No wide shots.", icon: "🎯" },
                        { text: "Create 3 shots with zero dialogue — tell the story visually.", icon: "🤫" },
                        { text: "Use Slow Motion for every shot in your next scene.", icon: "⏱" },
                        { text: "Build a scene using only one lighting type throughout.", icon: "💡" },
                        { text: "Create a shot sequence: Wide → Medium → Extreme Close-Up.", icon: "🔭" },
                        { text: "Use Handheld camera for every shot — no tripods.", icon: "📷" },
                        { text: "Build a scene with no BGM — only SFX.", icon: "🔊" },
                        { text: "Create a 5-shot sequence using 5 different transitions.", icon: "✂️" },
                        { text: "Use only Ilford HP5 film stock for your next project.", icon: "🎞" },
                        { text: "Build a scene where every shot uses a different camera angle.", icon: "🎬" },
                        { text: "Create a scene using only Bird's Eye and Worm's Eye shots.", icon: "🦅" },
                        { text: "Build a 3-act scene in exactly 6 shots — 2 per act.", icon: "📖" },
                    ];
                    setDailyChallenge(challenges[new Date().getDate() % challenges.length]);
                }
            }, [isOpen]);

            // Context-Aware Greeting with cross-session memory (Feature 15)
            useEffect(() => {
                if (isOpen && messages.length === 0) {
                    const mem = crossSessionMemory;
                    const returning = mem.lastSeen && mem.lastProject;
                    const profile = directorProfile;
                    const memHint = sessionMemory.directorStyle ? `\n\n🧠 Remembering: ${sessionMemory.directorStyle} style.`
                        : sessionMemory.mood ? `\n\n🧠 Remembering: "${sessionMemory.mood}" mood.` : '';

                    // New user — no profile yet → start interview
                    if (!profile) {
                        setMessages([{ sender: 'bot', text: `Hey! I'm MOKHA — your AI director assistant. 🎬\n\nBefore we start, I'd love to get to know you a little so I can give you better, more personal advice.\n\nThis will only take a minute. Ready?` }]);
                        setTimeout(() => {
                            setMessages(prev => [...prev, { sender: 'bot', text: PROFILE_QUESTIONS[0].q }]);
                            setProfileInterview({ step: 0, answers: {} });
                        }, 1200);
                        return;
                    }

                    const name = profile.name || 'Director';
                    let g;
                    if (returning) {
                        g = `Welcome back, ${name}! 👋\n\nLast session: ${mem.lastSeen}\nProject: ${mem.lastProject}${mem.lastDirector ? `\nStyle: ${mem.lastDirector}` : ''}${mem.lastMood ? `\nMood: ${mem.lastMood}` : ''}\n\nContinue where you left off? Say "yes" or tell me what to do.`;
                    } else {
                        g = `Hey ${name}! I'm your MOKHA Agent — offline, no API.\n\nI understand complex requests:\n🔗 "create project Noir City, add 3 scenes, build tense shots"\n🎬 "director kubrick" · 🎭 "mood lonely"\n🔍 "find all shots with handheld camera"\n📊 "analyze my project"${memHint}`;
                        if (currentView === 'dashboard') g = `Dashboard, ${name}! I'm your MOKHA Agent.\n\nTry:\n⚡ "create project My Film, add scenes Act 1, Act 2, Act 3"\n🎬 "build a complete horror film, 3 scenes, 4 shots each, Lynch style"`;
                        else if (currentView === 'editor') g = `Editor mode, ${name}!${memHint}\n\n⚡ "add 3 shots: establishing, character, close-up"\n🔄 "rewrite all shots in Nolan style"`;
                    }
                    setMessages([{ sender: 'bot', text: g }]);
                }
            }, [isOpen, currentView, activeInputTab, messages.length]);

            // Feature #1 + #3 + #10 + #11 — Shot watcher
            const prevShotCountRef = useRef(0);
            useEffect(() => {
                if (!appActions || !isOpen) return;
                const { scenes, activeSceneId } = appActions;
                const scene = scenes?.find(s => s.id === activeSceneId);
                const count = scene?.shots?.length || 0;
                if (count > prevShotCountRef.current && prevShotCountRef.current > 0) {
                    const newShot = scene.shots[count - 1];
                    const sel = newShot?.selections || {};
                    // Stats tracking
                    if (sel.lighting) setSessionStats(p => ({ ...p, lightingUsed: [...p.lightingUsed, sel.lighting] }));
                    if (sel.shotStyle) setSessionStats(p => ({ ...p, stylesUsed: [...p.stylesUsed, sel.shotStyle] }));
                    if (sel.camera) setSessionStats(p => ({ ...p, camerasUsed: [...p.camerasUsed, sel.camera] }));
                    // Update style fingerprint
                    updateFingerprint(sel);
                    setSessionShotCount(prev => {
                        const next = prev + 1;
                        // Feature #3 — streak
                        if (next > 0 && next % 5 === 0) {
                            const allLights = [...sessionStats.lightingUsed, sel.lighting].filter(Boolean);
                            const topLight = allLights.length ? allLights.sort((a,b) => allLights.filter(x=>x===b).length - allLights.filter(x=>x===a).length)[0] : 'Natural Daylight';
                            setTimeout(() => setMessages(p => [...p, { sender: 'bot', text: `🔥 ${next}-shot streak!\n\nFavorite lighting: ${topLight}\nShots this session: ${next}\n\nYou're building something great.`, isStreak: true }]), 800);
                        }
                        return next;
                    });
                    // Feature #1 — Prompt Coach
                    const tips = [];
                    if (sel.angle === 'Dutch Angle / Canted' && sel.lighting === 'Natural Daylight') tips.push('Dutch Angle pairs better with Low Key or Harsh Shadows for tension.');
                    if (sel.shotType?.includes('Wide') && sel.lens?.includes('85mm')) tips.push('85mm on a Wide Shot creates compression — try 24mm or 14mm for environment.');
                    if (sel.movement === 'Dolly In' && sel.shotType?.includes('Extreme Wide')) tips.push('Dolly In on Extreme Wide loses impact — try it on a Close-Up instead.');
                    if (!sel.lighting) tips.push('No lighting set — try Golden Hour for warmth or Low Key for drama.');
                    if (!sel.camera && !sel.lens) tips.push('No camera/lens — even "ARRI Alexa 65 + 50mm Prime" elevates the prompt.');
                    if (tips.length) setTimeout(() => setMessages(p => [...p, { sender: 'bot', text: `💡 Prompt Coach:\n\n${tips[0]}`, isCoach: true }]), 1200);
                    // Feature #11 — Smart rename
                    if (scene?.name?.match(/^Scene \d+$/) && count === 3) {
                        const subj = scene.shots.map(s => s.subject || '').join(' ').toLowerCase();
                        const nameMap = [['night','dark','Night Sequence'],['chase','run','Chase Sequence'],['rain','Rain Scene'],['fight','battle','Confrontation'],['love','kiss','Romantic Interlude']];
                        const found = nameMap.find(([a,b,n]) => subj.includes(a) || subj.includes(b));
                        if (found) setTimeout(() => setMessages(p => [...p, { sender: 'bot', text: `✏️ Smart Rename: Your scene is still "${scene.name}". Based on your shots I'd call it "${found[2]}".\n\nSay "rename scene ${found[2]}" to apply.`, isCoach: true }]), 1600);
                    }
                    // Feature #10 — Continuity watcher
                    if (count >= 2) {
                        const prev2 = scene.shots[count - 2]?.selections || {};
                        const issues = [];
                        if (prev2.lighting === 'Golden Hour' && sel.lighting === 'Blue Hour') issues.push(`Shot ${count-1} is Golden Hour but Shot ${count} is Blue Hour — continuity break!`);
                        if (prev2.lighting === 'Natural Daylight' && sel.lighting === 'Low Key (Dark/Moody)') issues.push('Lighting jumps from Daylight to Low Key — intentional?');
                        if (prev2.shotStyle && sel.shotStyle && prev2.shotStyle !== sel.shotStyle) issues.push(`Style changed from "${prev2.shotStyle}" to "${sel.shotStyle}".`);
                        if (issues.length) setTimeout(() => setMessages(p => [...p, { sender: 'bot', text: `⚠️ Continuity Watch:\n\n${issues[0]}\n\nSay "list shots" to review.`, isWarning: true }]), 1400);
                    }
                    // ── Next-shot suggestion (cinematic grammar) ──────────
                    const shotGrammar = {
                        'Extreme Wide Shot (EWS)': { next: 'Wide Shot (WS)', reason: 'Move in from establishing to context' },
                        'Wide Shot (WS)': { next: 'Medium Shot (MS)', reason: 'Bring the audience closer to the character' },
                        'Medium Shot (MS)': { next: 'Close-Up (CU)', reason: 'Increase intimacy and emotional impact' },
                        'Close-Up (CU)': { next: 'Over the Shoulder (OTS)', reason: 'Show the reaction or dialogue partner' },
                        'Over the Shoulder (OTS)': { next: 'Extreme Close-Up (ECU)', reason: 'Heighten tension with a detail shot' },
                        'Extreme Close-Up (ECU)': { next: 'Wide Shot (WS)', reason: 'Release tension with a wider perspective' },
                        'Point of View (POV)': { next: 'Close-Up (CU)', reason: 'Show the character\'s reaction to what they saw' },
                    };
                    const currentType = sel.shotType?.split('(')[0].trim();
                    const grammar = Object.entries(shotGrammar).find(([k]) => sel.shotType?.includes(k.split('(')[0].trim()));
                    if (grammar && count >= 2) {
                        setTimeout(() => setMessages(p => [...p, { sender: 'bot', text: `🎬 Next shot suggestion:\n\n${grammar[1].next}\n\n${grammar[1].reason}.\n\nSay "add shot" or "suggest sequence" for a full sequence.`, isCoach: true }]), 2000);
                    }
                }
                prevShotCountRef.current = count;
            }, [appActions?.scenes, appActions?.activeSceneId, isOpen]);

            const handleSend = (e) => {
                e?.preventDefault();

                // ── Director Profile Interview interception ─────────────────
                if (isInterviewing && input.trim()) {
                    const handled = handleProfileAnswer(input.trim());
                    if (handled) { setInput(''); return; }
                }

                // ── If images are pending, process them with Gemini Vision ──
                if (pendingImages.length > 0) {
                    if (!llmEnabled) {
                        setMessages(p => [...p, { sender: 'bot', text: '⚠️ Image analysis requires the Gemini API. Go to ⚙️ Settings to add your API key.', isWarning: true }]);
                        return;
                    }
                    const imgs = [...pendingImages];
                    const userPrompt = input.trim();
                    const displayText = userPrompt || `Analyze ${imgs.length} image${imgs.length > 1 ? 's' : ''}`;
                    setMessages(prev => [...prev,
                        { sender: 'user', text: displayText, images: imgs.map(i => i.previewUrl) },
                        { sender: 'bot', text: '...', isTyping: true, typingId: 'vision' }
                    ]);
                    setPendingImages([]);
                    setInput('');
                    setHistoryIdx(-1);
                    setCmdHistory(prev => [...prev.slice(-49), displayText]);

                    LLMBridge.analyzeImages(imgs, userPrompt, getKey('gemini') || getKey(llmSettings.provider)).then(story => {
                        setMessages(prev => prev.filter(m => m.typingId !== 'vision'));
                        const { setStoryData, setShowStoryEngineModal } = appActions || {};

                        // Apply to Story Engine if story data available
                        if (setStoryData && story.act1) {
                            setStoryData(prev => ({
                                ...prev,
                                act1: story.act1,
                                act2: story.act2,
                                act3: story.act3,
                                theme: { theme: story.genre, message: story.theme, tone: story.tone },
                                dramatic: { ...prev.dramatic, genre: story.genre, visualStyle: story.visualStyle || story.tone, centralConflict: story.centralConflict },
                                characters: (story.characters || []).map((c, i) => ({ id: Date.now()+i, name: c.name, motivation: c.motivation, fear: c.fear, contradiction: '', x: 30+i*35, y: 50 }))
                            }));
                            if (setShowStoryEngineModal) setShowStoryEngineModal(true);
                        }

                        // Apply detected visual params to current shot selections
                        if (story.detectedLighting && appActions?.setSelections) {
                            appActions.setSelections(prev => ({
                                ...prev,
                                ...(story.detectedLighting ? { lighting: story.detectedLighting } : {}),
                            }));
                        }

                        const shotList = story.shotSuggestions?.length
                            ? `\n\n🎬 Shot suggestions:\n${story.shotSuggestions.map((s,i) => `${i+1}. ${s}`).join('\n')}`
                            : '';

                        setMessages(prev => [...prev, {
                            sender: 'bot',
                            text: `🖼️ Image Analysis Complete!\n\n${story.imageDescription}\n\nGenre: ${story.genre} · Tone: ${story.tone}\nVisual Style: ${story.visualStyle || 'Cinematic'}\n${story.detectedLighting ? `Lighting: ${story.detectedLighting}\n` : ''}${story.detectedCamera ? `Camera: ${story.detectedCamera}\n` : ''}\n${story.act1 ? '✅ Story Engine filled with all 3 acts!' : ''}${shotList}`,
                            isLLM: true,
                            llmProvider: 'gemini'
                        }]);
                    }).catch(err => {
                        setMessages(prev => prev.filter(m => m.typingId !== 'vision'));
                        setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Vision error: ${err.message}`, isWarning: true }]);
                    });
                    return;
                }

                if (!input.trim() || isRunningChain) return;
                const rawInput = input.trim();
                setMessages(prev => [...prev, { sender: 'user', text: rawInput }]);
                setInput('');
                setHistoryIdx(-1);
                setCmdHistory(prev => [...prev.slice(-49), rawInput]); // keep last 50

                // Feature 3 — Resolve pronouns/context
                const resolved = resolveContext(rawInput, convContext);

                // Feature 1 — Check for intent chain
                const chain = parseIntentChain(resolved);

                if (chain && chain.length > 1) {
                    // ── Multi-step chain execution ────────────────────────────────────
                    setIsRunningChain(true);
                    const queueId = Date.now();
                    const initialQueue = chain.map(s => ({ label: s.length > 50 ? s.substring(0, 50) + '...' : s, status: 'pending' }));
                    setMessages(prev => [...prev, { sender: 'bot', text: '', isTaskQueue: true, queueId, queue: initialQueue }]);

                    runChain(
                        chain,
                        appActions,
                        convContext,
                        {
                            onStepStart: (i) => {
                                setMessages(prev => prev.map(m => m.queueId === queueId
                                    ? { ...m, queue: m.queue.map((q, qi) => qi === i ? { ...q, status: 'running' } : q) }
                                    : m));
                            },
                            onStepDone: (i, result) => {
                                setMessages(prev => {
                                    const updated = prev.map(m => m.queueId === queueId
                                        ? { ...m, queue: m.queue.map((q, qi) => qi === i ? { ...q, status: 'done', result: result.text.substring(0, 60) } : q) }
                                        : m);
                                    return [...updated, { sender: 'bot', text: result.text, isAction: !!result.snapshot, isExplain: result.type === 'explain', isCard: result.isCard }];
                                });
                                if (result.contextUpdate) setConvContext(prev => ({ ...prev, ...result.contextUpdate }));
                                if (result.action === 'OPEN_STORY_ENGINE') setShowStoryEngineModal(true);
                                if (result.action === 'OPEN_LIBRARY') setShowPromptLibraryModal(true);
                                if (result.action === 'OPEN_CHAIN') setShowChainModal(true);
                                if (result.action === 'OPEN_RHYTHM') setShowRhythm(true);
                                if (result.action === 'OPEN_GENRE_DNA') setShowGenreDNA(true);
                                if (result.action === 'OPEN_FIND_REPLACE') setShowFindReplace(true);
                                if (result.action === 'OPEN_PERFORMANCE') setShowSettings(true);
                                if (result.action === 'OPEN_SEQUENCES') setShowSequenceTemplates(true);
                                if (result.action === 'OPEN_CONTINUITY') setShowContinuityLock(true);
                            },
                            onStepError: (i, err) => {
                                setMessages(prev => prev.map(m => m.queueId === queueId
                                    ? { ...m, queue: m.queue.map((q, qi) => qi === i ? { ...q, status: 'error' } : q) }
                                    : m));
                            },
                            onChainComplete: (results, suggestion) => {
                                setIsRunningChain(false);
                                if (suggestion) {
                                    setMessages(prev => [...prev, { sender: 'bot', text: suggestion, isSuggestion: true }]);
                                }
                            }
                        },
                        agentActionLog,
                        setAgentActionLog,
                        sessionMemory,
                        setSessionMemory
                    );
                } else {
                    // ── Single-step dispatch ──────────────────────────────────────────
                    setTimeout(async () => {

                        // ── Async LLM commands — intercept BEFORE agentDispatch ────────
                        const qLow = resolved.toLowerCase().trim();

                        // 1. AI Shot Subject Generator
                        // "generate shot subject: [brief]" / "write shot for: [brief]" / "ai shot: [brief]"
                        const shotGenMatch = resolved.match(/^(?:generate\s+shot\s+subject|write\s+shot\s+(?:for|about)|ai\s+shot|gemini\s+shot|create\s+shot\s+subject)\s*[:—]?\s*(.+)/i);
                        if (shotGenMatch && llmEnabled) {
                            const brief = shotGenMatch[1].trim();
                            const typingId = Date.now();
                            setMessages(prev => [...prev, { sender: 'bot', text: '...', isTyping: true, typingId }]);
                            try {
                                const { scenes, activeSceneId } = appActions || {};
                                const scene = scenes?.find(s => s.id === activeSceneId);
                                const lastShot = scene?.shots?.[scene.shots.length - 1];
                                const generated = await LLMBridge.generateShotSubject(brief, 'Runway', lastShot?.selections, getKey(), llmSettings.provider);
                                setMessages(prev => prev.filter(m => m.typingId !== typingId));
                                if (appActions?.setSubject) appActions.setSubject(generated);
                                setMessages(prev => [...prev, { sender: 'bot', text: `✨ Shot subject generated!\n\n"${generated}"\n\nLoaded into the Shot Builder — hit Add Shot!`, isLLM: true, llmProvider: llmSettings.provider || 'gemini' }]);
                                refreshQuota();
                            } catch(err) {
                                setMessages(prev => prev.filter(m => m.typingId !== typingId));
                                setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ AI error: ${err.message}`, isWarning: true }]);
                            }
                            return;
                        }

                        // 2. Full Story from one sentence (AI-powered)
                        // "ai story: [premise]" / "gemini story: [premise]" / "ai write story: [premise]"
                        const aiStoryMatch = resolved.match(/^(?:ai\s+story|gemini\s+story|ai\s+write\s+story|smart\s+story|full\s+story)\s*[:—]?\s*(.+)/i);
                        if (aiStoryMatch && llmEnabled) {
                            const premise = aiStoryMatch[1].trim();
                            const typingId = Date.now();
                            setMessages(prev => [...prev, { sender: 'bot', text: '...', isTyping: true, typingId }]);
                            try {
                                const story = await LLMBridge.generateFullStory(premise, getKey(), llmSettings.provider);
                                setMessages(prev => prev.filter(m => m.typingId !== typingId));
                                const { setStoryData, setShowStoryEngineModal } = appActions || {};
                                if (setStoryData) {
                                    setStoryData(prev => ({
                                        ...prev,
                                        act1: story.act1,
                                        act2: story.act2,
                                        act3: story.act3,
                                        theme: { theme: story.genre, message: story.theme, tone: story.tone },
                                        dramatic: { ...prev.dramatic, genre: story.genre, visualStyle: story.tone, centralConflict: story.centralConflict },
                                        characters: (story.characters || []).map((c, i) => ({ id: Date.now()+i, name: c.name, motivation: c.motivation, fear: c.fear, contradiction: '', x: 30+i*35, y: 50 }))
                                    }));
                                }
                                if (setShowStoryEngineModal) setShowStoryEngineModal(true);
                                setMessages(prev => [...prev, {
                                    sender: 'bot',
                                    text: `🎬 AI Story Generated!\n\n"${premise.substring(0,80)}"\n\nGenre: ${story.genre} · Tone: ${story.tone}\nProtagonist: ${story.characters?.[0]?.name || 'Unknown'}\n\nAll 9 act fields filled by Gemini AI.\nStory Engine opened!`,
                                    isLLM: true, llmProvider: llmSettings.provider || 'gemini'
                                }]);
                                refreshQuota();
                            } catch(err) {
                                setMessages(prev => prev.filter(m => m.typingId !== typingId));
                                setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ AI story error: ${err.message}`, isWarning: true }]);
                            }
                            return;
                        }

                        // 3. Shot Enhancer
                        // "enhance shot N" / "enhance this shot" / "ai enhance shot" / "improve shot N"
                        const enhanceMatch = resolved.match(/^(?:enhance|improve|ai\s+enhance|gemini\s+enhance|rewrite\s+shot|polish\s+shot)\s+(?:shot\s+)?(\d+|this|last)?/i);
                        if (enhanceMatch && llmEnabled) {
                            const { scenes, activeSceneId, updateActiveProjectScenes } = appActions || {};
                            const scene = scenes?.find(s => s.id === activeSceneId);
                            const shots = scene?.shots || [];
                            const shotNumStr = enhanceMatch[1];
                            const shotIdx = shotNumStr === 'this' || shotNumStr === 'last' || !shotNumStr
                                ? shots.length - 1
                                : parseInt(shotNumStr) - 1;
                            const shot = shots[shotIdx];
                            if (!shot) {
                                setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Shot ${shotIdx+1} not found. Active scene has ${shots.length} shot(s).`, isWarning: true }]);
                                return;
                            }
                            const typingId = Date.now();
                            setMessages(prev => [...prev, { sender: 'bot', text: '...', isTyping: true, typingId }]);
                            try {
                                const platform = 'Runway'; // could be dynamic later
                                const enhanced = await LLMBridge.enhanceShot(shot.subject || '', platform, shot.selections, getKey(), llmSettings.provider);
                                setMessages(prev => prev.filter(m => m.typingId !== typingId));
                                const snap = buildSnapshot(appActions, `Enhance shot ${shotIdx+1}`);
                                updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? {
                                    ...s, shots: s.shots.map((sh, i) => i === shotIdx ? { ...sh, subject: enhanced } : sh)
                                } : s));
                                setMessages(prev => [...prev, {
                                    sender: 'bot',
                                    text: `✨ Shot ${shotIdx+1} enhanced!\n\nBefore: "${(shot.subject||'').substring(0,60)}..."\n\nAfter: "${enhanced.substring(0,120)}..."\n\nSay "undo that" to revert.`,
                                    isLLM: true, llmProvider: llmSettings.provider || 'gemini'
                                }]);
                                setAgentActionLog(prev => [...prev.slice(-19), { id: Date.now(), ts: Date.now(), description: `Enhance shot ${shotIdx+1}`, snapshot: snap, resultText: enhanced, featureId: 0 }]);
                                refreshQuota();
                            } catch(err) {
                                setMessages(prev => prev.filter(m => m.typingId !== typingId));
                                setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ AI enhance error: ${err.message}`, isWarning: true }]);
                            }
                            return;
                        }

                        // ── Standard agentDispatch ────────────────────────────────────
                        const result = agentDispatch(resolved, appActions, convContext, agentActionLog, setAgentActionLog, sessionMemory, setSessionMemory);

                        // ── LLM PRIMARY PATH: if API enabled and result is KB fallback, use LLM first ──
                        // App actions (create shot, lock param, chain add, etc.) always execute directly.
                        // Questions, conversation, and unknown intents go to LLM immediately.
                        const isAppAction = result.type !== 'kb';
                        if (!isAppAction && llmEnabled) {
                            const streamId = Date.now();
                            // Push user turn to history
                            pushLlmHistory('user', resolved);
                            // Start with empty streaming message
                            setMessages(prev => [...prev, { sender: 'bot', text: '', isLLM: true, isStreaming: true, streamId, llmProvider: llmSettings.provider || 'gemini' }]);
                            try {
                                let accumulated = '';
                                const llmText = await LLMBridge.call(
                                    resolved,
                                    llmSettings.provider || 'gemini',
                                    getKey(),
                                    llmHistory, // pass conversation history
                                    (chunk, full) => {
                                        accumulated = full;
                                        // Update the streaming message in-place
                                        setMessages(prev => prev.map(m => m.streamId === streamId ? { ...m, text: full } : m));
                                    },
                                    buildProfileContext(directorProfile) // inject profile context
                                );
                                // Finalize — remove streaming flag
                                setMessages(prev => prev.map(m => m.streamId === streamId ? { ...m, text: llmText || accumulated, isStreaming: false } : m));
                                // Push assistant turn to history
                                pushLlmHistory('assistant', llmText || accumulated);
                                refreshQuota();
                                if (result.action === 'OPEN_STORY_ENGINE') setShowStoryEngineModal(true);
                                if (result.action === 'OPEN_LIBRARY') setShowPromptLibraryModal(true);
                                if (result.action === 'OPEN_CHAIN') setShowChainModal(true);
                                if (result.action === 'OPEN_RHYTHM') setShowRhythm(true);
                                if (result.action === 'OPEN_GENRE_DNA') setShowGenreDNA(true);
                                if (result.action === 'OPEN_FIND_REPLACE') setShowFindReplace(true);
                                if (result.action === 'OPEN_PERFORMANCE') setShowSettings(true);
                                if (result.action === 'OPEN_SEQUENCES') setShowSequenceTemplates(true);
                                if (result.action === 'OPEN_CONTINUITY') setShowContinuityLock(true);
                                return;
                            } catch (err) {
                                setMessages(prev => prev.map(m => m.streamId === streamId
                                    ? { ...m, text: `⚠️ ${err.message}`, isStreaming: false, isWarning: true, isLLM: false }
                                    : m));
                                refreshQuota();
                                return; // don't fall through to KB on stream error — error is already shown
                            }
                        }

                        // Push to action log if state-mutating
                        if (result.snapshot) {
                            setAgentActionLog(prev => {
                                const entry = { id: Date.now(), ts: Date.now(), description: resolved.substring(0, 80), snapshot: result.snapshot, resultText: result.text, featureId: 0 };
                                return [...prev.slice(-19), entry];
                            });
                        }

                        // Update conversation context
                        if (result.contextUpdate) setConvContext(prev => ({ ...prev, ...result.contextUpdate }));

                        // Push reply
                        setMessages(prev => [...prev, {
                            sender: 'bot',
                            text: result.text,
                            isAction: !!result.snapshot,
                            isExplain: result.type === 'explain',
                            isStoryWizard: result.type === 'storyWizard',
                            wizardStep: result.wizardStep,
                            isCard: result.isCard
                        }]);

                        // Handle navigation actions from KB fallback
                        if (result.action === 'OPEN_STORY_ENGINE') setShowStoryEngineModal(true);
                        if (result.action === 'OPEN_LIBRARY') setShowPromptLibraryModal(true);
                        if (result.action === 'OPEN_CHAIN') { setShowChainModal(true); }
                        if (result.action === 'OPEN_RHYTHM') { setShowRhythm(true); }
                        if (result.action === 'OPEN_GENRE_DNA') { setShowGenreDNA(true); }
                        if (result.action === 'OPEN_FIND_REPLACE') { setShowFindReplace(true); }
                        if (result.action === 'OPEN_PERFORMANCE') { setShowSettings(true); }
                        if (result.action === 'OPEN_SEQUENCES') { setShowSequenceTemplates(true); }
                        if (result.action === 'OPEN_CONTINUITY') { setShowContinuityLock(true); }

                        // Feature 12 — Proactive suggestion
                        const suggestion = getProactiveSuggestion(result, appActions);
                        if (suggestion) {
                            setTimeout(() => {
                                setMessages(prev => [...prev, { sender: 'bot', text: suggestion, isSuggestion: true }]);
                            }, 600);
                        }
                    }, 300);
                }
            };

                        const handleQuickAction = (query) => {
                if (query.endsWith(' ')) {
                    setInput(query);
                    setTimeout(() => document.getElementById('assistant-input')?.focus(), 50);
                } else {
                    setInput(query);
                    setTimeout(() => document.getElementById('assistant-submit-btn')?.click(), 50);
                }
            };

            const quickActions = [
                { label: "🎬 Director", query: "director " },
                { label: "🎭 Mood", query: "mood " },
                { label: "🎲 Surprise", query: "surprise me" },
                { label: "🎥 Steal Shot", query: "steal this shot" },
                { label: "📜 Parse Script", query: "parse script: " },
                { label: "📝 Batch Build", query: "build scene: " },
                { label: "🎨 Combo", query: "suggest combo" },
                { label: "🃏 Director Card", query: "export summary" },
                { label: "🧠 Memory", query: "what do you remember" },
                { label: "⚡ New Project", query: "create project " },
                { label: "⚡ New Scene", query: "create scene " },
                { label: "⚡ Add Shot", query: "add shot " },
                { label: "⚡ New Character", query: "create character " },
                { label: "⚡ New Location", query: "create location " },
                { label: "⚡ New Voice", query: "create voice " },
                { label: "⚡ List Shots", query: "list shots" },
                { label: "⚡ List Scenes", query: "list scenes" },
                { label: "⚡ List Projects", query: "list projects" },
                { label: "↩️ Undo", query: "undo that" },
                { label: "📊 Analyze", query: "analyze my project" },
                { label: "🔍 Explain", query: "explain what you just did" },
                { label: "⚡ List Rules", query: "list rules" },
                { label: "📚 Cameras", query: "cameras" },
                { label: "📚 Lighting", query: "lighting" },
                { label: "📚 Platforms", query: "AI platforms" },
                { label: "📚 Story Engine", query: "open story engine" },
                { label: "📖 Create Story", query: "create story: " },
                { label: "📋 Parse Story", query: "parse story: " },
                { label: "🧙 Story Wizard", query: "story wizard" },
                { label: "🎬 Shots from Story", query: "build shots from story" },
                // ── New Feature Chips ──
                { label: "⛓ Chain Mode", query: "activate chain mode" },
                { label: "⛓ Start Sequence", query: "start sequence" },
                { label: "⛓ Chain Add", query: "chain add: " },
                { label: "🎬 Load Reveal", query: "load the reveal sequence" },
                { label: "🎬 Load Chase", query: "load the chase sequence" },
                { label: "🎬 Load Confrontation", query: "load the confrontation sequence" },
                { label: "🔒 Lock Lighting", query: "lock lighting" },
                { label: "🔒 Lock Camera", query: "lock camera" },
                { label: "🔓 Unlock All", query: "unlock all" },
                { label: "⚡ Shotify ON", query: "shotify on" },
                { label: "⚡ Shotify OFF", query: "shotify off" },
                { label: "🎭 Genre DNA", query: "detect genre" },
                { label: "📊 Rhythm", query: "analyze rhythm" },
                { label: "🔍 Find & Replace", query: "find " },
                { label: "⚙️ Performance", query: "open performance settings" },
                { label: "✨ Complete Shot", query: "complete this shot" },
                { label: "🎬 Suggest Sequence", query: "suggest sequence" },
                { label: "🎨 My Style", query: "my style fingerprint" },
                { label: "✦ AI Shot", query: "generate shot subject: " },
                { label: "✦ AI Story", query: "ai story: " },
                { label: "✦ Enhance Shot", query: "enhance shot last" },
                { label: "📚 Library", query: "open library" },
            ];

            const msgBg = (msg) => {
                if (msg.sender === 'user') return 'lg-bubble-user lg-bubble-enter';
                if (msg.isAction) return 'lg-bubble-bot lg-bubble-enter bg-emerald-500/10 border-emerald-500/30';
                if (msg.isExplain) return 'lg-bubble-bot lg-bubble-enter bg-violet-500/10 border-violet-500/30 font-mono';
                if (msg.isStoryWizard) return 'lg-bubble-bot lg-bubble-enter bg-violet-500/10 border-violet-500/30';
                if (msg.isLLM) return 'lg-bubble-bot lg-bubble-enter bg-cyan-500/10 border-cyan-500/30';
                if (msg.isTyping) return 'lg-bubble-bot lg-bubble-enter opacity-60';
                if (msg.isStreak) return 'lg-bubble-bot lg-bubble-enter bg-amber-500/10 border-amber-500/30';
                if (msg.isCoach) return 'lg-bubble-bot lg-bubble-enter bg-blue-500/10 border-blue-500/30';
                if (msg.isWarning) return 'lg-bubble-bot lg-bubble-enter bg-red-500/10 border-red-500/30';
                if (msg.isCard) return 'lg-bubble-bot lg-bubble-enter font-mono';
                return 'lg-bubble-bot lg-bubble-enter';
            };

            const msgBadge = (msg) => {
                if (msg.isAction) return <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Icon name="Zap" size={9}/>Action Executed</div>;
                if (msg.isExplain) return <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">🔍 Action Log</div>;
                if (msg.isStoryWizard) return <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">🧙 Story Wizard — Step {msg.wizardStep || ''} of 6</div>;
                if (msg.isLLM) return (
                    <div className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <span>✦</span>
                        {msg.llmProvider === 'gemini' ? 'Gemini AI' : msg.llmProvider === 'groq' ? 'Groq AI' : msg.llmProvider === 'deepseek' ? 'DeepSeek R1' : msg.llmProvider === 'mistral' ? 'Mistral AI' : 'AI'}
                        {msg.isStreaming && <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse rounded-sm"/>}
                    </div>
                );
                if (msg.isTyping) return <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mb-1 typing-dots">Thinking</div>;
                if (msg.isStreak) return <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">🔥 Streak</div>;
                if (msg.isCoach) return <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">💡 Prompt Coach</div>;
                if (msg.isWarning) return <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">⚠️ Continuity</div>;
                if (msg.isCard) return <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">🎬 Director's Card</div>;
                return null;
            };

            return (
                <div
                    style={fabPos
                        ? { position: 'fixed', left: fabPos.x, top: fabPos.y, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }
                        : { position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }
                    }
                >
                    {(isOpen || isClosing) && (
                        <div
                            ref={panelRef}
                            className={`lg-panel flex flex-col ${isClosing ? 'lg-panel-close-anim' : 'lg-panel-open-anim'}`}
                            style={panelPos
                                ? { position: 'fixed', left: panelPos.x, top: panelPos.y, width: panelSize.w, height: panelSize.h, marginBottom: 0 }
                                : { width: panelSize.w, height: panelSize.h, marginBottom: '16px', position: 'relative' }
                            }
                        >
                            <div className="lg-mesh">
                              <div className="lg-orb lg-orb-1"></div>
                              <div className="lg-orb lg-orb-2"></div>
                              <div className="lg-orb lg-orb-3"></div>
                              <div className="lg-orb lg-orb-4"></div>
                            </div>
                            {/* Header — drag handle */}
                            <div
                                className="lg-header p-2.5 flex justify-between items-center text-white shrink-0"
                                style={{ cursor: 'grab', userSelect: 'none' }}
                                onPointerDown={onHeaderDragStart}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon name="Brain" size={16} />
                                    <div>
                                        <span className="font-bold text-xs block leading-tight">MOKHA Assistant</span>
                                        <span className="text-[8px] text-white/70">Offline · No API · {isTranscribing ? '⏳ Transcribing...' : isListening ? (voiceLang === 'fr-FR' ? '🎤 Écoute...' : '🎤 Recording...') : sessionShotCount > 0 ? `${sessionShotCount} shots · Ctrl+Space` : 'Ctrl+Space to open'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    {/* Pro tab buttons — icon + label */}
                                    {dailyChallenge && (
                                        <button onClick={() => setActiveTab(t => t === 'challenge' ? 'chat' : 'challenge')}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${activeTab === 'challenge' ? 'bg-white/15 text-white border-white/25 shadow-sm' : 'text-white/45 border-transparent hover:text-white/80 hover:bg-white/8'}`}
                                            title="Daily Challenge">
                                            <Icon name="Zap" size={11}/><span className="hidden sm:inline">Challenge</span>
                                        </button>
                                    )}
                                    <button onClick={() => setActiveTab(t => t === 'stats' ? 'chat' : 'stats')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${activeTab === 'stats' ? 'bg-white/15 text-white border-white/25 shadow-sm' : 'text-white/45 border-transparent hover:text-white/80 hover:bg-white/8'}`}
                                        title="Session Stats">
                                        <Icon name="Activity" size={11}/><span>Stats</span>
                                    </button>
                                    <button onClick={() => setActiveTab(t => t === 'tips' ? 'chat' : 'tips')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${activeTab === 'tips' ? 'bg-white/15 text-white border-white/25 shadow-sm' : 'text-white/45 border-transparent hover:text-white/80 hover:bg-white/8'}`}
                                        title="Tips & Learning">
                                        <Icon name="BookOpen" size={11}/><span>Tips</span>
                                    </button>
                                    <button onClick={() => setActiveTab(t => t === 'director' ? 'chat' : 'director')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${activeTab === 'director' ? 'bg-white/15 text-white border-white/25 shadow-sm' : 'text-white/45 border-transparent hover:text-white/80 hover:bg-white/8'}`}
                                        title="Director Brain">
                                        <Icon name="Clapperboard" size={11}/><span>Director</span>
                                    </button>
                                    <button onClick={() => setActiveTab(t => t === 'settings' ? 'chat' : 'settings')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${activeTab === 'settings' ? 'bg-white/15 text-white border-white/25 shadow-sm' : 'text-white/45 border-transparent hover:text-white/80 hover:bg-white/8'} ${llmEnabled ? 'ring-1 ring-cyan-400/40 ring-inset' : ''}`}
                                        title="AI Settings">
                                        <Icon name="Settings" size={11}/>
                                        <span>API</span>
                                        {llmEnabled && <span className={`w-1.5 h-1.5 rounded-full ${quotaStats.pct >= 90 ? 'bg-red-400' : quotaStats.pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}/>}
                                    </button>
                                    {/* Divider */}
                                    <div className="w-px h-4 bg-white/15 mx-1"/>
                                    <button onClick={() => { setPanelPos(null); setPanelSize({ w: 320, h: 520 }); setFabPos(null); }}
                                        className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                        title="Reset position & size">
                                        <Icon name="Minimize" size={12}/>
                                    </button>
                                    <button onClick={() => { setIsOpen(false); setMessages([]); }}
                                        className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                        title="Close">
                                        <Icon name="X" size={12}/>
                                    </button>
                                </div>
                            </div>

                            {/* Daily Challenge Panel */}
                            {activeTab === 'challenge' && dailyChallenge && (
                                <div className="flex-1 flex flex-col items-center justify-center p-5 text-center gap-3">
                                    <div className="text-4xl">{dailyChallenge.icon}</div>
                                    <div className="text-xs font-bold text-primary uppercase tracking-widest">Today's Challenge</div>
                                    <div className="text-sm font-bold text-textMain-light dark:text-textMain-dark leading-relaxed">{dailyChallenge.text}</div>
                                    <button onClick={() => setActiveTab('chat')} className="mt-2 text-xs px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primaryHover transition-colors">Accept Challenge</button>
                                </div>
                            )}

                            {/* Stats Panel */}
                            {activeTab === 'stats' && (
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Session Stats</div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-input-light dark:bg-input-dark rounded-lg p-2 text-center border border-border-light dark:border-border-dark">
                                            <div className="text-xl font-black text-primary">{sessionShotCount}</div>
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark">Shots Built</div>
                                        </div>
                                        <div className="bg-input-light dark:bg-input-dark rounded-lg p-2 text-center border border-border-light dark:border-border-dark">
                                            <div className="text-xl font-black text-accent">{appActions?.scenes?.length || 0}</div>
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark">Scenes</div>
                                        </div>
                                    </div>
                                    {sessionMemory.directorStyle && <div className="text-[10px] mb-1.5 p-2 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark"><span className="text-primary font-bold">🎬 Director:</span> {sessionMemory.directorStyle}</div>}
                                    {sessionMemory.mood && <div className="text-[10px] mb-1.5 p-2 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark"><span className="text-accent font-bold">🎭 Mood:</span> {sessionMemory.mood}</div>}
                                    {sessionStats.lightingUsed.length > 0 && (
                                        <div className="text-[10px] p-2 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark">
                                            <div className="font-bold text-textMuted-light dark:text-textMuted-dark mb-1">Top Lighting</div>
                                            <div className="text-textMain-light dark:text-textMain-dark">{[...sessionStats.lightingUsed].sort((a,b) => sessionStats.lightingUsed.filter(x=>x===b).length - sessionStats.lightingUsed.filter(x=>x===a).length)[0]}</div>
                                        </div>
                                    )}
                                    <button onClick={() => { setActiveTab('chat'); handleQuickAction('export summary'); }} className="w-full mt-3 text-xs px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors">Generate Director's Card</button>
                                </div>
                            )}

                            {/* Tips & Learning Panel */}
                            {activeTab === 'tips' && (
                                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">Tips & Learning</div>
                                        <button onClick={() => setTipIndex(i => (i + 1) % TIPS_DB.length)} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors">Next tip →</button>
                                    </div>
                                    {/* Featured tip */}
                                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                                        <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">{TIPS_DB[tipIndex % TIPS_DB.length].cat}</div>
                                        <div className="text-xs text-textMain-light dark:text-textMain-dark leading-relaxed">{TIPS_DB[tipIndex % TIPS_DB.length].tip}</div>
                                        <button onClick={() => { setActiveTab('chat'); handleQuickAction(`tell me about ${TIPS_DB[tipIndex % TIPS_DB.length].cat.replace(/[^\w\s]/g,'').trim()}`); }} className="mt-2 text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-colors">Ask me more →</button>
                                    </div>
                                    {/* Category quick-access */}
                                    <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mt-1 mb-0.5">Browse by category</div>
                                    {['🎬 Cinematography','💡 Lighting','🎥 Camera','📖 Story','🤖 AI Prompts','🎞 Film Stock','⚡ MOKHA Tips'].map(cat => (
                                        <button key={cat} onClick={() => { const idx = TIPS_DB.findIndex(t => t.cat === cat); if (idx >= 0) setTipIndex(idx); }} className="text-left text-[10px] px-2.5 py-1.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/40 transition-colors text-textMain-light dark:text-textMain-dark font-medium">{cat}</button>
                                    ))}
                                    {/* Story wizard shortcut */}
                                    <div className="mt-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30">
                                        <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">🧙 Story Wizard</div>
                                        <div className="text-[10px] text-textMain-light dark:text-textMain-dark mb-1.5">Build a complete story step by step with guided questions.</div>
                                        <button onClick={() => { setActiveTab('chat'); handleQuickAction('story wizard'); }} className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-bold hover:bg-violet-500/30 transition-colors">Start Wizard →</button>
                                    </div>
                                </div>
                            )}

                            {/* Director Brain Panel */}
                            {activeTab === 'director' && (
                                <DirectorBrainPanel
                                    brainMode={brainMode || 'fast'}
                                    deepBrainEngineRef={deepBrainEngineRef || { current: null }}
                                    projectSnapshot={buildProjectSnapshot(appActions)}
                                    onBrainModeChange={() => {}}
                                    appActions={appActions ? {
                                        scenes: appActions.scenes,
                                        activeSceneId: appActions.activeSceneId,
                                        activeProjectId: appActions.activeProjectId,
                                        updateActiveProjectScenes: appActions.updateActiveProjectScenes,
                                        setProjects: appActions.setProjects,
                                        setActiveSceneId: appActions.setActiveSceneId,
                                        saveToHistory: appActions.saveToHistory,
                                        globalCharacters: appActions.globalCharacters,
                                        setGlobalCharacters: appActions.setGlobalCharacters,
                                    } : null}
                                    selectedShotId={(() => {
                                        if (!appActions) return null;
                                        const idx = appActions.editingIndex;
                                        if (idx == null || idx < 0) return null;
                                        const scene = (appActions.scenes || []).find(s => s.id === appActions.activeSceneId);
                                        const shot = scene && scene.shots && scene.shots[idx];
                                        return shot ? shot.id : null;
                                    })()}
                                />
                            )}

                            {/* AI Settings Panel */}
                            {activeTab === 'settings' && (
                                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
                                    {/* Director Profile card */}
                                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-black text-primary uppercase tracking-widest">👤 Director Profile</div>
                                            <button onClick={() => { saveDirectorProfile(null); localStorage.removeItem(DIRECTOR_PROFILE_KEY); setDirectorProfile(null); setMessages([]); setProfileInterview(null); addToast('Profile reset — interview will restart', 'success'); }}
                                                className="text-[8px] font-bold text-textMuted-light dark:text-textMuted-dark hover:text-red-500 transition-colors border border-border-light dark:border-border-dark px-2 py-0.5 rounded">
                                                Reset
                                            </button>
                                        </div>
                                        {directorProfile ? (
                                            <div className="space-y-0.5 text-[9px] text-textMuted-light dark:text-textMuted-dark">
                                                <div><span className="text-textMain-light dark:text-textMain-dark font-bold">{directorProfile.name}</span> · {directorProfile.level}</div>
                                                <div>🎭 {directorProfile.genre}</div>
                                                <div>✨ Inspired by {directorProfile.inspiration}</div>
                                            </div>
                                        ) : (
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark">No profile yet — open chat to start the interview.</div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">AI API Settings</div>
                                        <div className="flex items-center gap-1.5">
                                            {connectedCount > 0 && <div className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">{connectedCount} connected</div>}
                                            {llmEnabled && <div className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">✦ Active</div>}
                                        </div>
                                    </div>

                                    {/* Enable toggle */}
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                        <div>
                                            <div className="text-[10px] font-bold text-textMain-light dark:text-textMain-dark">Enable AI API</div>
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark">Smarter answers when offline KB doesn't match</div>
                                        </div>
                                        <button onClick={() => saveLlmSettings({ enabled: !llmSettings.enabled })} className={`w-9 h-5 rounded-full transition-all relative ${llmSettings.enabled ? 'bg-cyan-500' : 'bg-border-light dark:bg-border-dark'}`}>
                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${llmSettings.enabled ? 'left-4' : 'left-0.5'}`}/>
                                        </button>
                                    </div>

                                    {/* Per-provider API key fields */}
                                    {[
                                        { id: 'gemini',     label: 'Gemini',      color: 'text-blue-400',    border: 'border-blue-500/40',    bg: 'bg-blue-500/5',    url: 'https://aistudio.google.com',    note: 'Free · 1000 req/day · Vision + Audio', placeholder: 'AIzaSy...' },
                                        { id: 'openrouter', label: 'OpenRouter',  color: 'text-violet-400',  border: 'border-violet-500/40',  bg: 'bg-violet-500/5',  url: 'https://openrouter.ai/keys',     note: 'Free models · Browser CORS ✓',        placeholder: 'sk-or-...' },
                                        { id: 'deepseek',   label: 'DeepSeek R1', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/5', url: 'https://openrouter.ai/keys',     note: 'Uses OpenRouter key — paste same key here or leave empty to auto-use OpenRouter key', placeholder: 'sk-or-... (or leave empty if OpenRouter key set)' },
                                        { id: 'mistral',    label: 'Mistral',     color: 'text-orange-400',  border: 'border-orange-500/40',  bg: 'bg-orange-500/5',  url: 'https://console.mistral.ai',     note: 'Free tier · Direct API · Fast',        placeholder: 'xxxx...' },
                                        { id: 'groq',       label: 'Groq',        color: 'text-red-400',     border: 'border-red-500/40',     bg: 'bg-red-500/5',     url: 'https://console.groq.com',       note: '⚠ CORS blocked from local files',     placeholder: 'gsk_...' },
                                    ].map(p => {
                                        const key = (llmSettings.keys || {})[p.id] || '';
                                        const isActive = (llmSettings.provider || 'gemini') === p.id;
                                        const hasKey = !!key.trim();
                                        return (
                                            <div key={p.id} className={`rounded-xl border p-2.5 transition-all ${isActive ? `${p.border} ${p.bg}` : 'border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark'}`}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[10px] font-black ${p.color}`}>{p.label}</span>
                                                        {hasKey && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">✓ Key set</span>}
                                                        {isActive && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">Active</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-cyan-400 hover:underline">Get key →</a>
                                                        {hasKey && (
                                                            <button
                                                                onClick={() => saveLlmSettings({ provider: p.id })}
                                                                className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold transition-all ${isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-input-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-cyan-400'}`}
                                                            >{isActive ? '● Using' : 'Use'}</button>
                                                        )}
                                                    </div>
                                                </div>
                                                <input
                                                    type="password"
                                                    value={key}
                                                    onChange={e => saveLlmSettings({ keys: { ...(llmSettings.keys || {}), [p.id]: e.target.value } })}
                                                    placeholder={p.placeholder}
                                                    className="w-full text-[10px] px-2 py-1.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark outline-none focus:border-cyan-500/60 transition-colors"
                                                />
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark">{p.note}</div>
                                                    {hasKey && (
                                                        <button
                                                            onClick={async () => {
                                                                setLlmTestingProvider(p.id);
                                                                setLlmTestResult(null); setLlmTestMsg('');
                                                                try {
                                                                    const res = await LLMBridge.call('Say "MOKHA ready" and nothing else.', p.id, key);
                                                                    setLlmTestResult(p.id + ':ok');
                                                                    setLlmTestMsg(res.substring(0, 60));
                                                                } catch(err) {
                                                                    setLlmTestResult(p.id + ':error');
                                                                    setLlmTestMsg(err.message.substring(0, 80));
                                                                } finally { setLlmTestingProvider(null); }
                                                            }}
                                                            disabled={llmTestingProvider === p.id}
                                                            className="text-[8px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                                                        >{llmTestingProvider === p.id ? '⏳' : '🔌 Test'}</button>
                                                    )}
                                                </div>
                                                {/* Test result for this provider */}
                                                {llmTestResult?.startsWith(p.id + ':') && (
                                                    <div className={`mt-1.5 text-[9px] p-1.5 rounded-lg ${llmTestResult.endsWith(':ok') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {llmTestResult.endsWith(':ok') ? '✅ ' : '❌ '}{llmTestMsg}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Active provider quick-switch (only shows connected ones) */}
                                    {connectedCount > 1 && (
                                        <div>
                                            <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1.5">Active Provider</div>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {['gemini','openrouter','deepseek','mistral','groq'].filter(p => (llmSettings.keys||{})[p]?.trim()).map(p => {
                                                    const labels = { gemini:'Gemini', openrouter:'OpenRouter', deepseek:'DeepSeek', mistral:'Mistral', groq:'Groq' };
                                                    const colors = { gemini:'text-blue-400', openrouter:'text-violet-400', deepseek:'text-emerald-400', mistral:'text-orange-400', groq:'text-red-400' };
                                                    const isActive = (llmSettings.provider || 'gemini') === p;
                                                    return (
                                                        <button key={p} onClick={() => saveLlmSettings({ provider: p })} className={`text-[9px] px-2.5 py-1 rounded-full font-bold transition-all border ${isActive ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400' : `border-border-light dark:border-border-dark ${colors[p]} hover:border-cyan-500/30`}`}>
                                                            {isActive ? '● ' : ''}{labels[p]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quota tracker */}
                                    {llmEnabled && (
                                        <div className="p-2.5 rounded-xl bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-[9px] font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest">Daily Quota</div>
                                                <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark">Resets in {quotaStats.resetIn}</div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full h-2 rounded-full bg-border-light dark:bg-border-dark overflow-hidden mb-1.5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        quotaStats.pct >= 90 ? 'bg-red-500' :
                                                        quotaStats.pct >= 70 ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${quotaStats.pct}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark">
                                                    <span className={`font-bold ${quotaStats.pct >= 90 ? 'text-red-400' : quotaStats.pct >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {quotaStats.remaining}
                                                    </span> / {quotaStats.rpd} requests left today
                                                </div>
                                                <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark">{quotaStats.used} used</div>
                                            </div>
                                            {quotaStats.pct >= 90 && (
                                                <div className="mt-1.5 text-[8px] text-red-400 font-bold">⚠️ Almost out! {quotaStats.remaining} requests remaining.</div>
                                            )}
                                            <div className="mt-1 text-[8px] text-textMuted-light dark:text-textMuted-dark">{quotaStats.model} · {quotaStats.rpm} RPM limit</div>
                                            <div className="mt-1 text-[8px] text-textMuted-light dark:text-textMuted-dark italic">Tracked locally — counts calls from this browser only.</div>
                                        </div>
                                    )}

                                    {/* How it works */}
                                    <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark p-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark leading-relaxed">
                                        <span className="font-bold text-textMain-light dark:text-textMain-dark">How it works:</span> The AI API only activates when your question doesn't match a known command. All app actions (create project, add shot, etc.) still run instantly offline.
                                    </div>

                                    {/* AI Features available */}
                                    {llmEnabled && (
                                        <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                                            <div className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2">✦ AI Features Unlocked</div>
                                            <div className="flex flex-col gap-1">
                                                {[
                                                    { cmd: 'generate shot subject: [brief]', label: '✨ AI Shot Generator' },
                                                    { cmd: 'ai story: [one sentence]', label: '📖 Full Story from 1 sentence' },
                                                    { cmd: 'enhance shot last', label: '🔮 Shot Enhancer' },
                                                    { cmd: 'enhance shot N', label: '🔮 Enhance specific shot' },
                                                ].map(f => (
                                                    <button key={f.cmd} onClick={() => { setActiveTab('chat'); setInput(f.cmd.includes('[') ? f.cmd.split('[')[0] : f.cmd); setTimeout(() => document.getElementById('assistant-input')?.focus(), 50); }} className="text-left text-[9px] px-2 py-1 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-cyan-500/40 transition-colors">
                                                        <span className="font-bold text-textMain-light dark:text-textMain-dark">{f.label}</span>
                                                        <span className="text-textMuted-light dark:text-textMuted-dark ml-1">→ {f.cmd}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── VIDEO PREVIEW SETTINGS ── */}
                                    <div className="mt-2 pt-3 border-t border-border-light dark:border-border-dark">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest flex items-center gap-1.5">
                                                <Icon name="Zap" size={12} className="text-purple-400"/>Video & Image APIs
                                            </div>
                                            <button onClick={() => setShowApiSettingsModal(true)}
                                                className="text-[9px] font-bold px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-400 hover:bg-purple-600/30 transition-all flex items-center gap-1.5">
                                                <Icon name="Settings" size={10}/>Open API Settings
                                            </button>
                                        </div>
                                        <div className="mt-2 text-[9px] text-textMuted-light dark:text-textMuted-dark leading-relaxed">
                                            Configure Runway, Kling, Pika, DALL-E, Stability AI and more in the dedicated API Settings panel.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chat Messages */}
                            {activeTab === 'chat' && (
                                <>
                                    {/* ── Story Wizard 2.0 Banner ── */}
                                    {!convContext?.wizardActive && (
                                        <div className="mx-3 mt-3 shrink-0">
                                            <button onClick={() => { setInput('story wizard'); setTimeout(() => { const fakeEvent = { preventDefault: () => {} }; handleSend(fakeEvent); }, 50); }}
                                                className="w-full rounded-xl overflow-hidden border border-violet-500/30 hover:border-violet-500/60 transition-all group"
                                                style={{background:'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(14,165,233,0.08))'}}>
                                                <div className="flex items-center justify-between px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:'linear-gradient(135deg,#7c3aed,#0ea5e9)'}}>
                                                            <span className="text-base">🎬</span>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-[11px] font-black text-violet-400 uppercase tracking-wider leading-tight">Story Wizard 2.0</div>
                                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark leading-tight">Idea → Full cinematic project in 12 steps</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-black text-violet-400 group-hover:translate-x-0.5 transition-transform">START →</div>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                    {/* Wizard progress bar when active */}
                                    {convContext?.wizardActive && convContext?.wizardStep > 0 && (
                                        <div className="mx-3 mt-3 shrink-0">
                                            <div className="rounded-xl border border-violet-500/30 px-3 py-2" style={{background:'rgba(124,58,237,0.08)'}}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider">🎬 Story Wizard — Step {convContext.wizardStep} of 12</span>
                                                    <button onClick={() => { setConvContext({}); }} className="text-[8px] text-textMuted-light dark:text-textMuted-dark hover:text-red-500 font-bold">Exit</button>
                                                </div>
                                                <div className="h-1 rounded-full bg-input-light dark:bg-input-dark overflow-hidden">
                                                    <div className="h-full rounded-full transition-all" style={{width:`${(convContext.wizardStep/12)*100}%`, background:'linear-gradient(90deg,#7c3aed,#0ea5e9)'}}/>
                                                </div>
                                                <div className="flex justify-between mt-1">
                                                    {['Logline','Genre','Protagonist','Antagonist','World','Incident','Midpoint','Climax','Resolution','Style','Scenes','Build'].map((label,i)=>(
                                                        <div key={i} className={`text-[7px] font-bold ${i+1 === convContext.wizardStep ? 'text-violet-400' : i+1 < convContext.wizardStep ? 'text-green-500' : 'text-textMuted-light dark:text-textMuted-dark opacity-40'}`}>
                                                            {i+1 === convContext.wizardStep ? '●' : i+1 < convContext.wizardStep ? '✓' : '○'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar text-sm"
                                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                                        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) handleImageFiles(e.dataTransfer.files); }}
                                    >
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                {/* User image attachments */}
                                                {msg.images?.length > 0 && (
                                                    <div className="flex gap-1 mb-1 flex-wrap justify-end">
                                                        {msg.images.map((url, ii) => (
                                                            <img key={ii} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-border-light dark:border-border-dark shadow-sm" />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.isTaskQueue ? (
                                                    <div className="w-full bg-input-light dark:bg-input-dark border border-primary/30 rounded-xl p-2.5 shadow-sm">
                                                        <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1"><Icon name="Zap" size={9}/>Agent Running</div>
                                                        {(msg.queue || []).map((step, si) => (
                                                            <div key={si} className={`flex items-center gap-2 py-1 text-xs ${step.status === 'done' ? 'text-emerald-400' : step.status === 'error' ? 'text-red-400' : step.status === 'running' ? 'text-primary' : 'text-textMuted-light dark:text-textMuted-dark'}`}>
                                                                <span className="shrink-0 text-sm">{step.status === 'done' ? '✅' : step.status === 'error' ? '❌' : step.status === 'running' ? '⏳' : '○'}</span>
                                                                <span className="truncate">{step.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : msg.isSuggestion ? (
                                                    <div className="max-w-[90%] p-2.5 rounded-xl shadow-sm text-xs leading-relaxed bg-amber-500/10 border border-amber-500/30 text-textMain-light dark:text-textMain-dark rounded-bl-sm">
                                                        <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5">💡 Next Step</div>
                                                        <span className="italic">{msg.text}</span>
                                                        <button onClick={() => { setInput(msg.text); setTimeout(() => document.getElementById('assistant-input')?.focus(), 50); }} className="mt-1.5 block text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold hover:bg-amber-500/30 transition-colors">Try it →</button>
                                                    </div>
                                                ) : (
                                                    <div onContextMenu={(e) => { e.stopPropagation(); openCtxMenu(e, 'agent-message', { messageIndex: i, role: msg.sender, text: msg.text, onDelete: (idx) => setMessages(prev => prev.filter((_,mi) => mi !== idx)) }); }} className={`whitespace-pre-wrap text-xs leading-relaxed ${msgBg(msg)}`}>
                                                        {msgBadge(msg)}
                                                        {msg.text}
                                                    </div>
                                                )}
                                            </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    {/* Quick Actions */}
                                    <div className="lg-chips-row">
                                        {quickActions.map(({ label, query }) => (
                                            <button key={label} onClick={() => handleQuickAction(query)} className="lg-chip">
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Voice waveform visualizer — shown when listening */}
                                    {isListening && (
                                        <div className="lg-voice-bar shrink-0 px-2 pb-1">
                                            <div className="flex items-end justify-center gap-[2px] h-8 w-full">
                                                {voiceBars.map((h, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            height: `${Math.max(3, h * 28)}px`,
                                                            width: '3px',
                                                            borderRadius: '2px',
                                                            background: h > 0.5
                                                                ? 'rgb(var(--color-primary))'
                                                                : h > 0.15
                                                                    ? 'rgba(var(--color-primary)/0.6)'
                                                                    : 'rgba(var(--color-primary)/0.2)',
                                                            transition: 'height 60ms ease',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            {interimText && (
                                                <div className="text-[9px] text-center text-textMuted-light dark:text-textMuted-dark italic truncate px-1 mt-0.5">
                                                    {interimText}
                                                </div>
                                            )}
                                            <div className="text-[8px] text-center text-primary font-bold uppercase tracking-widest mt-0.5 flex items-center justify-center gap-1">
                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                                                {isTranscribing
                                                    ? <span className="text-cyan-400">{voiceLang === 'fr-FR' ? '⏳ Transcription Gemini...' : '⏳ Gemini transcribing...'}</span>
                                                    : voiceLang === 'fr-FR' ? 'Écoute en cours...' : (llmEnabled ? 'Recording for Gemini...' : 'Listening...')
                                                }
                                                {!isTranscribing && <span className="text-textMuted-light dark:text-textMuted-dark font-normal normal-case tracking-normal">tap mic to stop</span>}
                                            </div>
                                        </div>
                                    )}
                                    {/* Image preview strip — shown when images are pending */}
                                    {pendingImages.length > 0 && (
                                        <div className="px-2 pb-1 flex gap-1.5 flex-wrap shrink-0 border-t border-border-light dark:border-border-dark pt-1.5">
                                            {pendingImages.map((img, i) => (
                                                <div key={i} className="relative group">
                                                    <img src={img.previewUrl} alt={img.name} className="w-12 h-12 object-cover rounded-lg border border-border-light dark:border-border-dark" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingImages(prev => prev.filter((_,j) => j !== i))}
                                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >×</button>
                                                </div>
                                            ))}
                                            <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark self-end pb-0.5">
                                                {pendingImages.length} image{pendingImages.length > 1 ? 's' : ''} · {llmEnabled ? 'Gemini Vision ready' : '⚠️ API key needed'}
                                            </div>
                                        </div>
                                    )}
                                    {/* Input */}
                                    <form onSubmit={handleSend} className={`lg-input-bar p-2 flex items-center gap-1.5 shrink-0 ${isRunningChain ? 'lg-processing' : ''}`}>
                                        {/* Hidden file input */}
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={e => { if (e.target.files?.length) handleImageFiles(e.target.files); e.target.value = ''; }}
                                        />
                                        <input
                                            id="assistant-input"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={handleInputKeyDown}
                                            placeholder={isListening ? (voiceLang === 'fr-FR' ? '🎤 Parlez maintenant...' : '🎤 Speak now...') : pendingImages.length > 0 ? 'Add a prompt or just send to analyze...' : isRunningChain ? "Agent running..." : "Ask anything... (↑↓ history, Ctrl+Space)"}
                                            disabled={isRunningChain}
                                            className={`flex-1 bg-transparent text-textMain-light dark:text-textMain-dark text-xs outline-none px-2 ${isRunningChain ? "opacity-50" : ""}`}
                                        />
                                        {/* Language toggle EN/FR */}
                                        <button
                                            type="button"
                                            onClick={() => setVoiceLang(l => l === 'en-US' ? 'fr-FR' : 'en-US')}
                                            title={`Voice language: ${voiceLang === 'en-US' ? 'English — click for French' : 'Français — cliquer pour Anglais'}`}
                                            className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:border-primary/40 transition-all"
                                        >
                                            {voiceLang === 'en-US' ? 'EN' : 'FR'}
                                        </button>
                                        {/* Image upload button */}
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            title="Upload image or storyboard for Gemini Vision analysis"
                                            className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${pendingImages.length > 0 ? 'text-cyan-400' : 'text-textMuted-light dark:text-textMuted-dark hover:text-primary'}`}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                            </svg>
                                        </button>
                                        {/* Mic button */}
                                        <button
                                            type="button"
                                            onClick={isListening ? stopVoice : startVoice}
                                            title={isListening
                                                ? (voiceLang === 'fr-FR' ? 'Arrêter' : 'Stop recording')
                                                : llmEnabled
                                                    ? (voiceLang === 'fr-FR' ? 'Enregistrer — Gemini transcrit automatiquement' : 'Record — Gemini will auto-transcribe')
                                                    : (voiceLang === 'fr-FR' ? 'Parler en français' : 'Voice input')
                                            }
                                            className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]' : llmEnabled ? 'text-cyan-400 hover:text-cyan-300' : 'text-textMuted-light dark:text-textMuted-dark hover:text-primary'}`}
                                        >
                                            {isListening
                                                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                                                : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 9a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V23h-2v-2.06A9 9 0 0 1 3 12h2z"/></svg>
                                            }
                                        </button>
                                        <button type="submit" id="assistant-submit-btn" disabled={!input.trim() || isRunningChain} className="lg-send-btn">
                                            <Icon name="Play" size={16} />
                                        </button>
                                    </form>
                                </>
                            )}
                            {/* Resize handle — bottom-right corner */}
                            <div
                                onPointerDown={onResizeStart}
                                title="Drag to resize"
                                style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    width: 18, height: 18, cursor: 'nwse-resize',
                                    zIndex: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                                    padding: '3px'
                                }}
                            >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M9 1L1 9M9 5L5 9M9 9" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </div>
                        </div>
                    )}

                    <button
                        ref={fabRef}
                        onPointerDown={onFabDragStart}
                        onClick={(e) => {
                          if (dragRef.current) { dragRef.current = false; return; }
                          if (isOpen) {
                            setIsClosing(true);
                            setTimeout(() => { setIsOpen(false); setIsClosing(false); }, 220);
                          } else {
                            setIsOpen(true);
                          }
                        }}
                        className="lg-fab"
                        title="MOKHA Assistant (drag to move)"
                        style={{ cursor: 'grab', touchAction: 'none' }}
                    >
                        <span className={`lg-fab-icon ${isOpen ? 'open' : ''}`}>
                            <Icon name={isOpen ? "X" : "Brain"} size={24} />
                        </span>
                        {sessionShotCount > 0 && !isOpen && (
                            <span className="lg-fab-badge">{sessionShotCount > 99 ? '99+' : sessionShotCount}</span>
                        )}
                    </button>
                </div>
            );
        };

