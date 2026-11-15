// ── Director Intelligence Suite: buildProjectSnapshot ─────────────────
        export function buildProjectSnapshot(appActions) {
            if (!appActions) return null;
            const { projects, activeProjectId, scenes, activeSceneId, globalCharacters, globalLocations } = appActions;
            const activeProject = (projects || []).find(p => p.id === activeProjectId) || (projects || [])[0];
            const activeScene = (scenes || []).find(s => s.id === activeSceneId) || (scenes || [])[0];
            return {
                projectName: activeProject?.name || 'Untitled',
                scenes: scenes || [],
                activeScene: activeScene || null,
                characters: globalCharacters || [],
                locations: globalLocations || [],
            };
        }

