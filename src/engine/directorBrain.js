import { ACTION_TYPES, INTENT_PATTERNS } from '../data/catalog';
import { DIRECTOR_STYLES } from '../data/presets';
import { loadDirectorProfile } from './memory';

// ─── End Director Agentic Mode constants ──────────────────────────────────

        // ─── End Director Intelligence Suite constants ────────────────────────────

        // ─── FastBrain ────────────────────────────────────────────────────────────
        export const FAST_BRAIN_PATTERNS = [
            // ── Director Style Rewrites (5) ──────────────────────────────────────
            {
                id: 'style_kubrick',
                category: 'style',
                description: 'Rewrite scene in Kubrick style',
                test: (q) => /kubrick/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'kubrick'),
            },
            {
                id: 'style_nolan',
                category: 'style',
                description: 'Rewrite scene in Nolan style',
                test: (q) => /nolan/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'nolan'),
            },
            {
                id: 'style_villeneuve',
                category: 'style',
                description: 'Rewrite scene in Villeneuve style',
                test: (q) => /villeneuve/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'villeneuve'),
            },
            {
                id: 'style_tarantino',
                category: 'style',
                description: 'Rewrite scene in Tarantino style',
                test: (q) => /tarantino/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'tarantino'),
            },
            {
                id: 'style_scorsese',
                category: 'style',
                description: 'Rewrite scene in Scorsese style',
                test: (q) => /scorsese/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'scorsese'),
            },
            {
                id: 'style_cameron',
                category: 'style',
                description: 'Rewrite scene in James Cameron style',
                test: (q) => /cameron/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'james cameron'),
            },
            {
                id: 'style_coogler',
                category: 'style',
                description: 'Rewrite scene in Ryan Coogler style',
                test: (q) => /coogler/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'ryan coogler'),
            },
            {
                id: 'style_snyder',
                category: 'style',
                description: 'Rewrite scene in Zack Snyder style',
                test: (q) => /snyder/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'zack snyder'),
            },
            {
                id: 'style_emilson',
                category: 'style',
                description: 'Rewrite scene in Charles Emilson style',
                test: (q) => /emilson|charles/.test(q) && /rewrite|apply|style/.test(q),
                respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'charles emilson'),
            },
            // ── Continuity Checks (3) ─────────────────────────────────────────────
            {
                id: 'continuity_check',
                category: 'continuity',
                description: 'Check continuity across all shots',
                test: (q) => /continuity|consistent|match/.test(q),
                respond: (q, snap) => FastBrain.runContinuityReport(snap),
            },
            {
                id: 'continuity_costume',
                category: 'continuity',
                description: 'Check costume/wardrobe continuity',
                test: (q) => /costume|wardrobe|outfit|clothing/.test(q),
                respond: (q, snap) => FastBrain.checkCostumeConsistency(snap),
            },
            {
                id: 'continuity_location',
                category: 'continuity',
                description: 'Check location continuity',
                test: (q) => /location|setting|place|where/.test(q) && /continuity|consistent|match/.test(q),
                respond: (q, snap) => FastBrain.checkLocationConsistency(snap),
            },
            // ── Emotional Arc (2) ─────────────────────────────────────────────────
            {
                id: 'emotional_missing',
                category: 'emotional',
                description: 'Identify missing emotional beats',
                test: (q) => /emotion|feeling|missing|gap|arc/.test(q),
                respond: (q, snap) => FastBrain.analyzeEmotionalArc(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            {
                id: 'emotional_tension',
                category: 'emotional',
                description: 'Analyze tension build in sequence',
                test: (q) => /tension|build|escalat|climax/.test(q),
                respond: (q, snap) => FastBrain.analyzeTensionArc(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            // ── Pacing (2) ────────────────────────────────────────────────────────
            {
                id: 'pacing_analysis',
                category: 'pacing',
                description: 'Analyze overall pacing',
                test: (q) => /pac(e|ing)|slow|fast|rhythm|tempo/.test(q),
                respond: (q, snap) => FastBrain.analyzePacing(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            {
                id: 'pacing_cuts',
                category: 'pacing',
                description: 'Analyze cut frequency',
                test: (q) => /cut|edit|transition|frequency/.test(q) && /pac(e|ing)|too many|too few/.test(q),
                respond: (q, snap) => FastBrain.analyzeCutFrequency(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            // ── Shot Type Distribution (2) ────────────────────────────────────────
            {
                id: 'distribution_overuse',
                category: 'distribution',
                description: 'Detect overused shot types',
                test: (q) => /overus|too many|repeat|variety|distribution/.test(q),
                respond: (q, snap) => FastBrain.analyzeShotDistribution(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            {
                id: 'distribution_coverage',
                category: 'coverage',
                description: 'Check for missing coverage shots',
                test: (q) => /coverage|cover|establish|close.?up|missing shot/.test(q),
                respond: (q, snap) => FastBrain.checkCoverage(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            // ── Lighting (2) ──────────────────────────────────────────────────────
            {
                id: 'lighting_conflict',
                category: 'lighting',
                description: 'Detect lighting conflicts between shots',
                test: (q) => /light(ing)?|conflict|inconsist/.test(q),
                respond: (q, snap) => FastBrain.checkLightingConflicts(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            {
                id: 'lighting_suggest',
                category: 'lighting',
                description: 'Suggest lighting for a shot',
                test: (q) => /suggest.*light|what.*light|light.*suggest/.test(q),
                respond: (q, snap) => FastBrain.suggestLighting(q, snap),
            },
            // ── Character Consistency (2) ─────────────────────────────────────────
            {
                id: 'character_consistency',
                category: 'character',
                description: 'Check character consistency across shots',
                test: (q) => /character|actor|person|subject/.test(q) && /consistent|same|match|continuity/.test(q),
                respond: (q, snap) => FastBrain.checkCharacterConsistency(snap),
            },
            {
                id: 'character_missing',
                category: 'character',
                description: 'Identify missing character reactions',
                test: (q) => /reaction|response|character.*missing|missing.*character/.test(q),
                respond: (q, snap) => FastBrain.findMissingReactions(snap && snap.activeScene ? snap.activeScene.shots : []),
            },
            // ── General / Project-level (4) ───────────────────────────────────────
            {
                id: 'project_summary',
                category: 'general',
                description: 'Summarize the current project',
                test: (q) => /summar|overview|what.*project|describe.*project/.test(q),
                respond: (q, snap) => FastBrain.summarizeProject(snap),
            },
            {
                id: 'scene_summary',
                category: 'general',
                description: 'Summarize a specific scene',
                test: (q) => /summar.*scene|scene.*summar|what.*scene|describe.*scene/.test(q),
                respond: (q, snap) => FastBrain.summarizeScene(resolveScene(q, snap)),
            },
            {
                id: 'shot_count',
                category: 'general',
                description: 'Report shot counts and statistics',
                test: (q) => /how many|count|total|number of/.test(q) && /shot|scene/.test(q),
                respond: (q, snap) => FastBrain.reportStats(snap),
            },
            {
                id: 'export_help',
                category: 'general',
                description: 'Help with export options',
                test: (q) => /export|download|save|pdf|json/.test(q),
                respond: () => FastBrain.getExportHelp(),
            },
        ];

export const FastBrain = {
            patterns: FAST_BRAIN_PATTERNS,

            match(query, projectSnapshot) {
                const q = (query || '').toLowerCase().trim();
                for (const pattern of this.patterns) {
                    try {
                        if (pattern.test(q, projectSnapshot)) {
                            return pattern.respond(q, projectSnapshot);
                        }
                    } catch(e) { /* skip broken pattern */ }
                }
                return null;
            },

            getFallbackResponse(query) {
                const profile = loadDirectorProfile();
                const name = profile?.name ? `, ${profile.name}` : '';
                return `I understand you're asking about "${query}"${name}. Try asking me about: director styles (e.g. "rewrite scene 1 as Kubrick"), continuity ("check continuity"), emotional arc ("what emotional beats are missing?"), pacing ("analyze pacing"), shot distribution ("am I overusing any shot types?"), or coverage ("check coverage"). Enable Deep Brain mode in Settings for open-ended creative questions.`;
            },

            applyDirectorStyle(scene, styleName) {
                if (!scene || !scene.shots || scene.shots.length === 0) {
                    return `No shots found in the target scene to apply ${styleName} style.`;
                }
                const styleGuides = {
                    kubrick: { lens: '24mm Wide', movement: 'Dolly In', lighting: 'Harsh Shadows', angle: 'Eye Level', notes: 'Symmetrical framing, slow deliberate movement, cold clinical lighting' },
                    nolan: { lens: '70mm IMAX', movement: 'Handheld / Shaky', lighting: 'Natural Daylight', angle: 'Low Angle', notes: 'Practical lighting, non-linear tension, IMAX scale' },
                    villeneuve: { lens: '35mm Standard', movement: 'Static / Tripod', lighting: 'Volumetric Lighting (God Rays)', angle: 'Eye Level', notes: 'Slow meditative pacing, vast landscapes, silence as storytelling' },
                    tarantino: { lens: '50mm Prime', movement: 'Static / Tripod', lighting: 'Studio Lighting', angle: 'Dutch Angle / Canted', notes: 'Long dialogue takes, trunk shots, pop culture references, non-linear' },
                    scorsese: { lens: '35mm Standard', movement: 'Tracking / Follow', lighting: 'Low Key (Dark/Moody)', angle: 'Eye Level', notes: 'Kinetic energy, tracking shots, rock music, moral ambiguity' },
                };
                const guide = styleGuides[styleName] || styleGuides.kubrick;
                const shotList = scene.shots.map((s, i) => {
                    return `Shot ${i+1}: Apply ${guide.lens} lens, ${guide.movement} movement, ${guide.lighting} lighting${guide.angle ? ', ' + guide.angle + ' angle' : ''}.`;
                }).join('\n');
                return `🎬 ${styleName.charAt(0).toUpperCase() + styleName.slice(1)} Style Applied to "${scene.name}":\n\n${shotList}\n\nDirector Notes: ${guide.notes}`;
            },

            analyzeEmotionalArc(shots) {
                if (!shots || shots.length === 0) return 'No shots to analyze. Add shots to this scene first.';
                const emotionalKeywords = ['emotion', 'feel', 'react', 'expression', 'fear', 'joy', 'anger', 'sad', 'tense', 'relief', 'shock', 'wonder'];
                const missingEmotional = shots.filter(s => {
                    const text = ((s.subject || '') + ' ' + (s.negativePrompt || '')).toLowerCase();
                    return !emotionalKeywords.some(kw => text.includes(kw));
                });
                if (missingEmotional.length === 0) return '✅ Emotional arc looks solid — all shots have emotional anchors.';
                const gaps = missingEmotional.map((s) => `Shot ${shots.indexOf(s)+1}: Missing emotional anchor — add a character reaction or emotional tone.`).join('\n');
                return `⚠️ Emotional Arc Analysis:\n\n${gaps}\n\nTip: Add emotional descriptors like "fearful expression", "joyful reaction", or "tense standoff" to ground each shot emotionally.`;
            },

            analyzeTensionArc(shots) {
                if (!shots || shots.length === 0) return 'No shots to analyze.';
                const tensionKeywords = ['tense', 'threat', 'danger', 'chase', 'conflict', 'confrontation', 'suspense', 'fear', 'urgent'];
                const tensionShots = shots.filter(s => tensionKeywords.some(kw => ((s.subject||'') + ' ' + (s.selections?.lighting||'')).toLowerCase().includes(kw)));
                if (tensionShots.length === 0) return '💡 No tension indicators found. Consider adding conflict, threat, or suspense elements to build dramatic tension.';
                return `📈 Tension Analysis: ${tensionShots.length}/${shots.length} shots carry tension markers. ${tensionShots.length < shots.length / 2 ? 'Consider escalating tension earlier in the sequence.' : 'Good tension distribution across the sequence.'}`;
            },

            checkContinuity(shotA, shotB) {
                const issues = [];
                if (!shotA || !shotB) return issues;
                const lightA = shotA.selections?.lighting || '';
                const lightB = shotB.selections?.lighting || '';
                const dayLighting = ['Golden Hour', 'Natural Daylight', 'High Key (Bright)'];
                const nightLighting = ['Low Key (Dark/Moody)', 'Neon / Cyberpunk'];
                if (dayLighting.includes(lightA) && nightLighting.includes(lightB)) {
                    issues.push({ type: 'lighting', message: `Lighting jump: "${lightA}" → "${lightB}" — day/night inconsistency.` });
                }
                return issues;
            },

            runContinuityReport(snap) {
                if (!snap || !snap.activeScene) return 'No active scene to check.';
                const shots = snap.activeScene.shots || [];
                if (shots.length < 2) return 'Need at least 2 shots to check continuity.';
                const issues = [];
                for (let i = 1; i < shots.length; i++) {
                    const found = this.checkContinuity(shots[i-1], shots[i]);
                    found.forEach(issue => issues.push(`Shots ${i}→${i+1}: ${issue.message}`));
                }
                if (issues.length === 0) return '✅ Continuity check passed — no conflicts detected across all shots.';
                return `⚠️ Continuity Issues Found:\n\n${issues.join('\n')}\n\nReview these transitions before exporting.`;
            },

            checkCostumeConsistency(snap) {
                if (!snap || !snap.activeScene) return 'No active scene.';
                const shots = snap.activeScene.shots || [];
                return `👗 Costume Check: ${shots.length} shots reviewed. Ensure character descriptions are consistent across shots. Tip: Use the Character Library to lock character appearances.`;
            },

            checkLocationConsistency(snap) {
                if (!snap || !snap.activeScene) return 'No active scene.';
                const shots = snap.activeScene.shots || [];
                const locations = [...new Set(shots.map(s => s.selections?.location || 'unspecified'))];
                if (locations.length === 1) return `✅ Location consistent: all shots in "${locations[0]}".`;
                return `📍 Location Variation: ${locations.length} different locations detected across ${shots.length} shots: ${locations.join(', ')}. Verify this is intentional.`;
            },

            checkLightingConflict(shotA, shotB) {
                const lightA = shotA?.selections?.lighting || '';
                const lightB = shotB?.selections?.lighting || '';
                if (!lightA || !lightB || lightA === lightB) return null;
                const dayTypes = ['Golden Hour', 'Natural Daylight', 'High Key (Bright)', 'Studio Lighting'];
                const nightTypes = ['Low Key (Dark/Moody)', 'Neon / Cyberpunk', 'Harsh Shadows'];
                if (dayTypes.includes(lightA) && nightTypes.includes(lightB)) return `Day→Night jump: "${lightA}" to "${lightB}"`;
                if (nightTypes.includes(lightA) && dayTypes.includes(lightB)) return `Night→Day jump: "${lightA}" to "${lightB}"`;
                return null;
            },

            checkLightingConflicts(shots) {
                if (!shots || shots.length < 2) return 'Need at least 2 shots to check lighting.';
                const conflicts = [];
                for (let i = 1; i < shots.length; i++) {
                    const conflict = this.checkLightingConflict(shots[i-1], shots[i]);
                    if (conflict) conflicts.push(`Shots ${i}→${i+1}: ${conflict}`);
                }
                if (conflicts.length === 0) return '✅ Lighting is consistent across all shots.';
                return `💡 Lighting Conflicts:\n\n${conflicts.join('\n')}\n\nConsider adding transition shots or adjusting lighting for continuity.`;
            },

            suggestLighting(query, snap) {
                const shotType = snap?.activeScene?.shots?.slice(-1)[0]?.selections?.shotType || '';
                const suggestions = {
                    'Close-Up (CU)': 'Studio Lighting or Cinematic Rim Lighting — isolates subject, adds depth.',
                    'Extreme Wide Shot (EWS)': 'Golden Hour or Natural Daylight — maximizes environmental drama.',
                    'Medium Shot (MS)': 'Studio Lighting — balanced, versatile for dialogue.',
                    'default': 'Consider: Golden Hour for warmth, Low Key for drama, Studio Lighting for clarity, Volumetric for epic scale.',
                };
                return `💡 Lighting Suggestion: ${suggestions[shotType] || suggestions.default}`;
            },

            analyzeShotDistribution(shots) {
                if (!shots || shots.length === 0) return 'No shots to analyze.';
                const counts = {};
                shots.forEach(s => {
                    const type = s.selections?.shotType || 'Unspecified';
                    counts[type] = (counts[type] || 0) + 1;
                });
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const overused = sorted.filter(([, count]) => count > 3);
                const report = sorted.map(([type, count]) => `  ${type}: ${count} shot${count > 1 ? 's' : ''}`).join('\n');
                const warning = overused.length > 0 ? `\n⚠️ Overused: ${overused.map(([t, c]) => `${t} (${c}×)`).join(', ')}` : '\n✅ Good variety in shot types.';
                return `📊 Shot Distribution:\n${report}${warning}`;
            },

            analyzePacing(shots) {
                if (!shots || shots.length === 0) return 'No shots to analyze.';
                const durations = shots.map(s => parseFloat(s.selections?.duration) || 3);
                const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
                const total = durations.reduce((a, b) => a + b, 0);
                if (avg > 6) return `🐢 Pacing: Slow (avg ${avg.toFixed(1)}s/shot, ${total.toFixed(0)}s total). Consider shorter shots to increase energy.`;
                if (avg < 2) return `⚡ Pacing: Very fast (avg ${avg.toFixed(1)}s/shot). Good for action — ensure audience can follow.`;
                return `✅ Pacing: Balanced (avg ${avg.toFixed(1)}s/shot, ${total.toFixed(0)}s total). Good rhythm for dramatic scenes.`;
            },

            analyzeCutFrequency(shots) {
                if (!shots || shots.length < 2) return 'Need at least 2 shots to analyze cuts.';
                const transitions = shots.map(s => s.selections?.transition || 'Cut').filter(Boolean);
                const hardCuts = transitions.filter(t => t === 'Cut' || t === 'Smash Cut').length;
                const softCuts = transitions.length - hardCuts;
                return `✂️ Cut Analysis: ${hardCuts} hard cuts, ${softCuts} soft transitions across ${shots.length} shots. ${hardCuts > shots.length * 0.8 ? 'Heavy use of hard cuts — good for action, may feel abrupt in drama.' : 'Good mix of transitions.'}`;
            },

            checkCoverage(shots) {
                if (!shots || shots.length === 0) return 'No shots to check.';
                const types = shots.map(s => s.selections?.shotType || '');
                const hasEstablishing = types.some(t => t.includes('Wide') || t.includes('EWS'));
                const hasCloseUp = types.some(t => t.includes('Close') || t.includes('CU'));
                const issues = [];
                if (!hasEstablishing) issues.push('Missing establishing shot (EWS or WS) — audience needs spatial context.');
                if (!hasCloseUp) issues.push('Missing close-up — add emotional intimacy with a CU or ECU.');
                if (issues.length === 0) return '✅ Coverage complete — establishing shot and close-up both present.';
                return `📷 Coverage Gaps:\n\n${issues.join('\n')}`;
            },

            checkCharacterConsistency(snap) {
                if (!snap || !snap.activeScene) return 'No active scene.';
                const shots = snap.activeScene.shots || [];
                const chars = snap.characters || [];
                if (chars.length === 0) return '💡 No characters defined in the Character Library. Add characters to enable consistency checking.';
                return `👤 Character Check: ${chars.length} character(s) defined. Ensure subject descriptions reference character names consistently across all ${shots.length} shots.`;
            },

            findMissingReactions(shots) {
                if (!shots || shots.length < 2) return 'Need at least 2 shots to find missing reactions.';
                const actionShots = shots.filter(s => {
                    const text = (s.subject || '').toLowerCase();
                    return /attack|strike|shoot|run|jump|fall|explode|reveal/.test(text);
                });
                if (actionShots.length === 0) return '💡 No clear action shots detected. Reaction shots follow action — add action shots first.';
                return `🎭 Reaction Check: ${actionShots.length} action shot(s) detected. Ensure each has a corresponding reaction shot (CU of character response) for emotional impact.`;
            },

            summarizeProject(snap) {
                if (!snap) return 'No project data available.';
                const scenes = snap.scenes || [];
                const totalShots = scenes.reduce((acc, sc) => acc + (sc.shots || []).length, 0);
                const chars = (snap.characters || []).length;
                const locs = (snap.locations || []).length;
                return `🎬 Project: "${snap.projectName || 'Untitled'}"\n📽️ ${scenes.length} scene(s), ${totalShots} total shot(s)\n👤 ${chars} character(s), 📍 ${locs} location(s)\n\nAsk me to analyze any scene, check continuity, or apply a director style.`;
            },

            summarizeScene(scene) {
                if (!scene) return 'Scene not found. Try "summarize scene 1" or "describe the current scene".';
                const shots = scene.shots || [];
                const types = [...new Set(shots.map(s => s.selections?.shotType || 'Unspecified'))];
                return `🎬 Scene: "${scene.name}"\n📷 ${shots.length} shot(s)\nShot types: ${types.join(', ') || 'None'}\n\nAsk me to check continuity, analyze pacing, or apply a director style to this scene.`;
            },

            reportStats(snap) {
                if (!snap) return 'No project data.';
                const scenes = snap.scenes || [];
                const totalShots = scenes.reduce((acc, sc) => acc + (sc.shots || []).length, 0);
                const sceneStats = scenes.map((sc, i) => `  Scene ${i+1} "${sc.name}": ${(sc.shots||[]).length} shots`).join('\n');
                return `📊 Project Stats:\n${sceneStats}\n\nTotal: ${scenes.length} scenes, ${totalShots} shots`;
            },

            getExportHelp() {
                return `📤 Export Options:\n• PDF Storyboard — export current scene as formatted PDF\n• JSON Backup — export full project data\n• Copy All Prompts — copy all shot prompts to clipboard\n• Shotify — compress prompts for Runway, Veo 3, KLING, or Seedance\n\nUse the Export button in the header or right-click any scene for export options.`;
            },

            critiqueShot(shot, prevShot, allShots) {
                const annotations = [];
                if (!shot) return annotations;
                const shotId = shot.id || `shot_${Math.random()}`;
                const idx = allShots ? allShots.indexOf(shot) : -1;

                // Rule 1: Missing emotional anchor
                const emotionalKeywords = ['emotion', 'feel', 'react', 'expression', 'fear', 'joy', 'anger', 'sad', 'tense', 'relief', 'shock', 'wonder', 'smile', 'cry', 'laugh', 'stare'];
                const subjectText = (shot.subject || '').toLowerCase();
                if (!emotionalKeywords.some(kw => subjectText.includes(kw))) {
                    annotations.push({
                        id: `${shotId}_emotional`,
                        shotId,
                        code: 'NO-EMOTION',
                        severity: 'note',
                        message: 'No emotional anchor detected in this shot.',
                        suggestion: 'Add a character reaction or emotional tone (e.g. "fearful expression", "joyful reaction").',
                    });
                }

                // Rule 2: Lighting conflict with previous shot
                if (prevShot) {
                    const conflict = this.checkLightingConflict(prevShot, shot);
                    if (conflict) {
                        annotations.push({
                            id: `${shotId}_lighting`,
                            shotId,
                            code: 'LIGHT-CONFLICT',
                            severity: 'warning',
                            message: `Lighting conflict with previous shot: ${conflict}`,
                            suggestion: 'Add a transition shot or adjust lighting for continuity.',
                        });
                    }
                }

                // Rule 3: Shot type overuse (3+ consecutive same type)
                if (allShots && idx >= 2) {
                    const currentType = shot.selections?.shotType;
                    const prev1Type = allShots[idx-1]?.selections?.shotType;
                    const prev2Type = allShots[idx-2]?.selections?.shotType;
                    if (currentType && currentType === prev1Type && currentType === prev2Type) {
                        annotations.push({
                            id: `${shotId}_overuse`,
                            shotId,
                            code: 'SHOT-OVERUSE',
                            severity: 'warning',
                            message: `3+ consecutive "${currentType}" shots — variety needed.`,
                            suggestion: 'Cut to a different shot type to maintain visual interest.',
                        });
                    }
                }

                // Rule 4: Missing coverage (only check first shot in scene)
                if (allShots && idx === 0) {
                    const type = shot.selections?.shotType || '';
                    if (!type.includes('Wide') && !type.includes('EWS') && !type.includes('Establishing')) {
                        annotations.push({
                            id: `${shotId}_coverage`,
                            shotId,
                            code: 'NO-ESTABLISH',
                            severity: 'note',
                            message: 'Scene opens without an establishing shot.',
                            suggestion: 'Consider starting with an EWS or WS to orient the audience.',
                        });
                    }
                }

                // Rule 5: Continuity with previous shot
                if (prevShot) {
                    const issues = this.checkContinuity(prevShot, shot);
                    issues.forEach(issue => {
                        annotations.push({
                            id: `${shotId}_continuity_${issue.type}`,
                            shotId,
                            code: 'CONTINUITY',
                            severity: 'warning',
                            message: issue.message,
                            suggestion: 'Review and align this shot with the previous shot\'s settings.',
                        });
                    });
                }

                return annotations;
            },
        };

// ─── DeepBrain ────────────────────────────────────────────────────────────
        export const DeepBrain = {
            SUPPORTED_MODELS: [
                { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', label: 'SmolLM2 360M (Fast, ~200MB)', size: '~200MB' },
                { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 0.5B (Balanced, ~300MB)', size: '~300MB' },
            ],

            async init(modelId, onProgress, engineRef) {
                if (!window.webllm) throw new Error('WebLLM not loaded. Check your internet connection.');
                const engine = new window.webllm.MLCEngine();
                engine.setInitProgressCallback((p) => {
                    if (onProgress) onProgress(Math.round((p.progress || 0) * 100));
                });
                await engine.reload(modelId);
                engineRef.current = engine;
            },

            async generate(prompt, engineRef) {
                if (!engineRef || !engineRef.current) throw new Error('Deep Brain not initialized. Enable Deep Mode in Settings first.');
                const reply = await engineRef.current.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are MOKHA Director Brain, an expert AI film director assistant. Give concise, actionable cinematic advice. Focus on shot composition, storytelling, and visual language.' },
                        { role: 'user', content: prompt }
                    ],
                    stream: false,
                    max_tokens: 300,
                });
                return reply.choices[0].message.content;
            },

            async unload(engineRef) {
                if (engineRef && engineRef.current) {
                    try { await engineRef.current.unload?.(); } catch(e) { /* ignore */ }
                    engineRef.current = null;
                }
            },
        };

// ─── BrainRouter ──────────────────────────────────────────────────────────
        export const BrainRouter = {
            async route(query, projectSnapshot, brainMode, deepBrainEngineRef) {
                const fastResult = FastBrain.match(query, projectSnapshot);
                if (fastResult !== null) {
                    return { source: 'fast', response: fastResult };
                }
                if (brainMode === 'deep' && deepBrainEngineRef && deepBrainEngineRef.current) {
                    try {
                        const contextPrompt = buildContextPrompt(query, projectSnapshot);
                        const response = await DeepBrain.generate(contextPrompt, deepBrainEngineRef);
                        return { source: 'deep', response };
                    } catch(e) {
                        return { source: 'fast', response: `Deep Brain error: ${e.message}. ${FastBrain.getFallbackResponse(query)}` };
                    }
                }
                return { source: 'fast', response: FastBrain.getFallbackResponse(query) };
            },
        };

// ─── IntentParser ─────────────────────────────────────────────────────────
        export const IntentParser = {

            // 2.1 parse(query, projectSnapshot) → ParsedIntent
            parse(query, projectSnapshot) {
                const q = (query || '').toLowerCase();

                // Determine category by iterating INTENT_PATTERNS
                let category = 'unknown';
                for (const entry of INTENT_PATTERNS) {
                    for (const pattern of entry.patterns) {
                        // Use regex so patterns like 'close.?up' work
                        try {
                            if (new RegExp(pattern, 'i').test(q)) {
                                category = entry.category;
                                break;
                            }
                        } catch(e) {
                            if (q.includes(pattern)) {
                                category = entry.category;
                                break;
                            }
                        }
                    }
                    if (category !== 'unknown') break;
                }

                // Severity heuristic
                let severity = 'minor';
                if (/\b(no |missing|flat|broken|lacks?|absent|gap|none)\b/i.test(q)) {
                    severity = 'critical';
                } else if (/\b(drags?|slow|too many|sluggish|rushed|overlong)\b/i.test(q)) {
                    severity = 'moderate';
                }

                // Resolve scope reference
                const ref = this.resolveReference(query, projectSnapshot);
                let scope = { type: 'project', id: null, index: null };
                if (ref) {
                    if (ref._refType === 'scene') {
                        scope = { type: 'scene', id: ref.id || null, index: ref._refIndex != null ? ref._refIndex : null };
                    } else if (ref._refType === 'shot') {
                        scope = { type: 'shot', id: ref.id || null, index: ref._refIndex != null ? ref._refIndex : null };
                    }
                }

                const isIdeasMode = this.isIdeasQuery(query);

                return {
                    category,
                    scope,
                    severity,
                    rawQuery: query,
                    isIdeasMode,
                };
            },

            // 2.2 isIdeasQuery(query) → boolean
            isIdeasQuery(query) {
                const q = (query || '').toLowerCase();
                const triggers = ['idea', 'inspire', 'creative', 'what if', 'how could', 'more cinematic'];
                return triggers.some(t => q.includes(t));
            },

            // 2.3 resolveReference(query, projectSnapshot) → scene | shot | null
            resolveReference(query, projectSnapshot) {
                if (!query || !projectSnapshot) return null;
                const q = query.toLowerCase();
                const scenes = projectSnapshot.scenes || [];

                // "my opening" → first scene (index 0)
                if (/\bmy opening\b|\bopening scene\b|\bfirst scene\b/i.test(q)) {
                    if (scenes[0]) {
                        return Object.assign({}, scenes[0], { _refType: 'scene', _refIndex: 0 });
                    }
                    return null;
                }

                // "the last shot" → last shot of active scene
                if (/\bthe last shot\b|\blast shot\b/i.test(q)) {
                    const activeScene = projectSnapshot.activeScene ||
                        scenes.find(s => s.id === projectSnapshot.activeSceneId) ||
                        scenes[0];
                    if (activeScene) {
                        const shots = activeScene.shots || [];
                        if (shots.length > 0) {
                            const lastShot = shots[shots.length - 1];
                            return Object.assign({}, lastShot, { _refType: 'shot', _refIndex: shots.length - 1 });
                        }
                    }
                    return null;
                }

                // "scene N" → scene at index N-1
                const sceneMatch = q.match(/\bscene\s+(\d+)\b/);
                if (sceneMatch) {
                    const idx = parseInt(sceneMatch[1], 10) - 1;
                    if (scenes[idx]) {
                        return Object.assign({}, scenes[idx], { _refType: 'scene', _refIndex: idx });
                    }
                    return null;
                }

                // "the Nth shot" / "shot N" → shot at index N-1 in active scene
                const ordinals = { first:0, second:1, third:2, fourth:3, fifth:4, sixth:5, seventh:6, eighth:7 };
                const ordinalMatch = q.match(/\bthe\s+(first|second|third|fourth|fifth|sixth|seventh|eighth)\s+shot\b/);
                if (ordinalMatch) {
                    const idx = ordinals[ordinalMatch[1]];
                    const activeScene = projectSnapshot.activeScene ||
                        scenes.find(s => s.id === projectSnapshot.activeSceneId) ||
                        scenes[0];
                    if (activeScene) {
                        const shots = activeScene.shots || [];
                        if (shots[idx]) {
                            return Object.assign({}, shots[idx], { _refType: 'shot', _refIndex: idx });
                        }
                    }
                    return null;
                }

                const shotNumMatch = q.match(/\bshot\s+(\d+)\b/);
                if (shotNumMatch) {
                    const idx = parseInt(shotNumMatch[1], 10) - 1;
                    const activeScene = projectSnapshot.activeScene ||
                        scenes.find(s => s.id === projectSnapshot.activeSceneId) ||
                        scenes[0];
                    if (activeScene) {
                        const shots = activeScene.shots || [];
                        if (shots[idx]) {
                            return Object.assign({}, shots[idx], { _refType: 'shot', _refIndex: idx });
                        }
                    }
                    return null;
                }

                return null;
            },
        };

// ─── ExecutionEngine ──────────────────────────────────────────────────────
        export const ExecutionEngine = {

            // 3.1 validate(proposal, appActions) → { valid: boolean, reason?: string }
            validate(proposal, appActions) {
                if (!proposal || !proposal.type || !proposal.payload) {
                    return { valid: false, reason: 'Invalid proposal: missing type or payload.' };
                }
                const scenes = (appActions && appActions.scenes) || [];
                const { type, payload } = proposal;

                // Helper: find a shot by id across all scenes
                const findShot = (shotId) => {
                    for (const sc of scenes) {
                        const shot = (sc.shots || []).find(sh => String(sh.id) === String(shotId));
                        if (shot) return { shot, scene: sc };
                    }
                    return null;
                };

                // Helper: find a scene by id
                const findScene = (sceneId) => scenes.find(sc => String(sc.id) === String(sceneId)) || null;

                switch (type) {
                    case 'ADD_SHOT': {
                        const scene = findScene(payload.sceneId);
                        if (!scene) return { valid: false, reason: `Scene "${payload.sceneId}" not found.` };
                        const pos = payload.position;
                        if (pos == null || pos < 0 || pos > (scene.shots || []).length) {
                            return { valid: false, reason: `ADD_SHOT position ${pos} is out of bounds (0–${(scene.shots||[]).length}).` };
                        }
                        return { valid: true };
                    }
                    case 'REWRITE_SHOT': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        return { valid: true };
                    }
                    case 'DELETE_SHOT': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        return { valid: true };
                    }
                    case 'SET_FIELD': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        return { valid: true };
                    }
                    case 'APPLY_PRESET': {
                        const shotIds = payload.shotIds || (payload.shotId ? [payload.shotId] : []);
                        for (const sid of shotIds) {
                            if (!findShot(sid)) return { valid: false, reason: `Shot "${sid}" not found.` };
                        }
                        if (shotIds.length === 0) return { valid: false, reason: 'APPLY_PRESET requires at least one shotId.' };
                        return { valid: true };
                    }
                    case 'REORDER_SHOTS': {
                        const found = findShot(payload.shotId);
                        if (!found) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        const sceneShots = found.scene.shots || [];
                        const toIndex = payload.toIndex;
                        if (toIndex == null || toIndex < 0 || toIndex >= sceneShots.length) {
                            return { valid: false, reason: `REORDER_SHOTS toIndex ${toIndex} is out of bounds (0–${sceneShots.length - 1}).` };
                        }
                        return { valid: true };
                    }
                    case 'APPLY_STYLE': {
                        if (!DIRECTOR_STYLES[payload.style]) {
                            return { valid: false, reason: `Unknown director style "${payload.style}".` };
                        }
                        const shotIds = payload.shotIds || [];
                        for (const sid of shotIds) {
                            if (!findShot(sid)) return { valid: false, reason: `Shot "${sid}" not found.` };
                        }
                        if (shotIds.length === 0) return { valid: false, reason: 'APPLY_STYLE requires at least one shotId.' };
                        return { valid: true };
                    }
                    case 'SPLIT_SCENE': {
                        const scene = findScene(payload.sceneId);
                        if (!scene) return { valid: false, reason: `Scene "${payload.sceneId}" not found.` };
                        const idx = payload.splitIndex;
                        const shotCount = (scene.shots || []).length;
                        if (idx == null || idx < 1 || idx >= shotCount) {
                            return { valid: false, reason: `SPLIT_SCENE splitIndex ${idx} is out of bounds (1–${shotCount - 1}).` };
                        }
                        return { valid: true };
                    }
                    case 'ADD_SCENE': {
                        const pos = payload.position;
                        if (pos == null || pos < 0 || pos > scenes.length) {
                            return { valid: false, reason: `ADD_SCENE position ${pos} is out of bounds (0–${scenes.length}).` };
                        }
                        return { valid: true };
                    }
                    case 'ADD_DIALOGUE': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        if (!payload.character || !payload.text) return { valid: false, reason: 'ADD_DIALOGUE requires character and text.' };
                        return { valid: true };
                    }
                    case 'ADD_ACTION': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        if (!payload.actionText) return { valid: false, reason: 'ADD_ACTION requires actionText.' };
                        return { valid: true };
                    }
                    case 'EDIT_DIALOGUE': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        const found = findShot(payload.shotId);
                        const dialogues = found.shot.dialogues || [];
                        const idx = payload.dialogueIndex || 0;
                        if (idx < 0 || idx >= dialogues.length) return { valid: false, reason: `Dialogue index ${idx} is out of bounds (0–${dialogues.length - 1}).` };
                        return { valid: true };
                    }
                    case 'EDIT_ACTION': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        if (!payload.actionText) return { valid: false, reason: 'EDIT_ACTION requires actionText.' };
                        return { valid: true };
                    }
                    case 'DELETE_DIALOGUE': {
                        if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
                        const found = findShot(payload.shotId);
                        const dialogues = found.shot.dialogues || [];
                        const idx = payload.dialogueIndex || 0;
                        if (idx < 0 || idx >= dialogues.length) return { valid: false, reason: `Dialogue index ${idx} is out of bounds (0–${dialogues.length - 1}).` };
                        return { valid: true };
                    }
                    case 'CREATE_CHARACTER': {
                        if (!payload.characterName) return { valid: false, reason: 'CREATE_CHARACTER requires characterName.' };
                        return { valid: true };
                    }
                    case 'RENAME_SCENE': {
                        const scene = findScene(payload.sceneId);
                        if (!scene) return { valid: false, reason: `Scene "${payload.sceneId}" not found.` };
                        if (!payload.newName) return { valid: false, reason: 'RENAME_SCENE requires newName.' };
                        return { valid: true };
                    }
                    case 'SET_SCENE_HEADING': {
                        const scene = findScene(payload.sceneId);
                        if (!scene) return { valid: false, reason: `Scene "${payload.sceneId}" not found.` };
                        if (!payload.heading) return { valid: false, reason: 'SET_SCENE_HEADING requires heading.' };
                        return { valid: true };
                    }
                    default:
                        return { valid: false, reason: `Unknown action type "${type}".` };
                }
            },

            // 3.2 apply(proposal, appActions) → { success: boolean, error?: string }
            apply(proposal, appActions) {
                const validation = this.validate(proposal, appActions);
                if (!validation.valid) {
                    return { success: false, error: validation.reason };
                }

                const scenes = (appActions && appActions.scenes) || [];
                const { type, payload } = proposal;

                // Helper: find a shot by id across all scenes
                const findShot = (shotId) => {
                    for (const sc of scenes) {
                        const shot = (sc.shots || []).find(sh => String(sh.id) === String(shotId));
                        if (shot) return { shot, scene: sc };
                    }
                    return null;
                };

                // Helper: find a scene by id
                const findScene = (sceneId) => scenes.find(sc => String(sc.id) === String(sceneId)) || null;

                // MUST call saveToHistory before any state mutation
                appActions.saveToHistory();

                switch (type) {
                    case 'ADD_SHOT': {
                        const scene = findScene(payload.sceneId);
                        let pos = payload.position;
                        const shotCount = (scene.shots || []).length;
                        if (pos > shotCount) {
                            console.warn(`[ExecutionEngine] ADD_SHOT position ${pos} clamped to ${shotCount}`);
                            pos = shotCount;
                        }
                        const newShot = {
                            id: Date.now() + Math.random(),
                            subject: payload.subject || '',
                            selections: Object.assign(
                                { shotType: '', shotStyle: '', camera: '', lens: '', angle: '', lighting: '', movement: '', actionSpeed: '', duration: '3.0s', transition: 'Hard Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                                payload.selections || {}
                            ),
                            sfx: '', bgm: '', dialogues: [],
                            mode: 'video', status: 'Planning',
                            tags: [], referenceImages: [], customPromptOverride: null,
                        };
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(payload.sceneId)) return sc;
                            const shots = [...(sc.shots || [])];
                            shots.splice(pos, 0, newShot);
                            return { ...sc, shots };
                        }));
                        return { success: true };
                    }

                    case 'REWRITE_SHOT': {
                        const { shot, scene } = findShot(payload.shotId);
                        const styleName = payload.style || 'kubrick';
                        const styleGuides = {
                            kubrick: { lens: '24mm Wide', movement: 'Dolly In', lighting: 'Harsh Shadows', angle: 'Eye Level' },
                            nolan: { lens: '70mm IMAX', movement: 'Handheld / Shaky', lighting: 'Natural Daylight', angle: 'Low Angle' },
                            villeneuve: { lens: '35mm Standard', movement: 'Static / Tripod', lighting: 'Volumetric Lighting (God Rays)', angle: 'Eye Level' },
                            tarantino: { lens: '50mm Prime', movement: 'Static / Tripod', lighting: 'Studio Lighting', angle: 'Dutch Angle / Canted' },
                            scorsese: { lens: '35mm Standard', movement: 'Tracking / Follow', lighting: 'Low Key (Dark/Moody)', angle: 'Eye Level' },
                        };
                        // Use DIRECTOR_STYLES if available, fall back to local guide
                        const dirStyle = DIRECTOR_STYLES[styleName] || styleGuides[styleName] || styleGuides.kubrick;
                        const styleFields = {};
                        if (dirStyle.lens) styleFields.lens = dirStyle.lens;
                        if (dirStyle.movement) styleFields.movement = dirStyle.movement;
                        if (dirStyle.lighting) styleFields.lighting = dirStyle.lighting;
                        if (dirStyle.angle) styleFields.angle = dirStyle.angle;
                        if (dirStyle.camera) styleFields.camera = dirStyle.camera;
                        if (dirStyle.shotType) styleFields.shotType = dirStyle.shotType;
                        if (dirStyle.shotStyle) styleFields.shotStyle = dirStyle.shotStyle;
                        if (dirStyle.filmStock) styleFields.filmStock = dirStyle.filmStock;
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            return {
                                ...sc,
                                shots: sc.shots.map(sh => {
                                    if (String(sh.id) !== String(payload.shotId)) return sh;
                                    return { ...sh, selections: { ...sh.selections, ...styleFields } };
                                }),
                            };
                        }));
                        return { success: true };
                    }

                    case 'REORDER_SHOTS': {
                        const { shot, scene } = findShot(payload.shotId);
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            const shots = [...(sc.shots || [])];
                            const fromIdx = shots.findIndex(sh => String(sh.id) === String(payload.shotId));
                            if (fromIdx === -1) return sc;
                            const [removed] = shots.splice(fromIdx, 1);
                            shots.splice(payload.toIndex, 0, removed);
                            return { ...sc, shots };
                        }));
                        return { success: true };
                    }

                    case 'DELETE_SHOT': {
                        const { scene } = findShot(payload.shotId);
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            return { ...sc, shots: sc.shots.filter(sh => String(sh.id) !== String(payload.shotId)) };
                        }));
                        return { success: true };
                    }

                    case 'APPLY_STYLE': {
                        const dirStyle = DIRECTOR_STYLES[payload.style];
                        const styleFields = {};
                        if (dirStyle.lens) styleFields.lens = dirStyle.lens;
                        if (dirStyle.movement) styleFields.movement = dirStyle.movement;
                        if (dirStyle.lighting) styleFields.lighting = dirStyle.lighting;
                        if (dirStyle.angle) styleFields.angle = dirStyle.angle;
                        if (dirStyle.camera) styleFields.camera = dirStyle.camera;
                        if (dirStyle.shotType) styleFields.shotType = dirStyle.shotType;
                        if (dirStyle.shotStyle) styleFields.shotStyle = dirStyle.shotStyle;
                        if (dirStyle.filmStock) styleFields.filmStock = dirStyle.filmStock;
                        const shotIdSet = new Set((payload.shotIds || []).map(String));
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => ({
                            ...sc,
                            shots: sc.shots.map(sh => {
                                if (!shotIdSet.has(String(sh.id))) return sh;
                                return { ...sh, selections: { ...sh.selections, ...styleFields } };
                            }),
                        })));
                        return { success: true };
                    }

                    case 'SPLIT_SCENE': {
                        const scene = findScene(payload.sceneId);
                        const splitIdx = payload.splitIndex;
                        const headShots = (scene.shots || []).slice(0, splitIdx);
                        const tailShots = (scene.shots || []).slice(splitIdx);
                        const newScene = {
                            id: Date.now() + Math.random(),
                            name: (scene.name || 'Scene') + ' (cont.)',
                            shots: tailShots,
                        };
                        appActions.updateActiveProjectScenes(prev => {
                            const sceneIdx = prev.findIndex(sc => String(sc.id) === String(payload.sceneId));
                            if (sceneIdx === -1) return prev;
                            const updated = [...prev];
                            updated[sceneIdx] = { ...scene, shots: headShots };
                            updated.splice(sceneIdx + 1, 0, newScene);
                            return updated;
                        });
                        return { success: true };
                    }

                    case 'ADD_SCENE': {
                        let pos = payload.position;
                        if (pos > scenes.length) {
                            console.warn(`[ExecutionEngine] ADD_SCENE position ${pos} clamped to ${scenes.length}`);
                            pos = scenes.length;
                        }
                        const newScene = {
                            id: Date.now() + Math.random(),
                            name: payload.name || `Scene ${scenes.length + 1}`,
                            shots: [],
                        };
                        appActions.updateActiveProjectScenes(prev => {
                            const updated = [...prev];
                            updated.splice(pos, 0, newScene);
                            return updated;
                        });
                        return { success: true };
                    }

                    case 'SET_FIELD': {
                        const { scene } = findShot(payload.shotId);
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            return {
                                ...sc,
                                shots: sc.shots.map(sh => {
                                    if (String(sh.id) !== String(payload.shotId)) return sh;
                                    return { ...sh, selections: { ...sh.selections, [payload.field]: payload.value } };
                                }),
                            };
                        }));
                        return { success: true };
                    }

                    case 'APPLY_PRESET': {
                        const shotIds = payload.shotIds || (payload.shotId ? [payload.shotId] : []);
                        const shotIdSet = new Set(shotIds.map(String));
                        // Map preset fields to shot.selections fields
                        const presetFields = {};
                        if (payload.shotType  != null) presetFields.shotType  = payload.shotType;
                        if (payload.lens      != null) presetFields.lens      = payload.lens;
                        if (payload.lighting  != null) presetFields.lighting  = payload.lighting;
                        if (payload.mood      != null) presetFields.mood      = payload.mood;
                        if (payload.subjectNote != null) presetFields.subjectNote = payload.subjectNote;
                        // Also support a nested preset object
                        if (payload.preset) {
                            const p = payload.preset;
                            if (p.shotType   != null) presetFields.shotType   = p.shotType;
                            if (p.lens       != null) presetFields.lens       = p.lens;
                            if (p.lighting   != null) presetFields.lighting   = p.lighting;
                            if (p.mood       != null) presetFields.mood       = p.mood;
                            if (p.subjectNote != null) presetFields.subjectNote = p.subjectNote;
                        }
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => ({
                            ...sc,
                            shots: sc.shots.map(sh => {
                                if (!shotIdSet.has(String(sh.id))) return sh;
                                return { ...sh, selections: { ...sh.selections, ...presetFields } };
                            }),
                        })));
                        return { success: true };
                    }

                    case 'ADD_DIALOGUE': {
                        console.log('[ADD_DIALOGUE] Starting execution', payload);
                        console.log('[ADD_DIALOGUE] appActions:', appActions);
                        
                        const { scene } = findShot(payload.shotId);
                        console.log('[ADD_DIALOGUE] Found scene:', scene);
                        
                        if (!scene) {
                            console.error('[ADD_DIALOGUE] Scene not found for shotId:', payload.shotId);
                            return { success: false, error: 'Shot not found.' };
                        }
                        
                        appActions.updateActiveProjectScenes(prev => {
                            console.log('[ADD_DIALOGUE] Previous scenes:', prev);
                            const updated = prev.map(sc => {
                                if (String(sc.id) !== String(scene.id)) return sc;
                                console.log('[ADD_DIALOGUE] Updating scene:', sc);
                                return {
                                    ...sc,
                                    shots: sc.shots.map(sh => {
                                        if (String(sh.id) !== String(payload.shotId)) return sh;
                                        console.log('[ADD_DIALOGUE] Updating shot:', sh);
                                        const newDialogue = {
                                            character: payload.character || 'Character',
                                            text: payload.text || '',
                                            emotion: payload.emotion || 'Neutral',
                                        };
                                        console.log('[ADD_DIALOGUE] Adding dialogue:', newDialogue);
                                        const updatedShot = { ...sh, dialogues: [...(sh.dialogues || []), newDialogue] };
                                        console.log('[ADD_DIALOGUE] Updated shot:', updatedShot);
                                        return updatedShot;
                                    }),
                                };
                            });
                            console.log('[ADD_DIALOGUE] Updated scenes:', updated);
                            return updated;
                        });
                        
                        console.log('[ADD_DIALOGUE] Execution complete');
                        return { success: true };
                    }

                    case 'ADD_ACTION': {
                        const { scene } = findShot(payload.shotId);
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            return {
                                ...sc,
                                shots: sc.shots.map(sh => {
                                    if (String(sh.id) !== String(payload.shotId)) return sh;
                                    const currentSubject = sh.subject || '';
                                    const newSubject = currentSubject ? `${currentSubject}\n${payload.actionText}` : payload.actionText;
                                    return { ...sh, subject: newSubject };
                                }),
                            };
                        }));
                        return { success: true };
                    }

                    case 'EDIT_DIALOGUE': {
                        const { scene } = findShot(payload.shotId);
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            return {
                                ...sc,
                                shots: sc.shots.map(sh => {
                                    if (String(sh.id) !== String(payload.shotId)) return sh;
                                    const dialogues = [...(sh.dialogues || [])];
                                    const idx = payload.dialogueIndex || 0;
                                    if (idx >= 0 && idx < dialogues.length) {
                                        dialogues[idx] = {
                                            character: payload.character || dialogues[idx].character,
                                            text: payload.text || dialogues[idx].text,
                                            emotion: dialogues[idx].emotion || 'Neutral',
                                        };
                                    }
                                    return { ...sh, dialogues };
                                }),
                            };
                        }));
                        return { success: true };
                    }

                    case 'EDIT_ACTION': {
                        const { scene } = findShot(payload.shotId);
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            return {
                                ...sc,
                                shots: sc.shots.map(sh => {
                                    if (String(sh.id) !== String(payload.shotId)) return sh;
                                    return { ...sh, subject: payload.actionText || sh.subject };
                                }),
                            };
                        }));
                        return { success: true };
                    }

                    case 'DELETE_DIALOGUE': {
                        const { scene } = findShot(payload.shotId);
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(scene.id)) return sc;
                            return {
                                ...sc,
                                shots: sc.shots.map(sh => {
                                    if (String(sh.id) !== String(payload.shotId)) return sh;
                                    const dialogues = (sh.dialogues || []).filter((_, idx) => idx !== payload.dialogueIndex);
                                    return { ...sh, dialogues };
                                }),
                            };
                        }));
                        return { success: true };
                    }

                    case 'CREATE_CHARACTER': {
                        console.log('[CREATE_CHARACTER] Starting execution', payload);
                        console.log('[CREATE_CHARACTER] appActions:', appActions);
                        console.log('[CREATE_CHARACTER] setGlobalCharacters:', appActions?.setGlobalCharacters);
                        
                        // Check if character already exists
                        const existingChars = appActions.globalCharacters || [];
                        console.log('[CREATE_CHARACTER] Existing characters:', existingChars);
                        
                        const exists = existingChars.find(c => 
                            (c.name || '').toLowerCase() === payload.characterName.toLowerCase()
                        );
                        
                        if (exists) {
                            console.log('[CREATE_CHARACTER] Character already exists:', exists);
                            return { success: false, error: `Character "${payload.characterName}" already exists.` };
                        }

                        // Create new character
                        const newChar = {
                            id: `char_${Date.now()}`,
                            name: payload.characterName,
                            role: payload.role || 'Character',
                            appearance: payload.appearance || '',
                            description: payload.description || `Character created automatically from dialogue.`
                        };
                        
                        console.log('[CREATE_CHARACTER] Creating new character:', newChar);

                        // Add to global characters
                        if (appActions.setGlobalCharacters) {
                            console.log('[CREATE_CHARACTER] Calling setGlobalCharacters');
                            appActions.setGlobalCharacters(prev => {
                                console.log('[CREATE_CHARACTER] Previous characters:', prev);
                                const updated = [...prev, newChar];
                                console.log('[CREATE_CHARACTER] Updated characters:', updated);
                                return updated;
                            });
                        } else {
                            console.error('[CREATE_CHARACTER] setGlobalCharacters not available!');
                            return { success: false, error: 'Character management not available.' };
                        }

                        console.log('[CREATE_CHARACTER] Execution complete');
                        return { success: true };
                    }

                    case 'RENAME_SCENE': {
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(payload.sceneId)) return sc;
                            return { ...sc, name: payload.newName };
                        }));
                        return { success: true };
                    }

                    case 'SET_SCENE_HEADING': {
                        appActions.updateActiveProjectScenes(prev => prev.map(sc => {
                            if (String(sc.id) !== String(payload.sceneId)) return sc;
                            return { 
                                ...sc, 
                                heading: payload.heading,
                                intExt: payload.intExt,
                                location: payload.location,
                                timeOfDay: payload.timeOfDay,
                            };
                        }));
                        return { success: true };
                    }

                    default:
                        return { success: false, error: `Unknown action type "${type}".` };
                }
            },
        };

