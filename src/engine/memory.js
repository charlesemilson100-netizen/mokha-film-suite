export const SESSION_MEMORY_KEY = 'mokha_agent_memory';

export const loadAgentMemory = () => { try { return JSON.parse(localStorage.getItem(SESSION_MEMORY_KEY) || '{}'); } catch { return {}; } };

export const saveAgentMemory = (data) => { try { localStorage.setItem(SESSION_MEMORY_KEY, JSON.stringify({ ...loadAgentMemory(), ...data, lastSeen: new Date().toLocaleDateString() })); } catch {} };

// ── Director Profile System ──────────────────────────────────────────
        export const DIRECTOR_PROFILE_KEY = 'mokha_director_profile';

export const loadDirectorProfile = () => { try { return JSON.parse(localStorage.getItem(DIRECTOR_PROFILE_KEY) || 'null'); } catch { return null; } };

export const saveDirectorProfile = (profile) => { try { localStorage.setItem(DIRECTOR_PROFILE_KEY, JSON.stringify(profile)); } catch {} };

// Interview questions — agent asks these one by one
        export const PROFILE_QUESTIONS = [
            { key: 'name',       q: "First things first — what's your name? I want to address you properly. 🎬" },
            { key: 'level',      q: (name) => `Nice to meet you, ${name}! What's your level in filmmaking?\n\n1. Beginner — just getting started\n2. Intermediate — some experience\n3. Advanced — professional background\n4. Veteran — industry expert\n\nJust type the number or describe yourself.` },
            { key: 'aiExp',      q: (name, p) => `Got it, ${p.level}! How comfortable are you with AI video tools like Runway, Veo 3, or KLING?\n\n1. Never used them\n2. Tried a few times\n3. Use them regularly\n4. Power user — I know the tricks\n\nType the number or tell me more.` },
            { key: 'genre',      q: () => `What genres or styles do you love most? (e.g. Sci-Fi, Horror, Action, Drama, Documentary, Noir, Fantasy — or mix them up!)` },
            { key: 'goal',       q: (name) => `What's your big goal, ${name}? What do you want to achieve with MOKHA and AI filmmaking? Dream big — I'm listening. 🎥` },
            { key: 'inspiration',q: () => `Last one — who's your biggest filmmaking inspiration? A director, a film, or a visual style that drives you?` },
        ];

// Build a personalized system context string from the profile
        export const buildProfileContext = (profile) => {
            if (!profile || !profile.name) return '';
            return `The user's name is ${profile.name}. They are a ${profile.level || 'filmmaker'} with ${profile.aiExp || 'some'} AI tool experience. Their favorite genres: ${profile.genre || 'various'}. Their goal: ${profile.goal || 'to create great films'}. Inspired by: ${profile.inspiration || 'great cinema'}. Always address them by name (${profile.name}) when appropriate. Be warm, personal, and encouraging.`;
        };

// ── TASK 2: buildSnapshot & restoreSnapshot ──────────────────────────────────
        export const buildSnapshot = (appActions, description) => {
            const { scenes, projects, globalCharacters, globalLocations, globalVoiceStyles, activeSceneId, activeProjectId } = appActions || {};
            return {
                scenes: JSON.parse(JSON.stringify(scenes || [])),
                projects: JSON.parse(JSON.stringify(projects || [])),
                globalCharacters: JSON.parse(JSON.stringify(globalCharacters || [])),
                globalLocations: JSON.parse(JSON.stringify(globalLocations || [])),
                globalVoiceStyles: JSON.parse(JSON.stringify(globalVoiceStyles || [])),
                activeSceneId,
                activeProjectId,
                description: description || 'Action',
                ts: Date.now()
            };
        };

export const restoreSnapshot = (snapshot, appActions) => {
            if (!snapshot || !appActions) return;
            const { setProjects, setActiveProjectId, updateActiveProjectScenes, setActiveSceneId, setGlobalCharacters, setGlobalLocations, setGlobalVoiceStyles } = appActions;
            if (setProjects) setProjects(JSON.parse(JSON.stringify(snapshot.projects)));
            if (setActiveProjectId && snapshot.activeProjectId) setActiveProjectId(snapshot.activeProjectId);
            if (setActiveSceneId && snapshot.activeSceneId) setActiveSceneId(snapshot.activeSceneId);
            if (setGlobalCharacters) setGlobalCharacters(JSON.parse(JSON.stringify(snapshot.globalCharacters)));
            if (setGlobalLocations) setGlobalLocations(JSON.parse(JSON.stringify(snapshot.globalLocations)));
            if (setGlobalVoiceStyles) setGlobalVoiceStyles(JSON.parse(JSON.stringify(snapshot.globalVoiceStyles)));
            // Restore scenes via updateActiveProjectScenes using the snapshotted scenes
            if (updateActiveProjectScenes && snapshot.scenes) {
                const restoredScenes = JSON.parse(JSON.stringify(snapshot.scenes));
                updateActiveProjectScenes(() => restoredScenes);
            }
        };

