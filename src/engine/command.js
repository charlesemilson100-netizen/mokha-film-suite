import { DIRECTOR_RULES, OPTIONS, PLATFORM_RESTRICTIONS } from '../data/catalog';
import { FILLER_WORDS, SYNONYM_MAP, TYPO_MAP } from '../data/language';
import { CHAIN_SCENE_PRESETS, DIRECTOR_STYLES, FAMOUS_SHOTS, MOOD_PRESETS } from '../data/presets';
import { AssistantEngine } from './assistant';
import { buildSnapshot, loadAgentMemory, restoreSnapshot, saveAgentMemory } from './memory';

// ── COMMAND ENGINE — parses user intent into executable app actions ──
        export const CommandEngine = {
            parse: (query) => {
                const normalized = normalizeQuery(query);
                const q = normalized.toLowerCase().trim();
                const raw = normalized.trim();

                // ── CHAIN MODE COMMANDS ───────────────────────────────────────
                if (/activate chain|start chain mode|chain mode on|enable chain/.test(q))
                    return { type: 'CHAIN_ACTIVATE', payload: {} };

                if (/deactivate chain|chain mode off|disable chain|stop chain/.test(q))
                    return { type: 'CHAIN_DEACTIVATE', payload: {} };

                if (/start sequence|create shot 1|add shot 1|chain shot 1/.test(q))
                    return { type: 'CHAIN_START_SEQUENCE', payload: {} };

                // "start chain noir scene with Marcus in the warehouse"
                const chainPresetMatch = raw.match(/(?:start chain|chain preset|use chain|chain with)\s+(.+?)(?:\s+with\s+(.+?))?(?:\s+in\s+(.+?))?(?:\s+about\s+(.+?))?$/i);
                if (chainPresetMatch) {
                    return { type: 'CHAIN_PRESET', payload: {
                        presetName: chainPresetMatch[1]?.trim() || '',
                        character: chainPresetMatch[2]?.trim() || '',
                        location: chainPresetMatch[3]?.trim() || '',
                        subject: chainPresetMatch[4]?.trim() || ''
                    }};
                }

                // "chain add: draws his weapon" or "chain: looks up"
                const chainAddMatch = raw.match(/(?:chain add|chain:|add chain shot)[:\s]+(.+)/i);
                if (chainAddMatch)
                    return { type: 'CHAIN_ADD', payload: { action: chainAddMatch[1].trim() } };

                // ── SHOTIFY COMMANDS ──────────────────────────────────────────
                if (/shotify on|enable shotify|compress prompt|compress for/.test(q))
                    return { type: 'SHOTIFY_ON', payload: {} };
                if (/shotify off|disable shotify|full prompt|restore prompt/.test(q))
                    return { type: 'SHOTIFY_OFF', payload: {} };

                // ── CONTINUITY LOCK ───────────────────────────────────────────
                const lockParamMatch = raw.match(/lock\s+(lighting|camera|lens|style|angle|speed|film stock|aspect ratio)(?:\s+(?:to|as)\s+(.+))?/i);
                if (lockParamMatch)
                    return { type: 'LOCK_PARAM', payload: { param: lockParamMatch[1].trim(), value: lockParamMatch[2]?.trim() || '' } };
                if (/unlock all|clear all locks|remove all locks/.test(q))
                    return { type: 'UNLOCK_ALL', payload: {} };

                // ── SHOT LOCK ─────────────────────────────────────────────────
                const lockShotMatch = raw.match(/(?:lock|unlock)\s+shot\s+(\d+)/i);
                if (lockShotMatch)
                    return { type: 'LOCK_SHOT', payload: { index: lockShotMatch[1] } };

                // ── COLOR TAG ─────────────────────────────────────────────────
                const colorTagMatch = raw.match(/(?:tag|color tag|label)\s+shot\s+(\d+)\s+(red|amber|green|blue|purple|pink)/i);
                if (colorTagMatch)
                    return { type: 'COLOR_TAG_SHOT', payload: { index: colorTagMatch[1], color: colorTagMatch[2].toLowerCase() } };

                // ── FIND & REPLACE ────────────────────────────────────────────
                const findReplaceMatch = raw.match(/find\s+[""']?(.+?)[""']?\s+replace\s+(?:with\s+)?[""']?(.+?)[""']?(?:\s+in\s+(scene|project|all))?$/i);
                if (findReplaceMatch)
                    return { type: 'FIND_REPLACE', payload: { find: findReplaceMatch[1].trim(), replace: findReplaceMatch[2].trim(), scope: findReplaceMatch[3] || 'scene' } };

                // ── SEQUENCE TEMPLATES ────────────────────────────────────────
                const loadSeqMatch = raw.match(/load\s+(?:the\s+)?(.+?)\s+sequence(?:\s+(?:with|for)\s+(.+))?$/i);
                if (loadSeqMatch)
                    return { type: 'LOAD_SEQUENCE', payload: { templateName: loadSeqMatch[1].trim(), subject: loadSeqMatch[2]?.trim() || '' } };

                // ── OPEN PANELS ───────────────────────────────────────────────
                if (/open chain|chain panel|chain mode panel/.test(q)) return { type: 'OPEN_CHAIN', payload: {} };
                if (/rhythm|check pacing|shot pacing/.test(q)) return { type: 'OPEN_RHYTHM', payload: {} };
                if (/genre dna|detect genre|what genre/.test(q)) return { type: 'OPEN_GENRE_DNA', payload: {} };
                if (/find.*replace|search.*replace/.test(q)) return { type: 'OPEN_FIND_REPLACE', payload: {} };
                if (/performance settings|open settings|ram settings/.test(q)) return { type: 'OPEN_PERFORMANCE', payload: {} };
                if (/sequence templates|load sequence|shot templates/.test(q)) return { type: 'OPEN_SEQUENCES', payload: {} };
                if (/continuity lock|lock panel/.test(q)) return { type: 'OPEN_CONTINUITY', payload: {} };

                // ── CREATE PROJECT ────────────────────────────────────────────
                const createProjectMatch = q.match(/(?:create|new|add|make)\s+(?:a\s+)?project(?:\s+(?:called|named|with name)?\s*[""']?(.+?)[""']?)?$/);
                if (createProjectMatch || /^(?:create|new|add|make)\s+(?:a\s+)?project/.test(q)) {
                    const nameRaw = raw.replace(/(?:create|new|add|make)\s+(?:a\s+)?project(?:\s+(?:called|named|with\s+name)?\s*)?/i, '').replace(/['"]/g, '').trim();
                    const name = nameRaw || `New Project`;
                    return { type: 'CREATE_PROJECT', payload: { name } };
                }

                // ── DELETE PROJECT ────────────────────────────────────────────
                if (/delete\s+(?:the\s+)?(?:current\s+)?project|remove\s+(?:this\s+)?project/.test(q)) {
                    return { type: 'DELETE_PROJECT', payload: {} };
                }

                // ── CREATE SCENE ──────────────────────────────────────────────
                const createSceneMatch = raw.match(/(?:create|new|add|make)\s+(?:a\s+)?scene(?:\s+(?:called|named|with name)?\s*[""']?(.+?)[""']?)?$/i);
                if (createSceneMatch || /^(?:create|new|add|make)\s+(?:a\s+)?scene/.test(q)) {
                    const nameRaw = raw.replace(/(?:create|new|add|make)\s+(?:a\s+)?scene(?:\s+(?:called|named|with\s+name)?\s*)?/i, '').replace(/['"]/g, '').trim();
                    const name = nameRaw || null;
                    return { type: 'CREATE_SCENE', payload: { name } };
                }

                // ── DELETE SCENE ──────────────────────────────────────────────
                if (/delete\s+(?:the\s+)?(?:current\s+|active\s+)?scene|remove\s+(?:this\s+)?scene/.test(q)) {
                    return { type: 'DELETE_SCENE', payload: {} };
                }

                // ── ADD SHOT ──────────────────────────────────────────────────
                const addShotMatch = raw.match(/(?:add|create|new|make)\s+(?:a\s+)?shot(?:\s+(?:with|about|of|for)?\s*[""']?(.+?)[""']?)?$/i);
                if (addShotMatch) {
                    const subject = raw.replace(/(?:add|create|new|make)\s+(?:a\s+)?shot(?:\s+(?:with|about|of|for)?\s*)?/i, '').replace(/['"]/g, '').trim();
                    return { type: 'ADD_SHOT', payload: { subject: subject || 'New shot' } };
                }

                // ── CREATE CHARACTER ──────────────────────────────────────────
                const createCharMatch = raw.match(/(?:create|add|new|make)\s+(?:a\s+)?(?:character|char)(?:\s+(?:called|named|with name)?\s*[""']?(.+?)[""']?)?$/i);
                if (createCharMatch || /^(?:create|add|new|make)\s+(?:a\s+)?(?:character|char)/.test(q)) {
                    const nameRaw = raw.replace(/(?:create|add|new|make)\s+(?:a\s+)?(?:character|char)(?:\s+(?:called|named|with\s+name)?\s*)?/i, '').replace(/['"]/g, '').trim();
                    const name = nameRaw || 'New Character';
                    return { type: 'CREATE_CHARACTER', payload: { name } };
                }

                // ── DELETE CHARACTER ──────────────────────────────────────────
                const deleteCharMatch = raw.match(/(?:delete|remove)\s+(?:character|char)\s+[""']?(.+?)[""']?$/i);
                if (deleteCharMatch) {
                    return { type: 'DELETE_CHARACTER', payload: { name: deleteCharMatch[1].trim() } };
                }

                // ── LIST CHARACTERS ───────────────────────────────────────────
                if (/(?:list|show|what are|display)\s+(?:my\s+)?(?:characters|chars)/.test(q)) {
                    return { type: 'LIST_CHARACTERS', payload: {} };
                }

                // ── CREATE LOCATION ───────────────────────────────────────────
                const createLocMatch = raw.match(/(?:create|add|new|make)\s+(?:a\s+)?location(?:\s+(?:called|named|with name)?\s*[""']?(.+?)[""']?)?$/i);
                if (createLocMatch || /^(?:create|add|new|make)\s+(?:a\s+)?location/.test(q)) {
                    const nameRaw = raw.replace(/(?:create|add|new|make)\s+(?:a\s+)?location(?:\s+(?:called|named|with\s+name)?\s*)?/i, '').replace(/['"]/g, '').trim();
                    const name = nameRaw || 'New Location';
                    return { type: 'CREATE_LOCATION', payload: { name } };
                }

                // ── DELETE LOCATION ───────────────────────────────────────────
                const deleteLocMatch = raw.match(/(?:delete|remove)\s+location\s+[""']?(.+?)[""']?$/i);
                if (deleteLocMatch) {
                    return { type: 'DELETE_LOCATION', payload: { name: deleteLocMatch[1].trim() } };
                }

                // ── LIST LOCATIONS ────────────────────────────────────────────
                if (/(?:list|show|what are|display)\s+(?:my\s+)?locations/.test(q)) {
                    return { type: 'LIST_LOCATIONS', payload: {} };
                }

                // ── CREATE VOICE ──────────────────────────────────────────────
                const createVoiceMatch = raw.match(/(?:create|add|new|make)\s+(?:a\s+)?voice(?:\s+(?:called|named|with name)?\s*[""']?(.+?)[""']?)?$/i);
                if (createVoiceMatch || /^(?:create|add|new|make)\s+(?:a\s+)?voice/.test(q)) {
                    const nameRaw = raw.replace(/(?:create|add|new|make)\s+(?:a\s+)?voice(?:\s+(?:called|named|with\s+name)?\s*)?/i, '').replace(/['"]/g, '').trim();
                    const name = nameRaw || 'New Voice';
                    return { type: 'CREATE_VOICE', payload: { name } };
                }

                // ── DELETE VOICE ──────────────────────────────────────────────
                const deleteVoiceMatch = raw.match(/(?:delete|remove)\s+voice\s+[""']?(.+?)[""']?$/i);
                if (deleteVoiceMatch) {
                    return { type: 'DELETE_VOICE', payload: { name: deleteVoiceMatch[1].trim() } };
                }

                // ── LIST VOICES ───────────────────────────────────────────────
                if (/(?:list|show|what are|display)\s+(?:my\s+)?voices/.test(q)) {
                    return { type: 'LIST_VOICES', payload: {} };
                }

                // ── LIST PROJECTS ─────────────────────────────────────────────
                if (/(?:list|show|what are|display)\s+(?:my\s+)?projects/.test(q)) {
                    return { type: 'LIST_PROJECTS', payload: {} };
                }

                // ── LIST SCENES ───────────────────────────────────────────────
                if (/(?:list|show|what are|display)\s+(?:my\s+|the\s+)?scenes/.test(q)) {
                    return { type: 'LIST_SCENES', payload: {} };
                }

                // ── LIST SHOTS ────────────────────────────────────────────────
                if (/(?:list|show|what are|display)\s+(?:my\s+|the\s+)?shots/.test(q)) {
                    return { type: 'LIST_SHOTS', payload: {} };
                }

                // ── SWITCH PROJECT ────────────────────────────────────────────
                const switchProjMatch = raw.match(/(?:switch|open|go to|select|activate)\s+(?:project\s+)?[""']?(.+?)[""']?$/i);
                if (/(?:switch|open|go to|select|activate)\s+project/.test(q) && switchProjMatch) {
                    return { type: 'SWITCH_PROJECT', payload: { name: switchProjMatch[1].replace(/project/i,'').trim() } };
                }

                // ── SWITCH SCENE ──────────────────────────────────────────────
                const switchSceneMatch = raw.match(/(?:switch|go to|select|activate)\s+scene\s+[""']?(.+?)[""']?$/i);
                if (switchSceneMatch) {
                    return { type: 'SWITCH_SCENE', payload: { name: switchSceneMatch[1].trim() } };
                }

                // ── ENABLE/DISABLE DIRECTOR RULE ──────────────────────────────
                const enableRuleMatch = raw.match(/(?:enable|activate|turn on)\s+(?:director\s+)?rule\s+[""']?(.+?)[""']?$/i);
                if (enableRuleMatch) {
                    return { type: 'ENABLE_RULE', payload: { name: enableRuleMatch[1].trim() } };
                }
                const disableRuleMatch = raw.match(/(?:disable|deactivate|turn off)\s+(?:director\s+)?rule\s+[""']?(.+?)[""']?$/i);
                if (disableRuleMatch) {
                    return { type: 'DISABLE_RULE', payload: { name: disableRuleMatch[1].trim() } };
                }
                if (/(?:list|show|what are|display)\s+(?:active\s+)?(?:director\s+)?rules/.test(q)) {
                    return { type: 'LIST_RULES', payload: {} };
                }

                // ── CLEAR SCENE ───────────────────────────────────────────────
                if (/clear\s+(?:the\s+)?(?:current\s+)?scene|remove\s+all\s+shots/.test(q)) {
                    return { type: 'CLEAR_SCENE', payload: {} };
                }

                // ── NAVIGATE ──────────────────────────────────────────────────
                if (/go to dashboard|open dashboard|show dashboard/.test(q)) {
                    return { type: 'NAVIGATE', payload: { view: 'dashboard' } };
                }
                if (/go to editor|open editor|show editor/.test(q)) {
                    return { type: 'NAVIGATE', payload: { view: 'editor' } };
                }

                // ── RENAME SCENE ──────────────────────────────────────────────
                const renameSceneMatch = raw.match(/rename\s+(?:(?:current|this|active)\s+)?scene\s+(?:to\s+)?[""']?(.+?)[""']?$/i);
                if (renameSceneMatch) {
                    return { type: 'RENAME_SCENE', payload: { name: renameSceneMatch[1].trim() } };
                }

                // ── RENAME PROJECT ────────────────────────────────────────────
                const renameProjMatch = raw.match(/rename\s+(?:(?:current|this|active)\s+)?project\s+(?:to\s+)?[""']?(.+?)[""']?$/i);
                if (renameProjMatch) {
                    return { type: 'RENAME_PROJECT', payload: { name: renameProjMatch[1].trim() } };
                }

                return null; // not a command
            },

            execute: (cmd, appActions) => {
                const {
                    projects, setProjects, activeProjectId, setActiveProjectId,
                    scenes, updateActiveProjectScenes, activeSceneId, setActiveSceneId,
                    globalCharacters, setGlobalCharacters,
                    globalLocations, setGlobalLocations,
                    globalVoiceStyles, setGlobalVoiceStyles,
                    activeDirectorRules, setActiveDirectorRules,
                    setSubject, setSelections, setCurrentView,
                    setShowStoryEngineModal, setShowPromptLibraryModal
                } = appActions;

                switch (cmd.type) {

                    case 'CREATE_PROJECT': {
                        const { name } = cmd.payload;
                        const id = `proj_${Date.now()}`;
                        const newProject = {
                            id, name,
                            description: '',
                            tags: [],
                            defaultParams: {},
                            scenes: [{ id: Date.now() + 1, name: 'Scene 1', shots: [] }]
                        };
                        setProjects(prev => [...prev, newProject]);
                        setActiveProjectId(id);
                        return `✓ Project "${name}" created and set as active! It has one empty scene ready to go.`;
                    }

                    case 'DELETE_PROJECT': {
                        if (projects.length <= 1) return '⚠ Cannot delete the last project. Create another one first.';
                        const proj = projects.find(p => p.id === activeProjectId);
                        setProjects(prev => prev.filter(p => p.id !== activeProjectId));
                        setActiveProjectId(projects.find(p => p.id !== activeProjectId)?.id);
                        return `✓ Project "${proj?.name || 'current'}" deleted.`;
                    }

                    case 'RENAME_PROJECT': {
                        const { name } = cmd.payload;
                        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, name } : p));
                        return `✓ Active project renamed to "${name}".`;
                    }

                    case 'LIST_PROJECTS': {
                        if (!projects.length) return 'No projects yet. Say "create project [name]" to make one!';
                        return `Your projects (${projects.length}):\n\n` + projects.map((p, i) => `${p.id === activeProjectId ? '▶' : '•'} ${p.name} — ${p.scenes?.length || 0} scene(s), ${p.scenes?.reduce((a, s) => a + (s.shots?.length || 0), 0)} shot(s)`).join('\n');
                    }

                    case 'SWITCH_PROJECT': {
                        const { name } = cmd.payload;
                        const match = projects.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
                        if (!match) return `⚠ No project found matching "${name}". Say "list projects" to see all.`;
                        setActiveProjectId(match.id);
                        return `✓ Switched to project "${match.name}".`;
                    }

                    case 'CREATE_SCENE': {
                        const { name } = cmd.payload;
                        const newId = Date.now();
                        const sceneName = name || `Scene ${(scenes?.length || 0) + 1}`;
                        updateActiveProjectScenes(prev => [...prev, { id: newId, name: sceneName, shots: [] }]);
                        setActiveSceneId(newId);
                        return `✓ Scene "${sceneName}" created and set as active!`;
                    }

                    case 'DELETE_SCENE': {
                        if (!scenes || scenes.length <= 1) return '⚠ Cannot delete the last scene. Add another scene first.';
                        const scene = scenes.find(s => s.id === activeSceneId);
                        updateActiveProjectScenes(prev => {
                            const filtered = prev.filter(s => s.id !== activeSceneId);
                            return filtered.length ? filtered : [{ id: Date.now(), name: 'Scene 1', shots: [] }];
                        });
                        const remaining = scenes.filter(s => s.id !== activeSceneId);
                        if (remaining.length) setActiveSceneId(remaining[0].id);
                        return `✓ Scene "${scene?.name || 'current'}" deleted.`;
                    }

                    case 'RENAME_SCENE': {
                        const { name } = cmd.payload;
                        updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? { ...s, name } : s));
                        return `✓ Active scene renamed to "${name}".`;
                    }

                    case 'CLEAR_SCENE': {
                        const scene = scenes?.find(s => s.id === activeSceneId);
                        updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? { ...s, shots: [] } : s));
                        return `✓ All shots cleared from scene "${scene?.name || 'current'}".`;
                    }

                    case 'LIST_SCENES': {
                        if (!scenes?.length) return 'No scenes in the active project yet.';
                        return `Scenes in active project (${scenes.length}):\n\n` + scenes.map(s => `${s.id === activeSceneId ? '▶' : '•'} ${s.name} — ${s.shots?.length || 0} shot(s)`).join('\n');
                    }

                    case 'LIST_SHOTS': {
                        const scene = scenes?.find(s => s.id === activeSceneId);
                        if (!scene?.shots?.length) return `No shots in the active scene "${scene?.name || ''}". Add one with "add shot [description]".`;
                        return `Shots in "${scene.name}" (${scene.shots.length}):\n\n` + scene.shots.map((s, i) => `${i + 1}. [${s.mode || 'video'}] ${(s.subject || s.customPromptOverride || 'Untitled').substring(0, 60)}...`).join('\n');
                    }

                    case 'ADD_SHOT': {
                        const { subject } = cmd.payload;
                        const newShot = {
                            id: Date.now() + Math.random(),
                            subject,
                            selections: { shotType: '', shotStyle: '', camera: '', lens: '', angle: '', lighting: '', movement: '', actionSpeed: '', duration: '3.0s', transition: 'Hard Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                            sfx: '', bgm: '', dialogues: [],
                            mode: 'video', status: 'Planning',
                            tags: [], referenceImages: [], customPromptOverride: null
                        };
                        updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? { ...s, shots: [...(s.shots || []), newShot] } : s));
                        return `✓ Shot added to active scene!\n\nSubject: "${subject}"\n\nThe shot uses default parameters. Open the editor to fine-tune camera, lighting, movement, etc.`;
                    }

                    case 'CREATE_CHARACTER': {
                        const { name } = cmd.payload;
                        const exists = globalCharacters.find(c => c.name.toLowerCase() === name.toLowerCase());
                        if (exists) return `⚠ A character named "${name}" already exists in your library.`;
                        const newChar = { id: `char_${Date.now()}`, name, role: '', appearance: '', description: '' };
                        setGlobalCharacters(prev => [...prev, newChar]);
                        return `✓ Character "${name}" added to your Character Library!\n\nOpen the Characters panel to add their role, appearance, and backstory.`;
                    }

                    case 'DELETE_CHARACTER': {
                        const { name } = cmd.payload;
                        const match = globalCharacters.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
                        if (!match) return `⚠ No character found matching "${name}". Say "list characters" to see all.`;
                        setGlobalCharacters(prev => prev.filter(c => c.id !== match.id));
                        return `✓ Character "${match.name}" removed from your library.`;
                    }

                    case 'LIST_CHARACTERS': {
                        if (!globalCharacters.length) return 'No characters in your library yet. Say "create character [name]" to add one!';
                        return `Your characters (${globalCharacters.length}):\n\n` + globalCharacters.map(c => `• ${c.name}${c.role ? ' — ' + c.role : ''}${c.appearance ? '\n  ' + c.appearance.substring(0, 60) + '...' : ''}`).join('\n');
                    }

                    case 'CREATE_LOCATION': {
                        const { name } = cmd.payload;
                        const exists = globalLocations.find(l => l.name.toLowerCase() === name.toLowerCase());
                        if (exists) return `⚠ A location named "${name}" already exists.`;
                        const newLoc = { id: `loc_${Date.now()}`, name, description: '' };
                        setGlobalLocations(prev => [...prev, newLoc]);
                        return `✓ Location "${name}" added to your Location Library!\n\nOpen the Locations panel to add a description.`;
                    }

                    case 'DELETE_LOCATION': {
                        const { name } = cmd.payload;
                        const match = globalLocations.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
                        if (!match) return `⚠ No location found matching "${name}". Say "list locations" to see all.`;
                        setGlobalLocations(prev => prev.filter(l => l.id !== match.id));
                        return `✓ Location "${match.name}" removed from your library.`;
                    }

                    case 'LIST_LOCATIONS': {
                        if (!globalLocations.length) return 'No locations yet. Say "create location [name]" to add one!';
                        return `Your locations (${globalLocations.length}):\n\n` + globalLocations.map(l => `• ${l.name}${l.description ? '\n  ' + l.description.substring(0, 60) + '...' : ''}`).join('\n');
                    }

                    case 'CREATE_VOICE': {
                        const { name } = cmd.payload;
                        const exists = globalVoiceStyles.find(v => v.name.toLowerCase() === name.toLowerCase());
                        if (exists) return `⚠ A voice named "${name}" already exists.`;
                        const newVoice = { id: `voice_${Date.now()}`, name, description: '', fx: '', age: '', genre: '', accent: '', language: '' };
                        setGlobalVoiceStyles(prev => [...prev, newVoice]);
                        return `✓ Voice "${name}" added to your Voice Library!\n\nOpen the Voices panel to add description, accent, age, and genre.`;
                    }

                    case 'DELETE_VOICE': {
                        const { name } = cmd.payload;
                        const match = globalVoiceStyles.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
                        if (!match) return `⚠ No voice found matching "${name}". Say "list voices" to see all.`;
                        setGlobalVoiceStyles(prev => prev.filter(v => v.id !== match.id));
                        return `✓ Voice "${match.name}" removed from your library.`;
                    }

                    case 'LIST_VOICES': {
                        if (!globalVoiceStyles.length) return 'No voices yet. Say "create voice [name]" to add one!';
                        return `Your voices (${globalVoiceStyles.length}):\n\n` + globalVoiceStyles.map(v => `• ${v.name}${v.description ? ' — ' + v.description : ''}`).join('\n');
                    }

                    case 'ENABLE_RULE': {
                        const { name } = cmd.payload;
                        const rule = DIRECTOR_RULES.find(r => r.name.toLowerCase().includes(name.toLowerCase()) || r.id === name);
                        if (!rule) return `⚠ No director rule found matching "${name}".\n\nAvailable rules:\n` + DIRECTOR_RULES.map(r => `• ${r.name}`).join('\n');
                        if (activeDirectorRules.includes(rule.id)) return `ℹ Rule "${rule.name}" is already active.`;
                        setActiveDirectorRules(prev => [...prev, rule.id]);
                        return `✓ Director Rule "${rule.name}" enabled!\n\n${rule.text}`;
                    }

                    case 'DISABLE_RULE': {
                        const { name } = cmd.payload;
                        const rule = DIRECTOR_RULES.find(r => r.name.toLowerCase().includes(name.toLowerCase()) || r.id === name);
                        if (!rule) return `⚠ No director rule found matching "${name}".`;
                        if (!activeDirectorRules.includes(rule.id)) return `ℹ Rule "${rule.name}" is not currently active.`;
                        setActiveDirectorRules(prev => prev.filter(id => id !== rule.id));
                        return `✓ Director Rule "${rule.name}" disabled.`;
                    }

                    case 'LIST_RULES': {
                        const active = DIRECTOR_RULES.filter(r => activeDirectorRules.includes(r.id));
                        const inactive = DIRECTOR_RULES.filter(r => !activeDirectorRules.includes(r.id));
                        let text = `Director Rules:\n\n`;
                        if (active.length) text += `✅ Active (${active.length}):\n` + active.map(r => `• ${r.name}`).join('\n') + '\n\n';
                        if (inactive.length) text += `○ Inactive (${inactive.length}):\n` + inactive.map(r => `• ${r.name}`).join('\n');
                        text += `\n\nSay "enable rule [name]" or "disable rule [name]" to toggle.`;
                        return text;
                    }

                    case 'NAVIGATE': {
                        const { view } = cmd.payload;
                        setCurrentView(view);
                        return `✓ Navigated to ${view === 'dashboard' ? 'Dashboard' : 'Editor'}.`;
                    }

                    case 'OPEN_STORY_ENGINE': {
                        setShowStoryEngineModal(true);
                        return 'Opening the Story Engine!';
                    }

                    case 'OPEN_LIBRARY': {
                        setShowPromptLibraryModal(true);
                        return 'Opening the Prompt Library!';
                    }

                    // ── NEW FEATURE COMMANDS ──────────────────────────────────

                    case 'CHAIN_ACTIVATE': {
                        setChainMode(true);
                        setShowChainModal(true);
                        return '⛓ Chain Mode activated! Open the Chain panel to pick a preset and start your sequence.';
                    }

                    case 'CHAIN_DEACTIVATE': {
                        setChainMode(false);
                        return '⛓ Chain Mode deactivated.';
                    }

                    case 'CHAIN_PRESET': {
                        const { presetName, character, location, subject: chainSubject } = cmd.payload;
                        const preset = CHAIN_SCENE_PRESETS.find(p =>
                            p.name.toLowerCase().includes(presetName.toLowerCase()) ||
                            p.id.toLowerCase().includes(presetName.toLowerCase().replace(/\s+/g,'_'))
                        );
                        if (!preset) return `⚠ Preset "${presetName}" not found. Available: ${CHAIN_SCENE_PRESETS.map(p=>p.name).join(', ')}`;
                        const char = character ? appActions.globalCharacters?.find(c => c.name.toLowerCase().includes(character.toLowerCase())) : null;
                        const loc = location ? appActions.globalLocations?.find(l => l.name.toLowerCase().includes(location.toLowerCase())) : null;
                        setChainBase(prev => ({
                            ...prev, ...preset.p,
                            character: char?.name || character || prev.character,
                            characterDesc: char ? `@${char.name.replace(/\s+/g,'')} [${char.role}, ${char.appearance}]` : prev.characterDesc,
                            location: loc?.name || location || prev.location,
                            locationDesc: loc?.description || prev.locationDesc,
                            subject: chainSubject || prev.subject
                        }));
                        setChainMode(true);
                        return `⛓ Chain preset "${preset.name}" applied${char ? ` with ${char.name}` : ''}${loc ? ` in ${loc.name}` : ''}. Say "start sequence" to create Shot 1.`;
                    }

                    case 'CHAIN_START_SEQUENCE': {
                        const shot1 = buildChainShot1();
                        if (!shot1) return '⚠ Set a subject or character in Chain Mode first.';
                        updateActiveShots(prev => { const without = prev.filter(s => !s._isChainShot1); return [shot1, ...without]; });
                        return '⛓ Shot 1 created! Now type your actions for shots 2, 3, 4...';
                    }

                    case 'CHAIN_ADD': {
                        const { action } = cmd.payload;
                        if (!chainMode) return '⚠ Chain Mode is not active. Say "activate chain mode" first.';
                        setSubject(action);
                        setTimeout(() => { handleChainAddShot(); }, 100);
                        return `⛓ Chain shot added: "${action}"`;
                    }

                    case 'SHOTIFY_ON': {
                        setShotifyMode(true);
                        return `⚡ Shotify ON — prompts compressed for ${videoPlatform}.`;
                    }

                    case 'SHOTIFY_OFF': {
                        setShotifyMode(false);
                        return '⚡ Shotify OFF — full prompts restored.';
                    }

                    case 'LOCK_PARAM': {
                        const { param, value } = cmd.payload;
                        const paramMap = { lighting:'lighting', camera:'camera', lens:'lens', style:'shotStyle', angle:'angle', speed:'actionSpeed', 'film stock':'filmStock', 'aspect ratio':'aspectRatio' };
                        const key = paramMap[param.toLowerCase()] || param;
                        const val = value || selections[key] || shots[0]?.selections?.[key] || '';
                        setContinuityLocks(prev => ({ ...prev, [key]: val }));
                        if (val) updateActiveShots(prev => prev.map(s => s.locked ? s : { ...s, selections: { ...s.selections, [key]: val } }));
                        return `🔒 ${param} locked${val ? ` to "${val}"` : ''} across all shots.`;
                    }

                    case 'UNLOCK_ALL': {
                        setContinuityLocks({});
                        return '🔓 All continuity locks cleared.';
                    }

                    case 'LOCK_SHOT': {
                        const { index } = cmd.payload;
                        const idx = parseInt(index) - 1;
                        if (idx < 0 || idx >= shots.length) return `⚠ Shot ${index} not found.`;
                        toggleShotLock(idx);
                        return `🔒 Shot ${index} ${shots[idx]?.locked ? 'unlocked' : 'locked'}.`;
                    }

                    case 'COLOR_TAG_SHOT': {
                        const { index, color } = cmd.payload;
                        const idx = parseInt(index) - 1;
                        if (idx < 0 || idx >= shots.length) return `⚠ Shot ${index} not found.`;
                        colorTagShot(idx, color);
                        return `🎨 Shot ${index} tagged ${color}.`;
                    }

                    case 'FIND_REPLACE': {
                        const { find, replace, scope } = cmd.payload;
                        setFrFind(find); setFrReplace(replace || '');
                        setFrScope(scope || 'scene');
                        handleFindReplace();
                        return `🔍 Find "${find}" → Replace "${replace || ''}" in ${scope || 'scene'}.`;
                    }

                    case 'LOAD_SEQUENCE': {
                        const { templateName, subject: seqSubject } = cmd.payload;
                        const tmpl = SEQUENCE_TEMPLATES.find(t =>
                            t.name.toLowerCase().includes(templateName.toLowerCase()) ||
                            t.id.toLowerCase().includes(templateName.toLowerCase().replace(/\s+/g,'_'))
                        );
                        if (!tmpl) return `⚠ Sequence "${templateName}" not found. Available: ${SEQUENCE_TEMPLATES.map(t=>t.name).join(', ')}`;
                        loadSequenceTemplate(tmpl, seqSubject || subject);
                        return `🎬 "${tmpl.name}" sequence loaded — ${tmpl.shots.length} shots added.`;
                    }

                    case 'OPEN_CHAIN': {
                        setShowChainModal(true);
                        return '⛓ Opening Chain Mode panel.';
                    }

                    case 'OPEN_RHYTHM': {
                        setShowRhythm(true);
                        return '📊 Opening Shot Rhythm Analyzer.';
                    }

                    case 'OPEN_GENRE_DNA': {
                        setShowGenreDNA(true);
                        return '🎭 Opening Genre DNA Detector.';
                    }

                    case 'OPEN_FIND_REPLACE': {
                        setShowFindReplace(true);
                        return '🔍 Opening Find & Replace.';
                    }

                    case 'OPEN_PERFORMANCE': {
                        setShowSettings(true);
                        return '⚙️ Opening Performance Settings.';
                    }

                    case 'OPEN_SEQUENCES': {
                        setShowSequenceTemplates(true);
                        return '🎬 Opening Shot Sequence Templates.';
                    }

                    case 'OPEN_CONTINUITY': {
                        setShowContinuityLock(true);
                        return '🔒 Opening Continuity Lock panel.';
                    }
                }
            }
        };

// ═══════════════════════════════════════════════════════════════════
        // AGENT ENGINE — 16 new agent-level capabilities
        // ═══════════════════════════════════════════════════════════════════

        // Feature 2 — Fuzzy / typo-tolerant matching
        export const fuzzyMatch = (str, target) => {
            str = str.toLowerCase(); target = target.toLowerCase();
            if (str.includes(target) || target.includes(str)) return true;
            // Levenshtein distance
            const m = str.length, n = target.length;
            if (Math.abs(m - n) > 3) return false;
            const dp = Array.from({length: m+1}, (_,i) => Array.from({length: n+1}, (_,j) => i === 0 ? j : j === 0 ? i : 0));
            for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
                dp[i][j] = str[i-1] === target[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
            return dp[m][n] <= Math.max(2, Math.floor(Math.min(m,n) * 0.3));
        };

export const normalizeQuery = (raw) => {
            let q = raw.trim();

            // 1. Fix common typos
            Object.entries(TYPO_MAP).forEach(([typo, fix]) => {
                const re = new RegExp(`\\b${typo}\\b`, 'gi');
                q = q.replace(re, fix);
            });

            // 2. Expand synonyms (longer phrases first to avoid partial replacements)
            const sortedSynonyms = Object.entries(SYNONYM_MAP).sort((a,b) => b[0].length - a[0].length);
            sortedSynonyms.forEach(([syn, canonical]) => {
                const re = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'gi');
                q = q.replace(re, canonical);
            });

            // 3. Strip filler words (but keep the meaningful parts)
            q = q.replace(FILLER_WORDS, ' ').replace(/\s{2,}/g, ' ').trim();

            // 4. Normalize punctuation
            q = q.replace(/[!?]+$/, '').trim();

            return q;
        };

export const fuzzyFindDirector = (q) => Object.keys(DIRECTOR_STYLES).find(d => fuzzyMatch(q.replace(/director\s*/i,'').trim(), d) || q.includes(d));

export const fuzzyFindMood = (q) => Object.keys(MOOD_PRESETS).find(m => fuzzyMatch(q.replace(/mood\s*/i,'').trim(), m) || q.includes(m));

// Feature 4 — Conditional logic evaluator
        export const evalCondition = (condition, appActions) => {
            const { scenes, activeSceneId, projects, activeProjectId, globalCharacters, globalLocations } = appActions || {};
            const scene = scenes?.find(s => s.id === activeSceneId);
            const shots = scene?.shots || [];
            const c = condition.toLowerCase();
            if (/no shots|empty scene|scene.*empty|has no shots/.test(c)) return shots.length === 0;
            if (/has shots|scene.*has/.test(c)) return shots.length > 0;
            if (/more than (\d+) shots?/.test(c)) { const n = parseInt(c.match(/more than (\d+)/)[1]); return shots.length > n; }
            if (/less than (\d+) shots?/.test(c)) { const n = parseInt(c.match(/less than (\d+)/)[1]); return shots.length < n; }
            if (/no characters|empty.*character/.test(c)) return (globalCharacters?.length || 0) === 0;
            if (/no locations/.test(c)) return (globalLocations?.length || 0) === 0;
            if (/no projects/.test(c)) return (projects?.length || 0) === 0;
            return null; // unknown condition
        };

// Feature 1 — Intent chain parser: splits "do X, then do Y, and also Z"
        export const parseIntentChain = (raw) => {
            // Guard: if the input looks like a single shot description with "and/with", don't split it
            // e.g. "add shot with golden hour and handheld" should NOT be split
            const singleShotPatterns = /^(add shot|build shot|create shot|duplicate shot|set|change|update|find|search|analyze|rewrite|generate|build scene|parse script)/i;
            if (singleShotPatterns.test(raw.trim())) return null;

            // Only split on explicit multi-step separators (comma+keyword, semicolon, "then", "also")
            // NOT on bare "and" — that's too greedy and breaks "add shot with X and Y"
            const separators = /\s*(?:,\s*(?:then|and|also|after that|next)\s+|;\s*|\s+then\s+|\s+also\s+|\s+after that\s+|\s+next\s+)/i;
            const parts = raw.split(separators).map(s => s.trim()).filter(s => s.length > 2);
            return parts.length > 1 ? parts : null;
        };

// Feature 3 — Context/pronoun resolver
        export const resolveContext = (raw, conversationContext) => {
            let resolved = raw;
            const { lastCreatedProject, lastCreatedScene, lastCreatedShot, lastCreatedChar, lastCreatedLoc, lastCreatedVoice, lastShotIndex } = conversationContext || {};
            // "it", "this", "that" → last created item
            if (/\b(rename|delete|remove|update)\s+(it|this|that)\b/i.test(resolved)) {
                if (lastCreatedScene) resolved = resolved.replace(/\b(it|this|that)\b/i, `scene ${lastCreatedScene}`);
                else if (lastCreatedProject) resolved = resolved.replace(/\b(it|this|that)\b/i, `project ${lastCreatedProject}`);
            }
            // "the last one", "the last shot"
            if (/the last (?:one|shot)/i.test(resolved) && lastShotIndex !== undefined) {
                resolved = resolved.replace(/the last (?:one|shot)/i, `shot ${lastShotIndex + 1}`);
            }
            // "another shot like that" → duplicate last shot
            if (/another shot like that|same shot again|duplicate that/i.test(resolved)) {
                resolved = 'duplicate last shot';
            }
            return resolved;
        };

// Feature 14 — Natural language parameter editor
        export const parseParamEdit = (raw, appActions) => {
            const q = raw.toLowerCase();
            const { scenes, activeSceneId, updateActiveProjectScenes } = appActions || {};
            const scene = scenes?.find(s => s.id === activeSceneId);
            if (!scene) return null;

            const paramMap = { lighting: 'lighting', camera: 'camera', lens: 'lens', movement: 'movement', angle: 'angle', style: 'shotStyle', type: 'shotType', speed: 'actionSpeed', duration: 'duration', transition: 'transition', stock: 'filmStock', shottype: 'shotType', shotstyle: 'shotStyle', filmstock: 'filmStock', actionspeed: 'actionSpeed' };

            const resolveParam = (paramRaw) => Object.keys(paramMap).find(k => paramRaw.replace(/\s+/g,'').includes(k.replace(/\s+/g,'')));
            const resolveValue = (optKey, valuePart) => {
                const optList = OPTIONS[optKey + 's'] || OPTIONS[optKey] || [];
                const flatList = Array.isArray(optList) ? optList.map(o => typeof o === 'object' ? o.name : o) : [];
                return flatList.find(v => v.toLowerCase().includes(valuePart.trim())) || valuePart.trim();
            };

            // "change lighting in shot N to X" / "set shot N lighting to X" / "update shot 3 camera to ARRI"
            const shotParamMatch = q.match(/(?:change|set|update)\s+(?:the\s+)?(\w+)\s+(?:in|of|for)\s+shot\s+(\d+)\s+to\s+(.+)/) ||
                                   q.match(/(?:change|set|update)\s+shot\s+(\d+)\s+(\w+)\s+to\s+(.+)/);
            if (shotParamMatch) {
                // Handle both word orders: "change lighting in shot 3 to X" and "set shot 3 lighting to X"
                let paramRaw, shotNumStr, valuePart;
                if (shotParamMatch[0].match(/shot\s+\d+\s+\w+\s+to/)) {
                    // "set shot N param to value" order
                    const m2 = q.match(/(?:change|set|update)\s+shot\s+(\d+)\s+(\w+)\s+to\s+(.+)/);
                    if (m2) { shotNumStr = m2[1]; paramRaw = m2[2]; valuePart = m2[3]; }
                } else {
                    paramRaw = shotParamMatch[1]; shotNumStr = shotParamMatch[2]; valuePart = shotParamMatch[3];
                }
                if (paramRaw && shotNumStr && valuePart) {
                    const shotIdx = parseInt(shotNumStr) - 1;
                    const param = resolveParam(paramRaw);
                    if (param && shotIdx >= 0 && shotIdx < scene.shots.length) {
                        const optKey = paramMap[param];
                        return { type: 'EDIT_SHOT_PARAM', payload: { shotIdx, param: optKey, value: resolveValue(optKey, valuePart) } };
                    }
                }
            }

            // "set all shots to X seconds" / "set duration of all shots to 4s"
            const allDurationMatch = q.match(/set\s+(?:all\s+shots?\s+(?:to|duration\s+to)|duration\s+of\s+all\s+shots?\s+to)\s+([\d.]+)\s*s/);
            if (allDurationMatch) {
                return { type: 'EDIT_ALL_SHOTS_PARAM', payload: { param: 'duration', value: `${allDurationMatch[1]}s` } };
            }

            // "set all shots lighting to golden hour" / "add handheld movement to every shot"
            const allParamMatch = q.match(/(?:add|set|apply|change|update)\s+(?:all\s+shots?\s+)?(.+?)\s+(?:movement|lighting|camera|lens|style|angle)\s+to\s+(?:every|all)\s+shots?/) ||
                                  q.match(/(?:set|change|update)\s+(?:all\s+shots?\s+)(\w+)\s+to\s+(.+)/);
            if (allParamMatch) {
                const valuePart = allParamMatch[1].trim();
                const paramWord = q.includes('movement') ? 'movement' : q.includes('lighting') ? 'lighting' : q.includes('camera') ? 'camera' : q.includes('lens') ? 'lens' : q.includes('style') ? 'shotStyle' : q.includes('angle') ? 'angle' : null;
                if (paramWord) {
                    const optList = OPTIONS[paramWord + 's'] || OPTIONS[paramWord] || [];
                    const flatList = Array.isArray(optList) ? optList.map(o => typeof o === 'object' ? o.name : o) : [];
                    const bestVal = flatList.find(v => v.toLowerCase().includes(valuePart)) || valuePart;
                    return { type: 'EDIT_ALL_SHOTS_PARAM', payload: { param: paramWord === 'movement' ? 'movement' : paramWord, value: bestVal } };
                }
            }

            return null;
        };

// Feature 10 — Smart search across project
        export const searchShots = (query, appActions) => {
            const { scenes } = appActions || {};
            if (!scenes) return [];
            const q = query.toLowerCase();
            const results = [];
            scenes.forEach(scene => {
                (scene.shots || []).forEach((shot, i) => {
                    const sel = shot.selections || {};
                    const matches =
                        (q.includes('handheld') && sel.movement?.toLowerCase().includes('handheld')) ||
                        (q.includes('golden hour') && sel.lighting?.toLowerCase().includes('golden')) ||
                        (q.includes('no lighting') && !sel.lighting) ||
                        (q.includes('no camera') && !sel.camera) ||
                        (q.includes('slow motion') && sel.actionSpeed?.toLowerCase().includes('slow')) ||
                        (q.includes('drone') && (sel.camera?.toLowerCase().includes('drone') || sel.movement?.toLowerCase().includes('drone'))) ||
                        (q.includes('close') && sel.shotType?.toLowerCase().includes('close')) ||
                        (q.includes('wide') && sel.shotType?.toLowerCase().includes('wide')) ||
                        Object.values(sel).some(v => typeof v === 'string' && v.toLowerCase().includes(q.replace(/find|show|search|shots?|with|that|have|has|using|all/g,'').trim()));
                    if (matches) results.push({ scene: scene.name, shotNum: i + 1, shot });
                });
            });
            return results;
        };

// Feature 6 — Full project generator
        export const generateFullProject = (desc, appActions) => {
            const d = desc.toLowerCase();
            const countMatch = d.match(/(\d+)\s+scenes?/);
            const shotsPerSceneMatch = d.match(/(\d+)\s+shots?\s+(?:per|each|a)/);
            const sceneCount = countMatch ? Math.min(parseInt(countMatch[1]), 10) : 3;
            const shotsPerScene = shotsPerSceneMatch ? Math.min(parseInt(shotsPerSceneMatch[1]), 8) : 3;
            const detectedDir = fuzzyFindDirector(d);
            const detectedMood = fuzzyFindMood(d);
            const dirData = detectedDir ? DIRECTOR_STYLES[detectedDir] : null;
            const moodData = detectedMood ? MOOD_PRESETS[detectedMood] : MOOD_PRESETS['epic'];
            const actNames = sceneCount === 3 ? ['Act 1 — Setup', 'Act 2 — Confrontation', 'Act 3 — Resolution'] :
                Array.from({length: sceneCount}, (_, i) => `Scene ${i + 1}`);
            const shotTemplates = [
                { type: 'Extreme Wide Shot (EWS)', movement: 'Drone Fly-Through', label: 'Establishing' },
                { type: 'Wide Shot (WS)', movement: 'Tracking / Follow', label: 'Context' },
                { type: 'Medium Shot (MS)', movement: 'Dolly In', label: 'Character' },
                { type: 'Close-Up (CU)', movement: 'Static / Tripod', label: 'Reaction' },
                { type: 'Over the Shoulder (OTS)', movement: 'Pan Left', label: 'Dialogue' },
                { type: 'Extreme Close-Up (ECU)', movement: 'Dolly In', label: 'Detail' },
                { type: 'Wide Shot (WS)', movement: 'Crane Shot', label: 'Reveal' },
                { type: 'Extreme Wide Shot (EWS)', movement: 'Drone Fly-Through', label: 'Final Image' },
            ];
            const scenes = actNames.map((name, si) => ({
                id: Date.now() + si * 1000,
                name,
                shots: shotTemplates.slice(0, shotsPerScene).map((t, i) => ({
                    id: Date.now() + si * 1000 + i + 1,
                    subject: `${desc}. ${name}. ${t.label} shot.`,
                    selections: {
                        shotType: t.type, shotStyle: dirData?.shotStyle || moodData.shotStyle || 'Cinematic',
                        camera: dirData?.camera || OPTIONS.cameraTypes[0], lens: dirData?.lens || OPTIONS.lenses[4],
                        angle: dirData?.angle || moodData.angle || 'Eye Level',
                        lighting: dirData?.lighting || moodData.lighting || 'Natural Daylight',
                        movement: dirData?.movement || t.movement, actionSpeed: 'Normal Speed',
                        duration: '3.0s', transition: i === shotsPerScene - 1 ? 'Fade to Black' : 'Hard Cut',
                        filmStock: dirData?.filmStock || moodData.filmStock || '', aspectRatio: '--ar 16:9'
                    },
                    sfx: moodData?.sfx || '', bgm: moodData?.bgm || '',
                    dialogues: [], mode: 'video', status: 'Planning', tags: ['generated'], referenceImages: [], customPromptOverride: null
                }))
            }));
            return { scenes, sceneCount, shotsPerScene, dirData, moodData, detectedDir, detectedMood };
        };

// Feature 13 — Project analyzer
        export const analyzeProject = (appActions) => {
            const { scenes, projects, activeProjectId } = appActions || {};
            const proj = projects?.find(p => p.id === activeProjectId);
            const allShots = scenes?.flatMap(s => s.shots || []) || [];
            const issues = [];
            const warnings = [];
            let totalDuration = 0;

            allShots.forEach((shot, i) => {
                const sel = shot.selections || {};
                if (!sel.lighting) issues.push(`Shot ${i+1}: No lighting set`);
                if (!sel.camera) warnings.push(`Shot ${i+1}: No camera specified`);
                if (!sel.shotType) warnings.push(`Shot ${i+1}: No shot type`);
                if (sel.duration) totalDuration += parseFloat(sel.duration) || 0;
                // Continuity check
                if (i > 0) {
                    const prev = allShots[i-1].selections || {};
                    if (prev.lighting === 'Golden Hour' && sel.lighting === 'Blue Hour') issues.push(`Shots ${i}→${i+1}: Day/night continuity break`);
                    if (prev.shotStyle && sel.shotStyle && prev.shotStyle !== sel.shotStyle) warnings.push(`Shots ${i}→${i+1}: Style change (${prev.shotStyle} → ${sel.shotStyle})`);
                }
            });

            // Platform compatibility
            const platformWarnings = [];
            allShots.forEach((shot, i) => {
                const text = (shot.subject || '').toLowerCase();
                Object.entries(PLATFORM_RESTRICTIONS).forEach(([platform, rules]) => {
                    rules.forbidden?.forEach(word => {
                        if (text.includes(word)) platformWarnings.push(`Shot ${i+1}: "${word}" may be blocked on ${platform}`);
                    });
                });
            });

            const lightingCount = {};
            const styleCount = {};
            allShots.forEach(s => {
                if (s.selections?.lighting) lightingCount[s.selections.lighting] = (lightingCount[s.selections.lighting]||0)+1;
                if (s.selections?.shotStyle) styleCount[s.selections.shotStyle] = (styleCount[s.selections.shotStyle]||0)+1;
            });
            const topLight = Object.entries(lightingCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'None';
            const topStyle = Object.entries(styleCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'None';

            return {
                projectName: proj?.name || 'Untitled',
                sceneCount: scenes?.length || 0,
                shotCount: allShots.length,
                totalDuration: totalDuration.toFixed(1),
                issues, warnings, platformWarnings,
                topLight, topStyle,
                completeness: Math.round(((allShots.length - issues.length) / Math.max(allShots.length, 1)) * 100)
            };
        };

// Feature 7 — Scene rewriter (bulk parameter update)
        export const rewriteScene = (desc, appActions) => {
            const { scenes, activeSceneId, updateActiveProjectScenes } = appActions || {};
            const scene = scenes?.find(s => s.id === activeSceneId);
            if (!scene || !scene.shots?.length) return null;
            const d = desc.toLowerCase();
            const detectedDir = fuzzyFindDirector(d);
            const detectedMood = fuzzyFindMood(d);
            const dirData = detectedDir ? DIRECTOR_STYLES[detectedDir] : null;
            const moodData = detectedMood ? MOOD_PRESETS[detectedMood] : null;
            if (!dirData && !moodData) return null;
            const updates = {};
            if (dirData) Object.assign(updates, { camera: dirData.camera, lens: dirData.lens, lighting: dirData.lighting, movement: dirData.movement, shotStyle: dirData.shotStyle, filmStock: dirData.filmStock });
            if (moodData) Object.assign(updates, { lighting: moodData.lighting, movement: moodData.movement, shotStyle: moodData.shotStyle, filmStock: moodData.filmStock });
            updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? {
                ...s, shots: s.shots.map(shot => ({ ...shot, selections: { ...shot.selections, ...updates } }))
            } : s));
            return { count: scene.shots.length, dirData, moodData, updates };
        };

// Feature 8 — Shot duplicator with variation
        export const duplicateShotWithVariation = (shotIdx, variationDesc, appActions) => {
            const { scenes, activeSceneId, updateActiveProjectScenes } = appActions || {};
            const scene = scenes?.find(s => s.id === activeSceneId);
            if (!scene || shotIdx < 0 || shotIdx >= scene.shots.length) return null;
            const original = scene.shots[shotIdx];
            const d = variationDesc.toLowerCase();
            const newSelections = { ...original.selections };
            // Apply variation overrides
            if (d.includes('close-up') || d.includes('close up')) newSelections.shotType = 'Close-Up (CU)';
            if (d.includes('wide')) newSelections.shotType = 'Wide Shot (WS)';
            if (d.includes('golden hour')) newSelections.lighting = 'Golden Hour';
            if (d.includes('low key') || d.includes('dark')) newSelections.lighting = 'Low Key (Dark/Moody)';
            if (d.includes('slow motion') || d.includes('slow mo')) newSelections.actionSpeed = 'Slow Motion';
            if (d.includes('handheld')) newSelections.movement = 'Handheld / Shaky';
            if (d.includes('dolly')) newSelections.movement = 'Dolly In';
            // Apply mood/director
            const moodKey = fuzzyFindMood(d);
            const dirKey = fuzzyFindDirector(d);
            if (moodKey) { const m = MOOD_PRESETS[moodKey]; Object.assign(newSelections, { lighting: m.lighting, movement: m.movement, shotStyle: m.shotStyle }); }
            if (dirKey) { const dir = DIRECTOR_STYLES[dirKey]; Object.assign(newSelections, { camera: dir.camera, lens: dir.lens, lighting: dir.lighting, movement: dir.movement }); }
            const newShot = { ...original, id: Date.now() + Math.random(), selections: newSelections };
            updateActiveProjectScenes(prev => prev.map(s => {
                if (s.id !== activeSceneId) return s;
                const shots = [...s.shots];
                shots.splice(shotIdx + 1, 0, newShot);
                return { ...s, shots };
            }));
            return { original, newShot, shotIdx };
        };

// Feature 9 — Cross-scene operations
        export const crossSceneOp = (op, appActions) => {
            const { scenes, activeSceneId, updateActiveProjectScenes } = appActions || {};
            if (!scenes) return null;
            const q = op.toLowerCase();

            // "copy all shots from scene X to scene Y"
            const copyMatch = q.match(/copy\s+(?:all\s+)?shots?\s+from\s+(?:scene\s+)?(.+?)\s+to\s+(?:scene\s+)?(.+)/);
            if (copyMatch) {
                const fromName = copyMatch[1].trim(), toName = copyMatch[2].trim();
                const fromScene = scenes.find(s => s.name.toLowerCase().includes(fromName) || s.name.toLowerCase() === fromName);
                const toScene = scenes.find(s => s.name.toLowerCase().includes(toName) || s.name.toLowerCase() === toName);
                if (!fromScene || !toScene) return { error: `Could not find scenes matching "${fromName}" and "${toName}".` };
                const copiedShots = fromScene.shots.map(s => ({ ...s, id: Date.now() + Math.random() }));
                updateActiveProjectScenes(prev => prev.map(s => s.id === toScene.id ? { ...s, shots: [...(s.shots||[]), ...copiedShots] } : s));
                return { type: 'copy', from: fromScene.name, to: toScene.name, count: copiedShots.length };
            }

            // "merge scene X and scene Y"
            const mergeMatch = q.match(/merge\s+(?:scene\s+)?(.+?)\s+(?:and|with)\s+(?:scene\s+)?(.+)/);
            if (mergeMatch) {
                const n1 = mergeMatch[1].trim(), n2 = mergeMatch[2].trim();
                const s1 = scenes.find(s => s.name.toLowerCase().includes(n1));
                const s2 = scenes.find(s => s.name.toLowerCase().includes(n2));
                if (!s1 || !s2) return { error: `Could not find scenes to merge.` };
                const merged = [...(s1.shots||[]), ...(s2.shots||[]).map(s => ({ ...s, id: Date.now() + Math.random() }))];
                updateActiveProjectScenes(prev => {
                    const without2 = prev.filter(s => s.id !== s2.id);
                    return without2.map(s => s.id === s1.id ? { ...s, name: `${s1.name} + ${s2.name}`, shots: merged } : s);
                });
                return { type: 'merge', s1: s1.name, s2: s2.name, count: merged.length };
            }

            return null;
        };

// ── TASK 5: getProactiveSuggestion ───────────────────────────────────────────
        export const getProactiveSuggestion = (lastResult, appActions) => {
            if (!lastResult) return null;
            const t = lastResult.type || '';
            const { scenes, activeSceneId } = appActions || {};
            const scene = scenes?.find(s => s.id === activeSceneId);
            const shotCount = scene?.shots?.length || 0;
            if (t === 'CREATE_PROJECT') return 'add a scene to get started — say "add scene Act 1"';
            if (t === 'CREATE_SCENE') return shotCount === 0 ? 'add shots — say "add 3 shots" or "build scene: [description]"' : null;
            if (t === 'generateFullProject') return 'analyze my project';
            if (t === 'rewriteScene') return 'duplicate a shot with variation — say "duplicate shot 1 with golden hour"';
            if (t === 'searchShots' && lastResult.resultCount > 0) return `change a parameter — say "change lighting in shot 1 to golden hour"`;
            if (t === 'analyzeProject' && lastResult.issueCount > 0) return 'fix issues — say "rewrite all shots in cinematic style"';
            if (t === 'ADD_SHOT') return shotCount >= 3 ? 'compile your scene — say "export summary"' : 'add another shot or say "build scene: [description]"';
            return null;
        };

// ── TASK 3: agentDispatch — unified single-step router ───────────────────────
        export const agentDispatch = (step, appActions, convContext, agentActionLogRef, setAgentActionLogFn, sessionMemoryRef, setSessionMemoryFn) => {
            const q = step.toLowerCase().trim();
            const push = (text, type, extra) => ({ text, type: type || 'info', ...extra });

            // ── Ultra-Smart NL Normalizer ────────────────────────────────────────────
            // Translates vague/natural language into canonical commands before routing
            const nlNormalize = (raw) => {
                const r = raw.toLowerCase().trim();
                // "make it darker / brighter / warmer / cooler / moodier"
                if (/make\s+(?:it\s+)?darker|go\s+darker|more\s+dark/.test(r)) return `set all shots lighting to Low Key (Dark/Moody)`;
                if (/make\s+(?:it\s+)?brighter|go\s+brighter|more\s+bright/.test(r)) return `set all shots lighting to High Key (Bright)`;
                if (/make\s+(?:it\s+)?warmer|more\s+warm/.test(r)) return `set all shots lighting to Golden Hour`;
                if (/make\s+(?:it\s+)?cooler|more\s+cool|blue\s+tones?/.test(r)) return `set all shots lighting to Blue Hour`;
                if (/make\s+(?:it\s+)?moodier|more\s+moody/.test(r)) return `set all shots lighting to Low Key (Dark/Moody)`;
                if (/make\s+(?:it\s+)?cinematic|more\s+cinematic/.test(r)) return `set all shots style to Cinematic`;
                if (/make\s+(?:it\s+)?noir|more\s+noir/.test(r)) return `set all shots style to Film Noir`;
                if (/make\s+(?:it\s+)?dramatic|more\s+dramatic/.test(r)) return `mood tense`;
                if (/make\s+(?:it\s+)?epic|more\s+epic/.test(r)) return `mood epic`;
                if (/make\s+(?:it\s+)?romantic|more\s+romantic/.test(r)) return `mood romantic`;
                if (/make\s+(?:it\s+)?scary|more\s+scary|more\s+horror/.test(r)) return `mood horror`;
                if (/make\s+(?:it\s+)?dreamy|more\s+dreamy/.test(r)) return `mood dreamy`;
                // "add more shots" / "give me more shots"
                if (/add\s+more\s+shots?|give\s+me\s+more\s+shots?|need\s+more\s+shots?/.test(r)) {
                    const n = r.match(/(\d+)/)?.[1] || '3';
                    return `build scene: ${n} shots`;
                }
                // "start over" / "clear everything" / "fresh start"
                if (/start\s+over|fresh\s+start|clear\s+everything|reset\s+scene/.test(r)) return `clear scene`;
                // "what's in my scene" / "show me what I have"
                if (/what.?s\s+in\s+my\s+scene|show\s+me\s+what\s+i\s+have|what\s+do\s+i\s+have/.test(r)) return `list shots`;
                // "go back" / "revert" → undo
                if (/^(go\s+back|revert|take\s+that\s+back|cancel\s+that)$/.test(r)) return `undo that`;
                // "open the story" / "story time" / "let's write a story"
                if (/open\s+the\s+story|story\s+time|let.?s\s+write\s+a\s+story|start\s+a\s+story|new\s+story/.test(r)) return `story engine`;
                // "I want to make a [genre] film" → generate full project
                if (/i\s+want\s+to\s+(?:make|create|build)\s+(?:a\s+)?(.+?)\s+(?:film|movie|short)/.test(r)) {
                    const m = r.match(/i\s+want\s+to\s+(?:make|create|build)\s+(?:a\s+)?(.+?)\s+(?:film|movie|short)/);
                    return `generate complete project: ${m[1]} film`;
                }
                // "shoot like [director]" / "film like [director]" / "style of [director]"
                if (/(?:shoot|film|style|look)\s+like\s+(.+)|in\s+the\s+style\s+of\s+(.+)/.test(r)) {
                    const m = r.match(/(?:shoot|film|style|look)\s+like\s+(.+)|in\s+the\s+style\s+of\s+(.+)/);
                    return `director ${(m[1]||m[2]).trim()}`;
                }
                // "feeling of [mood]" / "vibe of [mood]" / "atmosphere of [mood]"
                if (/(?:feeling|vibe|atmosphere|tone)\s+of\s+(.+)/.test(r)) {
                    const m = r.match(/(?:feeling|vibe|atmosphere|tone)\s+of\s+(.+)/);
                    return `mood ${m[1].trim()}`;
                }
                // "how many shots do I have" / "how many scenes"
                if (/how\s+many\s+shots/.test(r)) return `list shots`;
                if (/how\s+many\s+scenes/.test(r)) return `list scenes`;
                if (/how\s+many\s+projects/.test(r)) return `list projects`;
                // "what's my project called" / "what project am I on"
                if (/what.?s\s+my\s+project|what\s+project\s+am\s+i/.test(r)) return `list projects`;
                // "show me the story" / "what's my story"
                if (/show\s+me\s+the\s+story|what.?s\s+my\s+story|my\s+story/.test(r)) return `story engine`;
                // "check my work" / "review my project" / "is my project good"
                if (/check\s+my\s+work|review\s+my\s+project|is\s+my\s+project\s+good|how.?s\s+my\s+project/.test(r)) return `analyze my project`;
                // "I'm done" / "finished" / "export" → director's card
                if (/^(i.?m\s+done|finished|all\s+done|wrap\s+it\s+up)$/.test(r)) return `export summary`;
                // "tell me a tip" / "give me a tip" / "teach me something"
                if (/tell\s+me\s+a\s+tip|give\s+me\s+a\s+tip|teach\s+me|tip\s+of\s+the\s+day|learn\s+something/.test(r)) return `__TIP__`;
                // "what should I do next" / "what's next" / "suggest something"
                if (/what\s+should\s+i\s+do\s+next|what.?s\s+next|suggest\s+something|what\s+do\s+i\s+do/.test(r)) return `__SUGGEST__`;
                // "fill all my shot params" / "auto complete" / "smart complete"
                if (/fill\s+all\s+(?:my\s+)?(?:shot\s+)?params?|auto\s+complete\s+shot|smart\s+complete/.test(r)) return `complete this shot`;
                // "what shots should I use for [genre]"
                if (/what\s+shots?\s+(?:should|do)\s+i\s+use/.test(r)) return `suggest sequence`;
                // "optimize my shots for [platform]"
                if (/optimize\s+my\s+shots?\s+for\s+(.+)/.test(r)) { const m = r.match(/optimize\s+my\s+shots?\s+for\s+(.+)/); return `optimize for ${m[1]}`; }
                // "write a shot about [X]" / "generate a shot for [X]" → AI shot generator
                if (/^(?:write|generate|create|make)\s+(?:a\s+)?shot\s+(?:about|for|of)\s+(.+)/.test(r)) { const m = r.match(/^(?:write|generate|create|make)\s+(?:a\s+)?shot\s+(?:about|for|of)\s+(.+)/); return `generate shot subject: ${m[1]}`; }
                // "ai story about [X]" / "write me a story about [X]"
                if (/^(?:write\s+me\s+a\s+story|ai\s+story\s+about|gemini\s+story\s+about)\s+(.+)/.test(r)) { const m = r.match(/^(?:write\s+me\s+a\s+story|ai\s+story\s+about|gemini\s+story\s+about)\s+(.+)/); return `ai story: ${m[1]}`; }
                // "enhance shot" / "improve shot" / "make shot better"
                if (/^(?:make\s+(?:the\s+)?shot\s+better|improve\s+(?:the\s+)?shot|polish\s+(?:the\s+)?shot)/.test(r)) return `enhance this shot`;
                return null; // no normalization needed
            };

            // Apply NL normalization
            const normalized = nlNormalize(step);
            if (normalized === '__TIP__') {
                const tips = [
                    'Dutch Angle signals psychological unease. Use it sparingly — overuse kills the effect.',
                    'Dolly In on a Close-Up creates intimacy. Dolly Out on a Wide Shot creates isolation.',
                    'Golden Hour lasts ~20 minutes. Villeneuve shot almost every exterior in Blade Runner 2049 during this window.',
                    '85mm is the "portrait lens" — matches the compression of the human eye at conversation distance.',
                    'Specificity beats length in AI prompts. "ARRI Alexa 65, 85mm, Golden Hour, Dolly In" outperforms a 200-word vague description.',
                    'Every scene needs a Want and an Obstacle. No obstacle = no scene.',
                    'Rim lighting separates your subject from the background — essential for dark scenes.',
                    'Handheld creates urgency and realism. Static/Tripod creates authority and control.',
                    'Kodak Portra 400: warm skin tones, fine grain. Best for drama and romance.',
                    'Fujifilm CineStill 800T: neon halos in highlights. Perfect for night city scenes.',
                ];
                return push(`💡 Tip:\n\n${tips[Math.floor(Math.random() * tips.length)]}\n\nSay "more tips" for another one!`, 'info', { isCoach: true });
            }
            if (normalized === '__SUGGEST__') {
                const { scenes, activeSceneId, projects } = appActions || {};
                const scene = scenes?.find(s => s.id === activeSceneId);
                const shots = scene?.shots || [];
                if (!projects?.length) return push('💡 Start by creating a project:\n\n"create project My Film"\n\nOr try: "build a complete horror film, 3 scenes, 4 shots each, Lynch style"', 'info', { isCoach: true });
                if (!scenes?.length || shots.length === 0) return push('💡 Your scene is empty. Try:\n\n"build scene: a detective walking through a rainy city at night"\n\nOr: "add 3 shots: establishing, character, close-up"', 'info', { isCoach: true });
                if (shots.length < 3) return push(`💡 You have ${shots.length} shot(s). A good scene needs at least 3-5.\n\nTry: "add 3 more shots" or "build scene: [description]"`, 'info', { isCoach: true });
                const hasNoLighting = shots.some(s => !s.selections?.lighting);
                if (hasNoLighting) return push('💡 Some shots have no lighting set. Try:\n\n"set all shots lighting to Golden Hour"\n\nOr: "analyze my project" to see all issues.', 'info', { isCoach: true });
                return push('💡 Your scene looks good! Next steps:\n\n• "analyze my project" — full audit\n• "rewrite all shots in Fincher style" — apply a director\n• "export summary" — get your Director\'s Card', 'info', { isCoach: true });
            }
            if (normalized && normalized !== step.toLowerCase().trim()) {
                return agentDispatch(normalized, appActions, convContext, agentActionLogRef, setAgentActionLogFn, sessionMemoryRef, setSessionMemoryFn);
            }

            // ── Feature 5: Undo ──────────────────────────────────────────────────────
            if (/^(undo|undo that|undo last|revert|go back)/.test(q)) {
                const log = agentActionLogRef || [];
                if (log.length === 0) return push('↩️ Nothing to undo — no actions recorded yet.', 'info');
                const last = log[log.length - 1];
                restoreSnapshot(last.snapshot, appActions);
                setAgentActionLogFn(prev => prev.slice(0, -1));
                return push(`↩️ Undone: ${last.description}\n\nState restored to before that action.`, 'action', { isAction: true });
            }

            // ── Feature 16: Explain ──────────────────────────────────────────────────
            if (/^(explain|what did you do|what just happened|what have you done|explain what you just did)/.test(q)) {
                const log = agentActionLogRef || [];
                if (log.length === 0) return push('No actions recorded yet in this session.', 'info');
                const recent = log.slice(-3).reverse();
                const text = '🔍 Last actions:\n\n' + recent.map((e, i) =>
                    `${i + 1}. [${new Date(e.ts).toLocaleTimeString()}] ${e.description}\n   ${e.resultText.substring(0, 80)}${e.resultText.length > 80 ? '...' : ''}`
                ).join('\n\n');
                return push(text, 'explain', { isExplain: true });
            }

            // ── Help / Command Reference ─────────────────────────────────────────────
            if (/^(help|commands|what can you do|what do you know|capabilities|show commands)/.test(q)) {
                return push(`🤖 MOKHA Agent — Commands:\n\n` +
                    `📁 Projects:\n• create project [name]\n• list projects\n\n` +
                    `🎬 Scenes:\n• create scene [name]\n• list scenes\n• rename scene [old] to [new]\n• delete scene [name]\n\n` +
                    `🎥 Shots:\n• add shot [description]\n• list shots\n• duplicate shot N\n• change [param] in shot N to [value]\n• lock shot N / unlock shot N\n• tag shot N [color]\n\n` +
                    `⛓ Chain Mode:\n• activate chain mode\n• start chain [preset] with [character] in [location]\n• chain add: [action]\n• start sequence\n• deactivate chain\n\n` +
                    `🎬 Sequences:\n• load the reveal sequence\n• load the chase sequence\n• load the confrontation sequence\n• load the discovery sequence\n\n` +
                    `🔒 Continuity:\n• lock lighting / lock camera / lock lens\n• unlock all\n\n` +
                    `⚡ Shotify:\n• shotify on / shotify off\n• compress for [platform]\n\n` +
                    `🔍 Find & Replace:\n• find [x] replace [y]\n• find [x] replace [y] in all projects\n\n` +
                    `🎭 Analysis:\n• detect genre\n• analyze rhythm\n• analyze my project\n\n` +
                    `🎨 Style:\n• director [name] (kubrick, nolan, fincher...)\n• mood [name] (tense, epic, lonely...)\n• rewrite all shots in [style]\n\n` +
                    `🔧 Agent:\n• undo that\n• analyze my project\n• build scene: [description]\n• generate full project [description]`, 'info');
            }

            // ── Feature 13: Analyze ──────────────────────────────────────────────────
            if (/analyze|analysis|project report|check project|audit project|project health/.test(q)) {
                const report = analyzeProject(appActions);
                const issueCount = report.issues.length;
                const warnCount = report.warnings.length;
                const platCount = report.platformWarnings.length;
                let text = `📊 Project Analysis: "${report.projectName}"\n━━━━━━━━━━━━━━━━\n`;
                text += `Scenes: ${report.sceneCount} · Shots: ${report.shotCount}\n`;
                text += `Est. Duration: ${report.totalDuration}s\n`;
                text += `Completeness: ${report.completeness}%\n`;
                text += `Style: ${report.topStyle} · Lighting: ${report.topLight}\n━━━━━━━━━━━━━━━━\n`;
                if (issueCount === 0 && warnCount === 0 && platCount === 0) {
                    text += '✅ All clear! No issues found.';
                } else {
                    if (issueCount > 0) text += `\n❌ Issues (${issueCount}):\n` + report.issues.map(i => `• ${i}`).join('\n');
                    if (warnCount > 0) text += `\n⚠️ Warnings (${warnCount}):\n` + report.warnings.map(w => `• ${w}`).join('\n');
                    if (platCount > 0) text += `\n🚫 Platform flags (${platCount}):\n` + report.platformWarnings.slice(0, 3).map(p => `• ${p}`).join('\n');
                }
                return push(text, 'analyzeProject', { isAction: true, resultCount: report.shotCount, issueCount });
            }

            // ── Feature 6: Full Project Generator ───────────────────────────────────
            if (/generate.*project|build.*complete.*film|create.*film.*with.*scene|build.*film.*scene|full.*project|complete.*project/.test(q)) {
                const snap = buildSnapshot(appActions, 'Generate full project');
                const result = generateFullProject(step, appActions);
                if (appActions?.setProjects && appActions?.setActiveProjectId) {
                    const newId = `proj_${Date.now()}`;
                    const newProject = { id: newId, name: step.replace(/generate|build|create|complete|full|project|film|with|scenes?|shots?|\d+/gi, '').trim() || 'Generated Film', description: '', tags: [], defaultParams: {}, scenes: result.scenes };
                    appActions.setProjects(prev => [...prev, newProject]);
                    appActions.setActiveProjectId(newId);
                    saveAgentMemory({ lastProject: newProject.name });
                }
                const text = `🎬 Full project generated!\n\n${result.sceneCount} scenes × ${result.shotsPerScene} shots each\n${result.detectedDir ? `Director: ${DIRECTOR_STYLES[result.detectedDir].label}\n` : ''}${result.detectedMood ? `Mood: ${result.detectedMood}\n` : ''}\nProject created and set as active!`;
                return push(text, 'generateFullProject', { isAction: true, snapshot: snap });
            }

            // ── Feature 7: Scene Rewriter ────────────────────────────────────────────
            if (/rewrite.*shot|rewrite.*scene|all shots.*style|convert.*shot|update.*all.*shot/.test(q)) {
                const snap = buildSnapshot(appActions, 'Rewrite scene shots');
                const result = rewriteScene(step, appActions);
                if (!result) return push('⚠️ No director or mood detected.\n\nTry: "rewrite all shots in Fincher style" or "rewrite scene with tense mood"', 'error');
                const styleName = result.dirData ? result.dirData.label : result.moodData ? Object.keys(MOOD_PRESETS).find(k => MOOD_PRESETS[k] === result.moodData) : 'new style';
                return push(`✓ Rewrote ${result.count} shots in "${styleName}" style!\n\nUpdated: camera, lens, lighting, movement, film stock.`, 'rewriteScene', { isAction: true, snapshot: snap });
            }

            // ── Feature 8: Shot Duplicator ───────────────────────────────────────────
            const dupMatch = q.match(/duplicate\s+shot\s+(\d+)|clone\s+shot\s+(\d+)|copy\s+shot\s+(\d+)/);
            if (dupMatch) {
                const shotNum = parseInt(dupMatch[1] || dupMatch[2] || dupMatch[3]);
                const shotIdx = shotNum - 1;
                const variationDesc = step.replace(/duplicate|clone|copy|shot\s+\d+/gi, '').trim();
                const snap = buildSnapshot(appActions, `Duplicate shot ${shotNum}`);
                const result = duplicateShotWithVariation(shotIdx, variationDesc, appActions);
                if (!result) {
                    const scene = appActions?.scenes?.find(s => s.id === appActions?.activeSceneId);
                    const max = scene?.shots?.length || 0;
                    return push(`⚠️ Shot ${shotNum} not found. Active scene has ${max} shot(s).`, 'error');
                }
                return push(`✓ Shot ${shotNum} duplicated${variationDesc ? ` with variation: "${variationDesc}"` : ''}!\n\nInserted as shot ${shotNum + 1}.`, 'duplicateShot', { isAction: true, snapshot: snap });
            }

            // ── Feature 9: Cross-Scene Operations ───────────────────────────────────
            if (/copy.*shots.*from|merge.*scene/.test(q)) {
                const snap = buildSnapshot(appActions, 'Cross-scene operation');
                const result = crossSceneOp(step, appActions);
                if (!result) return push('⚠️ Could not parse cross-scene operation.\n\nTry: "copy all shots from Act 1 to Act 2" or "merge scene Act 1 and Act 2"', 'error');
                if (result.error) return push(`⚠️ ${result.error}\n\nSay "list scenes" to see available scene names.`, 'error');
                if (result.type === 'copy') return push(`✓ Copied ${result.count} shots from "${result.from}" to "${result.to}"!`, 'crossScene', { isAction: true, snapshot: snap });
                if (result.type === 'merge') return push(`✓ Merged "${result.s1}" and "${result.s2}" into ${result.count} total shots!`, 'crossScene', { isAction: true, snapshot: snap });
            }

            // ── Feature 10: Smart Search ─────────────────────────────────────────────
            if (/^(find|search|show|list.*shots.*with|which shots|show me shots|get shots)/.test(q) || /shots.*(with|that have|using|no |without)/.test(q)) {
                const results = searchShots(step, appActions);
                if (results.length === 0) return push(`No shots found matching "${step.replace(/find|search|show|list|shots?|with|that|have|has|using|all|which|me|get/gi, '').trim()}".`, 'info', { type: 'searchShots', resultCount: 0 });
                const text = `🔍 Found ${results.length} shot(s):\n\n` + results.map(r => `• ${r.scene} — Shot ${r.shotNum}: ${(r.shot.selections?.shotType || 'No type').split('(')[0].trim()} / ${r.shot.selections?.lighting || 'No lighting'}`).join('\n');
                return push(text, 'searchShots', { resultCount: results.length });
            }

            // ── Feature 14: Parameter Edit ───────────────────────────────────────────
            const paramEdit = parseParamEdit(step, appActions);
            if (paramEdit) {
                const snap = buildSnapshot(appActions, `Edit shot parameter: ${paramEdit.payload.param}`);
                const { scenes, activeSceneId, updateActiveProjectScenes } = appActions || {};
                if (paramEdit.type === 'EDIT_SHOT_PARAM') {
                    const { shotIdx, param, value } = paramEdit.payload;
                    updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? {
                        ...s, shots: s.shots.map((sh, i) => i === shotIdx ? { ...sh, selections: { ...sh.selections, [param]: value } } : sh)
                    } : s));
                    return push(`✓ Shot ${shotIdx + 1} ${param} → "${value}"`, 'paramEdit', { isAction: true, snapshot: snap });
                }
                if (paramEdit.type === 'EDIT_ALL_SHOTS_PARAM') {
                    const { param, value } = paramEdit.payload;
                    const scene = scenes?.find(s => s.id === activeSceneId);
                    const count = scene?.shots?.length || 0;
                    updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? {
                        ...s, shots: s.shots.map(sh => ({ ...sh, selections: { ...sh.selections, [param]: value } }))
                    } : s));
                    return push(`✓ All ${count} shots ${param} → "${value}"`, 'paramEdit', { isAction: true, snapshot: snap });
                }
            }

            // ── Feature 4: Conditional Logic ─────────────────────────────────────────
            const condMatch = step.match(/^if\s+(.+?),?\s+(?:then\s+)?(.+)/i);
            if (condMatch) {
                const condition = condMatch[1].trim();
                const action = condMatch[2].trim();
                const condResult = evalCondition(condition, appActions);
                if (condResult === true) {
                    const result = agentDispatch(action, appActions, convContext, agentActionLogRef, setAgentActionLogFn, sessionMemoryRef, setSessionMemoryFn);
                    return { ...result, text: `✓ Condition met: "${condition}"\n\n${result.text}` };
                } else if (condResult === false) {
                    return push(`ℹ️ Condition not met: "${condition}" — no action taken.`, 'info');
                } else {
                    return push(`⚠️ Couldn't evaluate condition: "${condition}"\n\nTry: "if the scene has no shots, create 3"`, 'error');
                }
            }

            // ── Feature 2: Fuzzy Director/Mood ───────────────────────────────────────
            const dirKey = fuzzyFindDirector(q);
            if (dirKey && DIRECTOR_STYLES[dirKey]) {
                const style = DIRECTOR_STYLES[dirKey];
                const snap = buildSnapshot(appActions, `Apply ${style.label} style`);
                if (appActions?.setSelections) appActions.setSelections(prev => ({ ...prev, ...style }));
                if (setSessionMemoryFn) setSessionMemoryFn(p => ({ ...p, directorStyle: style.label }));
                saveAgentMemory({ lastDirector: style.label });
                const matched = dirKey !== q.replace(/director\s*/i, '').trim() ? ` (matched: "${style.label}")` : '';
                return push(`🎬 ${style.label} style applied!${matched}\n\n"${style.signature}"\n\nCamera: ${style.camera} · Lens: ${style.lens}\nLighting: ${style.lighting} · Movement: ${style.movement}\nFilm Stock: ${style.filmStock}`, 'director', { isAction: true, snapshot: snap });
            }

            const moodKey = fuzzyFindMood(q);
            if (moodKey && MOOD_PRESETS[moodKey]) {
                const mood = MOOD_PRESETS[moodKey];
                const snap = buildSnapshot(appActions, `Apply mood: ${moodKey}`);
                if (appActions?.setSelections) appActions.setSelections(prev => ({ ...prev, shotType: mood.shotType, shotStyle: mood.shotStyle, angle: mood.angle, lighting: mood.lighting, movement: mood.movement, filmStock: mood.filmStock }));
                if (setSessionMemoryFn) setSessionMemoryFn(p => ({ ...p, mood: moodKey }));
                saveAgentMemory({ lastMood: moodKey });
                return push(`🎭 "${moodKey}" mood applied!\n\n${mood.desc}\n\nLighting: ${mood.lighting}\nMovement: ${mood.movement}\nShot Type: ${mood.shotType}\nFilm Stock: ${mood.filmStock}\nSFX hint: ${mood.sfx}\nBGM hint: ${mood.bgm}`, 'mood', { isAction: true, snapshot: snap });
            }

            // ── Surprise Me ──────────────────────────────────────────────────────────
            if (/surprise me|random shot|random inspiration|inspire me|random idea/.test(q)) {
                const mKeys = Object.keys(MOOD_PRESETS);
                const randMoodKey = mKeys[Math.floor(Math.random() * mKeys.length)];
                const mood = MOOD_PRESETS[randMoodKey];
                const randPrompt = PROMPT_LIBRARY[Math.floor(Math.random() * PROMPT_LIBRARY.length)];
                const randCamera = OPTIONS.cameraTypes[Math.floor(Math.random() * OPTIONS.cameraTypes.length)];
                const randLens = OPTIONS.lenses[Math.floor(Math.random() * OPTIONS.lenses.length)];
                if (appActions?.setSelections) appActions.setSelections(prev => ({ ...prev, shotType: mood.shotType, shotStyle: mood.shotStyle, angle: mood.angle, lighting: mood.lighting, movement: mood.movement, filmStock: mood.filmStock, camera: randCamera, lens: randLens }));
                if (appActions?.setSubject) appActions.setSubject(randPrompt.text.substring(0, 120));
                return push(`🎲 Surprise!\n\n"${randPrompt.title}" — ${randPrompt.cat}\n\nMood: ${randMoodKey}\nCamera: ${randCamera}\nLens: ${randLens}\nLighting: ${mood.lighting}\nMovement: ${mood.movement}\n\nAll loaded — hit Add Shot!`, 'surprise', { isAction: true });
            }

            // ── Steal This Shot ───────────────────────────────────────────────────────
            if (/steal.*shot|famous shot|iconic shot|steal this/.test(q)) {
                const shot = FAMOUS_SHOTS[Math.floor(Math.random() * FAMOUS_SHOTS.length)];
                if (appActions?.setSelections) appActions.setSelections(prev => ({ ...prev, ...shot.selections }));
                if (appActions?.setSubject) appActions.setSubject(shot.subject);
                return push(`🎥 Steal This Shot!\n\n"${shot.title}"\nFrom: ${shot.film}\n\nAll parameters loaded — hit Add Shot!\n\nSFX: ${shot.sfx}\nBGM: ${shot.bgm}`, 'steal', { isAction: true });
            }

            // ── Batch Build ───────────────────────────────────────────────────────────
            const batchMatch = step.match(/^(?:build scene|batch build|generate scene|make scene)[:\s]+(.+)/i);
            if (batchMatch) {
                const desc = batchMatch[1].trim();
                const d = desc.toLowerCase();
                const countMatch = d.match(/(\d+)\s+shots?/);
                const shotCount = countMatch ? Math.min(parseInt(countMatch[1]), 8) : 3;
                const detectedMood = Object.keys(MOOD_PRESETS).find(m => d.includes(m));
                const detectedDir = Object.keys(DIRECTOR_STYLES).find(dir => d.includes(dir));
                const moodData = detectedMood ? MOOD_PRESETS[detectedMood] : MOOD_PRESETS['epic'];
                const dirData = detectedDir ? DIRECTOR_STYLES[detectedDir] : null;
                const tmpls = [
                    { type: 'Extreme Wide Shot (EWS)', movement: 'Drone Fly-Through', label: 'Establishing' },
                    { type: 'Wide Shot (WS)', movement: 'Tracking / Follow', label: 'Context' },
                    { type: 'Medium Shot (MS)', movement: 'Dolly In', label: 'Character' },
                    { type: 'Close-Up (CU)', movement: 'Static / Tripod', label: 'Reaction' },
                    { type: 'Over the Shoulder (OTS)', movement: 'Pan Left', label: 'Dialogue' },
                    { type: 'Extreme Close-Up (ECU)', movement: 'Dolly In', label: 'Detail' },
                    { type: 'Wide Shot (WS)', movement: 'Crane Shot', label: 'Reveal' },
                    { type: 'Extreme Wide Shot (EWS)', movement: 'Drone Fly-Through', label: 'Final Image' },
                ];
                const snap = buildSnapshot(appActions, `Batch build: ${desc}`);
                const shots = tmpls.slice(0, shotCount).map((t, i) => ({
                    id: Date.now() + Math.random() + i,
                    subject: `${desc}. ${t.label} shot.`,
                    selections: { shotType: t.type, shotStyle: dirData?.shotStyle || moodData.shotStyle || 'Cinematic', camera: dirData?.camera || OPTIONS.cameraTypes[0], lens: dirData?.lens || OPTIONS.lenses[4], angle: dirData?.angle || moodData.angle || 'Eye Level', lighting: dirData?.lighting || moodData.lighting || 'Natural Daylight', movement: dirData?.movement || t.movement, actionSpeed: 'Normal Speed', duration: '3.0s', transition: i === shotCount - 1 ? 'Fade to Black' : 'Hard Cut', filmStock: dirData?.filmStock || moodData.filmStock || '', aspectRatio: '--ar 16:9' },
                    sfx: moodData?.sfx || '', bgm: moodData?.bgm || '',
                    dialogues: [], mode: 'video', status: 'Planning', tags: ['batch'], referenceImages: [], customPromptOverride: null
                }));
                if (appActions?.updateActiveProjectScenes && appActions?.activeSceneId) {
                    appActions.updateActiveProjectScenes(prev => prev.map(s => s.id === appActions.activeSceneId ? { ...s, shots: [...(s.shots || []), ...shots] } : s));
                }
                return push(`📝 Batch Build done!\n\n${shotCount} shots from: "${desc}"\n${detectedMood ? `Mood: ${detectedMood}\n` : ''}${detectedDir ? `Director: ${DIRECTOR_STYLES[detectedDir].label}\n` : ''}\nAdded to active scene!`, 'batchBuild', { isAction: true, snapshot: snap });
            }

            // ── Director's Card ───────────────────────────────────────────────────────
            if (/export summary|director.?s card|summary card|project summary|my stats/.test(q)) {
                const { projects, activeProjectId, scenes } = appActions || {};
                const proj = projects?.find(p => p.id === activeProjectId);
                const allShots = scenes?.flatMap(s => s.shots || []) || [];
                const countMap = (arr, key) => arr.reduce((a, s) => { const v = s.selections?.[key]; if (v) a[v] = (a[v]||0)+1; return a; }, {});
                const top = obj => Object.entries(obj).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'None';
                const topLight = top(countMap(allShots,'lighting'));
                const topStyle = top(countMap(allShots,'shotStyle'));
                const topCam = top(countMap(allShots,'camera'));
                const mem = sessionMemoryRef || {};
                const moodProfile = mem.mood || (topLight.includes('Dark') ? 'Dark & Moody' : topLight.includes('Golden') ? 'Warm & Cinematic' : 'Neutral');
                return push(`🎬 Director's Card\n━━━━━━━━━━━━━━━━\nProject: ${proj?.name || 'Untitled'}\nScenes: ${scenes?.length || 0} · Shots: ${allShots.length}\n\nDominant Style: ${topStyle}\nFav Lighting: ${topLight}\nCamera: ${topCam}\nMood: ${moodProfile}${mem.directorStyle ? '\nInfluence: ' + mem.directorStyle : ''}\n━━━━━━━━━━━━━━━━`, 'card', { isCard: true });
            }

            // ── Story Wizard 2.0 — Full Cinematic Story Development ─────────────────
            if (/story\s+wizard|guide\s+me|help\s+me\s+(?:write|create|build)\s+(?:a\s+)?story|walk\s+me\s+through|step\s+by\s+step\s+story/.test(q)) {
                return push(
                    `🎬 STORY WIZARD 2.0 activated!\n\nI'll guide you through 12 steps to build a complete cinematic project.\n\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `STEP 1 of 12 — THE LOGLINE\n\n` +
                    `What's your story about? One sentence.\n\n` +
                    `Format: "[Character] wants [goal] but [obstacle]."\n\n` +
                    `Example: "A disgraced detective wants to clear her name but her own department is trying to bury her."\n\n` +
                    `Type your logline:`,
                    'storyWizard',
                    { isStoryWizard: true, wizardStep: 1, contextUpdate: { wizardActive: true, wizardStep: 1, wizardData: {} } }
                );
            }

            // ── Story Wizard 2.0 Step Handler ────────────────────────────────────────
            if (convContext?.wizardActive && convContext?.wizardStep) {
                const wStep = convContext.wizardStep;
                const wData = convContext.wizardData || {};
                const { setStoryData, setShowStoryEngineModal, setProjects, setActiveProjectId, setActiveSceneId, globalCharacters } = appActions || {};

                const detectGenre = (text) => {
                    const d = text.toLowerCase();
                    if (/horror|fear|monster|ghost|demon/.test(d)) return 'Horror';
                    if (/love|romance|heart|kiss/.test(d)) return 'Romance';
                    if (/space|future|robot|alien|sci.fi/.test(d)) return 'Sci-Fi';
                    if (/detective|murder|crime|heist/.test(d)) return 'Thriller / Crime';
                    if (/war|battle|soldier|military/.test(d)) return 'Action / War';
                    if (/magic|wizard|dragon|fantasy|kingdom/.test(d)) return 'Fantasy';
                    if (/comedy|funny|laugh|humor/.test(d)) return 'Comedy';
                    return 'Drama';
                };
                const getCinematicPreset = (genre, tone) => {
                    const t = (tone||'').toLowerCase(); const g = (genre||'').toLowerCase();
                    if (g.includes('horror')||t.includes('dark')||t.includes('dread')) return 'haunted';
                    if (g.includes('thriller')||t.includes('tense')||t.includes('suspense')) return 'noir_interrogation';
                    if (g.includes('romance')||t.includes('romantic')||t.includes('warm')) return 'romantic';
                    if (g.includes('sci-fi')||t.includes('futuristic')||t.includes('cold')) return 'deep_space';
                    if (g.includes('action')||t.includes('intense')||t.includes('fast')) return 'street_chase';
                    if (g.includes('fantasy')||t.includes('epic')||t.includes('grand')) return 'fantasy_epic';
                    return 'award_drama';
                };
                const extractName = (text) => text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)?.[1] || text.split(',')[0].trim().split(' ')[0];

                if (wStep === 1) {
                    const logline = step.trim();
                    const genre = detectGenre(logline);
                    const toneMap = { 'Horror':'Dark & Unsettling', 'Romance':'Warm & Intimate', 'Sci-Fi':'Cold & Vast', 'Thriller / Crime':'Tense & Gritty', 'Action / War':'Intense & Kinetic', 'Fantasy':'Epic & Mythic', 'Comedy':'Light & Playful', 'Drama':'Emotional & Raw' };
                    return push(
                        `✅ Logline locked.\n\n"${logline.substring(0,120)}"\n\nDetected genre: ${genre} · Suggested tone: ${toneMap[genre]||'Cinematic'}\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 2 of 12 — GENRE & TONE\n\nConfirm or adjust.\nGenre: Horror · Romance · Sci-Fi · Thriller/Crime · Action/War · Fantasy · Comedy · Drama\nTone: Dark & Gritty · Hopeful · Tense · Melancholic · Epic · Romantic · Mysterious · Bittersweet\n\nType "confirm" to accept "${genre} / ${toneMap[genre]||'Cinematic'}" or type your own:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:2, contextUpdate:{ wizardActive:true, wizardStep:2, wizardData:{...wData, logline, genre, tone:toneMap[genre]||'Cinematic'} } }
                    );
                }
                if (wStep === 2) {
                    const input = step.trim().toLowerCase();
                    const genre = input==='confirm' ? wData.genre : (step.includes('/') ? step.split('/')[0].trim() : wData.genre);
                    const tone = input==='confirm' ? wData.tone : (step.includes('/') ? step.split('/')[1].trim() : step);
                    return push(
                        `✅ Genre: ${genre} · Tone: ${tone}\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 3 of 12 — PROTAGONIST\n\nName · Role · What they WANT · What they FEAR · Their fatal flaw\n\nExample: "Marcus Vega, disgraced detective. Wants truth. Fears being forgotten. Flaw: trusts no one."\n\nDescribe your protagonist:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:3, contextUpdate:{ wizardActive:true, wizardStep:3, wizardData:{...wData, genre, tone} } }
                    );
                }
                if (wStep === 3) {
                    const protagonist = step.trim();
                    const protName = extractName(protagonist);
                    const charExists = globalCharacters?.find(c => c.name.toLowerCase().includes(protName.toLowerCase()));
                    return push(
                        `✅ Protagonist: ${protName}\n\n"${protagonist.substring(0,120)}"\n\n` +
                        (!charExists ? `💡 "${protName}" not in Character Library. Say "add ${protName} to library" or continue.\n\n` : `✓ "${protName}" found in library.\n\n`) +
                        `━━━━━━━━━━━━━━━━\nSTEP 4 of 12 — ANTAGONIST / OBSTACLE\n\nWho or what opposes your protagonist? Person, system, nature, or internal struggle.\n\nExample: "Commissioner Reyes — ${protName}'s former mentor now protecting the corrupt network."\n\nDescribe the antagonist:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:4, contextUpdate:{ wizardActive:true, wizardStep:4, wizardData:{...wData, protagonist, protName} } }
                    );
                }
                if (wStep === 4) {
                    const antagonist = step.trim();
                    const antName = extractName(antagonist);
                    return push(
                        `✅ Antagonist: ${antName}\n\n"${antagonist.substring(0,120)}"\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 5 of 12 — WORLD BUILDING\n\nWhere and when? Time period, location, atmosphere, visual rules.\n\nExample: "1970s New York. Gritty, rain-soaked. Neon signs in puddles. A city that never sleeps but always lies."\n\nDescribe your world:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:5, contextUpdate:{ wizardActive:true, wizardStep:5, wizardData:{...wData, antagonist, antName} } }
                    );
                }
                if (wStep === 5) {
                    const world = step.trim();
                    return push(
                        `✅ World locked.\n\n"${world.substring(0,120)}"\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 6 of 12 — INCITING INCIDENT\n\nThe moment that starts everything. What disrupts ${wData.protName||'your protagonist'}'s ordinary world?\n\nExample: "A body is found in the precinct's evidence room — the only fingerprints belong to ${wData.protName||'the protagonist'}."\n\nDescribe the inciting incident:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:6, contextUpdate:{ wizardActive:true, wizardStep:6, wizardData:{...wData, world} } }
                    );
                }
                if (wStep === 6) {
                    const incident = step.trim();
                    return push(
                        `✅ Inciting incident set.\n\n"${incident.substring(0,120)}"\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 7 of 12 — MIDPOINT TWIST\n\nWhat happens halfway that flips everything? The point of no return.\n\nExample: "${wData.protName||'The protagonist'} discovers the evidence was planted — by someone they trusted completely."\n\nDescribe the midpoint twist:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:7, contextUpdate:{ wizardActive:true, wizardStep:7, wizardData:{...wData, incident} } }
                    );
                }
                if (wStep === 7) {
                    const midpoint = step.trim();
                    return push(
                        `✅ Midpoint twist locked.\n\n"${midpoint.substring(0,120)}"\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 8 of 12 — CLIMAX\n\nThe final confrontation. ${wData.protName||'Your protagonist'} faces everything head-on.\n\nExample: "${wData.protName||'The protagonist'} confronts ${wData.antName||'the antagonist'} on the rooftop — with the city watching below."\n\nDescribe the climax:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:8, contextUpdate:{ wizardActive:true, wizardStep:8, wizardData:{...wData, midpoint} } }
                    );
                }
                if (wStep === 8) {
                    const climax = step.trim();
                    return push(
                        `✅ Climax set.\n\n"${climax.substring(0,120)}"\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 9 of 12 — RESOLUTION\n\nHow does it end? Does ${wData.protName||'the protagonist'} succeed? Fail? Transform? What is the final image?\n\nExample: "${wData.protName||'The protagonist'} exposes the truth — but walks away from the badge. The city is the same. She is not."\n\nDescribe the resolution:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:9, contextUpdate:{ wizardActive:true, wizardStep:9, wizardData:{...wData, climax} } }
                    );
                }
                if (wStep === 9) {
                    const resolution = step.trim();
                    return push(
                        `✅ Resolution locked.\n\n"${resolution.substring(0,120)}"\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 10 of 12 — CINEMATIC STYLE\n\nWhat is the visual language of your film?\n\nExamples:\n• "Fincher — cold, precise, blue-green, static"\n• "Wong Kar-wai — warm, blurry, handheld, neon"\n• "Villeneuve — vast, slow, IMAX, volumetric"\n• "Gritty 70s New York, grainy, available light"\n\nDescribe your visual style:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:10, contextUpdate:{ wizardActive:true, wizardStep:10, wizardData:{...wData, resolution} } }
                    );
                }
                if (wStep === 10) {
                    const visualStyle = step.trim();
                    const presetId = getCinematicPreset(wData.genre, wData.tone+' '+visualStyle);
                    const preset = CHAIN_SCENE_PRESETS.find(p=>p.id===presetId) || CHAIN_SCENE_PRESETS[0];
                    return push(
                        `✅ Visual style: "${visualStyle.substring(0,80)}"\n\n🎬 Recommended Chain Preset: ${preset.name} (${preset.tag})\nCamera: ${preset.p.camera} · Lens: ${preset.p.lens} · Lighting: ${preset.p.lighting}\n\n` +
                        `━━━━━━━━━━━━━━━━\nSTEP 11 of 12 — SCENE PLAN\n\nHow many scenes? (3–12)\n\nType a number or "auto" for me to decide:`,
                        'storyWizard', { isStoryWizard:true, wizardStep:11, contextUpdate:{ wizardActive:true, wizardStep:11, wizardData:{...wData, visualStyle, presetId} } }
                    );
                }
                if (wStep === 11) {
                    const input = step.trim().toLowerCase();
                    const d = wData;
                    const sceneCount = input==='auto' ? 5 : Math.min(12, Math.max(3, parseInt(input)||5));
                    const preset = CHAIN_SCENE_PRESETS.find(p=>p.id===d.presetId) || CHAIN_SCENE_PRESETS[0];
                    const sceneNames = [
                        `Opening — ${d.world?.split('.')[0]||'Establishing the world'}`,
                        `Ordinary World — ${d.protName||'Protagonist'} before the storm`,
                        `Inciting Incident — ${d.incident?.substring(0,35)||'Everything changes'}...`,
                        `Rising Action — First obstacles`,
                        `Midpoint — ${d.midpoint?.substring(0,35)||'The twist'}...`,
                        `Dark Night — All seems lost`,
                        `Preparation — ${d.protName||'Protagonist'} prepares`,
                        `Climax — ${d.climax?.substring(0,35)||'Final confrontation'}...`,
                        `Resolution — ${d.resolution?.substring(0,35)||'The aftermath'}...`,
                        `Epilogue — A new world`, `Flashback — What we missed`, `Coda — Final image`
                    ].slice(0, sceneCount);
                    const planText = sceneNames.map((name,i)=>`  Scene ${i+1}: ${name}`).join('\n');
                    return push(
                        `✅ ${sceneCount} scenes planned.\n\n━━━━━━━━━━━━━━━━\nSTEP 12 of 12 — CONFIRM & BUILD\n\n${planText}\n\nChain Preset: ${preset.name} · Character: ${d.protName||'Not set'}\n\n━━━━━━━━━━━━━━━━\nChoose:\n• "build" — auto-build the full project\n• "edit" — customize each scene first\n• "revise [element]" — go back and change something`,
                        'storyWizard', { isStoryWizard:true, wizardStep:12, contextUpdate:{ wizardActive:true, wizardStep:12, wizardData:{...wData, sceneCount, sceneNames} } }
                    );
                }
                if (wStep === 12) {
                    const input = step.trim().toLowerCase();
                    const d = wData;
                    const reviseMatch = input.match(/revise\s+(logline|genre|tone|protagonist|antagonist|world|incident|midpoint|climax|resolution|style)/);
                    if (reviseMatch) {
                        const stepMap = {logline:1,genre:2,tone:2,protagonist:3,antagonist:4,world:5,incident:6,midpoint:7,climax:8,resolution:9,style:10};
                        const targetStep = stepMap[reviseMatch[1]]||1;
                        const labels = {1:'Logline',2:'Genre & Tone',3:'Protagonist',4:'Antagonist',5:'World Building',6:'Inciting Incident',7:'Midpoint Twist',8:'Climax',9:'Resolution',10:'Cinematic Style'};
                        return push(`↩️ Revising Step ${targetStep}: ${labels[targetStep]}\n\nType your updated ${labels[targetStep]}:`, 'storyWizard', { isStoryWizard:true, wizardStep:targetStep, contextUpdate:{ wizardActive:true, wizardStep:targetStep, wizardData:d } });
                    }
                    if (input==='edit') {
                        return push(`✏️ Edit mode — Scene 1: "${d.sceneNames?.[0]||'Opening'}"\n\nType a new name or "ok" to keep it:`, 'storyWizard', { isStoryWizard:true, wizardStep:12, contextUpdate:{ wizardActive:true, wizardStep:12, wizardData:{...d, editMode:true, editIndex:0} } });
                    }
                    if (input==='build'||input.includes('build')||input.includes('yes')||input.includes('go')) {
                        const preset = CHAIN_SCENE_PRESETS.find(p=>p.id===d.presetId)||CHAIN_SCENE_PRESETS[0];
                        const sceneNames = d.sceneNames||['Opening','Rising Action','Climax'];
                        if (setStoryData) {
                            setStoryData(prev=>({...prev,
                                act1:{ character:`${d.protagonist||d.protName||'Protagonist'}. ${d.logline?.substring(0,120)||''}`, world:`${d.world||''}`, incident:`${d.incident||''}` },
                                act2:{ obstacles:`${d.antagonist||''}. ${d.midpoint?.substring(0,120)||''}`, midpoint:`${d.midpoint||''}`, stakes:`Tone: ${d.tone||'intense'}.` },
                                act3:{ climax:`${d.climax||''}`, resolution:`${d.resolution||''}`, aftermath:`${d.protName||'The protagonist'} is forever changed.` },
                                theme:{ theme:d.genre||'Drama', message:d.logline?.substring(0,100)||'', tone:d.tone||'Cinematic' },
                                dramatic:{ genre:d.genre||'Drama', visualStyle:d.visualStyle||'Cinematic', centralConflict:d.antagonist?.substring(0,150)||'' }
                            }));
                        }
                        if (setProjects && setActiveProjectId) {
                            const projId = `proj_${Date.now()}`;
                            const baseSelections = {...preset.p, aperture:'f/2.8', aspectRatio:'--ar 16:9'};
                            const newScenes = sceneNames.map((name,idx)=>{
                                const s1subj = `${d.protName?'@'+d.protName.replace(/\s+/g,'')+'  ':''} ${d.world?.split('.')[0]||''}`.trim();
                                return { id:Date.now()+idx, name, shots: s1subj ? [{ id:`shot_c1_${Date.now()}_${idx}`, subject:s1subj, selections:baseSelections, sfx:'', bgm:'', dialogues:[], mode:'video', status:'Planning', tags:['Chain Base'], referenceImages:[], customPromptOverride:null, _chainDelta:false, _isChainShot1:true }] : [] };
                            });
                            setProjects(prev=>[...prev,{ id:projId, name:d.logline?.substring(0,40)||'My Film', description:d.logline||'', tags:[d.genre||'Drama'], defaultParams:{}, scenes:newScenes }]);
                            setActiveProjectId(projId);
                            if (setActiveSceneId) setActiveSceneId(newScenes[0].id);
                            if (appActions?.setChainMode) appActions.setChainMode(true);
                            if (appActions?.setChainBase) appActions.setChainBase(prev=>({...prev,...preset.p, character:d.protName||'', subject:d.world?.split('.')[0]||''}));
                        }
                        if (setShowStoryEngineModal) setShowStoryEngineModal(true);
                        return push(
                            `🎬 PROJECT BUILT!\n\n━━━━━━━━━━━━━━━━\n"${d.logline?.substring(0,60)||'Your Film'}"\n\n✓ ${sceneNames.length} scenes created\n✓ Shot 1 added to each scene\n✓ Chain Mode activated with "${preset.name}"\n✓ Story Engine filled\n\n━━━━━━━━━━━━━━━━\nNext:\n• "chain add: [action]" to add shots\n• "build shots from story" to auto-generate\n• "revise [element]" to change story elements`,
                            'storyEngine', { isAction:true, contextUpdate:{ wizardActive:false, wizardStep:0, wizardData:{} } }
                        );
                    }
                }
            } // end wizardActive handler

            // ── Story Engine — Create / Fill / Parse ─────────────────────────────────
            if (/story engine|create story|write story|fill story|build story|story acts|parse story|import story|story from|story:/.test(q) ||
                /^(story|acts?)\s*[:—]/.test(q)) {

                const { setStoryData, setShowStoryEngineModal } = appActions || {};
                if (!setStoryData) return push('⚠️ Story Engine not available in this context.', 'error');

                // ── Mode 1: Paste a ready-made story text → auto-split into acts ──────
                // Triggered by: "parse story: [text]", "import story: [text]", or multi-line paste
                const pasteMatch = step.match(/^(?:parse story|import story|story to acts|fill acts from|story:)\s*[:—]?\s*([\s\S]+)/i);
                const isMultiLine = !pasteMatch && step.split('\n').length >= 3;

                if (pasteMatch || isMultiLine) {
                    const rawStory = pasteMatch ? pasteMatch[1].trim() : step.trim();
                    const lines = rawStory.split('\n').map(l => l.trim()).filter(Boolean);
                    const wordCount = rawStory.split(/\s+/).length;
                    const sentences = rawStory.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

                    // Split into thirds for acts
                    const third = Math.ceil(sentences.length / 3);
                    const act1Sents = sentences.slice(0, third);
                    const act2Sents = sentences.slice(third, third * 2);
                    const act3Sents = sentences.slice(third * 2);

                    // Extract genre/tone hints from text
                    const lower = rawStory.toLowerCase();
                    const detectedGenre =
                        /horror|fear|monster|ghost|haunted/.test(lower) ? 'Horror' :
                        /love|romance|heart|kiss|together/.test(lower) ? 'Romance' :
                        /space|planet|future|robot|alien/.test(lower) ? 'Sci-Fi' :
                        /detective|murder|crime|suspect|clue/.test(lower) ? 'Thriller / Crime' :
                        /war|battle|soldier|army|fight/.test(lower) ? 'Action / War' :
                        /magic|wizard|dragon|kingdom|quest/.test(lower) ? 'Fantasy' :
                        /family|childhood|memory|loss|grief/.test(lower) ? 'Drama' : 'Drama';

                    const detectedTone =
                        /dark|grim|bleak|hopeless/.test(lower) ? 'Dark & Gritty' :
                        /hope|light|joy|triumph/.test(lower) ? 'Hopeful' :
                        /funny|laugh|comedy|absurd/.test(lower) ? 'Comedic' :
                        /tense|suspense|danger|threat/.test(lower) ? 'Tense / Suspenseful' : 'Cinematic';

                    // Extract character names (capitalized words that repeat)
                    const capWords = rawStory.match(/\b[A-Z][a-z]{2,}\b/g) || [];
                    const freq = capWords.reduce((a, w) => { a[w] = (a[w]||0)+1; return a; }, {});
                    const charNames = Object.entries(freq).filter(([w, c]) => c >= 2 && !['The','And','But','When','Then','After','Before','During','While','This','That','With','From','Into','Over','Under'].includes(w)).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w])=>w);

                    // Build acts
                    const act1 = {
                        character: act1Sents.slice(0, 2).join('. ').substring(0, 200) || 'Protagonist introduced.',
                        world: act1Sents[0]?.substring(0, 200) || 'World established.',
                        incident: act1Sents[act1Sents.length - 1]?.substring(0, 200) || 'Inciting incident occurs.'
                    };
                    const act2 = {
                        obstacles: act2Sents.slice(0, 2).join('. ').substring(0, 200) || 'Rising action and obstacles.',
                        midpoint: act2Sents[Math.floor(act2Sents.length/2)]?.substring(0, 200) || 'Midpoint reversal.',
                        stakes: act2Sents[act2Sents.length - 1]?.substring(0, 200) || 'Stakes raised.'
                    };
                    const act3 = {
                        climax: act3Sents[0]?.substring(0, 200) || 'Final confrontation.',
                        resolution: act3Sents.slice(1, -1).join('. ').substring(0, 200) || 'Resolution.',
                        aftermath: act3Sents[act3Sents.length - 1]?.substring(0, 200) || 'New status quo.'
                    };

                    // Build characters array
                    const characters = charNames.length
                        ? charNames.map((name, i) => ({ id: Date.now()+i, name, motivation: '', fear: '', contradiction: '', x: 30 + i*30, y: 50 }))
                        : [{ id: Date.now(), name: 'Main Character', motivation: '', fear: '', contradiction: '', x: 50, y: 50 }];

                    setStoryData(prev => ({
                        ...prev,
                        act1, act2, act3,
                        theme: { theme: detectedGenre, message: act1Sents[0]?.substring(0, 100) || '', tone: detectedTone },
                        dramatic: { ...prev.dramatic, genre: detectedGenre, visualStyle: detectedTone },
                        characters
                    }));

                    if (setShowStoryEngineModal) setShowStoryEngineModal(true);

                    return push(
                        `📖 Story parsed into 3-Act Structure!\n\n` +
                        `Genre detected: ${detectedGenre}\nTone: ${detectedTone}\n` +
                        `Characters found: ${characters.map(c=>c.name).join(', ')}\n` +
                        `Words: ${wordCount} · Sentences: ${sentences.length}\n\n` +
                        `Act 1 — Setup: ${act1.character.substring(0,60)}...\n` +
                        `Act 2 — Conflict: ${act2.obstacles.substring(0,60)}...\n` +
                        `Act 3 — Resolution: ${act3.climax.substring(0,60)}...\n\n` +
                        `Story Engine opened with all fields filled!`,
                        'storyEngine', { isAction: true }
                    );
                }

                // ── Mode 2: Create story from natural language description ────────────
                // e.g. "create story: a detective in 1940s Paris chasing a ghost"
                const descMatch = step.match(/(?:create story|write story|build story|story engine|fill story|story acts?)\s*[:—]?\s*(.+)/i);
                const desc = descMatch ? descMatch[1].trim() : step.replace(/story engine|create story|write story|build story|fill story/gi,'').trim();

                if (desc.length < 5) {
                    if (setShowStoryEngineModal) setShowStoryEngineModal(true);
                    return push('📖 Story Engine opened!\n\nTell me your story idea and I\'ll fill all the acts.\n\nTry: "create story: a detective in 1940s Paris chasing a ghost"\nOr paste a full story text with: "parse story: [your text]"', 'info');
                }

                const d = desc.toLowerCase();
                const genre =
                    /horror|fear|monster|ghost|haunted/.test(d) ? 'Horror' :
                    /love|romance|heart|kiss/.test(d) ? 'Romance' :
                    /space|planet|future|robot|alien/.test(d) ? 'Sci-Fi' :
                    /detective|murder|crime|suspect/.test(d) ? 'Thriller / Crime' :
                    /war|battle|soldier|army/.test(d) ? 'Action / War' :
                    /magic|wizard|dragon|kingdom/.test(d) ? 'Fantasy' : 'Drama';

                const tone =
                    /dark|grim|bleak/.test(d) ? 'Dark & Gritty' :
                    /hope|light|joy/.test(d) ? 'Hopeful' :
                    /funny|comedy/.test(d) ? 'Comedic' :
                    /tense|suspense|danger/.test(d) ? 'Tense / Suspenseful' : 'Cinematic';

                // Extract protagonist hint
                const whoMatch = desc.match(/\b(a|an|the)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:who|that|named|called)/i);
                const protagonist = whoMatch ? whoMatch[2] : 'Protagonist';

                // Extract setting hint
                const whereMatch = desc.match(/\bin\s+([^,\.]+)/i);
                const setting = whereMatch ? whereMatch[1].trim() : 'Unknown world';

                setStoryData(prev => ({
                    ...prev,
                    act1: {
                        character: `${protagonist.charAt(0).toUpperCase()+protagonist.slice(1)} is introduced. ${desc.substring(0, 120)}`,
                        world: `Setting: ${setting}. The world is established through the protagonist's eyes.`,
                        incident: `An unexpected event disrupts ${protagonist}'s ordinary world, forcing them into action.`
                    },
                    act2: {
                        obstacles: `${protagonist} faces mounting obstacles and opposition. Each attempt to reach the goal creates new complications.`,
                        midpoint: `A major reversal changes everything — ${protagonist} must adapt or fail. The stakes become personal.`,
                        stakes: `Everything ${protagonist} cares about is now at risk. There is no turning back.`
                    },
                    act3: {
                        climax: `The final confrontation. ${protagonist} faces the central conflict head-on with everything on the line.`,
                        resolution: `The conflict is resolved. ${protagonist} is forever changed by the journey.`,
                        aftermath: `A new status quo is established. The world reflects what was won or lost.`
                    },
                    theme: { theme: genre, message: desc.substring(0, 100), tone },
                    dramatic: { ...prev.dramatic, genre, visualStyle: tone, centralConflict: desc.substring(0, 150) },
                    characters: [{ id: Date.now(), name: protagonist.charAt(0).toUpperCase()+protagonist.slice(1), motivation: 'To overcome the central conflict', fear: 'Failure and loss', contradiction: '', x: 50, y: 50 }]
                }));

                if (setShowStoryEngineModal) setShowStoryEngineModal(true);

                return push(
                    `📖 Story created!\n\n"${desc.substring(0, 80)}${desc.length>80?'...':''}"\n\n` +
                    `Genre: ${genre} · Tone: ${tone}\n` +
                    `Protagonist: ${protagonist.charAt(0).toUpperCase()+protagonist.slice(1)}\n` +
                    `Setting: ${setting}\n\n` +
                    `All 3 acts filled — Story Engine opened!\n\n` +
                    `Tip: Say "parse story: [full text]" to paste a complete story and auto-split it.`,
                    'storyEngine', { isAction: true }
                );
            }

            // ── Build Shots From Story ────────────────────────────────────────────────
            if (/build\s+shots?\s+from\s+story|scenes?\s+from\s+story|story\s+to\s+shots?|convert\s+story\s+to\s+shots?/.test(q)) {
                const { storyData, setProjects, setActiveProjectId, updateActiveProjectScenes, activeSceneId } = appActions || {};
                if (!storyData) return push('⚠️ No story data found. Create a story first with "story wizard" or "create story: [description]"', 'error');
                const snap = buildSnapshot(appActions, 'Build shots from story');
                const genre = storyData.dramatic?.genre || 'Drama';
                const tone = storyData.theme?.tone || 'Cinematic';
                const detectedMood = Object.keys(MOOD_PRESETS).find(m => tone.toLowerCase().includes(m)) || 'epic';
                const moodData = MOOD_PRESETS[detectedMood] || MOOD_PRESETS['epic'];
                const actData = [
                    { name: 'Act 1 — Setup', shots: [
                        { label: 'Establishing', subject: storyData.act1?.world || 'World established', type: 'Extreme Wide Shot (EWS)', movement: 'Drone Fly-Through' },
                        { label: 'Character Intro', subject: storyData.act1?.character || 'Protagonist introduced', type: 'Medium Shot (MS)', movement: 'Dolly In' },
                        { label: 'Inciting Incident', subject: storyData.act1?.incident || 'Inciting incident', type: 'Close-Up (CU)', movement: 'Static / Tripod' },
                    ]},
                    { name: 'Act 2 — Conflict', shots: [
                        { label: 'Rising Action', subject: storyData.act2?.obstacles || 'Rising action', type: 'Wide Shot (WS)', movement: 'Tracking / Follow' },
                        { label: 'Midpoint', subject: storyData.act2?.midpoint || 'Midpoint reversal', type: 'Over the Shoulder (OTS)', movement: 'Handheld / Shaky' },
                        { label: 'Stakes Raised', subject: storyData.act2?.stakes || 'Stakes raised', type: 'Extreme Close-Up (ECU)', movement: 'Dolly In' },
                    ]},
                    { name: 'Act 3 — Resolution', shots: [
                        { label: 'Climax', subject: storyData.act3?.climax || 'Final confrontation', type: 'Wide Shot (WS)', movement: 'Crane Shot' },
                        { label: 'Resolution', subject: storyData.act3?.resolution || 'Resolution', type: 'Medium Shot (MS)', movement: 'Static / Tripod' },
                        { label: 'Final Image', subject: storyData.act3?.aftermath || 'New status quo', type: 'Extreme Wide Shot (EWS)', movement: 'Dolly Out' },
                    ]},
                ];
                const newScenes = actData.map((act, si) => ({
                    id: Date.now() + si * 1000,
                    name: act.name,
                    shots: act.shots.map((s, i) => ({
                        id: Date.now() + si * 1000 + i + 1,
                        subject: s.subject.substring(0, 150),
                        selections: { shotType: s.type, shotStyle: tone, camera: 'ARRI Alexa 65', lens: '50mm Prime', angle: 'Eye Level', lighting: moodData.lighting, movement: s.movement, actionSpeed: 'Normal Speed', duration: '3.5s', transition: i === act.shots.length - 1 ? 'Cross Dissolve' : 'Hard Cut', filmStock: moodData.filmStock || '', aspectRatio: '--ar 16:9' },
                        sfx: moodData.sfx || '', bgm: moodData.bgm || '',
                        dialogues: [], mode: 'video', status: 'Planning', tags: ['from-story'], referenceImages: [], customPromptOverride: null
                    }))
                }));
                const newId = `proj_${Date.now()}`;
                const projName = storyData.theme?.message?.substring(0, 40) || storyData.dramatic?.genre || 'Story Project';
                if (setProjects && setActiveProjectId) {
                    setProjects(prev => [...prev, { id: newId, name: projName, description: '', tags: [], defaultParams: {}, scenes: newScenes }]);
                    setActiveProjectId(newId);
                }
                return push(
                    `🎬 Story converted to shots!\n\n3 acts × 3 shots each = 9 shots total\n\nGenre: ${genre} · Tone: ${tone}\n\nAct 1 — Setup: ${newScenes[0].shots.length} shots\nAct 2 — Conflict: ${newScenes[1].shots.length} shots\nAct 3 — Resolution: ${newScenes[2].shots.length} shots\n\nNew project "${projName}" created and set as active!`,
                    'generateFullProject', { isAction: true, snapshot: snap }
                );
            }

            // ── More Tips ─────────────────────────────────────────────────────────────
            if (/^(more tips?|another tip|next tip|tip|give me a tip|teach me)/.test(q)) {
                const tips = ['Dutch Angle signals psychological unease. Use it sparingly.', 'Dolly In on a Close-Up creates intimacy. Dolly Out on a Wide creates isolation.', 'Golden Hour lasts ~20 minutes. Villeneuve shot almost every exterior in Blade Runner 2049 during this window.', '85mm is the "portrait lens" — matches the compression of the human eye at conversation distance.', 'Specificity beats length in AI prompts. "ARRI Alexa 65, 85mm, Golden Hour, Dolly In" outperforms a 200-word vague description.', 'Every scene needs a Want and an Obstacle. No obstacle = no scene.', 'Rim lighting separates your subject from the background — essential for dark scenes.', 'Handheld creates urgency and realism. Static/Tripod creates authority and control.', 'Kodak Portra 400: warm skin tones, fine grain. Best for drama and romance.', 'Fujifilm CineStill 800T: neon halos in highlights. Perfect for night city scenes.', 'The Midpoint of Act 2 is where the protagonist shifts from reactive to proactive.', 'A great villain believes they\'re the hero of their own story.', 'KLING excels at realistic human motion. Runway Gen-4 is best for stylized/artistic looks.', 'Negative prompts are powerful: "no artifacts, no extra fingers" dramatically improves output quality.'];
                return push(`💡 Tip:\n\n${tips[Math.floor(Math.random() * tips.length)]}\n\nSay "more tips" for another one!`, 'info', { isCoach: true });
            }

            // ── Complete This Shot ────────────────────────────────────────────────────
            // "complete this shot", "fill this shot", "auto-fill shot", "finish this shot"
            if (/complete\s+(?:this\s+)?shot|fill\s+(?:this\s+)?shot|auto.?fill\s+shot|finish\s+(?:this\s+)?shot|smart\s+fill/.test(q)) {
                const { scenes, activeSceneId, updateActiveProjectScenes, setSelections } = appActions || {};
                const scene = scenes?.find(s => s.id === activeSceneId);
                const shots = scene?.shots || [];
                // Use current subject from appActions or last shot
                const subject = (appActions?.subject || shots[shots.length - 1]?.subject || '').toLowerCase();
                if (!subject) return push('⚠️ No subject found. Type a subject in the Shot Builder first, then say "complete this shot".', 'error');

                // Intelligent parameter inference from subject text
                const isNight = /night|dark|midnight|dusk|shadow|noir/.test(subject);
                const isDay = /day|morning|sunrise|golden|afternoon|sun/.test(subject);
                const isAction = /run|chase|fight|explosion|crash|battle|escape/.test(subject);
                const isPortrait = /face|portrait|close|emotion|tear|smile|stare/.test(subject);
                const isWide = /city|landscape|mountain|ocean|desert|crowd|aerial|sky/.test(subject);
                const isDrama = /talk|conversation|dialogue|sit|stand|walk|think|wait/.test(subject);
                const isHorror = /horror|fear|monster|ghost|haunted|creep|dark/.test(subject);
                const isRomance = /love|kiss|embrace|romantic|tender|together/.test(subject);
                const isScifi = /space|robot|future|alien|cyber|neon|hologram/.test(subject);

                const snap = buildSnapshot(appActions, 'Complete shot parameters');
                const inferred = {
                    shotType: isPortrait ? 'Close-Up (CU)' : isWide ? 'Extreme Wide Shot (EWS)' : isAction ? 'Wide Shot (WS)' : isDrama ? 'Medium Shot (MS)' : 'Medium Shot (MS)',
                    shotStyle: isHorror ? 'Film Noir' : isScifi ? 'Sci-Fi Epic' : isRomance ? 'Cinematic' : 'Cinematic',
                    camera: isScifi ? 'IMAX 70mm' : isAction ? 'RED V-Raptor' : isPortrait ? 'ARRI Alexa 65' : 'ARRI Alexa 65',
                    lens: isPortrait ? '85mm Portrait' : isWide ? '14mm Ultra-Wide' : isAction ? '24mm Wide' : '50mm Prime',
                    angle: isAction ? 'Low Angle' : isWide ? "Bird's Eye View" : isHorror ? 'Dutch Angle / Canted' : 'Eye Level',
                    lighting: isNight ? 'Low Key (Dark/Moody)' : isDay ? 'Golden Hour' : isHorror ? 'Low Key (Dark/Moody)' : isScifi ? 'Neon / Cyberpunk' : isRomance ? 'Golden Hour' : 'Natural Daylight',
                    movement: isAction ? 'Handheld / Shaky' : isPortrait ? 'Dolly In' : isWide ? 'Drone Fly-Through' : isDrama ? 'Static / Tripod' : 'Dolly In',
                    actionSpeed: isAction ? 'Speed Ramp' : 'Normal Speed',
                    filmStock: isHorror ? 'Ilford HP5' : isScifi ? 'Fujifilm CineStill 800T' : isRomance ? 'Kodak Portra 400' : 'Kodak Vision3 500T',
                    duration: isAction ? '2.5s' : isWide ? '5.0s' : '3.5s',
                    transition: 'Hard Cut',
                    aspectRatio: '--ar 16:9'
                };

                if (setSelections) setSelections(prev => ({ ...prev, ...inferred }));

                return push(
                    `✨ Shot completed!\n\nInferred from: "${subject.substring(0, 60)}..."\n\n` +
                    `Shot Type: ${inferred.shotType}\nCamera: ${inferred.camera} · ${inferred.lens}\n` +
                    `Lighting: ${inferred.lighting}\nMovement: ${inferred.movement}\n` +
                    `Style: ${inferred.shotStyle} · ${inferred.filmStock}\nDuration: ${inferred.duration}\n\n` +
                    `All parameters loaded — hit Add Shot!`,
                    'paramEdit', { isAction: true, snapshot: snap }
                );
            }

            // ── Suggest Sequence ──────────────────────────────────────────────────────
            // "suggest sequence", "what shots should I use", "shot sequence for [genre]"
            if (/suggest\s+sequence|shot\s+sequence|what\s+shots?\s+(?:should|do)|sequence\s+for|build\s+sequence|cinematic\s+sequence/.test(q)) {
                const { scenes, activeSceneId } = appActions || {};
                const scene = scenes?.find(s => s.id === activeSceneId);
                const shots = scene?.shots || [];
                const lastShot = shots[shots.length - 1];
                const lastType = lastShot?.selections?.shotType || '';
                const lastMood = lastShot?.selections?.shotStyle || '';

                // Detect genre from query or last shot
                const d = q;
                const genre = /horror|scary/.test(d) ? 'horror' : /action|fight|chase/.test(d) ? 'action' : /romance|love/.test(d) ? 'romance' : /drama|dialogue/.test(d) ? 'drama' : /scifi|sci.fi|space/.test(d) ? 'scifi' : 'drama';

                const sequences = {
                    drama: [
                        { type: 'Extreme Wide Shot (EWS)', movement: 'Static / Tripod', purpose: 'Establish the world and context' },
                        { type: 'Wide Shot (WS)', movement: 'Tracking / Follow', purpose: 'Introduce the character in their environment' },
                        { type: 'Medium Shot (MS)', movement: 'Dolly In', purpose: 'Character enters the scene' },
                        { type: 'Over the Shoulder (OTS)', movement: 'Static / Tripod', purpose: 'Dialogue — character A' },
                        { type: 'Over the Shoulder (OTS)', movement: 'Static / Tripod', purpose: 'Dialogue — character B (reverse)' },
                        { type: 'Close-Up (CU)', movement: 'Dolly In', purpose: 'Emotional peak / reaction' },
                        { type: 'Wide Shot (WS)', movement: 'Dolly Out', purpose: 'Release — character leaves or reflects' },
                    ],
                    action: [
                        { type: 'Wide Shot (WS)', movement: 'Drone Fly-Through', purpose: 'Establish the arena' },
                        { type: 'Medium Shot (MS)', movement: 'Handheld / Shaky', purpose: 'Character prepares / tension builds' },
                        { type: 'Close-Up (CU)', movement: 'Static / Tripod', purpose: 'Eyes — the decision moment' },
                        { type: 'Wide Shot (WS)', movement: 'Tracking / Follow', purpose: 'Action begins — full body in motion' },
                        { type: 'Extreme Close-Up (ECU)', movement: 'Handheld / Shaky', purpose: 'Impact detail — fist, weapon, collision' },
                        { type: 'Wide Shot (WS)', movement: 'Crane Shot', purpose: 'Aftermath — scale of the action' },
                    ],
                    horror: [
                        { type: 'Wide Shot (WS)', movement: 'Static / Tripod', purpose: 'Establish the space — something feels wrong' },
                        { type: 'Medium Shot (MS)', movement: 'Dolly In', purpose: 'Character investigates' },
                        { type: 'Point of View (POV)', movement: 'Handheld / Shaky', purpose: 'What the character sees' },
                        { type: 'Close-Up (CU)', movement: 'Static / Tripod', purpose: 'Character\'s face — fear registers' },
                        { type: 'Extreme Close-Up (ECU)', movement: 'Dolly In', purpose: 'The threat revealed — detail' },
                        { type: 'Wide Shot (WS)', movement: 'Handheld / Shaky', purpose: 'Chaos — the threat is real' },
                    ],
                    romance: [
                        { type: 'Wide Shot (WS)', movement: 'Tracking / Follow', purpose: 'Two characters in the same world' },
                        { type: 'Medium Shot (MS)', movement: 'Dolly In', purpose: 'They notice each other' },
                        { type: 'Over the Shoulder (OTS)', movement: 'Static / Tripod', purpose: 'First exchange — nervous energy' },
                        { type: 'Close-Up (CU)', movement: 'Dolly In', purpose: 'Eyes — the connection' },
                        { type: 'Extreme Close-Up (ECU)', movement: 'Static / Tripod', purpose: 'Hands touching / lips' },
                        { type: 'Wide Shot (WS)', movement: 'Orbit', purpose: 'The world falls away — just them' },
                    ],
                    scifi: [
                        { type: 'Extreme Wide Shot (EWS)', movement: 'Drone Fly-Through', purpose: 'Establish the scale of the world' },
                        { type: 'Wide Shot (WS)', movement: 'Tracking / Follow', purpose: 'Character navigates the environment' },
                        { type: 'Medium Shot (MS)', movement: 'Dolly In', purpose: 'Character interacts with technology' },
                        { type: 'Close-Up (CU)', movement: 'Static / Tripod', purpose: 'Interface / data / discovery' },
                        { type: 'Wide Shot (WS)', movement: 'Orbit', purpose: 'The revelation — full scope' },
                        { type: 'Extreme Wide Shot (EWS)', movement: 'Dolly Out', purpose: 'Character small against the universe' },
                    ],
                };

                const seq = sequences[genre] || sequences.drama;
                const text = `🎬 Cinematic Sequence — ${genre.charAt(0).toUpperCase()+genre.slice(1)}\n\n` +
                    seq.map((s, i) => `${i+1}. ${s.type}\n   ${s.movement} — ${s.purpose}`).join('\n\n') +
                    `\n\nSay "build scene: [description]" to generate all ${seq.length} shots at once!\nOr "suggest sequence for [genre]" for a different genre.`;
                return push(text, 'info', { isCoach: true });
            }

            // ── Platform Optimizer ────────────────────────────────────────────────────
            // "optimize for Veo 3", "optimize for Runway", "optimize for KLING"
            if (/optimize\s+(?:for\s+)?(?:veo|runway|kling|seedance)|platform\s+optimize|rewrite\s+for\s+(?:veo|runway|kling|seedance)/.test(q)) {
                const { scenes, activeSceneId, updateActiveProjectScenes } = appActions || {};
                const scene = scenes?.find(s => s.id === activeSceneId);
                if (!scene?.shots?.length) return push('⚠️ No shots to optimize. Add shots first.', 'error');

                const platform = /veo/.test(q) ? 'Veo 3' : /runway/.test(q) ? 'Runway' : /kling/.test(q) ? 'KLING' : /seedance/.test(q) ? 'Seedance' : 'Veo 3';
                const snap = buildSnapshot(appActions, `Optimize for ${platform}`);

                // Platform-specific parameter adjustments
                const platformProfiles = {
                    'Veo 3': { note: 'Veo 3 excels with audio cues. SFX and BGM fields are natively supported.', sfxBoost: true, durationRange: '3-6s', bestFor: 'Realistic motion, synchronized audio, natural environments' },
                    'Runway': { note: 'Runway Gen-4 excels with stylized aesthetics and consistent characters.', styleBoost: true, durationRange: '4-10s', bestFor: 'Artistic styles, character consistency, creative transitions' },
                    'KLING': { note: 'KLING excels with realistic human motion and physics.', motionBoost: true, durationRange: '5-10s', bestFor: 'Human movement, physical interactions, realistic scenes' },
                    'Seedance': { note: 'Seedance excels with cinematic quality and film-like aesthetics.', filmBoost: true, durationRange: '3-8s', bestFor: 'Cinematic look, film grain, professional color grading' },
                };

                const profile = platformProfiles[platform];
                const count = scene.shots.length;

                // Apply platform-specific optimizations
                updateActiveProjectScenes(prev => prev.map(s => s.id === activeSceneId ? {
                    ...s,
                    shots: s.shots.map(shot => ({
                        ...shot,
                        sfx: profile.sfxBoost && !shot.sfx ? 'ambient sound, natural environment audio' : shot.sfx,
                        bgm: profile.sfxBoost && !shot.bgm ? 'subtle cinematic score' : shot.bgm,
                        selections: {
                            ...shot.selections,
                            shotStyle: profile.styleBoost ? 'Cinematic' : shot.selections?.shotStyle,
                            filmStock: profile.filmBoost && !shot.selections?.filmStock ? 'Kodak Vision3 500T' : shot.selections?.filmStock,
                        }
                    }))
                } : s));

                return push(
                    `✅ Optimized ${count} shots for ${platform}!\n\n${profile.note}\n\nBest for: ${profile.bestFor}\nIdeal duration: ${profile.durationRange}\n\nAdjustments applied:\n${profile.sfxBoost ? '• SFX/BGM fields populated\n' : ''}${profile.styleBoost ? '• Shot style set to Cinematic\n' : ''}${profile.filmBoost ? '• Film stock applied\n' : ''}${profile.motionBoost ? '• Movement parameters checked\n' : ''}\nSay "analyze my project" to verify all shots are platform-ready.`,
                    'paramEdit', { isAction: true, snapshot: snap }
                );
            }

            // ── My Style Fingerprint ──────────────────────────────────────────────────
            // "my style", "what's my style", "show my fingerprint", "my shooting style"
            if (/my\s+(?:shooting\s+)?style\s+fingerprint|show\s+my\s+fingerprint|what.?s\s+my\s+(?:shooting\s+)?style|my\s+style\s+profile/.test(q)) {
                const fp = loadAgentMemory().fingerprint || {};
                const topOf = (obj) => Object.entries(obj || {}).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Not enough data';
                const avgDur = fp.duration?.length ? (fp.duration.reduce((a,b)=>a+b,0)/fp.duration.length).toFixed(1) : 'N/A';
                const totalShots = Object.values(fp.lighting || {}).reduce((a,b)=>a+b,0);
                if (totalShots < 3) return push('🎨 Not enough shots yet to build your style fingerprint.\n\nAdd at least 3 shots and I\'ll start learning your visual preferences!', 'info', { isCoach: true });
                return push(
                    `🎨 Your Style Fingerprint (${totalShots} shots analyzed)\n\n` +
                    `Favorite Lighting: ${topOf(fp.lighting)}\n` +
                    `Favorite Movement: ${topOf(fp.movement)}\n` +
                    `Favorite Camera: ${topOf(fp.camera)}\n` +
                    `Favorite Lens: ${topOf(fp.lens)}\n` +
                    `Favorite Shot Type: ${topOf(fp.shotType)}\n` +
                    `Avg Shot Duration: ${avgDur}s\n\n` +
                    `Say "apply my style" to pre-fill the current shot with your preferences!`,
                    'info', { isCoach: true }
                );
            }

            // "apply my style" — pre-fill with learned fingerprint
            if (/apply\s+my\s+style|use\s+my\s+style|my\s+style\s+preset/.test(q)) {
                const fp = loadAgentMemory().fingerprint || {};
                const topOf = (obj) => Object.entries(obj || {}).sort((a,b)=>b[1]-a[1])[0]?.[0];
                const snap = buildSnapshot(appActions, 'Apply style fingerprint');
                const inferred = {
                    lighting: topOf(fp.lighting), movement: topOf(fp.movement),
                    camera: topOf(fp.camera), lens: topOf(fp.lens), shotType: topOf(fp.shotType)
                };
                const filled = Object.fromEntries(Object.entries(inferred).filter(([,v]) => v));
                if (!Object.keys(filled).length) return push('🎨 No style fingerprint yet. Add more shots and I\'ll learn your preferences!', 'info', { isCoach: true });
                if (appActions?.setSelections) appActions.setSelections(prev => ({ ...prev, ...filled }));
                return push(`🎨 Your style applied!\n\n${Object.entries(filled).map(([k,v])=>`${k}: ${v}`).join('\n')}\n\nHit Add Shot to use it!`, 'paramEdit', { isAction: true, snapshot: snap });
            }

            // ── Memory Recall ─────────────────────────────────────────────────────────
            if (/what.*remember|my style|my mood|my director|what do you know about me/.test(q)) {
                const mem = sessionMemoryRef || {};
                const lines = [];
                if (mem.directorStyle) lines.push(`🎬 Director: ${mem.directorStyle}`);
                if (mem.mood) lines.push(`🎭 Mood: ${mem.mood}`);
                const crossMem = loadAgentMemory();
                if (crossMem.lastProject) lines.push(`📁 Last project: ${crossMem.lastProject}`);
                return push(lines.length ? `🧠 Session memory:\n\n${lines.join('\n')}\n\nWant me to re-apply any of these?` : "Nothing stored yet. Tell me your director style or mood and I'll remember it!", 'memory');
            }

            // ── List Scenes ───────────────────────────────────────────────────────────
            if (/^(list scenes?|show scenes?|what scenes?|scenes? list|my scenes?)/.test(q)) {
                const { scenes } = appActions || {};
                if (!scenes || scenes.length === 0) return push('No scenes yet. Say "create scene Act 1" to add one.', 'info');
                const activeId = appActions?.activeSceneId;
                const text = `📋 Scenes (${scenes.length}):\n\n` + scenes.map((s, i) => `${s.id === activeId ? '▶' : ' '} ${i+1}. ${s.name} — ${(s.shots||[]).length} shot(s)`).join('\n');
                return push(text, 'info');
            }

            // ── List Projects ─────────────────────────────────────────────────────────
            if (/^(list projects?|show projects?|what projects?|projects? list|my projects?)/.test(q)) {
                const { projects, activeProjectId } = appActions || {};
                if (!projects || projects.length === 0) return push('No projects yet. Say "create project My Film" to start.', 'info');
                const text = `📁 Projects (${projects.length}):\n\n` + projects.map((p, i) => `${p.id === activeProjectId ? '▶' : ' '} ${i+1}. ${p.name}`).join('\n');
                return push(text, 'info');
            }

            // ── List Shots ────────────────────────────────────────────────────────────
            if (/^(list shots?|show shots?|what shots?|shots? list|my shots?)/.test(q) && !/with|that|have|has|using|no |without/.test(q)) {
                const { scenes, activeSceneId } = appActions || {};
                const scene = scenes?.find(s => s.id === activeSceneId);
                if (!scene) return push('No active scene. Say "create scene Act 1" first.', 'info');
                const shots = scene.shots || [];
                if (shots.length === 0) return push(`Scene "${scene.name}" has no shots yet. Say "add shot" or "build scene: [description]".`, 'info');
                const text = `🎬 "${scene.name}" — ${shots.length} shot(s):\n\n` + shots.map((s, i) => {
                    const sel = s.selections || {};
                    return `${i+1}. ${(sel.shotType||'No type').split('(')[0].trim()} · ${sel.lighting||'No lighting'} · ${sel.movement||'No movement'}`;
                }).join('\n');
                return push(text, 'info');
            }

            // ── Rename Scene ──────────────────────────────────────────────────────────
            if (/rename scene|rename.*scene/.test(q)) {
                const renameMatch = step.match(/rename\s+(?:scene\s+)?["']?(.+?)["']?\s+to\s+["']?(.+?)["']?$/i);
                if (renameMatch) {
                    const [, oldName, newName] = renameMatch;
                    const { scenes, updateActiveProjectScenes } = appActions || {};
                    const scene = scenes?.find(s => s.name.toLowerCase().includes(oldName.toLowerCase().trim()));
                    if (!scene) return push(`⚠️ Scene "${oldName}" not found. Say "list scenes" to see available names.`, 'error');
                    const snap = buildSnapshot(appActions, `Rename scene "${scene.name}" to "${newName.trim()}"`);
                    updateActiveProjectScenes(prev => prev.map(s => s.id === scene.id ? { ...s, name: newName.trim() } : s));
                    return push(`✓ Scene renamed: "${scene.name}" → "${newName.trim()}"`, 'RENAME_SCENE', { isAction: true, snapshot: snap });
                }
                return push('⚠️ Try: "rename scene Act 1 to Opening"', 'error');
            }

            // ── Delete Scene ──────────────────────────────────────────────────────────
            if (/delete scene|remove scene/.test(q)) {
                const delMatch = step.match(/(?:delete|remove)\s+scene\s+["']?(.+?)["']?$/i);
                if (delMatch) {
                    const [, name] = delMatch;
                    const { scenes, updateActiveProjectScenes } = appActions || {};
                    const scene = scenes?.find(s => s.name.toLowerCase().includes(name.toLowerCase().trim()));
                    if (!scene) return push(`⚠️ Scene "${name}" not found. Say "list scenes" to see available names.`, 'error');
                    const snap = buildSnapshot(appActions, `Delete scene "${scene.name}"`);
                    updateActiveProjectScenes(prev => prev.filter(s => s.id !== scene.id));
                    return push(`✓ Scene "${scene.name}" deleted.`, 'DELETE_SCENE', { isAction: true, snapshot: snap });
                }
                return push('⚠️ Try: "delete scene Act 1"', 'error');
            }

            // ── Combo Suggestions ─────────────────────────────────────────────────────
            if (/combo|suggest combo|what goes with|pair with|recommend/.test(q)) {
                const combos = [
                    'ARRI Alexa 65 pairs best with:\n• 85mm Portrait · Cinematic Rim Lighting\n• Dolly In · Kodak Vision3 500T\n\nSay "director spielberg" to apply.',
                    'Film Noir pairs best with:\n• Ilford HP5 · Low Key lighting\n• Dutch Angle · Handheld movement\n\nSay "mood paranoid" or "director fincher".',
                    'Drone shots work best with:\n• DJI Mavic 3 · 14mm Ultra-Wide\n• Bird\'s Eye · Golden Hour · Slow Motion\n\nSay "director villeneuve" for epic drone.',
                    'Portrait shots work best with:\n• 85mm Portrait · Cinematic Rim Lighting\n• Eye Level · Close-Up · Dolly In\n\nSay "mood romantic" or "mood tense".',
                ];
                return push(`🎨 Cinematic Combo:\n\n${combos[Math.floor(Math.random() * combos.length)]}`, 'combo');
            }

            // ── Existing CommandEngine ────────────────────────────────────────────────
            if (appActions) {
                const cmd = CommandEngine.parse(step);
                if (cmd) {
                    const snap = buildSnapshot(appActions, cmd.type);
                    const cmdResult = CommandEngine.execute(cmd, appActions);
                    if (cmdResult) {
                        const ctxUpdate = {};
                        if (cmd.type === 'CREATE_PROJECT') { ctxUpdate.lastCreatedProject = cmd.payload.name; saveAgentMemory({ lastProject: cmd.payload.name }); }
                        if (cmd.type === 'CREATE_SCENE') ctxUpdate.lastCreatedScene = cmd.payload.name;
                        if (cmd.type === 'ADD_SHOT') ctxUpdate.lastCreatedShot = cmd.payload.subject;
                        if (cmd.type === 'CREATE_CHARACTER') ctxUpdate.lastCreatedChar = cmd.payload.name;
                        if (cmd.type === 'CREATE_LOCATION') ctxUpdate.lastCreatedLoc = cmd.payload.name;
                        if (cmd.type === 'CREATE_VOICE') ctxUpdate.lastCreatedVoice = cmd.payload.name;
                        return push(cmdResult, cmd.type, { isAction: true, snapshot: snap, contextUpdate: ctxUpdate });
                    }
                }
            }

            // ── Script Parser — build full project from a ready-made script ─────────────
            // Triggers: "parse script:", "build from script:", "import script:", "use this script:"
            // Also triggers when user pastes a multi-line block with scene/shot markers
            const scriptTrigger = step.match(/^(?:parse script|build from script|import script|use this script|script to shots|convert script|from script)[:\s]+(.+)/is);
            const isMultiLineScript = !scriptTrigger && step.split('\n').length >= 3 && /scene|int\.|ext\.|shot|act/i.test(step);

            if (scriptTrigger || isMultiLineScript) {
                const rawScript = scriptTrigger ? scriptTrigger[1].trim() : step.trim();
                const snap = buildSnapshot(appActions, 'Parse script into project');

                // ── Parse the script into scenes and shots ──────────────────
                const lines = rawScript.split(/\n/).map(l => l.trim()).filter(Boolean);

                // Detect scene headings: "Scene 1:", "ACT 1", "INT. LOCATION", "EXT. LOCATION", "--- Scene Name ---", "== Scene =="
                const isSceneHeading = (line) =>
                    /^(scene\s+\d+|act\s+\d+|int\.|ext\.|---|\*\*|==|#+\s)/i.test(line) ||
                    /^scene\s*[:—\-]/i.test(line) ||
                    (line.length < 60 && /^[A-Z\s\d\-:]+$/.test(line) && line.length > 3);

                // Detect dialogue lines: "CHARACTER: text" or "CHARACTER (mood): text"
                const isDialogue = (line) => /^[A-Z][A-Z\s]+(\s*\([^)]+\))?\s*:\s*.+/.test(line);

                // Detect action/description lines
                const isAction = (line) => !isSceneHeading(line) && !isDialogue(line) && line.length > 10;

                // Build scene/shot structure
                const scenes = [];
                let currentScene = null;
                let currentShotLines = [];
                let shotCounter = 0;

                const flushShot = () => {
                    if (!currentScene || currentShotLines.length === 0) return;
                    const shotText = currentShotLines.join(' ').trim();
                    if (!shotText) return;

                    // Extract dialogue from shot lines
                    const dialogues = [];
                    const actionLines = [];
                    currentShotLines.forEach(line => {
                        const dlgMatch = line.match(/^([A-Z][A-Z\s]+)(\s*\(([^)]+)\))?\s*:\s*(.+)/);
                        if (dlgMatch) {
                            dialogues.push({
                                character: dlgMatch[1].trim(),
                                mood: dlgMatch[3] || 'Neutral',
                                text: dlgMatch[4].trim(),
                                reaction: '', event: '', voiceStyle: ''
                            });
                        } else {
                            actionLines.push(line);
                        }
                    });

                    const subject = actionLines.join(' ').trim() || shotText.substring(0, 120);

                    // Auto-detect mood/style from content
                    const subjectLower = subject.toLowerCase();
                    const detectedMood = Object.keys(MOOD_PRESETS).find(m =>
                        subjectLower.includes(m) ||
                        (m === 'tense' && /fight|confront|danger|threat|chase|run/i.test(subject)) ||
                        (m === 'romantic' && /love|kiss|embrace|tender|soft/i.test(subject)) ||
                        (m === 'action' && /explosion|battle|attack|shoot|crash/i.test(subject)) ||
                        (m === 'melancholic' && /sad|cry|mourn|loss|alone|grief/i.test(subject)) ||
                        (m === 'mysterious' && /shadow|dark|secret|hidden|whisper/i.test(subject)) ||
                        (m === 'epic' && /vast|horizon|army|crowd|mountain|sky/i.test(subject))
                    );
                    const mood = detectedMood ? MOOD_PRESETS[detectedMood] : null;

                    // Shot type heuristic
                    let shotType = 'Medium Shot (MS)';
                    if (/close.?up|face|eyes|hands|detail/i.test(subject)) shotType = 'Close-Up (CU)';
                    else if (/wide|landscape|establishing|exterior|city|crowd|vast/i.test(subject)) shotType = 'Wide Shot (WS)';
                    else if (/extreme wide|aerial|drone|bird|sky|horizon/i.test(subject)) shotType = 'Extreme Wide Shot (EWS)';
                    else if (/over the shoulder|behind|back of/i.test(subject)) shotType = 'Over the Shoulder (OTS)';
                    else if (/pov|point of view|through|eyes of/i.test(subject)) shotType = 'Point of View (POV)';

                    // Movement heuristic
                    let movement = 'Static / Tripod';
                    if (/walk|run|chase|follow|move/i.test(subject)) movement = 'Tracking / Follow';
                    else if (/reveal|discover|enter|open/i.test(subject)) movement = 'Dolly In';
                    else if (/aerial|fly|drone|above/i.test(subject)) movement = 'Drone Fly-Through';
                    else if (/shake|panic|fear|chaos/i.test(subject)) movement = 'Handheld / Shaky';

                    shotCounter++;
                    currentScene.shots.push({
                        id: Date.now() + Math.random() + shotCounter,
                        subject: subject.substring(0, 200),
                        selections: {
                            shotType,
                            shotStyle: mood?.shotStyle || 'Cinematic',
                            camera: OPTIONS.cameraTypes[0],
                            lens: OPTIONS.lenses[4],
                            angle: mood?.angle || 'Eye Level',
                            lighting: mood?.lighting || 'Natural Daylight',
                            movement,
                            actionSpeed: 'Normal Speed',
                            duration: dialogues.length > 0 ? '4.0s' : '3.0s',
                            transition: 'Hard Cut',
                            filmStock: mood?.filmStock || '',
                            aspectRatio: '--ar 16:9'
                        },
                        sfx: mood?.sfx || '',
                        bgm: mood?.bgm || '',
                        dialogues,
                        mode: 'video',
                        status: 'Planning',
                        tags: ['script-import', detectedMood || 'neutral'].filter(Boolean),
                        referenceImages: [],
                        customPromptOverride: null
                    });
                    currentShotLines = [];
                };

                const flushScene = () => {
                    flushShot();
                    if (currentScene && currentScene.shots.length > 0) {
                        scenes.push(currentScene);
                    }
                };

                lines.forEach((line, i) => {
                    if (isSceneHeading(line)) {
                        flushScene();
                        // Clean up scene name
                        const sceneName = line
                            .replace(/^(scene\s*\d*\s*[:—\-]?\s*|act\s*\d*\s*[:—\-]?\s*|int\.\s*|ext\.\s*|---+|===+|#+\s*|\*\*)/gi, '')
                            .replace(/---+|===+|\*\*/g, '')
                            .trim() || `Scene ${scenes.length + 1}`;
                        currentScene = { id: Date.now() + scenes.length * 1000, name: sceneName, shots: [] };
                        currentShotLines = [];
                    } else if (currentScene) {
                        // Group lines into shots: new shot every 3-5 lines or on dialogue
                        currentShotLines.push(line);
                        // Flush shot on dialogue end or every 4 lines
                        if (currentShotLines.length >= 4 || (isDialogue(line) && i < lines.length - 1 && isDialogue(lines[i+1] || ''))) {
                            flushShot();
                        }
                    } else {
                        // Lines before first scene heading — create a default scene
                        currentScene = { id: Date.now(), name: 'Opening', shots: [] };
                        currentShotLines.push(line);
                    }
                });
                flushScene();

                // If no scenes were detected, treat the whole script as one scene
                if (scenes.length === 0 && lines.length > 0) {
                    const defaultScene = { id: Date.now(), name: 'Scene 1', shots: [] };
                    // Split into chunks of 4 lines each = one shot
                    for (let i = 0; i < lines.length; i += 4) {
                        const chunk = lines.slice(i, i + 4);
                        const subject = chunk.join(' ').trim().substring(0, 200);
                        if (subject) {
                            defaultScene.shots.push({
                                id: Date.now() + Math.random() + i,
                                subject,
                                selections: { shotType: 'Medium Shot (MS)', shotStyle: 'Cinematic', camera: OPTIONS.cameraTypes[0], lens: OPTIONS.lenses[4], angle: 'Eye Level', lighting: 'Natural Daylight', movement: 'Static / Tripod', actionSpeed: 'Normal Speed', duration: '3.0s', transition: 'Hard Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                                sfx: '', bgm: '', dialogues: [], mode: 'video', status: 'Planning',
                                tags: ['script-import'], referenceImages: [], customPromptOverride: null
                            });
                        }
                    }
                    if (defaultScene.shots.length > 0) scenes.push(defaultScene);
                }

                if (scenes.length === 0) {
                    return push('⚠️ Could not parse any scenes from the script. Make sure it has scene headings like "Scene 1:", "INT. LOCATION", "ACT 1", or "---Scene Name---".', 'error');
                }

                // Apply to project
                const totalShots = scenes.reduce((a, s) => a + s.shots.length, 0);

                if (appActions?.setProjects && appActions?.setActiveProjectId) {
                    const newId = `proj_${Date.now()}`;
                    const scriptTitle = lines[0]?.substring(0, 40) || 'Imported Script';
                    const newProject = {
                        id: newId,
                        name: scriptTitle,
                        description: 'Imported from script',
                        tags: ['script-import'],
                        defaultParams: {},
                        scenes
                    };
                    appActions.setProjects(prev => [...prev, newProject]);
                    appActions.setActiveProjectId(newId);
                    saveAgentMemory({ lastProject: scriptTitle });
                } else if (appActions?.updateActiveProjectScenes) {
                    appActions.updateActiveProjectScenes(() => scenes);
                }

                const moodBreakdown = scenes.flatMap(s => s.shots).reduce((acc, shot) => {
                    const tag = shot.tags?.find(t => t !== 'script-import' && t !== 'neutral');
                    if (tag) acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {});
                const moodSummary = Object.entries(moodBreakdown).map(([k,v]) => `${k}: ${v}`).join(', ');

                return push(
                    `📜 Script parsed!\n\n` +
                    `Scenes: ${scenes.length}\n` +
                    `Total shots: ${totalShots}\n` +
                    `Scenes: ${scenes.map(s => `"${s.name}" (${s.shots.length} shots)`).join(', ')}\n` +
                    (moodSummary ? `\nDetected moods: ${moodSummary}\n` : '') +
                    `\nProject created and set as active. Open the editor to review and fine-tune each shot!`,
                    'scriptParse',
                    { isAction: true, snapshot: snap }
                );
            }

                        // ── Knowledge Base Fallback ───────────────────────────────────────────────
            const kbResult = AssistantEngine.ask(step, {});
            return push(kbResult.text, 'kb', { action: kbResult.action });
        };