// ─── AgenticResponseBuilder ───────────────────────────────────────────────
        export const AgenticResponseBuilder = {

            // 5.1 buildActionCards(intent, projectSnapshot, sessionLog) → ActionProposal[]
            buildActionCards(intent, projectSnapshot, sessionLog) {
                if (!intent || !projectSnapshot) return [];
                const scenes = projectSnapshot.scenes || [];
                const log = sessionLog || [];
                const proposals = [];

                // Helper: generate a unique id
                const uid = () => Date.now() + '-' + Math.random().toString(36).slice(2);

                // Helper: check session log for duplicates
                const isDuplicate = (type, targetSceneId, targetShotId, payload) => {
                    const paramsHash = JSON.stringify(payload);
                    return log.some(entry =>
                        entry.status === 'applied' &&
                        entry.type === type &&
                        String(entry.targetSceneId) === String(targetSceneId) &&
                        String(entry.targetShotId) === String(targetShotId) &&
                        entry.paramsHash === paramsHash
                    );
                };

                // Helper: add proposal if not duplicate and under cap
                const addProposal = (p) => {
                    if (proposals.length >= 5) return;
                    if (isDuplicate(p.type, p.targetSceneId, p.targetShotId, p.payload)) return;
                    proposals.push({ ...p, status: 'pending' });
                };

                const category = intent.category;

                if (category === 'pacing') {
                    // Propose REORDER_SHOTS or DELETE_SHOT for overlong sequences
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        if (shots.length > 6) {
                            // Suggest deleting the longest redundant shot (last one as heuristic)
                            const targetShot = shots[shots.length - 1];
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.DELETE_SHOT,
                                label: `Delete shot ${shots.length} in "${sc.name}" to tighten pacing`,
                                rationale: `Scene "${sc.name}" has ${shots.length} shots — trim the tail to restore rhythm.`,
                                targetSceneId: sc.id,
                                targetShotId: targetShot.id,
                                payload: { shotId: targetShot.id },
                            });
                        }
                        if (shots.length >= 3) {
                            // Suggest reordering: move last shot to position 1 for in medias res
                            const targetShot = shots[shots.length - 1];
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.REORDER_SHOTS,
                                label: `Reorder shot ${shots.length} to position 2 in "${sc.name}"`,
                                rationale: `Front-load the kinetic beat — move the action shot earlier to drive momentum.`,
                                targetSceneId: sc.id,
                                targetShotId: targetShot.id,
                                payload: { shotId: targetShot.id, sceneId: sc.id, fromIndex: shots.length - 1, toIndex: 1 },
                            });
                        }
                    }
                }

                else if (category === 'coverage') {
                    // Propose ADD_SHOT for missing establishing shot or close-up
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        const types = shots.map(sh => (sh.selections?.shotType || '').toLowerCase());
                        const hasEWS = types.some(t => t.includes('extreme wide') || t.includes('ews') || t.includes('establishing'));
                        const hasCU = types.some(t => t.includes('close') || t.includes('cu'));

                        if (!hasEWS) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Add EWS before shot 1 in "${sc.name}"`,
                                rationale: `Scene "${sc.name}" has no establishing shot — the audience lacks spatial context.`,
                                targetSceneId: sc.id,
                                targetShotId: null,
                                payload: { sceneId: sc.id, position: 0, shotType: 'Extreme Wide Shot (EWS)', subject: 'Establishing shot' },
                            });
                        }
                        if (!hasCU && shots.length > 0) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Add CU after shot ${shots.length} in "${sc.name}"`,
                                rationale: `No close-up in "${sc.name}" — a CU here anchors the emotional register.`,
                                targetSceneId: sc.id,
                                targetShotId: null,
                                payload: { sceneId: sc.id, position: shots.length, shotType: 'Close-Up (CU)', subject: 'Reaction close-up' },
                            });
                        }
                    }
                }

                else if (category === 'continuity') {
                    // Propose SET_FIELD to fix inconsistencies
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        if (shots.length < 2) continue;
                        // Check lighting consistency
                        const lightings = shots.map(sh => sh.selections?.lighting).filter(Boolean);
                        const uniqueLightings = [...new Set(lightings)];
                        if (uniqueLightings.length > 2) {
                            const targetShot = shots[shots.length - 1];
                            const dominantLighting = lightings[0];
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.SET_FIELD,
                                label: `Unify lighting on shot ${shots.length} in "${sc.name}"`,
                                rationale: `Lighting shifts across ${uniqueLightings.length} values in "${sc.name}" — a continuity break that pulls the viewer out.`,
                                targetSceneId: sc.id,
                                targetShotId: targetShot.id,
                                payload: { shotId: targetShot.id, field: 'lighting', value: dominantLighting },
                            });
                        }
                        // Check lens consistency
                        const lenses = shots.map(sh => sh.selections?.lens).filter(Boolean);
                        const uniqueLenses = [...new Set(lenses)];
                        if (uniqueLenses.length > 2) {
                            const targetShot = shots[shots.length - 1];
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.SET_FIELD,
                                label: `Match lens on shot ${shots.length} in "${sc.name}"`,
                                rationale: `Lens jumps from ${uniqueLenses[0]} to ${uniqueLenses[uniqueLenses.length - 1]} — lock the optic to preserve visual grammar.`,
                                targetSceneId: sc.id,
                                targetShotId: targetShot.id,
                                payload: { shotId: targetShot.id, field: 'lens', value: lenses[0] },
                            });
                        }
                    }
                }

                else if (category === 'style') {
                    // Propose REWRITE_SHOT or APPLY_STYLE with named Director_Style
                    const styleKeys = Object.keys(DIRECTOR_STYLES || {});
                    const targetStyle = styleKeys[0] || 'Villeneuve';
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        if (shots.length === 0) continue;
                        const targetShot = shots[0];
                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.REWRITE_SHOT,
                            label: `Rewrite shot 1 in "${sc.name}" in ${targetStyle} style`,
                            rationale: `Apply ${targetStyle}'s visual grammar — deliberate framing, environmental dread, and tonal precision.`,
                            targetSceneId: sc.id,
                            targetShotId: targetShot.id,
                            payload: { shotId: targetShot.id, style: targetStyle },
                        });
                        if (shots.length > 1) {
                            const shotIds = shots.map(sh => sh.id);
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.APPLY_STYLE,
                                label: `Apply ${targetStyle} style to all shots in "${sc.name}"`,
                                rationale: `Unify the scene's visual language under a single directorial voice.`,
                                targetSceneId: sc.id,
                                targetShotId: null,
                                payload: { shotIds, style: targetStyle },
                            });
                        }
                    }
                }

                else if (category === 'structure') {
                    // Propose SPLIT_SCENE or ADD_SCENE for act structure issues
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        if (shots.length >= 6) {
                            const splitIdx = Math.floor(shots.length / 2);
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.SPLIT_SCENE,
                                label: `Split "${sc.name}" at shot ${splitIdx + 1}`,
                                rationale: `"${sc.name}" spans ${shots.length} shots — split at the midpoint to create a clean act break.`,
                                targetSceneId: sc.id,
                                targetShotId: null,
                                payload: { sceneId: sc.id, splitIndex: splitIdx },
                            });
                        }
                    }
                    if (scenes.length < 3) {
                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.ADD_SCENE,
                            label: `Add Act 2 scene after scene ${scenes.length}`,
                            rationale: `With only ${scenes.length} scene(s), the three-act structure is incomplete — a midpoint scene is required.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { position: scenes.length },
                        });
                    }
                }

                else if (category === 'tension') {
                    // Propose ADD_SHOT or REORDER_SHOTS for tension escalation
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        if (shots.length === 0) continue;
                        // Add a tight CU to escalate tension
                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.ADD_SHOT,
                            label: `Add ECU at shot ${shots.length + 1} in "${sc.name}"`,
                            rationale: `Punch in to an ECU here — the compression of frame space drives psychological pressure.`,
                            targetSceneId: sc.id,
                            targetShotId: null,
                            payload: { sceneId: sc.id, position: shots.length, shotType: 'Extreme Close-Up (ECU)', subject: 'Tension beat' },
                        });
                        if (shots.length >= 3) {
                            const targetShot = shots[0];
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.REORDER_SHOTS,
                                label: `Move shot 1 to end of "${sc.name}" for delayed reveal`,
                                rationale: `Withhold the wide shot — reorder to build dread before the spatial reveal.`,
                                targetSceneId: sc.id,
                                targetShotId: targetShot.id,
                                payload: { shotId: targetShot.id, sceneId: sc.id, fromIndex: 0, toIndex: shots.length - 1 },
                            });
                        }
                    }
                }

                else if (category === 'emotional_arc') {
                    // Propose REWRITE_SHOT or ADD_SHOT for missing emotional beats
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        if (shots.length === 0) continue;
                        const hasMoodShot = shots.some(sh => {
                            const mood = (sh.selections?.mood || '').toLowerCase();
                            return mood.includes('warm') || mood.includes('intimate') || mood.includes('emotional');
                        });
                        if (!hasMoodShot) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Add emotional beat shot in "${sc.name}"`,
                                rationale: `"${sc.name}" has no emotionally-coded shot — insert a warm CU to anchor the character's inner state.`,
                                targetSceneId: sc.id,
                                targetShotId: null,
                                payload: { sceneId: sc.id, position: shots.length, shotType: 'Close-Up (CU)', mood: 'Warm & Intimate', subject: 'Emotional beat' },
                            });
                        }
                        const targetShot = shots[Math.floor(shots.length / 2)];
                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.REWRITE_SHOT,
                            label: `Rewrite shot ${Math.floor(shots.length / 2) + 1} in "${sc.name}" for emotional resonance`,
                            rationale: `The midpoint shot needs a warmer register — rewrite to surface the character's vulnerability.`,
                            targetSceneId: sc.id,
                            targetShotId: targetShot.id,
                            payload: { shotId: targetShot.id, style: 'Wong Kar-wai' },
                        });
                    }
                }

                else if (category === 'character_presence') {
                    // Propose ADD_SHOT for missing character coverage
                    for (const sc of scenes) {
                        const shots = sc.shots || [];
                        const characters = projectSnapshot.characters || [];
                        if (characters.length > 0 && shots.length > 0) {
                            const charName = (characters[0].name || characters[0] || 'character');
                            const hasCoverage = shots.some(sh =>
                                (sh.subject || '').toLowerCase().includes(charName.toLowerCase())
                            );
                            if (!hasCoverage) {
                                addProposal({
                                    id: uid(),
                                    type: ACTION_TYPES.ADD_SHOT,
                                    label: `Add coverage shot for ${charName} in "${sc.name}"`,
                                    rationale: `${charName} has no dedicated coverage in "${sc.name}" — the character's presence is cinematically absent.`,
                                    targetSceneId: sc.id,
                                    targetShotId: null,
                                    payload: { sceneId: sc.id, position: shots.length, shotType: 'Medium Shot (MS)', subject: charName },
                                });
                            }
                        } else if (shots.length > 0) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Add character coverage shot in "${sc.name}"`,
                                rationale: `No character-specific coverage in "${sc.name}" — a dedicated MS grounds the scene's human anchor.`,
                                targetSceneId: sc.id,
                                targetShotId: null,
                                payload: { sceneId: sc.id, position: shots.length, shotType: 'Medium Shot (MS)', subject: 'Character coverage' },
                            });
                        }
                    }
                }

                // ─── COMMAND MODE ─────────────────────────────────────────────────────
                // Direct commands: add, delete, rewrite, reorder

                else if (category === 'command_add') {
                    // Parse user query to extract scene/shot numbers and position
                    const rawQuery = (intent.rawQuery || '').toLowerCase();
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);
                    const afterMatch = rawQuery.match(/after\s+(?:scene|shot)\s+(\d+)/i);
                    const beforeMatch = rawQuery.match(/before\s+(?:scene|shot)\s+(\d+)/i);
                    const atMatch = rawQuery.match(/at\s+(?:position\s+)?(\d+)/i);

                    const isSceneCommand = rawQuery.includes('scene');
                    const isShotCommand = rawQuery.includes('shot');

                    if (isSceneCommand) {
                        // ADD_SCENE command
                        let position = scenes.length; // default: add at end
                        if (afterMatch) {
                            const afterSceneNum = parseInt(afterMatch[1], 10);
                            position = afterSceneNum; // insert after scene N (0-indexed: position N)
                        } else if (beforeMatch) {
                            const beforeSceneNum = parseInt(beforeMatch[1], 10);
                            position = beforeSceneNum - 1; // insert before scene N
                        } else if (atMatch) {
                            position = parseInt(atMatch[1], 10) - 1; // 1-indexed to 0-indexed
                        }
                        position = Math.max(0, Math.min(position, scenes.length));

                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.ADD_SCENE,
                            label: `Add new scene at position ${position + 1}`,
                            rationale: `Creating a new scene at position ${position + 1} as requested.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { position },
                        });
                    } else if (isShotCommand) {
                        // ADD_SHOT command
                        let targetScene = scenes[0]; // default: first scene
                        let position = 0;

                        if (sceneMatch) {
                            const sceneNum = parseInt(sceneMatch[1], 10);
                            targetScene = scenes[sceneNum - 1] || scenes[0];
                        }

                        if (targetScene) {
                            const shots = targetScene.shots || [];
                            position = shots.length; // default: add at end

                            if (afterMatch) {
                                const afterShotNum = parseInt(afterMatch[1], 10);
                                position = afterShotNum; // insert after shot N
                            } else if (beforeMatch) {
                                const beforeShotNum = parseInt(beforeMatch[1], 10);
                                position = beforeShotNum - 1; // insert before shot N
                            } else if (atMatch) {
                                position = parseInt(atMatch[1], 10) - 1; // 1-indexed to 0-indexed
                            }
                            position = Math.max(0, Math.min(position, shots.length));

                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Add new shot at position ${position + 1} in "${targetScene.name}"`,
                                rationale: `Creating a new shot at position ${position + 1} in "${targetScene.name}" as requested.`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { sceneId: targetScene.id, position, shotType: 'Medium Shot (MS)', subject: 'New shot' },
                            });
                        }
                    } else {
                        // Generic add command without scene/shot specified
                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.ADD_SCENE,
                            label: `Add new scene at end`,
                            rationale: `Creating a new scene at the end of the project as requested.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { position: scenes.length },
                        });
                    }
                }

                else if (category === 'command_delete') {
                    // Parse user query to extract scene/shot numbers
                    const rawQuery = (intent.rawQuery || '').toLowerCase();
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);

                    const isSceneCommand = rawQuery.includes('scene');
                    const isShotCommand = rawQuery.includes('shot');

                    if (isSceneCommand && sceneMatch) {
                        // DELETE_SCENE command (need to add this action type if not present)
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        const targetScene = scenes[sceneNum - 1];
                        if (targetScene) {
                            addProposal({
                                id: uid(),
                                type: 'DELETE_SCENE', // Note: may need to add to ACTION_TYPES
                                label: `Delete scene ${sceneNum}: "${targetScene.name}"`,
                                rationale: `Removing scene ${sceneNum} as requested.`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { sceneId: targetScene.id },
                            });
                        }
                    } else if (isShotCommand && shotMatch) {
                        // DELETE_SHOT command
                        const shotNum = parseInt(shotMatch[1], 10);
                        let targetScene = scenes[0]; // default: first scene

                        if (sceneMatch) {
                            const sceneNum = parseInt(sceneMatch[1], 10);
                            targetScene = scenes[sceneNum - 1] || scenes[0];
                        }

                        if (targetScene) {
                            const shots = targetScene.shots || [];
                            const targetShot = shots[shotNum - 1];
                            if (targetShot) {
                                addProposal({
                                    id: uid(),
                                    type: ACTION_TYPES.DELETE_SHOT,
                                    label: `Delete shot ${shotNum} in "${targetScene.name}"`,
                                    rationale: `Removing shot ${shotNum} from "${targetScene.name}" as requested.`,
                                    targetSceneId: targetScene.id,
                                    targetShotId: targetShot.id,
                                    payload: { shotId: targetShot.id },
                                });
                            }
                        }
                    }
                }

                else if (category === 'command_rewrite') {
                    // Parse user query to extract scene/shot numbers and style
                    const rawQuery = (intent.rawQuery || '').toLowerCase();
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);
                    
                    // Extract director style if mentioned
                    const styleKeys = Object.keys(DIRECTOR_STYLES || {});
                    let targetStyle = null;
                    for (const style of styleKeys) {
                        if (rawQuery.includes(style.toLowerCase())) {
                            targetStyle = style;
                            break;
                        }
                    }

                    const isShotCommand = rawQuery.includes('shot');

                    if (isShotCommand && shotMatch) {
                        // REWRITE_SHOT command
                        const shotNum = parseInt(shotMatch[1], 10);
                        let targetScene = scenes[0]; // default: first scene

                        if (sceneMatch) {
                            const sceneNum = parseInt(sceneMatch[1], 10);
                            targetScene = scenes[sceneNum - 1] || scenes[0];
                        }

                        if (targetScene) {
                            const shots = targetScene.shots || [];
                            const targetShot = shots[shotNum - 1];
                            if (targetShot) {
                                const styleNote = targetStyle ? ` in ${targetStyle} style` : '';
                                addProposal({
                                    id: uid(),
                                    type: ACTION_TYPES.REWRITE_SHOT,
                                    label: `Rewrite shot ${shotNum} in "${targetScene.name}"${styleNote}`,
                                    rationale: `Rewriting shot ${shotNum}${styleNote} as requested.`,
                                    targetSceneId: targetScene.id,
                                    targetShotId: targetShot.id,
                                    payload: { shotId: targetShot.id, style: targetStyle },
                                });
                            }
                        }
                    } else if (sceneMatch) {
                        // Rewrite entire scene (apply style to all shots)
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        const targetScene = scenes[sceneNum - 1];
                        if (targetScene) {
                            const shots = targetScene.shots || [];
                            const shotIds = shots.map(sh => sh.id);
                            const styleNote = targetStyle ? ` in ${targetStyle} style` : '';
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.APPLY_STYLE,
                                label: `Rewrite all shots in scene ${sceneNum}${styleNote}`,
                                rationale: `Rewriting all shots in "${targetScene.name}"${styleNote} as requested.`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { shotIds, style: targetStyle },
                            });
                        }
                    }
                }

                else if (category === 'command_reorder') {
                    // Parse user query to extract scene/shot numbers and positions
                    const rawQuery = (intent.rawQuery || '').toLowerCase();
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);
                    const toMatch = rawQuery.match(/to\s+(?:position\s+)?(\d+)/i);
                    const afterMatch = rawQuery.match(/after\s+(?:scene|shot)\s+(\d+)/i);
                    const beforeMatch = rawQuery.match(/before\s+(?:scene|shot)\s+(\d+)/i);

                    const isShotCommand = rawQuery.includes('shot');

                    if (isShotCommand && shotMatch) {
                        // REORDER_SHOTS command
                        const shotNum = parseInt(shotMatch[1], 10);
                        let targetScene = scenes[0]; // default: first scene

                        if (sceneMatch) {
                            const sceneNum = parseInt(sceneMatch[1], 10);
                            targetScene = scenes[sceneNum - 1] || scenes[0];
                        }

                        if (targetScene) {
                            const shots = targetScene.shots || [];
                            const targetShot = shots[shotNum - 1];
                            if (targetShot) {
                                const fromIndex = shotNum - 1;
                                let toIndex = shots.length - 1; // default: move to end

                                if (toMatch) {
                                    toIndex = parseInt(toMatch[1], 10) - 1; // 1-indexed to 0-indexed
                                } else if (afterMatch) {
                                    toIndex = parseInt(afterMatch[1], 10); // after shot N
                                } else if (beforeMatch) {
                                    toIndex = parseInt(beforeMatch[1], 10) - 1; // before shot N
                                }
                                toIndex = Math.max(0, Math.min(toIndex, shots.length - 1));

                                addProposal({
                                    id: uid(),
                                    type: ACTION_TYPES.REORDER_SHOTS,
                                    label: `Move shot ${shotNum} to position ${toIndex + 1} in "${targetScene.name}"`,
                                    rationale: `Reordering shot ${shotNum} to position ${toIndex + 1} as requested.`,
                                    targetSceneId: targetScene.id,
                                    targetShotId: targetShot.id,
                                    payload: { shotId: targetShot.id, sceneId: targetScene.id, fromIndex, toIndex },
                                });
                            }
                        }
                    }
                }

                // ─── DIALOGUE & ACTION COMMANDS ────────────────────────────────────

                else if (category === 'command_dialogue') {
                    // Enhanced dialogue command with intelligent scene/shot resolution and character management
                    const rawQuery = (intent.rawQuery || '');
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);
                    
                    // Extract character name with improved patterns (handles lowercase, multiple words, etc.)
                    let characterName = 'Character';
                    
                    // Pattern 1: "character says hello" or "character: hello"
                    const charSaysMatch = rawQuery.match(/(?:character\s+)?([A-Za-z][A-Za-z\s]*?)\s+(?:says|:)/i);
                    if (charSaysMatch) {
                        characterName = charSaysMatch[1].trim();
                    } else {
                        // Pattern 2: "jon says hello" (word before "says")
                        const wordSaysMatch = rawQuery.match(/\b([A-Za-z][A-Za-z]*?)\s+says\b/i);
                        if (wordSaysMatch) {
                            characterName = wordSaysMatch[1].trim();
                        } else {
                            // Pattern 3: "add dialogue for jon: hello"
                            const forMatch = rawQuery.match(/for\s+([A-Za-z][A-Za-z\s]*?)(?:\s*:|$)/i);
                            if (forMatch) {
                                characterName = forMatch[1].trim();
                            }
                        }
                    }
                    
                    // Extract dialogue text with multiple patterns
                    const dialogueMatch = rawQuery.match(/says\s+["']?([^"']+?)["']?(?:\s|$)/i) ||
                                        rawQuery.match(/:\s+["']?([^"']+?)["']?(?:\s|$)/i) ||
                                        rawQuery.match(/dialogue\s+["']?([^"']+?)["']?(?:\s|$)/i) ||
                                        rawQuery.match(/add\s+dialogue\s+(?:for\s+\w+\s+)?["']?([^"']+?)["']?(?:\s|$)/i);
                    const dialogueText = dialogueMatch ? (dialogueMatch[1] || 'New dialogue line').trim() : 'New dialogue line';

                    // Smart scene resolution
                    let targetScene = null;
                    let sceneExplicitlySpecified = !!sceneMatch;
                    
                    if (sceneMatch) {
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        targetScene = scenes[sceneNum - 1];
                        if (!targetScene) {
                            addProposal({
                                id: uid(),
                                type: 'ERROR',
                                label: `Scene ${sceneNum} not found`,
                                rationale: `Scene ${sceneNum} doesn't exist. Project has ${scenes.length} scene(s). Please specify a valid scene number.`,
                                targetSceneId: null,
                                targetShotId: null,
                                payload: { error: `Scene ${sceneNum} not found` },
                            });
                            return proposals.slice(0, 5);
                        }
                    } else {
                        // Default to active scene or first scene
                        targetScene = projectSnapshot.activeScene || scenes[0];
                    }

                    if (!targetScene) {
                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.ADD_SCENE,
                            label: `Create first scene`,
                            rationale: `No scenes exist. Creating first scene before adding dialogue.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { position: 0, name: 'Scene 1' },
                        });
                        return proposals.slice(0, 5);
                    }

                    // If scene wasn't explicitly specified and there are multiple scenes, ask for confirmation
                    if (!sceneExplicitlySpecified && scenes.length > 1) {
                        const sceneOptions = scenes.map((sc, idx) => `Scene ${idx + 1}: "${sc.name}"`).join(' | ');
                        addProposal({
                            id: uid(),
                            type: 'CLARIFICATION',
                            label: `Which scene for "${characterName}"'s dialogue?`,
                            rationale: `Multiple scenes found. Please specify which scene to add the dialogue to:\n${sceneOptions}`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { 
                                clarificationType: 'scene_selection',
                                characterName,
                                dialogueText,
                                availableScenes: scenes.map((sc, idx) => ({ num: idx + 1, id: sc.id, name: sc.name }))
                            },
                        });
                        return proposals.slice(0, 5);
                    }

                    // Smart shot resolution
                    let targetShot = null;
                    let shotExplicitlySpecified = !!shotMatch;
                    const shots = targetScene.shots || [];
                    
                    if (shotMatch) {
                        const shotNum = parseInt(shotMatch[1], 10);
                        targetShot = shots[shotNum - 1];
                        if (!targetShot) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Create shot ${shotNum} in "${targetScene.name}"`,
                                rationale: `Shot ${shotNum} doesn't exist in "${targetScene.name}". Creating shot before adding dialogue.`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { 
                                    sceneId: targetScene.id, 
                                    position: shotNum - 1, 
                                    shotType: 'Medium Shot (MS)', 
                                    subject: `Shot for ${characterName}'s dialogue` 
                                },
                            });
                            return proposals.slice(0, 5);
                        }
                    } else {
                        // If shot wasn't explicitly specified and scene has multiple shots, ask for confirmation
                        if (shots.length > 1) {
                            const shotOptions = shots.map((sh, idx) => `Shot ${idx + 1}`).join(' | ');
                            addProposal({
                                id: uid(),
                                type: 'CLARIFICATION',
                                label: `Which shot in "${targetScene.name}" for "${characterName}"'s dialogue?`,
                                rationale: `"${targetScene.name}" has ${shots.length} shots. Please specify which shot:\n${shotOptions}`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { 
                                    clarificationType: 'shot_selection',
                                    sceneId: targetScene.id,
                                    characterName,
                                    dialogueText,
                                    availableShots: shots.map((sh, idx) => ({ num: idx + 1, id: sh.id }))
                                },
                            });
                            return proposals.slice(0, 5);
                        }
                        
                        // Default to last shot or create first shot
                        targetShot = shots[shots.length - 1];
                        if (!targetShot) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Create first shot in "${targetScene.name}"`,
                                rationale: `"${targetScene.name}" has no shots. Creating first shot before adding dialogue.`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { 
                                    sceneId: targetScene.id, 
                                    position: 0, 
                                    shotType: 'Medium Shot (MS)', 
                                    subject: `Shot for ${characterName}'s dialogue` 
                                },
                            });
                            return proposals.slice(0, 5);
                        }
                    }

                    // Check if character exists in global characters
                    const existingCharacters = projectSnapshot.characters || [];
                    const characterExists = existingCharacters.find(c => 
                        (c.name || c).toLowerCase() === characterName.toLowerCase()
                    );

                    // Create proposals for dialogue and character management
                    const proposals_list = [];

                    // If character doesn't exist, propose creating it
                    if (!characterExists && characterName !== 'Character') {
                        proposals_list.push({
                            id: uid(),
                            type: 'CREATE_CHARACTER',
                            label: `Create character "${characterName}"`,
                            rationale: `Character "${characterName}" not found in Character Library. Creating new character.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { 
                                characterName: characterName,
                                role: 'Character',
                                appearance: '',
                                description: `Character created from dialogue: "${dialogueText}"`
                            },
                        });
                    }

                    // Add dialogue proposal
                    proposals_list.push({
                        id: uid(),
                        type: ACTION_TYPES.ADD_DIALOGUE,
                        label: `Add dialogue: "${characterName}" in "${targetScene.name}" shot ${shots.indexOf(targetShot) + 1}`,
                        rationale: `Adding dialogue line for ${characterName}: "${dialogueText}"`,
                        targetSceneId: targetScene.id,
                        targetShotId: targetShot.id,
                        payload: {
                            shotId: targetShot.id,
                            character: characterName,
                            text: dialogueText,
                            emotion: 'Neutral',
                        },
                    });

                    // Add all proposals
                    proposals_list.forEach(p => addProposal(p));
                }

                else if (category === 'command_action') {
                    // Enhanced action command with intelligent scene/shot resolution
                    const rawQuery = (intent.rawQuery || '');
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);
                    
                    // Extract action text with improved patterns
                    let actionText = 'New action description';
                    const actionMatch = rawQuery.match(/add\s+action\s+(?:in\s+)?(?:scene\s+\d+\s+)?(?:shot\s+\d+\s+)?["']?([^"']+?)["']?(?:\s|$)/i) ||
                                      rawQuery.match(/action\s*:?\s+["']?([^"']+?)["']?(?:\s|$)/i) ||
                                      rawQuery.match(/description\s*:?\s+["']?([^"']+?)["']?(?:\s|$)/i);
                    if (actionMatch) {
                        actionText = actionMatch[1].trim();
                    }

                    // Smart scene resolution
                    let targetScene = null;
                    if (sceneMatch) {
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        targetScene = scenes[sceneNum - 1];
                        if (!targetScene) {
                            addProposal({
                                id: uid(),
                                type: 'ERROR',
                                label: `Scene ${sceneNum} not found`,
                                rationale: `Scene ${sceneNum} doesn't exist. Project has ${scenes.length} scene(s). Please specify a valid scene number.`,
                                targetSceneId: null,
                                targetShotId: null,
                                payload: { error: `Scene ${sceneNum} not found` },
                            });
                            return proposals.slice(0, 5);
                        }
                    } else {
                        // Default to active scene or first scene
                        targetScene = projectSnapshot.activeScene || scenes[0];
                    }

                    if (!targetScene) {
                        addProposal({
                            id: uid(),
                            type: ACTION_TYPES.ADD_SCENE,
                            label: `Create first scene`,
                            rationale: `No scenes exist. Creating first scene before adding action.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { position: 0, name: 'Scene 1' },
                        });
                        return proposals.slice(0, 5);
                    }

                    // Smart shot resolution
                    let targetShot = null;
                    const shots = targetScene.shots || [];
                    if (shotMatch) {
                        const shotNum = parseInt(shotMatch[1], 10);
                        targetShot = shots[shotNum - 1];
                        if (!targetShot) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Create shot ${shotNum} in "${targetScene.name}"`,
                                rationale: `Shot ${shotNum} doesn't exist in "${targetScene.name}". Creating shot before adding action.`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { 
                                    sceneId: targetScene.id, 
                                    position: shotNum - 1, 
                                    shotType: 'Medium Shot (MS)', 
                                    subject: actionText 
                                },
                            });
                            return proposals.slice(0, 5);
                        }
                    } else {
                        // Default to last shot or create first shot
                        targetShot = shots[shots.length - 1];
                        if (!targetShot) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Create first shot in "${targetScene.name}"`,
                                rationale: `"${targetScene.name}" has no shots. Creating first shot with action description.`,
                                targetSceneId: targetScene.id,
                                targetShotId: null,
                                payload: { 
                                    sceneId: targetScene.id, 
                                    position: 0, 
                                    shotType: 'Medium Shot (MS)', 
                                    subject: actionText 
                                },
                            });
                            return proposals.slice(0, 5);
                        }
                    }

                    // Add action proposal
                    addProposal({
                        id: uid(),
                        type: ACTION_TYPES.ADD_ACTION,
                        label: `Add action to "${targetScene.name}" shot ${shots.indexOf(targetShot) + 1}`,
                        rationale: `Adding action description: "${actionText}"`,
                        targetSceneId: targetScene.id,
                        targetShotId: targetShot.id,
                        payload: {
                            shotId: targetShot.id,
                            actionText: actionText,
                        },
                    });
                }

                else if (category === 'command_edit_dialogue') {
                    // Parse user query to extract character name, new dialogue text, and shot/scene
                    const rawQuery = (intent.rawQuery || '');
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);
                    const dialogueNumMatch = rawQuery.match(/dialogue\s+(\d+)|line\s+(\d+)/i);
                    
                    // Extract character name with improved patterns
                    let characterName = null;
                    const charMatch = rawQuery.match(/(?:character\s+)?([A-Za-z][A-Za-z\s]*?)\s+(?:to|says|:)/i) ||
                                    rawQuery.match(/\b([A-Za-z][A-Za-z]*?)\s+(?:to|says)\b/i);
                    if (charMatch) {
                        characterName = charMatch[1].trim();
                    }
                    
                    // Extract new dialogue text with improved patterns
                    let newDialogueText = 'Updated dialogue';
                    const newDialogueMatch = rawQuery.match(/(?:to|says)\s+["']?([^"']+?)["']?(?:\s|$)/i) ||
                                           rawQuery.match(/dialogue\s+["']?([^"']+?)["']?(?:\s|$)/i);
                    if (newDialogueMatch) {
                        newDialogueText = newDialogueMatch[1].trim();
                    }

                    let targetScene = scenes[0];
                    let targetShot = null;

                    if (sceneMatch) {
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        targetScene = scenes[sceneNum - 1] || scenes[0];
                    }

                    if (targetScene) {
                        const shots = targetScene.shots || [];
                        if (shotMatch) {
                            const shotNum = parseInt(shotMatch[1], 10);
                            targetShot = shots[shotNum - 1];
                        } else {
                            targetShot = shots[shots.length - 1];
                        }

                        if (targetShot) {
                            const dialogueIndex = dialogueNumMatch ? parseInt(dialogueNumMatch[1] || dialogueNumMatch[2], 10) - 1 : 0;
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.EDIT_DIALOGUE,
                                label: `Edit dialogue in shot ${shots.indexOf(targetShot) + 1}`,
                                rationale: `Updating dialogue to: "${newDialogueText}"`,
                                targetSceneId: targetScene.id,
                                targetShotId: targetShot.id,
                                payload: {
                                    shotId: targetShot.id,
                                    dialogueIndex: dialogueIndex,
                                    character: characterName,
                                    text: newDialogueText,
                                },
                            });
                        }
                    }
                }

                else if (category === 'command_edit_action') {
                    // Parse user query to extract new action description and shot/scene
                    const rawQuery = (intent.rawQuery || '');
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const shotMatch = rawQuery.match(/shot\s+(\d+)/i);
                    
                    // Extract new action text
                    const newActionMatch = rawQuery.match(/(?:to|action|description)\s+["']?([^"']+)["']?/i);
                    const newActionText = newActionMatch ? newActionMatch[1] : 'Updated action';

                    let targetScene = scenes[0];
                    let targetShot = null;

                    if (sceneMatch) {
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        targetScene = scenes[sceneNum - 1] || scenes[0];
                    }

                    if (targetScene) {
                        const shots = targetScene.shots || [];
                        if (shotMatch) {
                            const shotNum = parseInt(shotMatch[1], 10);
                            targetShot = shots[shotNum - 1];
                        } else {
                            targetShot = shots[shots.length - 1];
                        }

                        if (targetShot) {
                            addProposal({
                                id: uid(),
                                type: ACTION_TYPES.EDIT_ACTION,
                                label: `Edit action in shot ${shots.indexOf(targetShot) + 1}`,
                                rationale: `Updating action to: "${newActionText}"`,
                                targetSceneId: targetScene.id,
                                targetShotId: targetShot.id,
                                payload: {
                                    shotId: targetShot.id,
                                    actionText: newActionText,
                                },
                            });
                        }
                    }
                }

                // ─── SCENE MANAGEMENT COMMANDS ────────────────────────────────────

                else if (category === 'command_scene_name') {
                    // Parse scene number and new name
                    const rawQuery = (intent.rawQuery || '');
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    const nameMatch = rawQuery.match(/(?:name|title|to)\s+["']?([^"']+)["']?/i) ||
                                    rawQuery.match(/["']([^"']+)["']/);
                    
                    const newName = nameMatch ? nameMatch[1] : 'New Scene Name';
                    
                    let targetScene = null;
                    if (sceneMatch) {
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        targetScene = scenes[sceneNum - 1];
                    } else {
                        targetScene = projectSnapshot.activeScene || scenes[0];
                    }

                    if (!targetScene) {
                        addProposal({
                            id: uid(),
                            type: 'ERROR',
                            label: `No scene to rename`,
                            rationale: `No scenes exist or scene not found. Create a scene first.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { error: 'No scene found' },
                        });
                        return proposals.slice(0, 5);
                    }

                    addProposal({
                        id: uid(),
                        type: ACTION_TYPES.RENAME_SCENE,
                        label: `Rename "${targetScene.name}" to "${newName}"`,
                        rationale: `Updating scene name from "${targetScene.name}" to "${newName}".`,
                        targetSceneId: targetScene.id,
                        targetShotId: null,
                        payload: {
                            sceneId: targetScene.id,
                            newName: newName,
                        },
                    });
                }

                else if (category === 'command_scene_heading') {
                    // Parse scene number and heading components
                    const rawQuery = (intent.rawQuery || '');
                    const sceneMatch = rawQuery.match(/scene\s+(\d+)/i);
                    
                    // Extract heading components
                    const intExt = rawQuery.match(/\b(int|ext|interior|exterior)\b/i)?.[1]?.toUpperCase() || 'INT';
                    const location = rawQuery.match(/(?:location|at|in)\s+([^-\n]+)/i)?.[1]?.trim() || 'LOCATION';
                    const timeOfDay = rawQuery.match(/\b(day|night|morning|evening|dawn|dusk)\b/i)?.[1]?.toUpperCase() || 'DAY';
                    
                    const heading = `${intExt}. ${location} - ${timeOfDay}`;
                    
                    let targetScene = null;
                    if (sceneMatch) {
                        const sceneNum = parseInt(sceneMatch[1], 10);
                        targetScene = scenes[sceneNum - 1];
                    } else {
                        targetScene = projectSnapshot.activeScene || scenes[0];
                    }

                    if (!targetScene) {
                        addProposal({
                            id: uid(),
                            type: 'ERROR',
                            label: `No scene for heading`,
                            rationale: `No scenes exist or scene not found. Create a scene first.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { error: 'No scene found' },
                        });
                        return proposals.slice(0, 5);
                    }

                    addProposal({
                        id: uid(),
                        type: ACTION_TYPES.SET_SCENE_HEADING,
                        label: `Set scene heading: "${heading}"`,
                        rationale: `Setting scene heading for "${targetScene.name}" to "${heading}".`,
                        targetSceneId: targetScene.id,
                        targetShotId: null,
                        payload: {
                            sceneId: targetScene.id,
                            heading: heading,
                            intExt: intExt,
                            location: location,
                            timeOfDay: timeOfDay,
                        },
                    });
                }

                return proposals.slice(0, 5);
            },

            // 5.2 buildIdeaCards(intent, projectSnapshot) → IdeaCardData[]
            buildIdeaCards(intent, projectSnapshot) {
                if (!intent || !projectSnapshot) return [];
                const scenes = projectSnapshot.scenes || [];
                const uid = () => Date.now() + '-' + Math.random().toString(36).slice(2);
                const ideas = [];

                const activeScene = projectSnapshot.activeScene ||
                    scenes.find(s => s.id === projectSnapshot.activeSceneId) ||
                    scenes[0];

                // Idea 1: Visual escalation sequence
                ideas.push({
                    id: uid(),
                    title: 'Visual Escalation Sequence',
                    rationale: 'Open wide to establish geography, then compress the frame as tension mounts. The push from EWS to ECU mirrors the protagonist\'s psychological constriction. End on a tight insert to lock the emotional register.',
                    shotSequence: 'EWS → MS → CU → ECU (push-in reveal)',
                    status: 'pending',
                });

                // Idea 2: Contrast-cut structure
                if (scenes.length >= 2) {
                    ideas.push({
                        id: uid(),
                        title: 'Contrast-Cut Structure',
                        rationale: 'Intercut between two opposing visual registers — warm and cold, wide and tight. The juxtaposition creates subtext without dialogue. Each cut should land on a beat that recontextualizes the previous image.',
                        shotSequence: 'WS (cold) → CU (warm) → WS (cold) → ECU (warm)',
                        status: 'pending',
                    });
                }

                // Idea 3: Scene-specific idea based on active scene
                if (activeScene) {
                    const shots = activeScene.shots || [];
                    const shotCount = shots.length;
                    ideas.push({
                        id: uid(),
                        title: `Motivated Camera Movement in "${activeScene.name}"`,
                        rationale: `Use camera movement as a narrative device rather than decoration. Every push, pull, or pan should be motivated by character action or emotional state. In "${activeScene.name}" with ${shotCount} shot(s), a single motivated dolly-in at the scene\'s turning point will carry more weight than a static cut.`,
                        shotSequence: 'Static WS → Motivated dolly-in to MS → Locked CU',
                        status: 'pending',
                    });
                }

                return ideas.slice(0, 3);
            },

            // 5.3 expandIdea(ideaCard, projectSnapshot) → ActionProposal[]
            expandIdea(ideaCard, projectSnapshot) {
                if (!ideaCard || !projectSnapshot) return [];
                const scenes = projectSnapshot.scenes || [];
                const uid = () => Date.now() + '-' + Math.random().toString(36).slice(2);
                const proposals = [];

                const activeScene = projectSnapshot.activeScene ||
                    scenes.find(s => s.id === projectSnapshot.activeSceneId) ||
                    scenes[0];

                if (!activeScene) return [];

                const shots = activeScene.shots || [];
                const sceneId = activeScene.id;

                // Parse the shotSequence to generate concrete ADD_SHOT proposals
                const seqStr = ideaCard.shotSequence || '';
                const seqParts = seqStr.split(/→|->/).map(s => s.trim()).filter(Boolean);

                // Map sequence abbreviations to full shot types
                const shotTypeMap = {
                    'EWS': 'Extreme Wide Shot (EWS)',
                    'WS': 'Wide Shot (WS)',
                    'MS': 'Medium Shot (MS)',
                    'CU': 'Close-Up (CU)',
                    'ECU': 'Extreme Close-Up (ECU)',
                    'OTS': 'Over-the-Shoulder (OTS)',
                    'POV': 'POV Shot',
                    'INSERT': 'Insert Shot',
                };

                // Generate up to 3 ADD_SHOT proposals from the sequence
                const maxProposals = Math.min(seqParts.length, 3);
                for (let i = 0; i < maxProposals; i++) {
                    const part = seqParts[i];
                    // Extract shot type abbreviation (first word before any parenthetical)
                    const abbr = part.split(/\s+/)[0].toUpperCase();
                    const shotType = shotTypeMap[abbr] || part;
                    const position = shots.length + i;

                    proposals.push({
                        id: uid(),
                        type: ACTION_TYPES.ADD_SHOT,
                        label: `Add ${abbr} at position ${position + 1} in "${activeScene.name}"`,
                        rationale: `Expand idea "${ideaCard.title}" — ${part} at position ${i + 1} of the sequence.`,
                        targetSceneId: sceneId,
                        targetShotId: null,
                        payload: { sceneId, position, shotType, subject: `${ideaCard.title} — step ${i + 1}` },
                        status: 'pending',
                    });
                }

                return proposals;
            },

            // 5.4 build(intent, snapshot, brainMode, engineRef, sessionLog) → AgenticResponse (async)
            async build(intent, snapshot, brainMode, engineRef, sessionLog) {
                // Unknown intent: plain text response, no action cards
                if (!intent || intent.category === 'unknown') {
                    const rawQuery = (intent && intent.rawQuery) || '';
                    const { response, source } = await BrainRouter.route(rawQuery, snapshot, brainMode, engineRef);
                    return {
                        text: response,
                        actionCards: [],
                        ideaCards: [],
                        closingNote: '',
                        source,
                    };
                }

                // Get text response from BrainRouter (preserves existing Fast/Deep Brain routing)
                const { response, source } = await BrainRouter.route(intent.rawQuery, snapshot, brainMode, engineRef);

                // Build action cards based on intent category + snapshot analysis
                const actionCards = this.buildActionCards(intent, snapshot, sessionLog || []);

                // Build idea cards only for ideas-mode queries
                const ideaCards = intent.isIdeasMode ? this.buildIdeaCards(intent, snapshot) : [];

                // Determine closing note using cinematic vocabulary
                let closingNote = '';
                if (actionCards.length > 0 && ideaCards.length > 0) {
                    closingNote = 'Confirm the action cards above to apply these fixes, or explore an idea card to expand it into concrete shot proposals.';
                } else if (actionCards.length > 0) {
                    closingNote = 'Confirm the action cards above to apply these fixes to your sequence.';
                } else if (ideaCards.length > 0) {
                    closingNote = 'Explore an idea card to expand it into concrete shot proposals.';
                } else {
                    closingNote = 'Refine your query with a specific scene or shot reference to unlock targeted action proposals.';
                }

                return {
                    text: response,
                    actionCards,
                    ideaCards,
                    closingNote,
                    source,
                };
            },

            // 5.5 scan(projectSnapshot) → AgenticResponse | null
            scan(projectSnapshot) {
                if (!projectSnapshot) return null;
                const scenes = projectSnapshot.scenes || [];
                if (scenes.length === 0) return null;

                const uid = () => Date.now() + '-' + Math.random().toString(36).slice(2);

                // Priority 1: Missing coverage (no EWS in any scene)
                for (const sc of scenes) {
                    const shots = sc.shots || [];
                    if (shots.length === 0) continue;
                    const types = shots.map(sh => (sh.selections?.shotType || '').toLowerCase());
                    const hasEWS = types.some(t => t.includes('extreme wide') || t.includes('ews') || t.includes('establishing'));
                    if (!hasEWS) {
                        return {
                            text: `Coverage gap detected: "${sc.name}" opens without an establishing shot. The audience has no spatial anchor — every subsequent cut lands without geographic context.`,
                            actionCards: [{
                                id: uid(),
                                type: ACTION_TYPES.ADD_SHOT,
                                label: `Add EWS before shot 1 in "${sc.name}"`,
                                rationale: `No establishing shot in "${sc.name}" — insert an EWS to orient the viewer before the scene's first cut.`,
                                targetSceneId: sc.id,
                                targetShotId: null,
                                payload: { sceneId: sc.id, position: 0, shotType: 'Extreme Wide Shot (EWS)', subject: 'Establishing shot' },
                                status: 'pending',
                            }],
                            ideaCards: [],
                            closingNote: 'Confirm the action card above to add the establishing shot to your sequence.',
                            source: 'fast',
                        };
                    }
                }

                // Priority 2: Continuity conflict (lighting inconsistency across shots)
                for (const sc of scenes) {
                    const shots = sc.shots || [];
                    if (shots.length < 2) continue;
                    const lightings = shots.map(sh => sh.selections?.lighting).filter(Boolean);
                    const uniqueLightings = [...new Set(lightings)];
                    if (uniqueLightings.length > 2) {
                        const targetShot = shots[shots.length - 1];
                        return {
                            text: `Continuity conflict in "${sc.name}": lighting shifts across ${uniqueLightings.length} distinct values (${uniqueLightings.slice(0, 3).join(', ')}). This breaks the scene's visual grammar and signals a production error to the viewer.`,
                            actionCards: [{
                                id: uid(),
                                type: ACTION_TYPES.SET_FIELD,
                                label: `Unify lighting on shot ${shots.length} in "${sc.name}"`,
                                rationale: `Lock the lighting to "${lightings[0]}" to restore continuity across the scene.`,
                                targetSceneId: sc.id,
                                targetShotId: targetShot.id,
                                payload: { shotId: targetShot.id, field: 'lighting', value: lightings[0] },
                                status: 'pending',
                            }],
                            ideaCards: [],
                            closingNote: 'Confirm the action card above to resolve the continuity conflict.',
                            source: 'fast',
                        };
                    }
                }

                // Priority 3: Pacing (scene with too many shots)
                for (const sc of scenes) {
                    const shots = sc.shots || [];
                    if (shots.length > 8) {
                        const targetShot = shots[shots.length - 1];
                        return {
                            text: `Pacing issue in "${sc.name}": ${shots.length} shots in a single scene creates a sluggish editorial rhythm. The sequence needs a structural cut — either trim redundant shots or split the scene at its midpoint.`,
                            actionCards: [{
                                id: uid(),
                                type: ACTION_TYPES.DELETE_SHOT,
                                label: `Delete shot ${shots.length} in "${sc.name}" to tighten the cut`,
                                rationale: `Remove the tail shot to restore editorial momentum — the scene's final beat is diluting the sequence's drive.`,
                                targetSceneId: sc.id,
                                targetShotId: targetShot.id,
                                payload: { shotId: targetShot.id },
                                status: 'pending',
                            }],
                            ideaCards: [],
                            closingNote: 'Confirm the action card above to tighten the scene\'s pacing.',
                            source: 'fast',
                        };
                    }
                }

                // Priority 4: Structural gap (fewer than 3 scenes)
                if (scenes.length < 3) {
                    return {
                        text: `Structural gap: the project has only ${scenes.length} scene(s). A three-act structure requires at minimum a setup, confrontation, and resolution — the current sequence is missing act-level architecture.`,
                        actionCards: [{
                            id: uid(),
                            type: ACTION_TYPES.ADD_SCENE,
                            label: `Add Act 2 scene after scene ${scenes.length}`,
                            rationale: `Insert a confrontation scene to complete the three-act arc — the midpoint is the structural spine of the narrative.`,
                            targetSceneId: null,
                            targetShotId: null,
                            payload: { position: scenes.length },
                            status: 'pending',
                        }],
                        ideaCards: [],
                        closingNote: 'Confirm the action card above to add the missing act to your structure.',
                        source: 'fast',
                    };
                }

                return null;
            },
        };

