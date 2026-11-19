import { DIRECTOR_RULES, OPTIONS } from '../data/catalog';
import { MOKHA_KB } from '../data/library';
import { normalizeQuery } from './command';

export const AssistantEngine = {
            ask: (query, context) => {
                const raw = query.trim();
                const q = normalizeQuery(raw).toLowerCase().replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
                let reply = { text: "", action: null };

                // ── ACTION INTENTS (UI CONTROL) ──────────────────────────────
                if (/open story engine|start story engine|story engine|open story|narrative tool/.test(q))
                    return { text: "Opening the Story Engine for you!", action: "OPEN_STORY_ENGINE" };
                if (/open library|show prompts|prompt library|browse prompts|show library/.test(q))
                    return { text: "Opening the Prompt Library!", action: "OPEN_LIBRARY" };

                // ── NEW FEATURE INTENTS ──────────────────────────────────────

                // Chain Mode
                if (/chain mode|start chain|activate chain|chain sequence/.test(q))
                    return { text: MOKHA_KB.chainMode.overview + "\n\nCommands:\n" + MOKHA_KB.chainMode.commands + "\n\nPresets: " + MOKHA_KB.chainMode.presets, action: "OPEN_CHAIN" };

                // Shotify
                if (/shotify|compress prompt|compress for|prompt compression/.test(q))
                    return { text: "Shotify:\n\n" + MOKHA_KB.shotify.overview + "\n\nPlatform profiles:\n" + MOKHA_KB.shotify.profiles + "\n\nCommands: " + MOKHA_KB.shotify.commands };

                // Sequence Templates
                if (/sequence template|load.*sequence|reveal sequence|chase sequence|confrontation|discovery sequence|hero moment|nightmare sequence/.test(q))
                    return { text: "Shot Sequence Templates:\n\n" + MOKHA_KB.sequenceTemplates.overview + "\n\nAvailable:\n" + MOKHA_KB.sequenceTemplates.available + "\n\nCommands: " + MOKHA_KB.sequenceTemplates.commands, action: "OPEN_SEQUENCES" };

                // Continuity Lock
                if (/continuity lock|lock.*param|lock lighting|lock camera|lock lens|lock style|unlock all/.test(q))
                    return { text: "Continuity Lock:\n\n" + MOKHA_KB.continuityLock.overview + "\n\nLockable: " + MOKHA_KB.continuityLock.lockable + "\n\nCommands: " + MOKHA_KB.continuityLock.commands, action: "OPEN_CONTINUITY" };

                // Shot Locking
                if (/lock shot|unlock shot|protect shot/.test(q))
                    return { text: "Shot Locking:\n\n" + MOKHA_KB.shotLocking.overview + "\n\nCommands: " + MOKHA_KB.shotLocking.commands };

                // Find & Replace
                if (/find.*replace|search.*replace|bulk.*replace/.test(q))
                    return { text: "Find & Replace:\n\n" + MOKHA_KB.findReplace.overview + "\n\nCommands: " + MOKHA_KB.findReplace.commands, action: "OPEN_FIND_REPLACE" };

                // Rhythm Analyzer
                if (/rhythm|pacing|shot.*duration.*analysis|analyze.*pacing/.test(q))
                    return { text: "Shot Rhythm Analyzer:\n\n" + MOKHA_KB.rhythmAnalyzer.overview + "\n\nCommands: " + MOKHA_KB.rhythmAnalyzer.commands, action: "OPEN_RHYTHM" };

                // Genre DNA
                if (/genre dna|detect genre|what genre|genre fingerprint|genre analysis/.test(q))
                    return { text: "Genre DNA Detector:\n\n" + MOKHA_KB.genreDNA.overview + "\n\nCommands: " + MOKHA_KB.genreDNA.commands, action: "OPEN_GENRE_DNA" };

                // Prompt Mutation
                if (/mutate shot|mutation|shot variation|generate variation/.test(q))
                    return { text: "Prompt Mutation Engine:\n\n" + MOKHA_KB.promptMutation.overview + "\n\nCommands: " + MOKHA_KB.promptMutation.commands };

                // Revision History
                if (/revision history|shot history|restore.*shot|undo.*shot/.test(q))
                    return { text: "Shot Revision History:\n\n" + MOKHA_KB.revisionHistory.overview + "\n\nCommands: " + MOKHA_KB.revisionHistory.commands };

                // Cost Estimator
                if (/cost|credit|estimate|how much|budget/.test(q))
                    return { text: "Platform Cost Estimator:\n\n" + MOKHA_KB.costEstimator.overview + "\n\nCommands: " + MOKHA_KB.costEstimator.commands };

                // Performance Settings
                if (/performance|ram|vram|gpu|cpu|render quality|unload model/.test(q))
                    return { text: "Performance Settings:\n\n" + MOKHA_KB.performanceSettings.overview + "\n\nCommands: " + MOKHA_KB.performanceSettings.commands, action: "OPEN_PERFORMANCE" };

                // Color Tags
                if (/color tag|tag shot|label shot/.test(q))
                    return { text: "Shot Color Tags:\n\n" + MOKHA_KB.colorTags.overview + "\n\nCommands: " + MOKHA_KB.colorTags.commands };

                // ── CASUAL CONVERSATION & NATURAL LANGUAGE ──────────────────
                // Greetings
                if (/^(hi|hello|hey|sup|yo|howdy|greetings|bonjour|salut|good morning|good evening|good afternoon|what.s up|hiya|heya|wassup)/.test(q)) {
                    const greets = ["Hey! Good to see you. Ready to build something cinematic? 🎬","Hi there! What are we creating today?","Hey! I'm here and ready. What's on your mind?","Hello! Let's make something great. What do you need?","Hey! Drop a command or just ask me anything."];
                    reply.text = greets[Math.floor(Math.random() * greets.length)];
                    return reply;
                }

                // Who are you / what are you
                if (/who are you|what are you|introduce yourself|tell me about yourself|your name|are you an ai|are you a bot|are you human/.test(q)) {
                    reply.text = "I'm MOKHA — your built-in AI agent.\n\nI run 100% offline, no API, no internet. I live inside MOKHA FILM Prompt Builder and I know everything about it.\n\nI can:\n• Answer any question about the app\n• Execute tasks directly (create projects, scenes, shots)\n• Chain complex commands in one sentence\n• Apply director styles, moods, cinematic presets\n• Analyze your project, find shots, rewrite scenes\n• Remember your style across sessions\n\nThink of me as your creative co-pilot. What do we build?";
                    return reply;
                }

                // What can you do
                if (/what can you do|what do you do|your capabilities|how can you help|capabilities|features list/.test(q)) {
                    reply.text = "Here's what I can do:\n\n💬 Answer anything about MOKHA — cameras, lighting, platforms, glossary, tips\n\n⛓ Chain Mode:\n• 'start chain noir scene with Marcus in the warehouse'\n• 'chain add: draws his weapon'\n• 'start sequence' / 'deactivate chain'\n• 'load the reveal sequence' / 'load the chase sequence'\n\n🔒 Continuity & Locking:\n• 'lock lighting' / 'lock camera' / 'unlock all'\n• 'lock shot 3' / 'tag shot 5 red'\n\n⚡ Shotify & Compression:\n• 'shotify on' / 'compress for Runway'\n\n🎭 Analysis:\n• 'detect genre' / 'analyze rhythm' / 'analyze my project'\n\n🔍 Find & Replace:\n• 'find Golden Hour replace Blue Hour in all projects'\n\n⚡ Execute tasks:\n• Create/delete projects, scenes, shots\n• Add characters, locations, voices\n• Enable/disable director rules\n\n🤖 Agent commands:\n• Chain: 'create project X, add 3 scenes, build tense shots'\n• Undo: 'undo that'\n• Rewrite: 'rewrite all shots in Fincher style'\n\nJust talk naturally. I'll figure it out.";
                    return reply;
                }

                // How are you
                if (/how are you|how.s it going|how are things|you okay|you good|how do you feel/.test(q)) {
                    const r = ["Doing great — ready to help you build something cinematic. What's the plan?","All good! Fully loaded and offline. What are we working on?","Running smooth. No API costs, no internet needed. What do you need?","Good! I've got your whole app loaded in memory. What's next?"];
                    reply.text = r[Math.floor(Math.random() * r.length)];
                    return reply;
                }

                // Thank you
                if (/^(thank|thanks|thank you|thx|ty|merci|gracias|mesi)/.test(q)) {
                    const r = ["Anytime! What's next?","Happy to help. Keep building!","Of course. What else do you need?","No problem at all. What's the next shot?"];
                    reply.text = r[Math.floor(Math.random() * r.length)];
                    return reply;
                }

                // Goodbye
                if (/^(bye|goodbye|see you|later|ciao|au revoir|take care|good night|goodnight)/.test(q)) {
                    reply.text = "See you! Your project is saved. Come back anytime — I'll remember where we left off. 🎬";
                    return reply;
                }

                // Compliments
                if (/(you.re (great|amazing|awesome|good|the best|cool|smart|helpful)|good (job|work|bot|agent)|well done|nice work|you rock)/.test(q)) {
                    const r = ["Thanks! Now let's make something great together.","Appreciate it! What are we building next?","That means a lot. Let's keep going — what's next?","Thanks! I'm just doing my job. What do you need?"];
                    reply.text = r[Math.floor(Math.random() * r.length)];
                    return reply;
                }

                // Confusion / help
                if (/i don.t understand|i.m confused|this is confusing|i.m lost|help me understand|what does that mean|explain that/.test(q)) {
                    reply.text = "No worries — let me help. What specifically are you confused about?\n\nYou can ask things like:\n• \"what is a dolly shot?\"\n• \"how do I export my project?\"\n• \"what's the difference between Runway and Veo 3?\"\n• \"how do I add a character?\"\n\nOr just describe what you're trying to do and I'll guide you.";
                    return reply;
                }

                // Yes / ok / sure (continuation)
                if (/^(yes|yeah|yep|yup|sure|ok|okay|alright|go ahead|do it|sounds good|perfect|let.s go|proceed|continue)$/.test(q)) {
                    reply.text = "Got it — what would you like me to do? Give me a command or ask a question.";
                    return reply;
                }

                // Fun facts / boredom
                if (/i.m bored|entertain me|tell me something|fun fact|did you know|random fact/.test(q)) {
                    const facts = [
                        "Fun fact: The Golden Hour lasts about 20-30 minutes after sunrise or before sunset. Villeneuve used it for almost every exterior shot in Blade Runner 2049.",
                        "Did you know? The Dolly Zoom (Vertigo effect) was invented by Hitchcock's DP Irmin Roberts in 1958. Still one of the most emotionally powerful camera moves.",
                        "Fun fact: Kubrick was obsessed with the 1.33:1 aspect ratio for close-ups — he believed it was the most psychologically confrontational framing for a human face.",
                        "Did you know? Veo 3 is currently the only AI video model that generates synchronized audio natively from text prompts.",
                        "Fun fact: The 85mm lens is called the portrait lens because it matches the compression of the human eye at a comfortable conversation distance — about 1.5 meters."
                    ];
                    reply.text = facts[Math.floor(Math.random() * facts.length)] + "\n\nWant to use that in a shot? Just say the word.";
                    return reply;
                }

                // ── GREETINGS (full capabilities) ────────────────────────────
                if (/^(hi|hello|hey|sup|yo|howdy|greetings|bonjour|salut|what can you do|what do you know|capabilities|features list)/.test(q)) {
                    reply.text = "Hey! I'm your fully offline MOKHA Assistant — no API, no internet needed.\n\nI know everything about this app. Ask me about:\n• Cameras, lenses, lighting, shot types\n• Director Rules & how to use them\n• Story Engine, Scene Manager, Prompt Library\n• AI platforms (Runway, Veo 3, KLING, Seedance)\n• Export, shortcuts, tips & best practices\n• Glossary terms (bokeh, dolly, LUT, etc.)\n• Character/Location libraries, Dialogue & Voices\n\nOr say 'open story engine' / 'open library' to navigate directly!";
                    return reply;
                }

                // ── APP OVERVIEW ─────────────────────────────────────────────
                if (/what is mokha|about mokha|what does this app do|what is this app|app overview|mokha film/.test(q)) {
                    reply.text = MOKHA_KB.app.description + "\n\nKey features include:\n" + MOKHA_KB.app.features.join('\n• ').replace(/^/, '• ');
                    return reply;
                }

                // ── WORKSPACES ───────────────────────────────────────────────
                if (/workspace|designer mode|filmmaker mode|default workspace/.test(q)) {
                    reply.text = "MOKHA has 3 workspace modes:\n\n• " + Object.values(MOKHA_KB.workspaces).join('\n• ');
                    return reply;
                }

                // ── IMAGE vs VIDEO MODE ──────────────────────────────────────
                if (/image mode|video mode|difference between image and video|what is image mode|what is video mode/.test(q)) {
                    reply.text = MOKHA_KB.modes.image + "\n\n" + MOKHA_KB.modes.video;
                    return reply;
                }

                // ── AI PLATFORMS ─────────────────────────────────────────────
                if (/runway/.test(q) && !/open|launch/.test(q)) {
                    reply.text = "Runway: " + MOKHA_KB.platforms["Runway"];
                    return reply;
                }
                if (/veo 3|veo3|google veo/.test(q)) {
                    reply.text = "Veo 3: " + MOKHA_KB.platforms["Veo 3"];
                    return reply;
                }
                if (/kling/.test(q)) {
                    reply.text = "KLING: " + MOKHA_KB.platforms["KLING"];
                    return reply;
                }
                if (/seedance/.test(q)) {
                    reply.text = "Seedance: " + MOKHA_KB.platforms["Seedance"];
                    return reply;
                }
                if (/platform|which ai|ai model|ai platform|compare platform|best platform/.test(q)) {
                    reply.text = "Supported AI platforms:\n\n" + Object.entries(MOKHA_KB.platforms).map(([k,v]) => "• " + k + ": " + v).join('\n\n');
                    return reply;
                }
                if (/restriction|forbidden|banned|content filter|nsfw|copyright|political/.test(q)) {
                    reply.text = "Platform content restrictions:\n\n• " + Object.values(MOKHA_KB.platformRestrictions).slice(1).join('\n• ');
                    return reply;
                }
                if (/sanitiz|safe prompt|auto replace|forbidden word/.test(q)) {
                    reply.text = MOKHA_KB.platformRestrictions.sanitize + "\n\nExamples: 'gun' → 'futuristic metallic device', 'blood' → 'crimson liquid splattering', 'explosion' → 'burst of energy'.";
                    return reply;
                }

                // ── CAMERAS ──────────────────────────────────────────────────
                if (/camera|cameras|what camera|which camera|arri|red raptor|sony a7|canon r5|gopro|drone camera|imax|polaroid|cctv|vhs/.test(q) && !/movement|move|pan|tilt|dolly|tracking|handheld|orbit|crane/.test(q)) {
                    reply.text = "Available cameras to emulate:\n\n" + OPTIONS.cameraTypes.map(c => "• " + c).join('\n') + "\n\nTip: ARRI Alexa 65 = Hollywood cinematic. DJI Mavic 3 = aerial drone. VHS Camcorder = retro 80s look.";
                    return reply;
                }

                // ── LENSES ───────────────────────────────────────────────────
                if (/lens|lenses|focal length|fisheye|wide angle|telephoto|macro|portrait lens|prime lens/.test(q)) {
                    reply.text = "Available lenses:\n\n" + OPTIONS.lenses.map(l => "• " + l).join('\n') + "\n\nTip: 85mm Portrait = beautiful bokeh for faces. 14mm Ultra-Wide = dramatic environments. 200mm Telephoto = compressed, cinematic distance shots.";
                    return reply;
                }

                // ── SHOT TYPES ───────────────────────────────────────────────
                if (/shot type|framing|close.?up|wide shot|medium shot|extreme wide|full shot|pov|over the shoulder|bird.?s eye|worm.?s eye|ews|ots|ecw|ecu/.test(q)) {
                    reply.text = "Shot types:\n\n" + OPTIONS.shotTypes.map(s => "• " + s).join('\n') + "\n\nTip: CU (Close-Up) for emotion. EWS (Extreme Wide) for scale. MS (Medium Shot) for dialogue. POV for immersion.";
                    return reply;
                }

                // ── SHOT STYLES ──────────────────────────────────────────────
                if (/shot style|visual style|aesthetic|cinematic style|documentary style|cyberpunk|film noir|anime|photorealistic|vintage|sci.?fi|fantasy style/.test(q)) {
                    reply.text = "Visual styles/aesthetics:\n\n" + OPTIONS.shotStyles.map(s => "• " + s).join('\n');
                    return reply;
                }

                // ── LIGHTING ─────────────────────────────────────────────────
                if (/light|lighting|golden hour|blue hour|neon|high key|low key|studio light|volumetric|god ray|rim light|harsh shadow/.test(q)) {
                    reply.text = "Lighting options:\n\n" + OPTIONS.lighting.map(l => "• " + l).join('\n') + "\n\nTip: Golden Hour = warm cinematic glow. Low Key = dark/moody/noir. Volumetric = atmospheric god rays. Rim Lighting = separates subject from background.";
                    return reply;
                }

                // ── CAMERA MOVEMENTS ─────────────────────────────────────────
                if (/movement|camera move|pan|tilt|dolly|tracking|handheld|orbit|crane|zoom|drone fly|static|tripod/.test(q)) {
                    reply.text = "Camera movements:\n\n" + OPTIONS.movements.map(m => "• " + m).join('\n') + "\n\nTip: Dolly In = intimate reveal. Handheld = raw energy. Orbit = dramatic character moment. Drone Fly-Through = epic establishing.";
                    return reply;
                }

                // ── ACTION SPEEDS ────────────────────────────────────────────
                if (/speed|slow motion|slow.?mo|fast forward|time.?lapse|stop motion|speed ramp|action speed/.test(q)) {
                    reply.text = "Action speeds:\n\n" + OPTIONS.actionSpeeds.map(s => "• " + s).join('\n') + "\n\nTip: Speed Ramp = starts normal, transitions to slow-mo. Ultra Slow Motion = extreme detail. Time-Lapse = fast-forward time.";
                    return reply;
                }

                // ── TRANSITIONS ──────────────────────────────────────────────
                if (/transition|cut|dissolve|fade|whip pan|l.?cut|j.?cut|match cut|smash cut|morph|glitch|luma fade|zoom transition/.test(q)) {
                    reply.text = "Transitions:\n\n" + OPTIONS.transitions.map(t => "• " + t).join('\n') + "\n\nTip: Hard Cut = standard edit. Cross Dissolve = smooth/emotional. Smash Cut = jarring/comedic. Match Cut = visual poetry.";
                    return reply;
                }

                // ── FILM STOCKS ──────────────────────────────────────────────
                if (/film stock|kodak|fujifilm|cinestill|portra|vision3|technicolor|ilford|hp5|ektachrome|arri logc|analog film/.test(q)) {
                    reply.text = "Film stock emulations:\n\n" + OPTIONS.filmStocks.map(f => "• " + f.name + " — " + f.desc).join('\n') + "\n\nTip: Kodak Portra 400 = warm skin tones. CineStill 800T = neon night scenes. Ilford HP5 = gritty black & white.";
                    return reply;
                }

                // ── ANGLES ───────────────────────────────────────────────────
                if (/angle|eye level|high angle|low angle|dutch angle|overhead|ground level|shoulder level|hip level|knee level/.test(q)) {
                    reply.text = "Camera angles:\n\n" + OPTIONS.angles.map(a => "• " + a).join('\n') + "\n\nTip: Low Angle = power/dominance. High Angle = vulnerability. Dutch Angle = unease/tension. Bird's Eye = god-like perspective.";
                    return reply;
                }

                // ── DURATIONS ────────────────────────────────────────────────
                if (/duration|how long|shot length|seconds|timing/.test(q)) {
                    reply.text = MOKHA_KB.motionTiming.durations;
                    return reply;
                }

                // ── DIRECTOR RULES ───────────────────────────────────────────
                if (/director rule|rules|consistency rule|quality rule|8k rule|lipsync|no artifact|color grade rule|reference image rule/.test(q)) {
                    reply.text = "Director Rules (global instructions for all shots):\n\n" + DIRECTOR_RULES.map(r => "• " + r.name + ": " + r.text).join('\n\n') + "\n\nEnable rules in the Rules panel (top-right of editor). Active rules are prepended to the final compiled script.";
                    return reply;
                }

                // ── STORY ENGINE ─────────────────────────────────────────────
                if (/story engine|3.?act|three act|narrative|act 1|act 2|act 3|inciting incident|climax|resolution|emotional arc|character map|relationship|midpoint|dark night/.test(q)) {
                    reply.text = "Story Engine:\n\n" + MOKHA_KB.storyEngine.overview + "\n\n" + MOKHA_KB.storyEngine.acts + "\n\nEmotional Arc: " + MOKHA_KB.storyEngine.emotionalArc + "\n\nCharacter Map: " + MOKHA_KB.storyEngine.characterMap + "\n\nTo use: say 'open story engine' and I'll launch it for you!";
                    return reply;
                }

                // ── PROMPT LIBRARY ───────────────────────────────────────────
                if (/prompt library|library|built.?in prompt|73 prompt|browse prompt|library categor/.test(q)) {
                    reply.text = "Prompt Library:\n\n" + MOKHA_KB.promptLibrary.overview + "\n\n" + MOKHA_KB.promptLibrary.categories + "\n\n" + MOKHA_KB.promptLibrary.modelCompatibility + "\n\nSay 'open library' to browse all 73 prompts!";
                    return reply;
                }

                // ── CHARACTER LIBRARY ────────────────────────────────────────
                if (/character library|character profile|character role|archetype|protagonist|antagonist|mentor|ally|rival|love interest|comic relief|trickster|herald|shapeshifter/.test(q)) {
                    reply.text = "Character Library:\n\n" + MOKHA_KB.characterLibrary.overview + "\n\nRoles: " + MOKHA_KB.characterLibrary.roles + "\n\nArchetypes: " + MOKHA_KB.characterLibrary.archetypes + "\n\nTip: " + MOKHA_KB.characterLibrary.randomize;
                    return reply;
                }

                // ── LOCATION LIBRARY ─────────────────────────────────────────
                if (/location library|location|setting|environment library|cyberpunk alley|warehouse/.test(q)) {
                    reply.text = "Location Library:\n\n" + MOKHA_KB.locationLibrary.overview + "\n\n" + MOKHA_KB.locationLibrary.fields;
                    return reply;
                }

                // ── VOICE & DIALOGUE ─────────────────────────────────────────
                if (/voice|dialogue|sfx|bgm|audio|sound|music|mood|reaction|lipsync|veo 3 audio|veo3 audio/.test(q)) {
                    reply.text = "Dialogue & Voices:\n\n" + MOKHA_KB.voiceDialogue.overview + "\n\nVoice Library: " + MOKHA_KB.voiceDialogue.voiceLib + "\n\nMoods: " + MOKHA_KB.voiceDialogue.moods + "\n\nAudio tip: " + MOKHA_KB.audio.tip;
                    return reply;
                }

                // ── EXPORT / IMPORT ──────────────────────────────────────────
                if (/export|import|save|backup|pdf|json|storyboard|share/.test(q)) {
                    reply.text = "Export & Import:\n\n• " + MOKHA_KB.exportShare.json + "\n• " + MOKHA_KB.exportShare.pdf + "\n• " + MOKHA_KB.exportShare.share + "\n• " + MOKHA_KB.exportShare.import;
                    return reply;
                }

                // ── SHORTCUTS ────────────────────────────────────────────────
                if (/shortcut|hotkey|keyboard|ctrl|key binding/.test(q)) {
                    reply.text = "Keyboard shortcuts:\n\n• Ctrl+S — Save project\n• Ctrl+D — Duplicate current shot\n• Alt+Arrow Keys — Switch between scenes\n• Ctrl+Z — Undo last action\n• Ctrl+Shift+L — Toggle dark/light theme\n\nCustomize shortcuts in the Preferences menu.";
                    return reply;
                }

                // ── WEBLLM / LOCAL AI ────────────────────────────────────────
                if (/webllm|web llm|local ai|in.?browser ai|offline ai|no api|no internet|ai suggest|auto.?build/.test(q)) {
                    reply.text = "Local AI (WebLLM):\n\n" + MOKHA_KB.glossary["webllm"] + "\n\nFeatures powered by WebLLM:\n• AI Suggest — generates creative subject descriptions\n• Auto-Build — fills all visual parameters automatically\n\nNo API key, no internet, no cost. Runs entirely in your browser using WebGPU.";
                    return reply;
                }

                // ── LLAVA / OLLAMA ───────────────────────────────────────────
                if (/llava|ollama|vision ai|image analysis|analyze image|reference image analysis/.test(q)) {
                    reply.text = "LLaVA Vision AI:\n\n" + MOKHA_KB.glossary["llava"] + "\n\n" + MOKHA_KB.glossary["ollama"] + "\n\nIn the Story Engine, use the LLaVA button to analyze a reference image and extract visual style, mood, and cinematography data automatically.";
                    return reply;
                }

                // ── PLOT HOLE DETECTOR ───────────────────────────────────────
                if (/plot hole|continuity error|continuity check|detect error|story error|logical error/.test(q)) {
                    reply.text = "Plot Hole Detector:\n\nScans all your scenes to find continuity errors, including:\n• Missing transitions between shots\n• Character resurrections (character dies then reappears)\n• Day/night lighting conflicts within a scene\n• Wardrobe or prop inconsistencies\n\nAccess it from the Scene Manager panel.";
                    return reply;
                }

                // ── QUICK PRESETS / MYSTYLE ──────────────────────────────────
                if (/preset|quick shot|mystyle|my style|template|gritty hyperreal|ultra 8k flawless/.test(q)) {
                    reply.text = "Quick Shot Presets & MyStyle:\n\n" + MOKHA_KB.quickPresets.overview + "\n\n" + MOKHA_KB.quickPresets.custom + "\n\n" + MOKHA_KB.quickPresets.mystyle;
                    return reply;
                }

                // ── SCENE MANAGER ────────────────────────────────────────────
                if (/scene manager|scene|add scene|new scene|compile|movie script|final script|reorder|sequence/.test(q)) {
                    reply.text = "Scene Manager:\n\n" + MOKHA_KB.sceneManager.overview + "\n\n• " + MOKHA_KB.sceneManager.addScene + "\n• " + MOKHA_KB.sceneManager.reorderShots + "\n• " + MOKHA_KB.sceneManager.compileMovie + "\n• " + MOKHA_KB.sceneManager.finalScript;
                    return reply;
                }

                // ── SHOT BUILDER ─────────────────────────────────────────────
                if (/shot builder|build shot|add shot|prompt builder|subject|base subject|negative prompt|custom override|ref image|reference image/.test(q)) {
                    reply.text = "Shot Builder:\n\n" + MOKHA_KB.shotBuilder.subject + "\n\n• " + MOKHA_KB.shotBuilder.addShot + "\n• " + MOKHA_KB.shotBuilder.autoBuild + "\n• " + MOKHA_KB.shotBuilder.aiSuggest + "\n• " + MOKHA_KB.shotBuilder.negativePrompt + "\n• " + MOKHA_KB.shotBuilder.customOverride;
                    return reply;
                }

                // ── TIPS BY GENRE/STYLE ──────────────────────────────────────
                if (/noir|film noir|detective|black and white/.test(q)) {
                    reply.text = "Film Noir tips:\n\n" + MOKHA_KB.tips.noir;
                    return reply;
                }
                if (/action|fight|chase|explosion|intense/.test(q)) {
                    reply.text = "Action shot tips:\n\n" + MOKHA_KB.tips.action;
                    return reply;
                }
                if (/portrait|face|character shot|headshot/.test(q)) {
                    reply.text = "Portrait/character shot tips:\n\n" + MOKHA_KB.tips.portrait;
                    return reply;
                }
                if (/aerial|drone|bird.?s eye|overhead shot/.test(q)) {
                    reply.text = "Aerial/drone shot tips:\n\n" + MOKHA_KB.tips.drone;
                    return reply;
                }
                if (/horror|scary|dark|creepy|thriller/.test(q)) {
                    reply.text = "Horror/thriller tips:\n\n" + MOKHA_KB.tips.horror;
                    return reply;
                }
                if (/sci.?fi|science fiction|futuristic|space|cyberpunk/.test(q)) {
                    reply.text = "Sci-fi tips:\n\n" + MOKHA_KB.tips.scifi;
                    return reply;
                }
                if (/documentary|realistic|candid|street/.test(q)) {
                    reply.text = "Documentary style tips:\n\n" + MOKHA_KB.tips.documentary;
                    return reply;
                }
                if (/slow.?mo|slow motion|ultra slow/.test(q)) {
                    reply.text = "Slow motion tips:\n\n" + MOKHA_KB.tips.slowmo;
                    return reply;
                }
                if (/quality|best quality|8k|high quality|masterpiece/.test(q)) {
                    reply.text = "Quality tips:\n\n" + MOKHA_KB.tips.quality;
                    return reply;
                }
                if (/consistency|character consistent|same character|keep character/.test(q)) {
                    reply.text = "Character consistency tips:\n\n" + MOKHA_KB.tips.consistency;
                    return reply;
                }
                if (/prompt length|how long prompt|prompt tip|best prompt|write prompt/.test(q)) {
                    reply.text = "Prompt writing tips:\n\n" + MOKHA_KB.tips.promptLength;
                    return reply;
                }

                // ── GLOSSARY LOOKUP ──────────────────────────────────────────
                const glossaryKeys = Object.keys(MOKHA_KB.glossary);
                const matchedGlossary = glossaryKeys.filter(k => q.includes(k.toLowerCase()));
                if (matchedGlossary.length > 0) {
                    reply.text = "Glossary:\n\n" + matchedGlossary.map(k => "• " + k.toUpperCase() + ": " + MOKHA_KB.glossary[k]).join('\n\n');
                    return reply;
                }

                // ── PROMPT LIBRARY SEARCH ────────────────────────────────────
                const libMatch = PROMPT_LIBRARY.filter(p =>
                    p.title.toLowerCase().includes(q) ||
                    p.cat.toLowerCase().includes(q) ||
                    p.text.toLowerCase().split(' ').some(w => w.length > 4 && q.includes(w))
                ).slice(0, 3);
                if (libMatch.length > 0) {
                    reply.text = "Found " + libMatch.length + " matching prompt(s) in the library:\n\n" + libMatch.map(p => "• [" + p.cat + "] " + p.title + "\n  Best for: " + p.models.join(', ')).join('\n\n') + "\n\nSay 'open library' to browse and use them!";
                    return reply;
                }

                // ── FALLBACK — Smart semantic matching ───────────────────────
                // Try to find the closest topic by keyword overlap
                const topicMap = [
                    { keys: ['camera','arri','red','sony','canon','gopro','imax','drone','vhs','polaroid'], topic: 'cameras' },
                    { keys: ['lens','focal','fisheye','wide','telephoto','macro','portrait','prime','85mm','50mm','24mm','14mm'], topic: 'lenses' },
                    { keys: ['light','lighting','golden','blue hour','neon','high key','low key','volumetric','rim','harsh','shadow'], topic: 'lighting' },
                    { keys: ['shot type','close up','wide shot','medium','extreme','pov','shoulder','bird','worm','ews','ots','ecu'], topic: 'shot types' },
                    { keys: ['movement','pan','tilt','dolly','tracking','handheld','orbit','crane','zoom','drone fly','static'], topic: 'camera movements' },
                    { keys: ['transition','cut','dissolve','fade','whip','match cut','smash','morph','glitch'], topic: 'transitions' },
                    { keys: ['film stock','kodak','fujifilm','cinestill','portra','vision3','ilford','hp5','ektachrome','arri logc'], topic: 'film stocks' },
                    { keys: ['story','act','narrative','inciting','climax','resolution','midpoint','protagonist','antagonist'], topic: 'story engine' },
                    { keys: ['export','import','save','pdf','json','backup','share'], topic: 'export and import' },
                    { keys: ['platform','runway','veo','kling','seedance','ai model'], topic: 'AI platforms' },
                    { keys: ['director rule','rule','consistency','quality','8k','artifact'], topic: 'director rules' },
                    { keys: ['character','role','archetype','protagonist','antagonist','mentor'], topic: 'character library' },
                    { keys: ['location','setting','environment'], topic: 'location library' },
                    { keys: ['voice','dialogue','sfx','bgm','audio','sound','music'], topic: 'voice and dialogue' },
                    { keys: ['shortcut','hotkey','keyboard','ctrl'], topic: 'keyboard shortcuts' },
                    { keys: ['webllm','local ai','offline','no api','ai suggest','auto build'], topic: 'WebLLM local AI' },
                    { keys: ['preset','mystyle','template','quick shot'], topic: 'quick presets and MyStyle' },
                    { keys: ['noir','detective','black white'], topic: 'film noir tips' },
                    { keys: ['action','fight','chase','explosion'], topic: 'action shot tips' },
                    { keys: ['horror','scary','dark','creepy','thriller'], topic: 'horror and thriller tips' },
                    { keys: ['sci fi','space','future','robot','alien','cyberpunk'], topic: 'sci-fi tips' },
                    { keys: ['drone','aerial','bird eye','overhead'], topic: 'aerial and drone tips' },
                    { keys: ['slow motion','slow mo','ultra slow'], topic: 'slow motion tips' },
                ];
                const qWords = q.split(' ').filter(w => w.length > 2);
                const scored = topicMap.map(t => ({ topic: t.topic, score: t.keys.filter(k => qWords.some(w => k.includes(w) || w.includes(k))).length })).filter(t => t.score > 0).sort((a,b) => b.score - a.score);
                if (scored.length > 0) {
                    reply.text = `I think you're asking about "${scored[0].topic}". Let me help:\n\nSay: "tell me about ${scored[0].topic}"\n\nOr try one of these:\n${scored.slice(0,3).map(s => `• "${s.topic}"`).join('\n')}\n\nOr just ask naturally — I understand most questions about filmmaking and MOKHA.`;
                    return reply;
                }
                reply.text = "I'm not sure about that one, but I can help with:\n\n🎬 Cameras, lenses, lighting, shot types, angles\n🎥 Camera movements, speeds, transitions, film stocks\n📖 Story Engine, Scene Manager, Prompt Library\n🤖 AI platforms (Runway, Veo 3, KLING, Seedance)\n⚡ Genre tips (noir, action, sci-fi, horror, drone...)\n\nTry: 'best camera for noir', 'how to export', 'what is a dolly shot', or just describe what you're trying to do.";
                return reply;
            }
        };