// ─── Context / Scene helpers ──────────────────────────────────────────────
        export function buildContextPrompt(query, snap) {
            if (!snap) return query;
            const scenes = snap.scenes || [];
            const chars = (snap.characters || []).map(c => c.name || c).join(', ') || 'none';
            const locs = (snap.locations || []).map(l => l.name || l).join(', ') || 'none';
            const sceneList = scenes.map((sc, i) => {
                const shots = (sc.shots || []).map((sh, j) => `    Shot ${j+1}: ${sh.subject || 'no subject'} [${sh.selections?.shotType || 'no type'}]`).join('\n');
                return `  Scene ${i+1}: "${sc.name}"\n${shots}`;
            }).join('\n');
            return `PROJECT: "${snap.projectName || 'Untitled'}"\nCHARACTERS: ${chars}\nLOCATIONS: ${locs}\nSCENES:\n${sceneList}\n\nDIRECTOR QUESTION: ${query}`;
        }

export function resolveScene(query, snap) {
            if (!snap || !snap.scenes) return snap?.activeScene || null;
            
            // Try to match "scene N" pattern
            const match = query.match(/scene\s+(\d+)/i);
            if (match) {
                const idx = parseInt(match[1], 10) - 1;
                if (snap.scenes[idx]) return snap.scenes[idx];
            }
            
            // Try to match scene by name (case-insensitive)
            const lower = query.toLowerCase();
            const byName = snap.scenes.find(sc => {
                const sceneName = (sc.name || '').toLowerCase();
                return sceneName && lower.includes(sceneName);
            });
            if (byName) return byName;
            
            // Try to match scene by ID
            const byId = snap.scenes.find(sc => lower.includes(String(sc.id)));
            if (byId) return byId;
            
            // Default to active scene or first scene
            return snap.activeScene || snap.scenes[0] || null;
        }

export function resolveShot(query, snap) {
            if (!snap || !snap.activeScene) return null;
            const shots = snap.activeScene.shots || [];
            
            // Try to match "shot N" pattern
            const match = query.match(/shot\s+(\d+)/i);
            if (match) {
                const idx = parseInt(match[1], 10) - 1;
                if (shots[idx]) return shots[idx];
            }
            
            // Try to match shot by ID
            const lower = query.toLowerCase();
            const byId = shots.find(sh => lower.includes(String(sh.id)));
            if (byId) return byId;
            
            // Default to last shot
            return shots[shots.length - 1] || null;
        }

