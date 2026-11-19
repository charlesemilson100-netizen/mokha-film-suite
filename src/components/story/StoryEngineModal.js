import React, { useEffect, useRef, useState } from 'react';
import { CharacterNode } from './CharacterNode';
import { InputField } from './InputField';
import { Icon } from '../ui/Icon';
import { RANDOM_FILL, getRandom, randChar } from '../../data/characters';
import { getRandomWord } from '../../data/library';
import { LocalAIEngine } from '../../engine/prompt';

export const StoryEngineModal = ({ onClose, uiStyle, storyData, setStoryData, scenes, globalCharacters, setGlobalCharacters, updateActiveProjectScenes, setActiveSceneId, projects, setProjects, setActiveProjectId, initialStoryId, isRevising, setIsRevising, stories, setStories, isLlavaReady, isGenerating, handleLLaVAStoryField, llavaMonitorLog, setLlavaMonitorLog }) => {
            const [isSeClosing, setIsSeClosing] = React.useState(false);
            const handleClose = () => {
                if (uiStyle === 'mr-re') {
                    setIsSeClosing(true);
                    setTimeout(() => { setIsSeClosing(false); onClose(); }, 220);
                } else {
                    onClose();
                }
            };
            const llavaStoryImageRef = React.useRef(null);
            const [pendingLLaVAField, setPendingLLaVAField] = React.useState(null);

            const triggerLLaVAForField = (section, field) => {
                if (!isLlavaReady) { addToast('LLaVA not connected. Open the Script Parser modal and click Connect LLaVA.', 'warning', 5000); return; }
                setPendingLLaVAField({ section, field });
                llavaStoryImageRef.current.click();
            };

            const handleLLaVAImagePick = (e) => {
                const file = e.target.files[0];
                if (!file || !pendingLLaVAField) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    handleLLaVAStoryField(ev.target.result, pendingLLaVAField.field, (result) => {
                        handleStoryChange(pendingLLaVAField.section, pendingLLaVAField.field, result);
                    }, pendingLLaVAField.section);
                };
                reader.readAsDataURL(file);
                e.target.value = null;
                setPendingLLaVAField(null);
            };
            const { useCallback } = React;
            // stories + setStories now received as props from App
            const [selectedStoryId, setSelectedStoryId] = useState(null);
            const [newStoryName, setNewStoryName] = useState('');
            const [showStoryList, setShowStoryList] = useState(true);
            const [showDependencyGraph, setShowDependencyGraph] = useState(false);
            const [showArcVisualizer, setShowArcVisualizer] = useState(false);
            const [showVersionHistory, setShowVersionHistory] = useState(false);
            const [showGenrePacks, setShowGenrePacks] = useState(false);
            const [showBeatSheet, setShowBeatSheet] = useState(false);
            const [beatSheets, setBeatSheets] = useState([]);
            const [showTonePreview, setShowTonePreview] = useState(false);
            const [scriptText, setScriptText] = useState('');
            const [parseMode, setParseMode] = useState('regex');
            const [shotCountTarget, setShotCountTarget] = useState(6);
            const [actSceneMap, setActSceneMap] = useState({ act1: 0, act2: 0, act3: 0 });
            const [actShotTypeMap, setActShotTypeMap] = useState({ act1: '', act2: '', act3: '' });

            useEffect(() => {
                if (initialStoryId && stories.length > 0) {
                    const match = stories.find(s => s.id === initialStoryId || s.projectId === initialStoryId);
                    if (match) {
                        selectStory(match.id);
                        if (isRevising) setShowStoryList(false);
                    }
                }
            }, [initialStoryId, stories]);

            const parseScriptToActs = () => {
                if (!scriptText.trim()) return;
                const acts = LocalAIEngine.parseScriptToActs(scriptText);
                setStoryData(prev => ({ ...prev, act1: acts.act1, act2: acts.act2, act3: acts.act3 }));
                addToast('✅ Three-Act Structure parsed! Acts populated.', 'success', 4000);
            };

            const generateBeatSheet = () => {
                const d = storyData;
                const genre = d.dramatic.genre || 'Drama';
                const char = d.act1.character || 'The protagonist';
                const world = d.act1.world || 'The world';
                const incident = d.act1.incident || 'An unexpected event';
                const obstacles = d.act2.obstacles || 'Rising challenges';
                const midpoint = d.act2.midpoint || 'A major turning point';
                const stakes = d.act2.stakes || 'Everything is at risk';
                const climax = d.act3.climax || 'The final confrontation';
                const resolution = d.act3.resolution || 'Loose ends are tied';
                const aftermath = d.act3.aftermath || 'A new normal';
                const villain = d.dramatic.villain || 'The antagonist';
                const arc = d.dramatic.emotionalArc || 'transformation';
                const message = d.theme.message || '';
                const beats = [
                    { num: 1,  act: 1, label: 'Opening Image',     desc: `${world}. We see the protagonist's ordinary world before everything changes. Visual tone: ${d.dramatic.visualStyle || 'cinematic'}.` },
                    { num: 2,  act: 1, label: 'Theme Stated',      desc: `Someone hints at the theme. ${message ? `"${message}"` : 'The central question of the story is posed.'}` },
                    { num: 3,  act: 1, label: 'Setup',             desc: `${char}. We understand their flaws, wants, and the world they inhabit.` },
                    { num: 4,  act: 1, label: 'Catalyst',          desc: `${incident}. The inciting incident that disrupts the status quo.` },
                    { num: 5,  act: 1, label: 'Debate',            desc: `Should the protagonist act? Internal conflict. Fear vs. necessity. The last moment of the old world.` },
                    { num: 6,  act: 2, label: 'Break into Two',    desc: `The protagonist commits. They leave the old world and enter the upside-down world of Act 2.` },
                    { num: 7,  act: 2, label: 'B Story',           desc: `A secondary storyline begins — often a relationship that carries the theme. Characters who challenge the protagonist.` },
                    { num: 8,  act: 2, label: 'Fun & Games',       desc: `${obstacles}. The promise of the premise. The protagonist explores the new world, wins some, loses some.` },
                    { num: 9,  act: 2, label: 'Midpoint',          desc: `${midpoint}. A false victory or false defeat. Stakes are raised: ${stakes}.` },
                    { num: 10, act: 2, label: 'Bad Guys Close In', desc: `${villain} tightens the grip. The protagonist's team fractures. Internal and external pressure mounts.` },
                    { num: 11, act: 2, label: 'All Is Lost',       desc: `The lowest point. Everything the protagonist worked for is gone. The opposite of the opening image.` },
                    { num: 12, act: 2, label: 'Dark Night of Soul',desc: `Despair. The protagonist must dig deep. The theme is tested to its breaking point. Arc: ${arc}.` },
                    { num: 13, act: 3, label: 'Break into Three',  desc: `A new idea, a new ally, or a realization gives the protagonist what they need to fight back.` },
                    { num: 14, act: 3, label: 'Finale',            desc: `${climax}. The protagonist defeats ${villain} using everything they have learned. ${resolution}.` },
                    { num: 15, act: 3, label: 'Final Image',       desc: `${aftermath}. The mirror of the opening image — proof that change has occurred.` },
                ];
                setBeatSheets(beats);
                setShowBeatSheet(true);
            };

            const sendBeatSheetToShots = () => {
                if (!selectedStoryId) { addToast('Select a story first.', 'warning', 3000); return; }
                const story = stories.find(s => s.id === selectedStoryId);
                if (!story) return;
                const activeProject = projects.find(p => p.id === story.projectId);
                if (!activeProject) return;
                const ACT_LIGHTING = { 1: 'Natural Daylight', 2: 'Low Key (Dark/Moody)', 3: 'Cinematic Rim Lighting' };
                const ACT_MOVEMENT = { 1: 'Static / Tripod', 2: 'Handheld / Shaky', 3: 'Dolly In' };
                const ACT_SPEED   = { 1: 'Normal Speed', 2: 'Speed Ramp', 3: 'Slow Motion' };
                const newShots = beatSheets.map((beat, i) => ({
                    id: Date.now() + i,
                    subject: `[Beat ${beat.num}: ${beat.label}] ${beat.desc}`,
                    selections: {
                        shotType: actShotTypeMap[`act${beat.act}`] || ['Wide Shot (WS)', 'Medium Shot (MS)', 'Close-Up (CU)'][beat.act - 1],
                        shotStyle: storyData.dramatic.visualStyle || '',
                        camera: '', lens: '50mm Prime',
                        angle: 'Eye Level',
                        lighting: ACT_LIGHTING[beat.act],
                        movement: ACT_MOVEMENT[beat.act],
                        actionSpeed: ACT_SPEED[beat.act],
                        duration: '3.0s', transition: beat.num === 15 ? 'Fade to Black' : 'Hard Cut',
                        filmStock: '', aspectRatio: '--ar 16:9'
                    },
                    sfx: '', bgm: '', dialogues: [], mode: 'video', status: 'Planning',
                    tags: [`act${beat.act}`, `beat-${beat.num}`, beat.label.toLowerCase().replace(/\s+/g, '-')],
                    referenceImages: [], customPromptOverride: null
                }));
                const sceneIdx = Math.min(actSceneMap.act1, activeProject.scenes.length - 1);
                const updatedProjects = projects.map(p => {
                    if (p.id !== story.projectId) return p;
                    return { ...p, scenes: p.scenes.map((scene, idx) => idx === sceneIdx ? { ...scene, shots: [...(scene.shots || []), ...newShots] } : scene) };
                });
                setProjects(updatedProjects);
                setActiveProjectId(story.projectId);
                addToast(`✓ ${newShots.length} beat sheet shots added to project!`, 'success', 4000);
                onClose();
            };

            const GENRE_PACKS = [
                { name: '🔫 Noir Thriller', color: '#6b7280', dramatic: { genre: 'Film Noir Thriller', visualStyle: 'High-contrast black and white, deep shadows', villain: 'A corrupt detective or crime boss', centralConflict: 'Protagonist trapped between law and crime', symbolicObject: 'A revolver', emotionalArc: 'Cynicism → Hope → Despair', worldRules: 'No one is innocent. Trust no one.' }, theme: { theme: 'Corruption vs Integrity', message: 'The system is broken and so are we.', tone: 'Dark, tense, melancholic' }, arcTension: [25, 35, 60, 55, 80, 95, 20] },
                { name: '🚀 Sci-Fi Epic', color: '#0ea5e9', dramatic: { genre: 'Sci-Fi Space Opera', visualStyle: 'Cyberpunk, volumetric lighting, neon glow', villain: 'An AI overlord or galactic empire', centralConflict: 'Humanity survival against an existential threat', symbolicObject: 'A quantum key', emotionalArc: 'Fear → Determination → Sacrifice → Victory', worldRules: 'FTL travel exists. AI are sentient. Earth is dying.' }, theme: { theme: 'Freedom vs Control', message: 'Technology is a tool, not a master.', tone: 'Epic, hopeful, intense' }, arcTension: [20, 30, 50, 45, 75, 100, 35] },
                { name: '🏰 Fantasy Epic', color: '#a855f7', dramatic: { genre: 'High Fantasy Adventure', visualStyle: 'Ethereal, golden hour, medieval grandeur', villain: 'An ancient dark sorcerer', centralConflict: 'A chosen hero must destroy a cursed artifact', symbolicObject: 'A broken crown', emotionalArc: 'Innocence → Loss → Courage → Triumph', worldRules: 'Magic exists but has a cost. Dragons are rare.' }, theme: { theme: 'Power vs Responsibility', message: 'True power lies in sacrifice.', tone: 'Mythic, emotional, grand' }, arcTension: [20, 35, 55, 50, 70, 95, 40] },
                { name: '💀 Horror', color: '#ef4444', dramatic: { genre: 'Psychological Horror', visualStyle: 'Low key, harsh shadows, found footage', villain: 'An unseen force or corrupted loved one', centralConflict: 'Protagonist discovers the monster is within', symbolicObject: 'A cracked mirror', emotionalArc: 'Comfort → Unease → Terror → Revelation', worldRules: 'Nothing is safe. No one believes you.' }, theme: { theme: 'Sanity vs Madness', message: 'The monsters we fear are the ones we create.', tone: 'Paranoid, claustrophobic, dread' }, arcTension: [15, 30, 55, 70, 85, 100, 10] },
                { name: '💘 Romance', color: '#ec4899', dramatic: { genre: 'Romantic Drama', visualStyle: 'Warm, soft focus, golden tones', villain: 'Past trauma or societal expectations', centralConflict: 'Two people from different worlds fall in love', symbolicObject: 'A handwritten letter', emotionalArc: 'Loneliness → Connection → Conflict → Reconciliation', worldRules: 'Vulnerability is strength. Love requires choice.' }, theme: { theme: 'Connection vs Fear', message: 'Love is the only risk worth taking.', tone: 'Tender, hopeful, bittersweet' }, arcTension: [20, 45, 60, 45, 65, 55, 80] },
                { name: '😂 Comedy', color: '#f59e0b', dramatic: { genre: 'Romantic Comedy', visualStyle: 'Bright, high key, vibrant colors', villain: 'A misunderstanding or competing suitor', centralConflict: 'Hero must admit the truth before it is too late', symbolicObject: 'A comically misdelivered package', emotionalArc: 'Confidence → Humiliation → Growth → Joy', worldRules: 'Chaos follows the protagonist. Every plan backfires.' }, theme: { theme: 'Pride vs Authenticity', message: 'Be yourself, even when it is embarrassing.', tone: 'Lighthearted, warm, chaotic' }, arcTension: [30, 45, 60, 50, 65, 70, 85] },
                { name: '🌍 War Drama', color: '#22c55e', dramatic: { genre: 'War Drama', visualStyle: 'Gritty, desaturated, documentary realism', villain: 'War itself and those who profit from it', centralConflict: 'Soldiers must choose between duty and humanity', symbolicObject: 'A photograph from home', emotionalArc: 'Patriotism → Doubt → Horror → Broken peace', worldRules: 'No heroes, only survivors. Orders conflict with morality.' }, theme: { theme: 'Duty vs Humanity', message: 'War reveals who we truly are.', tone: 'Heavy, tragic, humanizing' }, arcTension: [25, 40, 65, 70, 85, 95, 15] },
                { name: '🕵️ Mystery', color: '#14b8a6', dramatic: { genre: 'Detective Mystery', visualStyle: 'Cinematic, moody, dramatic shadows', villain: 'The most trusted character', centralConflict: 'A detective uncovers a conspiracy that goes to the top', symbolicObject: 'A missing pocket watch', emotionalArc: 'Curiosity → Obsession → Danger → Truth', worldRules: 'Everyone is a suspect. Time is running out.' }, theme: { theme: 'Truth vs Deception', message: 'The greatest lies are the ones we tell ourselves.', tone: 'Tense, cerebral, suspenseful' }, arcTension: [20, 30, 50, 60, 75, 90, 30] },
            ];

            const applyGenrePack = (pack) => {
                if (!confirm(`Apply "${pack.name}" preset? This will overwrite Dramatic Keys, Theme, and Arc tension.`)) return;
                setStoryData(prev => ({
                    ...prev,
                    dramatic: { ...prev.dramatic, ...pack.dramatic },
                    theme: { ...prev.theme, ...pack.theme },
                }));
                setArcTension(pack.arcTension);
                setShowGenrePacks(false);
            };

            // --- Continuity Checker ---
            const [showContinuity, setShowContinuity] = useState(false);
            const runContinuityCheck = (shotList) => {
                const issues = [];
                const DAY_LIGHTS = ['Natural Daylight', 'Golden Hour', 'High Key (Bright)', 'Studio Lighting'];
                const NIGHT_LIGHTS = ['Low Key (Dark/Moody)', 'Neon / Cyberpunk', 'Blue Hour', 'Harsh Shadows'];
                let prevShot = null;
                shotList.forEach((shot, idx) => {
                    const n = idx + 1;
                    const subj = (shot.subject || '').toLowerCase();
                    const sel = shot.selections || {};
                    // 1. Missing transition between consecutive shots
                    if (prevShot && (!sel.transition || sel.transition === '' || sel.transition === 'None') && prevShot.selections?.transition !== 'None') {
                        issues.push({ shot: n, type: 'Transition', severity: 'Low', msg: `Shot ${n} has no transition set.` });
                    }
                    // 2. Day/night lighting conflict between adjacent shots
                    if (prevShot) {
                        const prevLight = prevShot.selections?.lighting || '';
                        const curLight = sel.lighting || '';
                        const prevDay = DAY_LIGHTS.some(l => prevLight.includes(l.split(' ')[0]));
                        const curNight = NIGHT_LIGHTS.some(l => curLight.includes(l.split(' ')[0]));
                        const prevNight = NIGHT_LIGHTS.some(l => prevLight.includes(l.split(' ')[0]));
                        const curDay = DAY_LIGHTS.some(l => curLight.includes(l.split(' ')[0]));
                        if ((prevDay && curNight) || (prevNight && curDay)) {
                            issues.push({ shot: n, type: 'Lighting', severity: 'High', msg: `Shot ${n}: Lighting jumps from "${prevLight || 'unset'}" to "${curLight || 'unset'}" — possible day/night conflict.` });
                        }
                    }
                    // 3. Camera style mismatch (e.g. VHS then ARRI)
                    if (prevShot) {
                        const styleCams = ['VHS Camcorder', 'CCTV Camera', 'Polaroid', 'Vintage 35mm Film'];
                        const prevCam = prevShot.selections?.camera || '';
                        const curCam = sel.camera || '';
                        const prevStyle = styleCams.includes(prevCam);
                        const curCinema = ['ARRI Alexa 65', 'RED V-Raptor', 'Sony A7S III'].includes(curCam);
                        if (prevStyle && curCinema) {
                            issues.push({ shot: n, type: 'Camera', severity: 'Medium', msg: `Shot ${n}: Camera switches from stylized "${prevCam}" to cinematic "${curCam}" — style break.` });
                        }
                    }
                    // 4. Dialogue word count vs duration
                    if (shot.dialogues?.length) {
                        const words = shot.dialogues.reduce((acc, d) => acc + (d.text?.trim().split(/\s+/).length || 0), 0);
                        const durMatch = (sel.duration || '').match(/([\d.]+)/);
                        const dur = durMatch ? parseFloat(durMatch[1]) : 0;
                        const needed = Math.ceil(words / 2.5);
                        if (dur > 0 && dur < needed) {
                            issues.push({ shot: n, type: 'Dialogue', severity: 'High', msg: `Shot ${n}: ${words} dialogue words need ~${needed}s but duration is only ${dur}s.` });
                        }
                    }
                    // 5. Missing subject
                    if (!shot.subject || shot.subject.trim().length < 3) {
                        issues.push({ shot: n, type: 'Subject', severity: 'Medium', msg: `Shot ${n}: Subject/action is empty or too short.` });
                    }
                    // 6. Speed Ramp with no duration
                    if (sel.actionSpeed === 'Speed Ramp' && !sel.duration) {
                        issues.push({ shot: n, type: 'Duration', severity: 'Low', msg: `Shot ${n}: Speed Ramp requires a duration to be set.` });
                    }
                    prevShot = shot;
                });
                return issues;
            };
            const [storyVersions, setStoryVersions] = useState([]);
            const [diffViewId, setDiffViewId] = useState(null);

            const saveVersion = () => {
                const label = prompt('Version label (e.g. "Draft 2", "Before Act 3 rewrite"):');
                if (!label) return;
                setStoryVersions(prev => [...prev, {
                    id: Date.now(),
                    label,
                    savedAt: new Date().toISOString(),
                    snapshot: JSON.parse(JSON.stringify(storyData))
                }]);
            };

            const restoreVersion = (ver) => {
                if (!confirm(`Restore "${ver.label}"? Current unsaved changes will be lost.`)) return;
                setStoryData(JSON.parse(JSON.stringify(ver.snapshot)));
                setShowVersionHistory(false);
            };

            const deleteVersion = (id) => {
                if (confirm('Delete this version?')) setStoryVersions(prev => prev.filter(v => v.id !== id));
            };

            // Build a flat diff between two storyData snapshots
            const buildDiff = (a, b) => {
                const fields = [
                    ['act1','character'],['act1','world'],['act1','incident'],
                    ['act2','obstacles'],['act2','midpoint'],['act2','stakes'],
                    ['act3','climax'],['act3','resolution'],['act3','aftermath'],
                    ['theme','theme'],['theme','message'],['theme','tone'],
                    ['dramatic','genre'],['dramatic','visualStyle'],['dramatic','villain'],
                ];
                return fields.map(([sec, key]) => ({
                    label: `${sec} / ${key}`,
                    old: (a?.[sec]?.[key] || '').trim(),
                    cur: (b?.[sec]?.[key] || '').trim(),
                })).filter(f => f.old !== f.cur);
            };

            // Emotional Arc: 7 beat points mapped to story beats
            const ARC_BEATS = [
                { id: 'ab_setup',      label: 'Setup',      act: 1, field: ['act1','character'] },
                { id: 'ab_world',      label: 'World',      act: 1, field: ['act1','world'] },
                { id: 'ab_incident',   label: 'Incident',   act: 1, field: ['act1','incident'] },
                { id: 'ab_obstacles',  label: 'Obstacles',  act: 2, field: ['act2','obstacles'] },
                { id: 'ab_midpoint',   label: 'Midpoint',   act: 2, field: ['act2','midpoint'] },
                { id: 'ab_climax',     label: 'Climax',     act: 3, field: ['act3','climax'] },
                { id: 'ab_resolution', label: 'Resolution', act: 3, field: ['act3','resolution'] },
            ];
            const TENSION_PRESETS = {
                'Rising Dread':    [10, 20, 35, 55, 70, 95, 40],
                'Hero Journey':    [20, 30, 50, 45, 65, 90, 30],
                'Tragedy':         [60, 70, 80, 75, 85, 95, 5],
                'Comedy':          [30, 40, 55, 50, 65, 75, 80],
                'Thriller Spike':  [15, 20, 80, 40, 70, 100, 20],
            };
            const TONE_KEYWORDS = {
                low:    'calm, peaceful, quiet, subdued lighting',
                medium: 'tense, dramatic, dynamic',
                high:   'intense, frantic, explosive, high-contrast lighting, fast cuts',
            };
            const getToneKeyword = (tension) => tension >= 70 ? TONE_KEYWORDS.high : tension >= 40 ? TONE_KEYWORDS.medium : TONE_KEYWORDS.low;

            const [arcTension, setArcTension] = useState([20, 30, 50, 45, 65, 90, 30]);
            const [draggingArcPoint, setDraggingArcPoint] = useState(null);
            const arcSvgRef = useRef(null);

            const handleArcPointDrag = React.useCallback((e) => {
                if (draggingArcPoint === null || !arcSvgRef.current) return;
                const rect = arcSvgRef.current.getBoundingClientRect();
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const relY = clientY - rect.top;
                const tension = Math.max(0, Math.min(100, Math.round((1 - relY / rect.height) * 100)));
                setArcTension(prev => prev.map((v, i) => i === draggingArcPoint ? tension : v));
            }, [draggingArcPoint]);

            useEffect(() => {
                if (draggingArcPoint === null) return;
                const up = () => setDraggingArcPoint(null);
                window.addEventListener('mousemove', handleArcPointDrag);
                window.addEventListener('mouseup', up);
                window.addEventListener('touchmove', handleArcPointDrag);
                window.addEventListener('touchend', up);
                return () => {
                    window.removeEventListener('mousemove', handleArcPointDrag);
                    window.removeEventListener('mouseup', up);
                    window.removeEventListener('touchmove', handleArcPointDrag);
                    window.removeEventListener('touchend', up);
                };
            }, [draggingArcPoint, handleArcPointDrag]);

            const isSceneUnlocked = (nodeId) => {
                const node = storyData.sceneDependencies.find(n => n.id === nodeId);
                if (!node || node.requires.length === 0) return true;
                // A scene is unlocked if all its prerequisites have content in storyData
                const fieldMap = {
                    'sd_act1_world': storyData.act1.world,
                    'sd_act1_incident': storyData.act1.incident,
                    'sd_act2_obstacles': storyData.act2.obstacles,
                    'sd_act2_midpoint': storyData.act2.midpoint,
                    'sd_act2_stakes': storyData.act2.stakes,
                    'sd_act3_climax': storyData.act3.climax,
                    'sd_act3_resolution': storyData.act3.resolution,
                    'sd_act3_aftermath': storyData.act3.aftermath,
                };
                return node.requires.every(reqId => !!fieldMap[reqId]?.trim());
            };

            const toggleDependency = (nodeId, reqId) => {
                setStoryData(prev => ({
                    ...prev,
                    sceneDependencies: prev.sceneDependencies.map(n => {
                        if (n.id !== nodeId) return n;
                        const has = n.requires.includes(reqId);
                        return { ...n, requires: has ? n.requires.filter(r => r !== reqId) : [...n.requires, reqId] };
                    })
                }));
            };

            const createStory = () => {
                if (!newStoryName.trim()) return;
                const newProjectId = `proj_${Date.now()}`;
                const storyId = Date.now();
                const story = {
                    id: storyId,
                    name: newStoryName,
                    data: JSON.parse(JSON.stringify(storyData)),
                    createdAt: new Date().toISOString(),
                    projectId: newProjectId
                };
                const newProject = {
                    id: newProjectId,
                    name: newStoryName,
                    description: `Project for story: ${newStoryName}`,
                    tags: ['story-based'],
                    defaultParams: {},
                    scenes: [{ id: Date.now() + 1, name: `Scene 1 - ${getRandomWord()}`, shots: [] }],
                    storyId: storyId
                };
                setStories(prev => [...prev, story]);
                setProjects(prev => [...prev, newProject]);
                setActiveProjectId(newProjectId);
                setSelectedStoryId(storyId);
                setNewStoryName('');
            };

            const deleteStory = (id) => {
                if (confirm('Delete this story and its project?')) {
                    const story = stories.find(s => s.id === id);
                    setStories(stories.filter(s => s.id !== id));
                    if (story?.projectId) {
                        setProjects(prev => prev.filter(p => p.id !== story.projectId));
                    }
                    if (selectedStoryId === id) setSelectedStoryId(null);
                }
            };

            const selectStory = (id) => {
                const story = stories.find(s => s.id === id);
                if (story) {
                    setStoryData(JSON.parse(JSON.stringify(story.data)));
                    setSelectedStoryId(id);
                    if (story.projectId) {
                        setActiveProjectId(story.projectId);
                    }
                }
            };

            const handleStoryChange = (section, field, value) => {
                setStoryData(prev => ({
                    ...prev,
                    [section]: { ...prev[section], [field]: value }
                }));
                if (selectedStoryId) {
                    setStories(prev => prev.map(s => s.id === selectedStoryId ? { ...s, data: { ...s.data, [section]: { ...s.data[section], [field]: value } } } : s));
                }
            };

            const handleCharacterChange = (id, field, value) => { setStoryData(prev => ({ ...prev, characters: prev.characters.map(c => c.id === id ? { ...c, [field]: value } : c) })); };
            const handleCharacterPosChange = (id, x, y) => { setStoryData(prev => ({ ...prev, characters: prev.characters.map(c => c.id === id ? { ...c, x, y } : c) })); };

            const mapRef = useRef(null);
            const [mapZoom, setMapZoom] = useState(1);
            const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
            const isPanningRef = useRef(false);
            const panStartRef = useRef({ x: 0, y: 0 });
            const panOffsetStartRef = useRef({ x: 0, y: 0 });

            const handleMapWheel = React.useCallback((e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setMapZoom(z => Math.min(3, Math.max(0.2, parseFloat((z + delta).toFixed(2)))));
            }, []);

            const handleMapPanStart = React.useCallback((e) => {
                if (e.target.closest('.character-node') || e.button !== 0) return;
                isPanningRef.current = true;
                panStartRef.current = { x: e.clientX, y: e.clientY };
                panOffsetStartRef.current = { ...mapOffset };
            }, [mapOffset]);

            const handleMapPanMove = React.useCallback((e) => {
                if (!isPanningRef.current) return;
                const dx = e.clientX - panStartRef.current.x;
                const dy = e.clientY - panStartRef.current.y;
                setMapOffset({ x: panOffsetStartRef.current.x + dx, y: panOffsetStartRef.current.y + dy });
            }, []);

            const handleMapPanEnd = React.useCallback(() => { isPanningRef.current = false; }, []);

            const handleAutoFit = React.useCallback(() => {
                if (!mapRef.current || storyData.characters.length === 0) return;
                const container = mapRef.current;
                const cw = container.clientWidth, ch = container.clientHeight;
                const xs = storyData.characters.map(c => c.x);
                const ys = storyData.characters.map(c => c.y);
                const minX = Math.min(...xs), maxX = Math.max(...xs) + 240;
                const minY = Math.min(...ys), maxY = Math.max(...ys) + 160;
                const contentW = maxX - minX, contentH = maxY - minY;
                const zoom = Math.min(3, Math.max(0.2, Math.min((cw - 40) / contentW, (ch - 40) / contentH)));
                setMapZoom(parseFloat(zoom.toFixed(2)));
                setMapOffset({ x: (cw - contentW * zoom) / 2 - minX * zoom, y: (ch - contentH * zoom) / 2 - minY * zoom });
            }, [storyData.characters]);

            useEffect(() => {
                const el = mapRef.current;
                if (!el) return;
                el.addEventListener('wheel', handleMapWheel, { passive: false });
                return () => el.removeEventListener('wheel', handleMapWheel);
            }, [handleMapWheel]);
            const [draggingChar, setDraggingChar] = useState(null);
            const [drawingLine, setDrawingLine] = useState(null);

            const addCharacter = () => {
                setStoryData(prev => ({
                    ...prev,
                    characters: [...prev.characters, { id: Date.now(), name: `Character ${prev.characters.length + 1}`, motivation: '', fear: '', contradiction: '', x: 50, y: 50 }]
                }));
            };

            const removeCharacter = (id) => {
                if (storyData.characters.length <= 1) return;
                setStoryData(prev => ({
                    ...prev,
                    characters: prev.characters.filter(c => c.id !== id),
                    relationships: prev.relationships.filter(r => r.from !== id && r.to !== id)
                }));
            };

            const convertToPromptData = () => {
                if (!selectedStoryId) { addToast("Please select or create a story first.", 'warning', 3000); return; }
                const story = stories.find(s => s.id === selectedStoryId);
                if (!story) return;
                
                const activeProject = projects.find(p => p.id === story.projectId);
                if (!activeProject) return;
                
                // Generate multiple shots from story data
                const generatedShots = [];
                const act1Slots = Math.max(1, Math.round(shotCountTarget * 0.25));
                const act2Slots = Math.max(1, Math.round(shotCountTarget * 0.42));
                const act3Slots = Math.max(1, shotCountTarget - act1Slots - act2Slots);
                
                // Act 1 shots
                if (story.data.act1.character) {
                    generatedShots.push({
                        id: Date.now() + Math.random(),
                        subject: `${story.data.act1.character}. ${story.data.dramatic.visualStyle || 'Cinematic'}. ${story.data.dramatic.genre || 'Drama'}.${story.data.relationships.length ? ' Character dynamics: ' + story.data.relationships.map(r => { const a = story.data.characters.find(c=>c.id===r.from)?.name||'?'; const b = story.data.characters.find(c=>c.id===r.to)?.name||'?'; return `${a} & ${b} [${r.type||'Neutral'}]`; }).join(', ') + '.' : ''}`,
                        selections: { shotType: 'Medium Shot (MS)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '50mm Prime', angle: 'Eye Level', lighting: arcTension[0] >= 70 ? 'Harsh Shadows' : arcTension[0] >= 40 ? 'Natural Daylight' : 'High Key (Bright)', movement: 'Static / Tripod', actionSpeed: 'Normal Speed', duration: '3.0s', transition: 'Hard Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Ambient environment sounds',
                        bgm: 'Subtle orchestral theme',
                        dialogues: story.data.characters.slice(0, 1).map(c => ({ character: c.name, text: c.motivation || 'Dialogue', mood: 'Neutral', reaction: '', event: '', voiceStyle: '' })),
                        mode: 'video',
                        status: 'Planning',
                        tags: ['act1', 'setup', story.data.dramatic.genre].filter(Boolean),
                        referenceImages: [],
                        customPromptOverride: null
                    });
                }
                
                // Act 1 extra: world-building
                if (act1Slots >= 2 && story.data.act1.world) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 0.1,
                        subject: `${story.data.act1.world}. Establishing the world. ${story.data.dramatic.visualStyle || 'Cinematic'}.`,
                        selections: { shotType: 'Extreme Wide Shot (EWS)', shotStyle: story.data.dramatic.visualStyle || '', camera: 'DJI Mavic 3 (Drone)', lens: '14mm Ultra-Wide', angle: "Bird's Eye View", lighting: 'Golden Hour', movement: 'Drone Fly-Through', actionSpeed: 'Normal Speed', duration: '4.0s', transition: 'Hard Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Ambient world sounds', bgm: 'Establishing orchestral theme',
                        dialogues: [], mode: 'video', status: 'Planning',
                        tags: ['act1', 'world-building'], referenceImages: [], customPromptOverride: null
                    });
                }
                // Act 1 extra: inciting incident
                if (act1Slots >= 3 && story.data.act1.incident) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 0.2,
                        subject: `${story.data.act1.incident}. Inciting incident. Everything changes.`,
                        selections: { shotType: 'Close-Up (CU)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '50mm Prime', angle: 'Eye Level', lighting: 'Cinematic Rim Lighting', movement: 'Dolly In', actionSpeed: 'Normal Speed', duration: '2.5s', transition: 'Smash Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Dramatic sting', bgm: 'Tension rising',
                        dialogues: [], mode: 'video', status: 'Planning',
                        tags: ['act1', 'inciting-incident'], referenceImages: [], customPromptOverride: null
                    });
                }

                // Act 2 shots
                if (story.data.act2.obstacles) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 1,
                        subject: `${story.data.act2.obstacles}. ${story.data.dramatic.centralConflict || 'Conflict'}. Tension building.`,
                        selections: { shotType: 'Wide Shot (WS)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '35mm Standard', angle: 'Eye Level', lighting: arcTension[3] >= 70 ? 'Low Key (Dark/Moody)' : 'Cinematic Rim Lighting', movement: arcTension[3] >= 70 ? 'Handheld / Shaky' : 'Tracking / Follow', actionSpeed: arcTension[3] >= 70 ? 'Speed Ramp' : 'Normal Speed', duration: '4.0s', transition: 'Cross Dissolve', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Intense action sounds',
                        bgm: 'Dramatic orchestral score',
                        dialogues: story.data.characters.slice(0, 2).map(c => ({ character: c.name, text: c.fear || 'Dialogue', mood: 'Intense', reaction: '', event: '', voiceStyle: '' })),
                        mode: 'video',
                        status: 'Planning',
                        tags: ['act2', 'conflict', 'tension'],
                        referenceImages: [],
                        customPromptOverride: null
                    });
                }
                
                // Act 2 extra: stakes
                if (act2Slots >= 3 && story.data.act2.stakes) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 1.5,
                        subject: `${story.data.act2.stakes}. Stakes raised. No turning back.`,
                        selections: { shotType: 'Close-Up (CU)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '85mm Portrait', angle: 'High Angle', lighting: 'Low Key (Dark/Moody)', movement: 'Tilt Down', actionSpeed: 'Slow Motion', duration: '3.0s', transition: 'Cross Dissolve', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Heartbeat, silence', bgm: 'Ominous underscore',
                        dialogues: [], mode: 'video', status: 'Planning',
                        tags: ['act2', 'stakes'], referenceImages: [], customPromptOverride: null
                    });
                }

                // Midpoint shot
                if (story.data.act2.midpoint) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 2,
                        subject: `${story.data.act2.midpoint}. Turning point. ${story.data.dramatic.emotionalArc || 'Emotional shift'}.`,
                        selections: { shotType: 'Close-Up (CU)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '85mm Portrait', angle: 'Eye Level', lighting: 'Cinematic Rim Lighting', movement: 'Dolly In', actionSpeed: 'Slow Motion', duration: '2.5s', transition: 'Fade to Black', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Silence or heartbeat',
                        bgm: 'Emotional orchestral swell',
                        dialogues: [{ character: story.data.characters[0]?.name || 'Character', text: 'Realization moment', mood: 'Intense', reaction: '', event: '', voiceStyle: '' }],
                        mode: 'video',
                        status: 'Planning',
                        tags: ['act2', 'midpoint', 'turning-point'],
                        referenceImages: [],
                        customPromptOverride: null
                    });
                }
                
                // Act 2 extra: dark night of the soul
                if (act2Slots >= 4) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 2.5,
                        subject: `All seems lost. ${story.data.dramatic.centralConflict || 'The protagonist faces their lowest point'}. Dark night of the soul.`,
                        selections: { shotType: 'Wide Shot (WS)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '35mm Standard', angle: 'Low Angle', lighting: 'Low Key (Dark/Moody)', movement: 'Static / Tripod', actionSpeed: 'Slow Motion', duration: '3.5s', transition: 'Fade to Black', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Silence, distant wind', bgm: 'Sparse, emotional piano',
                        dialogues: [], mode: 'video', status: 'Planning',
                        tags: ['act2', 'dark-night'], referenceImages: [], customPromptOverride: null
                    });
                }

                // Act 3 shots
                if (story.data.act3.climax) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 3,
                        subject: `${story.data.act3.climax}. Final confrontation. ${story.data.dramatic.villain || 'Antagonist'} vs protagonist.`,
                        selections: { shotType: 'Wide Shot (WS)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '24mm Wide', angle: 'Low Angle', lighting: 'Harsh Shadows', movement: 'Handheld / Shaky', actionSpeed: 'Speed Ramp', duration: '5.0s', transition: 'Smash Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Intense action, impacts, explosions',
                        bgm: 'Epic climactic score',
                        dialogues: story.data.characters.map(c => ({ character: c.name, text: c.contradiction || 'Action dialogue', mood: 'Angry', reaction: '', event: '', voiceStyle: '' })),
                        mode: 'video',
                        status: 'Planning',
                        tags: ['act3', 'climax', 'action'],
                        referenceImages: [],
                        customPromptOverride: null
                    });
                }
                
                // Act 3 extra: break into 3
                if (act3Slots >= 3 && story.data.dramatic.emotionalArc) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 3.5,
                        subject: `The protagonist finds their resolve. ${story.data.dramatic.emotionalArc}. Break into Act 3.`,
                        selections: { shotType: 'Medium Shot (MS)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '50mm Prime', angle: 'Eye Level', lighting: 'Cinematic Rim Lighting', movement: 'Dolly In', actionSpeed: 'Normal Speed', duration: '2.5s', transition: 'Hard Cut', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Rising score', bgm: 'Heroic theme building',
                        dialogues: [], mode: 'video', status: 'Planning',
                        tags: ['act3', 'break-into-3'], referenceImages: [], customPromptOverride: null
                    });
                }

                // Resolution shot
                if (story.data.act3.resolution) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 4,
                        subject: `${story.data.act3.resolution}. Aftermath. ${story.data.theme.message || 'Resolution'}.`,
                        selections: { shotType: 'Medium Shot (MS)', shotStyle: story.data.dramatic.visualStyle || '', camera: '', lens: '50mm Prime', angle: 'Eye Level', lighting: 'Golden Hour', movement: 'Static / Tripod', actionSpeed: 'Normal Speed', duration: '3.0s', transition: 'Cross Dissolve', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Ambient sounds, wind',
                        bgm: 'Reflective, hopeful score',
                        dialogues: [{ character: story.data.characters[0]?.name || 'Character', text: story.data.act3.aftermath || 'Resolution dialogue', mood: 'Happy', reaction: '', event: '', voiceStyle: '' }],
                        mode: 'video',
                        status: 'Planning',
                        tags: ['act3', 'resolution', 'ending'],
                        referenceImages: [],
                        customPromptOverride: null
                    });
                }
                
                // Final image shot
                if (story.data.act3.aftermath) {
                    generatedShots.push({
                        id: Date.now() + Math.random() + 5,
                        subject: `${story.data.act3.aftermath}. Final image. ${story.data.dramatic.symbolicObject || 'Symbolic moment'}.`,
                        selections: { shotType: 'Extreme Wide Shot (EWS)', shotStyle: story.data.dramatic.visualStyle || '', camera: 'DJI Mavic 3 (Drone)', lens: '14mm Ultra-Wide', angle: 'Bird\'s Eye View', lighting: 'Golden Hour', movement: 'Drone Fly-Through', actionSpeed: 'Normal Speed', duration: '4.0s', transition: 'Fade to Black', filmStock: '', aspectRatio: '--ar 16:9' },
                        sfx: 'Ambient nature sounds',
                        bgm: 'Emotional, conclusive score',
                        dialogues: [],
                        mode: 'video',
                        status: 'Planning',
                        tags: ['act3', 'final-image', 'symbolic'],
                        referenceImages: [],
                        customPromptOverride: null
                    });
                }
                
                // Add generated shots to active scene
                const trimmed = generatedShots.slice(0, shotCountTarget);

                // Split trimmed shots into per-act buckets using tags
                const act1Shots = trimmed.filter(s => s.tags?.includes('act1'));
                const act2Shots = trimmed.filter(s => s.tags?.includes('act2'));
                const act3Shots = trimmed.filter(s => s.tags?.includes('act3'));

                // Apply per-act shot type overrides
                const applyOverride = (shots, act) => {
                    const override = actShotTypeMap[act];
                    if (!override) return shots;
                    return shots.map(s => ({ ...s, selections: { ...s.selections, shotType: override } }));
                };
                const act1ShotsRouted = applyOverride(act1Shots, 'act1');
                const act2ShotsRouted = applyOverride(act2Shots, 'act2');
                const act3ShotsRouted = applyOverride(act3Shots, 'act3');

                if (trimmed.length > 0 && activeProject.scenes && activeProject.scenes.length > 0) {
                    const sceneCount = activeProject.scenes.length;
                    const s1 = Math.min(actSceneMap.act1, sceneCount - 1);
                    const s2 = Math.min(actSceneMap.act2, sceneCount - 1);
                    const s3 = Math.min(actSceneMap.act3, sceneCount - 1);

                    const updatedProjects = projects.map(p => {
                        if (p.id !== story.projectId) return p;
                        const newScenes = p.scenes.map((scene, idx) => {
                            const toAdd = [
                                ...(idx === s1 ? act1ShotsRouted : []),
                                ...(idx === s2 ? act2ShotsRouted : []),
                                ...(idx === s3 ? act3ShotsRouted : []),
                            ];
                            if (toAdd.length === 0) return scene;
                            return { ...scene, shots: [...(scene.shots || []), ...toAdd] };
                        });
                        return { ...p, scenes: newScenes };
                    });
                    setProjects(updatedProjects);
                    setActiveProjectId(story.projectId);
                    const sceneNames = activeProject.scenes.map(s => s.name);
                    addToast(`✓ Converted story to ${trimmed.length} cinematic shots!\n\nAct 1 (${act1ShotsRouted.length} shots) → ${sceneNames[s1] || 'Scene 1'}\nAct 2 (${act2ShotsRouted.length} shots) → ${sceneNames[s2] || 'Scene 1'}\nAct 3 (${act3ShotsRouted.length} shots) → ${sceneNames[s3] || 'Scene 1'}`, 'success', 6000);
                }
                onClose();
            };

            const REL_TYPES = ['Ally', 'Rival', 'Neutral', 'Romantic', 'Mentor', 'Enemy'];
            const REL_COLORS = { Ally: '#22c55e', Rival: '#ef4444', Neutral: '#6b7280', Romantic: '#ec4899', Mentor: '#a855f7', Enemy: '#f97316' };

            const deleteRelationship = (relId) => {
                if (confirm('Delete this relationship?')) {
                    setStoryData(prev => ({ ...prev, relationships: prev.relationships.filter(r => r.id !== relId) }));
                }
            };

            const cycleRelationType = (relId) => {
                setStoryData(prev => ({
                    ...prev,
                    relationships: prev.relationships.map(r => {
                        if (r.id !== relId) return r;
                        const idx = REL_TYPES.indexOf(r.type || 'Neutral');
                        return { ...r, type: REL_TYPES[(idx + 1) % REL_TYPES.length] };
                    })
                }));
            };

            const handleCharMouseDown = useCallback((e, charId) => {
                const tag = e.target.tagName.toLowerCase();
                if (["input", "textarea", "button", "select"].includes(tag)) return;
                e.preventDefault();
                const charNode = e.target.closest('.character-node');
                const rect = charNode.getBoundingClientRect();
                const offsetX = (e.clientX - rect.left) / mapZoom;
                const offsetY = (e.clientY - rect.top) / mapZoom;
                setDraggingChar({ id: charId, offsetX, offsetY });
            }, [mapZoom]);

            const handleConnectorMouseDown = useCallback((e, charId) => {
                e.stopPropagation();
                e.preventDefault();
                const mapRect = mapRef.current.getBoundingClientRect();
                const char = storyData.characters.find(c => c.id === charId);
                if (char) {
                    setDrawingLine({
                        fromId: charId,
                        startX: char.x + 250,
                        startY: char.y + 20,
                        endX: (e.clientX - mapRect.left - mapOffset.x) / mapZoom,
                        endY: (e.clientY - mapRect.top - mapOffset.y) / mapZoom,
                    });
                }
            }, [storyData.characters, mapZoom, mapOffset]);

            useEffect(() => {
                const handleMouseMove = (e) => {
                    if (!mapRef.current) return;
                    const mapRect = mapRef.current.getBoundingClientRect();
                    const x = (e.clientX - mapRect.left - mapOffset.x) / mapZoom;
                    const y = (e.clientY - mapRect.top - mapOffset.y) / mapZoom;

                    if (draggingChar) {
                        handleCharacterPosChange(draggingChar.id, x - draggingChar.offsetX, y - draggingChar.offsetY);
                    }
                    if (drawingLine) {
                        setDrawingLine(prev => ({ ...prev, endX: x, endY: y }));
                    }
                };

                const handleMouseUp = (e) => {
                    if (drawingLine) {
                        const toCharElement = e.target.closest('.character-node');
                        if (toCharElement) {
                            const toId = Number(toCharElement.dataset.charId);
                            const fromId = drawingLine.fromId;
                            const relationshipExists = storyData.relationships.some(
                                r => (r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId)
                            );
                            if (toId !== fromId && !relationshipExists) {
                                setStoryData(prev => ({
                                    ...prev,
                                    relationships: [...prev.relationships, { id: Date.now(), from: fromId, to: toId }]
                                }));
                            }
                        }
                    }
                    setDrawingLine(null);
                    setDraggingChar(null);
                };

                if (draggingChar || drawingLine) {
                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp, { once: true });
                }

                return () => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                };
            }, [draggingChar, drawingLine, storyData, setStoryData, mapZoom, mapOffset]);

            const EmotionalArcVisualizer = () => {
                const W = 420, H = 100, PAD = 24;
                const pts = arcTension.map((t, i) => ({
                    x: PAD + (i / (arcTension.length - 1)) * (W - PAD * 2),
                    y: H - PAD/2 - (t / 100) * (H - PAD)
                }));
                // Smooth bezier path
                const pathD = pts.reduce((d, pt, i) => {
                    if (i === 0) return `M${pt.x},${pt.y}`;
                    const prev = pts[i - 1];
                    const cx = (prev.x + pt.x) / 2;
                    return `${d} C${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
                }, '');
                const fillD = `${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
                return (
                    <div className="bg-input-light dark:bg-input-dark p-3 rounded-xl border border-border-light dark:border-border-dark mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-rose-500 flex items-center"><Icon name="Activity" size={14} className="mr-1.5"/>Emotional Arc</h3>
                            <div className="flex gap-1">
                                {Object.entries(TENSION_PRESETS).map(([name, vals]) => (
                                    <button key={name} onClick={() => setArcTension(vals)} className="text-[9px] px-1.5 py-0.5 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark hover:border-rose-500/60 text-textMuted-light dark:text-textMuted-dark hover:text-rose-500 transition-all">{name}</button>
                                ))}
                            </div>
                        </div>
                        <svg ref={arcSvgRef} viewBox={`0 0 ${W} ${H}`} className="w-full select-none" style={{height:'80px',cursor:'crosshair'}}>
                            {/* Act dividers */}
                            {[1/3, 2/3].map((x, i) => (
                                <line key={i} x1={PAD + x*(W-PAD*2)} y1={0} x2={PAD + x*(W-PAD*2)} y2={H} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3" className="text-textMuted-light dark:text-textMuted-dark" />
                            ))}
                            {/* Act labels */}
                            {[['Act 1', 1/6], ['Act 2', 1/2], ['Act 3', 5/6]].map(([lbl, x]) => (
                                <text key={lbl} x={PAD + x*(W-PAD*2)} y={H-2} textAnchor="middle" fontSize="7" fill="currentColor" fillOpacity="0.35" className="text-textMuted-light dark:text-textMuted-dark">{lbl}</text>
                            ))}
                            {/* Fill */}
                            <path d={fillD} fill="rgb(244,63,94)" fillOpacity="0.08" />
                            {/* Curve */}
                            <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                            {/* Drag points */}
                            {pts.map((pt, i) => (
                                <g key={i} onMouseDown={(e) => { e.preventDefault(); setDraggingArcPoint(i); }} onTouchStart={(e) => { e.preventDefault(); setDraggingArcPoint(i); }} className="cursor-ns-resize">
                                    <circle cx={pt.x} cy={pt.y} r={7} fill="transparent" />
                                    <circle cx={pt.x} cy={pt.y} r={draggingArcPoint === i ? 5 : 3.5} fill={arcTension[i] >= 70 ? '#ef4444' : arcTension[i] >= 40 ? '#f59e0b' : '#22c55e'} stroke="white" strokeWidth="1.5" />
                                    <text x={pt.x} y={pt.y - 7} textAnchor="middle" fontSize="7" fill="#f43f5e" fontWeight="bold">{arcTension[i]}</text>
                                </g>
                            ))}
                        </svg>
                        {/* Beat labels + tone keywords */}
                        <div className="grid grid-cols-7 gap-0.5 mt-1">
                            {ARC_BEATS.map((beat, i) => (
                                <div key={beat.id} className="text-center">
                                    <div className="text-[8px] font-bold text-textMuted-light dark:text-textMuted-dark truncate">{beat.label}</div>
                                    <div className="text-[7px] leading-tight" style={{color: arcTension[i] >= 70 ? '#ef4444' : arcTension[i] >= 40 ? '#f59e0b' : '#22c55e'}}>{arcTension[i] >= 70 ? 'HIGH' : arcTension[i] >= 40 ? 'MID' : 'LOW'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            };

            return (
                <div className={`fixed inset-0 z-[60] flex ${uiStyle === 'mr-re' ? 'bg-[#080810]' : 'bg-base-light dark:bg-base-dark'}`}>
                    <input ref={llavaStoryImageRef} type="file" accept="image/*" className="hidden" onChange={handleLLaVAImagePick} />
                    {/* LLaVA Process Monitor */}
                    {llavaMonitorLog.length > 0 && (
                        <div className="fixed bottom-4 right-4 z-[200] w-80 bg-panel-light dark:bg-[#1a1a2e] border border-violet-500/40 rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                            <div className="flex items-center justify-between px-3 py-2 bg-violet-500/10 border-b border-violet-500/30">
                                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping"></div>
                                    LLaVA Monitor
                                </span>
                                <button onClick={() => setLlavaMonitorLog([])} className="text-textMuted-light dark:text-textMuted-dark hover:text-red-400 transition-colors text-[10px]">✕ Clear</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
                                {llavaMonitorLog.map(log => (
                                    <div key={log.id} className={`rounded-lg p-2 border text-[10px] transition-all ${log.status === 'processing' ? 'bg-violet-500/10 border-violet-500/40' : log.status === 'done' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-black uppercase tracking-wider flex items-center gap-1">
                                                {log.status === 'processing' && <Icon name="Timer" size={10} className="animate-spin text-violet-400" />}
                                                {log.status === 'done' && <Icon name="Check" size={10} className="text-green-400" />}
                                                {log.status === 'error' && <Icon name="AlertTriangle" size={10} className="text-red-400" />}
                                                <span className={log.status === 'processing' ? 'text-violet-400' : log.status === 'done' ? 'text-green-400' : 'text-red-400'}>
                                                    {log.section && <span className="opacity-60 mr-1">{log.section} /</span>}{log.field}
                                                </span>
                                            </span>
                                            <span className="text-textMuted-light dark:text-textMuted-dark">{log.ts}</span>
                                        </div>
                                        {log.status === 'processing' && (
                                            <div className="flex items-center gap-1 text-violet-400">
                                                <div className="flex gap-0.5">
                                                    <div className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'0ms'}}></div>
                                                    <div className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'150ms'}}></div>
                                                    <div className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'300ms'}}></div>
                                                </div>
                                                <span>Analyzing image...</span>
                                            </div>
                                        )}
                                        {log.result && <p className="text-textMuted-light dark:text-textMuted-dark leading-tight mt-0.5 line-clamp-3">{log.result}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className={`w-full h-full flex flex-col overflow-hidden ${uiStyle === 'mr-re' ? `lg-panel relative ${isSeClosing ? 'lg-panel-close-anim' : 'lg-panel-open-anim'}` : 'bg-panel-light dark:bg-panel-dark border-0 shadow-none animate-slide-up'}`}>
                        {uiStyle === 'mr-re' && (
                            <div className="lg-mesh">
                                <div className="lg-orb lg-orb-1" />
                                <div className="lg-orb lg-orb-2" />
                                <div className="lg-orb lg-orb-3" />
                                <div className="lg-orb lg-orb-4" />
                            </div>
                        )}
                        <div className={`p-4 flex items-center justify-between shrink-0 ${uiStyle === 'mr-re' ? 'lg-header' : 'border-b border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50'}`}>
                            <h2 className="text-xl font-bold text-textMain-light dark:text-textMain-dark flex items-center space-x-3">
                                <Icon name="Film" size={24} className="text-primary" />
                                <span>Story Engine</span>
                            </h2>
                            <button onClick={handleClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={24} /></button>
                        </div>

                        {showDependencyGraph && (
                            <div className="border-b border-border-light dark:border-border-dark bg-base-light dark:bg-base-dark p-4">
                                <h3 className="text-sm font-bold text-primary mb-3 flex items-center"><Icon name="Link" size={15} className="mr-2"/>Scene Dependency Graph — Unlock order is determined by filled content</h3>
                                <div className="flex flex-wrap gap-3">
                                    {storyData.sceneDependencies.map((node, idx) => {
                                        const unlocked = isSceneUnlocked(node.id);
                                        const otherNodes = storyData.sceneDependencies.filter(n => n.id !== node.id);
                                        return (
                                            <div key={node.id} className={`bg-panel-light dark:bg-panel-dark border rounded-lg p-3 w-56 shrink-0 transition-all ${ unlocked ? 'border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.15)]' : 'border-border-light dark:border-border-dark opacity-60' }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] font-bold text-textMain-light dark:text-textMain-dark leading-tight">{node.label}</span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ unlocked ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-500' }`}>{unlocked ? '✓ READY' : '🔒 LOCKED'}</span>
                                                </div>
                                                {otherNodes.length > 0 && (
                                                    <div className="mt-1">
                                                        <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mb-1 uppercase tracking-wider">Requires:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {otherNodes.map(req => (
                                                                <button key={req.id} onClick={() => toggleDependency(node.id, req.id)} className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${ node.requires.includes(req.id) ? 'bg-primary/20 border-primary/60 text-primary font-bold' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-primary/40' }`}>{req.label.split('—')[1]?.trim() || req.label}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                                {/* Column 1: Act Builder */}
                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    <div className="bg-input-light dark:bg-input-dark p-4 rounded-xl border border-border-light dark:border-border-dark h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-primary flex items-center"><Icon name="Layout" size={18} className="mr-2"/>Act Builder</h3>
                                            <button onClick={() => setShowArcVisualizer(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all border shadow-sm flex items-center gap-1.5 ${ showArcVisualizer ? 'bg-rose-500/20 border-rose-500/60 text-rose-500' : 'text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:border-rose-500/40' }`}><Icon name="Activity" size={12}/> Arc Visualizer</button>
                                        </div>
                                        {showArcVisualizer && <EmotionalArcVisualizer />}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2">
                                            <div className={`p-4 rounded-lg flex flex-col gap-4 ${uiStyle === 'mr-re' ? 'lg-bubble-bot' : 'bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark/50'}`}><h4 className="font-bold text-textMain-light dark:text-textMain-dark border-b border-border-light dark:border-border-dark pb-2">Act 1: Setup</h4><InputField label="Character Intro" value={storyData.act1.character} onChange={e => handleStoryChange('act1', 'character', e.target.value)} placeholder="Who is the protagonist? What do they want?" onAutoFill={() => handleStoryChange('act1', 'character', getRandom(RANDOM_FILL.character))} onLLaVA={() => triggerLLaVAForField('act1','character')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'character' && isGenerating} /><InputField label="World Building" value={storyData.act1.world} onChange={e => handleStoryChange('act1', 'world', e.target.value)} placeholder="Describe the setting and its rules." onAutoFill={() => handleStoryChange('act1', 'world', getRandom(RANDOM_FILL.world))} onLLaVA={() => triggerLLaVAForField('act1','world')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'world' && isGenerating} /><InputField label="Inciting Incident" value={storyData.act1.incident} onChange={e => handleStoryChange('act1', 'incident', e.target.value)} placeholder="The event that kicks off the story." onAutoFill={() => handleStoryChange('act1', 'incident', getRandom(RANDOM_FILL.incident))} onLLaVA={() => triggerLLaVAForField('act1','incident')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'incident' && isGenerating} /></div>
                                            <div className={`p-4 rounded-lg flex flex-col gap-4 ${uiStyle === 'mr-re' ? 'lg-bubble-bot' : 'bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark/50'}`}><h4 className="font-bold text-textMain-light dark:text-textMain-dark border-b border-border-light dark:border-border-dark pb-2">Act 2: Conflict</h4><InputField label="Rising Action / Obstacles" value={storyData.act2.obstacles} onChange={e => handleStoryChange('act2', 'obstacles', e.target.value)} placeholder="What challenges do they face?" onAutoFill={() => handleStoryChange('act2', 'obstacles', getRandom(RANDOM_FILL.obstacles))} onLLaVA={() => triggerLLaVAForField('act2','obstacles')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'obstacles' && isGenerating} /><InputField label="Midpoint" value={storyData.act2.midpoint} onChange={e => handleStoryChange('act2', 'midpoint', e.target.value)} placeholder="A major turning point. No turning back." onAutoFill={() => handleStoryChange('act2', 'midpoint', getRandom(RANDOM_FILL.midpoint))} onLLaVA={() => triggerLLaVAForField('act2','midpoint')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'midpoint' && isGenerating} /><InputField label="Stakes are Raised" value={storyData.act2.stakes} onChange={e => handleStoryChange('act2', 'stakes', e.target.value)} placeholder="What happens if they fail now?" onAutoFill={() => handleStoryChange('act2', 'stakes', getRandom(RANDOM_FILL.stakes))} onLLaVA={() => triggerLLaVAForField('act2','stakes')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'stakes' && isGenerating} /></div>
                                            <div className={`p-4 rounded-lg flex flex-col gap-4 ${uiStyle === 'mr-re' ? 'lg-bubble-bot' : 'bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark/50'}`}><h4 className="font-bold text-textMain-light dark:text-textMain-dark border-b border-border-light dark:border-border-dark pb-2">Act 3: Resolution</h4><InputField label="Climax" value={storyData.act3.climax} onChange={e => handleStoryChange('act3', 'climax', e.target.value)} placeholder="The final confrontation." onAutoFill={() => handleStoryChange('act3', 'climax', getRandom(RANDOM_FILL.climax))} onLLaVA={() => triggerLLaVAForField('act3','climax')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'climax' && isGenerating} /><InputField label="Falling Action" value={storyData.act3.resolution} onChange={e => handleStoryChange('act3', 'resolution', e.target.value)} placeholder="Tying up loose ends." onAutoFill={() => handleStoryChange('act3', 'resolution', getRandom(RANDOM_FILL.resolution))} onLLaVA={() => triggerLLaVAForField('act3','resolution')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'resolution' && isGenerating} /><InputField label="Final Image / Aftermath" value={storyData.act3.aftermath} onChange={e => handleStoryChange('act3', 'aftermath', e.target.value)} placeholder="The new normal." onAutoFill={() => handleStoryChange('act3', 'aftermath', getRandom(RANDOM_FILL.aftermath))} onLLaVA={() => triggerLLaVAForField('act3','aftermath')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'aftermath' && isGenerating} /></div>
                                        </div>
                                    </div>
                                </div>

                                {showBeatSheet && beatSheets.length > 0 && (
                                    <div className="lg:col-span-3 bg-input-light dark:bg-input-dark rounded-xl border border-green-500/40 shadow-sm overflow-hidden animate-slide-up">
                                        <div className="flex items-center justify-between p-3 bg-green-500/10 border-b border-green-500/20">
                                            <h3 className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                                                <Icon name="ListVideo" size={16} />
                                                Save the Cat Beat Sheet â€” 15 Beats
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button onClick={sendBeatSheetToShots} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
                                                    <Icon name="Sparkles" size={12} /> Send All to Shots
                                                </button>
                                                <button onClick={() => setShowBeatSheet(false)} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark p-1">
                                                    <Icon name="X" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 max-h-64 overflow-y-auto custom-scrollbar">
                                            {beatSheets.map(beat => (
                                                <div key={beat.num} className={`p-2 rounded-lg border flex flex-col gap-1 text-[10px] ${beat.act === 1 ? 'border-primary/30 bg-primary/5' : beat.act === 2 ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`font-black text-[9px] px-1.5 py-0.5 rounded ${beat.act === 1 ? 'bg-primary/20 text-primary' : beat.act === 2 ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'bg-rose-500/20 text-rose-500'}`}>
                                                            {beat.num}
                                                        </span>
                                                        <span className="text-[8px] text-textMuted-light dark:text-textMuted-dark font-bold uppercase">A{beat.act}</span>
                                                    </div>
                                                    <div className="font-bold text-textMain-light dark:text-textMain-dark leading-tight">{beat.label}</div>
                                                    <textarea
                                                        value={beat.desc}
                                                        onChange={e => setBeatSheets(prev => prev.map(b => b.num === beat.num ? { ...b, desc: e.target.value } : b))}
                                                        className="w-full bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark rounded p-1 text-[9px] outline-none resize-none leading-tight custom-scrollbar"
                                                        rows={3}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Column 2: Character & Theme */}
                                <div className="lg:col-span-1 flex flex-col gap-4">
                                    {/* Story Summary Card */}
                                    {(() => {
                                        const d = storyData;
                                        const hasSummary = d.act1.character || d.act1.incident || d.act2.obstacles || d.act3.climax;
                                        if (!hasSummary) return null;
                                        const parts = [];
                                        if (d.dramatic.genre) parts.push(`A ${d.dramatic.genre.toLowerCase()} story.`);
                                        if (d.act1.character) parts.push(d.act1.character.trim().replace(/\.+$/, '') + '.');
                                        if (d.act1.incident) parts.push(`Everything changes when: ${d.act1.incident.trim().replace(/\.+$/, '')}.`);
                                        if (d.act2.obstacles) parts.push(`Facing ${d.act2.obstacles.trim().replace(/\.+$/, '')}.`);
                                        if (d.act2.midpoint) parts.push(`At the turning point: ${d.act2.midpoint.trim().replace(/\.+$/, '')}.`);
                                        if (d.act3.climax) parts.push(`The climax: ${d.act3.climax.trim().replace(/\.+$/, '')}.`);
                                        if (d.act3.aftermath) parts.push(d.act3.aftermath.trim().replace(/\.+$/, '') + '.');
                                        if (d.theme.message) parts.push(`Theme: "${d.theme.message.trim()}".`);
                                        const synopsis = parts.join(' ');
                                        return (
                                            <div className="bg-input-light dark:bg-input-dark p-4 rounded-xl border border-primary/30 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                                        <Icon name="AlignLeft" size={14} className="text-primary" />
                                                        Story Summary
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {d.dramatic.tone && <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold border border-primary/20">{d.dramatic.tone || d.theme.tone}</span>}
                                                        {d.theme.tone && <span className="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded font-bold border border-accent/20">{d.theme.tone}</span>}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-textMain-light dark:text-textMain-dark leading-relaxed font-mono bg-panel-light dark:bg-panel-dark p-3 rounded border border-border-light dark:border-border-dark shadow-inner">
                                                    {synopsis}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-light dark:border-border-dark/50">
                                                    {d.dramatic.visualStyle && <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark flex items-center gap-1"><Icon name="Film" size={10} className="text-primary" />{d.dramatic.visualStyle}</span>}
                                                    {d.dramatic.villain && <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark flex items-center gap-1"><Icon name="AlertTriangle" size={10} className="text-red-500" />{d.dramatic.villain}</span>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <div className={`p-4 rounded-xl ${uiStyle === 'mr-re' ? 'lg-bubble-bot' : 'bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark'}`}><h3 className="text-lg font-bold text-accent mb-4 flex items-center"><Icon name="Lock" size={18} className="mr-2"/>Theme Lock System</h3><div className="flex flex-col gap-4"><InputField label="Theme" value={storyData.theme.theme} onChange={e => handleStoryChange('theme', 'theme', e.target.value)} placeholder="e.g., Man vs. Nature" /><InputField label="Message" value={storyData.theme.message} onChange={e => handleStoryChange('theme', 'message', e.target.value)} placeholder="e.g., Technology cannot conquer all." /><InputField label="Emotional Tone" value={storyData.theme.tone} onChange={e => handleStoryChange('theme', 'tone', e.target.value)} placeholder="e.g., Hopeful, Melancholic, Tense" /></div></div>
                                    <div className={`p-4 rounded-xl ${uiStyle === 'mr-re' ? 'lg-bubble-bot' : 'bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark'}`}><h3 className="text-lg font-bold text-rose-500 mb-4 flex items-center"><Icon name="Sparkles" size={18} className="mr-2"/>Dramatic Keys</h3><div className="flex flex-col gap-4"><InputField label="Genre" value={storyData.dramatic.genre} onChange={e => handleStoryChange('dramatic', 'genre', e.target.value)} placeholder="e.g., Sci-Fi Thriller, Fantasy Epic" /><InputField label="Visual Style" value={storyData.dramatic.visualStyle} onChange={e => handleStoryChange('dramatic', 'visualStyle', e.target.value)} placeholder="e.g., Cyberpunk Noir, Ethereal Fantasy" onLLaVA={() => triggerLLaVAForField('dramatic','visualStyle')} isLlavaReady={isLlavaReady} isProcessing={pendingLLaVAField?.field === 'visualStyle' && isGenerating} /><InputField label="Villain / Antagonist" value={storyData.dramatic.villain} onChange={e => handleStoryChange('dramatic', 'villain', e.target.value)} placeholder="Who or what opposes the protagonist?" /><InputField label="Central Conflict" value={storyData.dramatic.centralConflict} onChange={e => handleStoryChange('dramatic', 'centralConflict', e.target.value)} placeholder="The core struggle driving the story." /><InputField label="Symbolic Object" value={storyData.dramatic.symbolicObject} onChange={e => handleStoryChange('dramatic', 'symbolicObject', e.target.value)} placeholder="An object representing the story's theme." /><InputField label="Emotional Arc" value={storyData.dramatic.emotionalArc} onChange={e => handleStoryChange('dramatic', 'emotionalArc', e.target.value)} placeholder="e.g., Despair → Hope → Triumph" /><InputField label="World Rules" value={storyData.dramatic.worldRules} onChange={e => handleStoryChange('dramatic', 'worldRules', e.target.value)} placeholder="Laws, magic systems, or constraints of this world." /></div></div>
                                    <div className="bg-input-light dark:bg-input-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex-1 flex flex-col">
                                        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-cyan-500 flex items-center"><Icon name="Film" size={18} className="mr-2"/>Story List</h3><button onClick={() => setShowStoryList(!showStoryList)} className="text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm border border-cyan-500/20 hover:bg-cyan-500/20">{showStoryList ? 'Hide' : 'Show'}</button></div>
                                        {showStoryList && (
                                            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-border-light dark:border-border-dark">
                                                <div className="flex gap-2">
                                                    <input type="text" value={newStoryName} onChange={(e) => setNewStoryName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && createStory()} placeholder="Story name..." className="flex-1 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-500" />
                                                    <button onClick={createStory} disabled={!newStoryName.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"><Icon name="Plus" size={14} /></button>
                                                </div>
                                                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                    {stories.length === 0 ? (
                                                        <div className="text-xs text-textMuted-light dark:text-textMuted-dark italic text-center py-2">No stories yet. Create one to get started.</div>
                                                    ) : (
                                                        stories.map(story => (
                                                            <div key={story.id} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${selectedStoryId === story.id ? 'bg-cyan-600/20 border-cyan-500 shadow-sm' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark hover:border-cyan-500/50'}`}>
                                                                <div onClick={() => selectStory(story.id)} className="flex-1 min-w-0">
                                                                    <div className="text-xs font-bold text-textMain-light dark:text-textMain-dark truncate">{story.name}</div>
                                                                    <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{new Date(story.createdAt).toLocaleDateString()}</div>
                                                                </div>
                                                                <button onClick={() => deleteStory(story.id)} className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-1 ml-2 shrink-0"><Icon name="Trash2" size={12} /></button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-amber-500 flex items-center"><Icon name="Users" size={18} className="mr-2"/>Character Web</h3>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <div className="flex flex-wrap gap-1">
                                                {[['Ally','#22c55e'],['Rival','#ef4444'],['Neutral','#6b7280'],['Romantic','#ec4899'],['Mentor','#a855f7'],['Enemy','#f97316']].map(([type,color]) => (
                                                    <span key={type} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{background: color+'33', color, border: `1px solid ${color}55`}}>{type}</span>
                                                ))}
                                            </div>
                                            <button onClick={addCharacter} className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1"><Icon name="Plus" size={12}/>Add</button>
                                            <button onClick={() => { const newChar = { id: Date.now(), name: randChar('name'), motivation: randChar('motivation'), fear: randChar('fear'), contradiction: randChar('contradiction'), appearance: randChar('appearance'), backstory: randChar('backstory'), voiceStyle: randChar('voiceStyle'), role: randChar('role'), archetype: randChar('archetype'), x: 40 + storyData.characters.length * 60, y: 40 }; setStoryData(prev => ({ ...prev, characters: [...prev.characters, newChar] })); }} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm border border-primary/20 hover:bg-primary/20 flex items-center gap-1"><Icon name="Sparkles" size={12}/>Random</button>
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mb-2">Drag cards · Click ⊞ to expand · Link icon + drag to connect · Click line label to cycle type · Click line to delete</div>
                                        {/* Zoom controls */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <button onClick={() => setMapZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))} className="w-7 h-7 flex items-center justify-center rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark hover:border-amber-500 hover:text-amber-500 text-sm font-bold transition-all" title="Zoom In">+</button>
                                            <button onClick={() => setMapZoom(z => Math.max(0.2, parseFloat((z - 0.1).toFixed(2))))} className="w-7 h-7 flex items-center justify-center rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark hover:border-amber-500 hover:text-amber-500 text-sm font-bold transition-all" title="Zoom Out">−</button>
                                            <button onClick={() => { setMapZoom(1); setMapOffset({ x: 0, y: 0 }); }} className="px-2 h-7 flex items-center justify-center rounded bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark hover:border-amber-500 hover:text-amber-500 transition-all min-w-[42px]" title="Reset zoom">{Math.round(mapZoom * 100)}%</button>
                                            <button onClick={handleAutoFit} className="px-2 h-7 flex items-center justify-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-all" title="Auto-fit all nodes"><Icon name="Maximize" size={11}/>Auto Fit</button>
                                            <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark ml-1">Scroll to zoom · Middle-drag or right-drag to pan</span>
                                        </div>
                                        <div
                                            ref={mapRef}
                                            className="flex-1 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark/50 rounded-lg relative overflow-hidden shadow-inner select-none"
                                            style={{minHeight:'420px', cursor: isPanningRef.current ? 'grabbing' : 'grab'}}
                                            onMouseDown={handleMapPanStart}
                                            onMouseMove={handleMapPanMove}
                                            onMouseUp={handleMapPanEnd}
                                            onMouseLeave={handleMapPanEnd}
                                        >
                                            <div style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapZoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, width: '2000px', height: '2000px' }}>
                                                <svg className="absolute inset-0 pointer-events-none" style={{width:'2000px',height:'2000px'}}>
                                                    {storyData.relationships.map(rel => {
                                                        const fromChar = storyData.characters.find(c => c.id === rel.from);
                                                        const toChar = storyData.characters.find(c => c.id === rel.to);
                                                        if (!fromChar || !toChar) return null;
                                                        const x1 = fromChar.x + 128, y1 = fromChar.y + 80, x2 = toChar.x + 128, y2 = toChar.y + 80;
                                                        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                                                        const relType = rel.type || 'Neutral';
                                                        const relColor = REL_COLORS[relType] || '#6b7280';
                                                        return (
                                                            <g key={rel.id} className="group pointer-events-auto">
                                                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={relColor} strokeWidth="2" strokeOpacity="0.7" strokeDasharray={relType === 'Rival' || relType === 'Enemy' ? '6 3' : 'none'} />
                                                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="14" className="cursor-pointer" onClick={() => deleteRelationship(rel.id)} />
                                                                <rect x={mx - 22} y={my - 9} width="44" height="18" rx="4" fill={relColor} fillOpacity="0.9" className="cursor-pointer" onClick={() => cycleRelationType(rel.id)} />
                                                                <text x={mx} y={my + 4} textAnchor="middle" fontSize="8" fontWeight="bold" fill="white" className="pointer-events-none select-none">{relType}</text>
                                                            </g>
                                                        );
                                                    })}
                                                    {drawingLine && <line x1={drawingLine.startX} y1={drawingLine.startY} x2={drawingLine.endX} y2={drawingLine.endY} className="stroke-primary" strokeWidth="2" strokeDasharray="4 4" />}
                                                </svg>
                                                {storyData.characters.map(char => <CharacterNode key={char.id} char={char} draggingChar={draggingChar} handleCharMouseDown={handleCharMouseDown} handleConnectorMouseDown={handleConnectorMouseDown} handleCharacterChange={handleCharacterChange} removeCharacter={removeCharacter} charCount={storyData.characters.length} />)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showContinuity && (() => {
                            const allShots = projects.flatMap(p => p.scenes?.flatMap(s => s.shots || []) || []);
                            const activeShots = scenes?.flatMap(s => s.shots || []) || [];
                            const issues = runContinuityCheck(activeShots);
                            const sevColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#6b7280' };
                            const sevBg = { High: '#ef444418', Medium: '#f59e0b18', Low: '#6b728018' };
                            return (
                                <div className="border-t border-border-light dark:border-border-dark bg-base-light dark:bg-base-dark p-4 shrink-0 max-h-56 overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-orange-500 flex items-center"><Icon name="AlertTriangle" size={14} className="mr-1.5"/>Continuity Checker — Active Scene ({activeShots.length} shots)</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ issues.length === 0 ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500' }`}>{issues.length === 0 ? '✓ No Issues' : `${issues.length} Issue${issues.length > 1 ? 's' : ''}`}</span>
                                    </div>
                                    {activeShots.length === 0 ? (
                                        <div className="text-xs text-textMuted-light dark:text-textMuted-dark italic text-center py-3">No shots in the active scene yet. Add shots first.</div>
                                    ) : issues.length === 0 ? (
                                        <div className="text-xs text-green-500 text-center py-3">✓ All {activeShots.length} shots passed continuity checks.</div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {issues.map((issue, i) => (
                                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg text-[11px]" style={{ background: sevBg[issue.severity], border: `1px solid ${sevColor[issue.severity]}40` }}>
                                                    <span className="font-bold shrink-0 text-[9px] px-1.5 py-0.5 rounded mt-0.5" style={{ background: sevColor[issue.severity] + '30', color: sevColor[issue.severity] }}>{issue.severity}</span>
                                                    <span className="font-bold shrink-0" style={{ color: sevColor[issue.severity] }}>[{issue.type}]</span>
                                                    <span className="text-textMain-light dark:text-textMain-dark">{issue.msg}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {showGenrePacks && (
                            <div className="border-t border-border-light dark:border-border-dark bg-base-light dark:bg-base-dark p-4 shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-fuchsia-500 flex items-center"><Icon name="Sparkles" size={14} className="mr-1.5"/>Genre Preset Packs — One-click fills Dramatic Keys, Theme &amp; Arc Curve</h3>
                                    <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Click any genre to apply</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {GENRE_PACKS.map(pack => (
                                        <button key={pack.name} onClick={() => applyGenrePack(pack)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
                                            style={{ borderColor: pack.color + '60', background: pack.color + '18', color: pack.color }}>
                                            {pack.name}
                                            <span className="text-[9px] font-normal opacity-70">{pack.theme.tone.split(',')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showVersionHistory && (
                            <div className="border-t border-border-light dark:border-border-dark bg-base-light dark:bg-base-dark p-4 shrink-0 max-h-64 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-indigo-500 flex items-center"><Icon name="Clock" size={14} className="mr-1.5"/>Version History</h3>
                                    <button onClick={saveVersion} className="text-[10px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-500 px-2.5 py-1 rounded-lg font-bold hover:bg-indigo-500/30 transition-all">+ Save Snapshot</button>
                                </div>
                                {storyVersions.length === 0 ? (
                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark italic text-center py-3">No versions saved yet. Click "Save Snapshot" to capture the current state.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {storyVersions.slice().reverse().map(ver => {
                                            const diff = buildDiff(ver.snapshot, storyData);
                                            const isViewing = diffViewId === ver.id;
                                            return (
                                                <div key={ver.id} className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg p-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-xs font-bold text-textMain-light dark:text-textMain-dark">{ver.label}</div>
                                                            <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{new Date(ver.savedAt).toLocaleString()} · {diff.length === 0 ? <span className="text-green-500">No changes</span> : <span className="text-amber-500">{diff.length} field{diff.length > 1 ? 's' : ''} changed</span>}</div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {diff.length > 0 && <button onClick={() => setDiffViewId(isViewing ? null : ver.id)} className={`text-[9px] px-2 py-0.5 rounded border transition-all font-bold ${ isViewing ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-500' : 'border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-indigo-500/50' }`}>Diff</button>}
                                                            <button onClick={() => restoreVersion(ver)} className="text-[9px] px-2 py-0.5 rounded border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-primary/50 hover:text-primary transition-all font-bold">Restore</button>
                                                            <button onClick={() => deleteVersion(ver.id)} className="text-red-500 hover:text-red-400 p-0.5"><Icon name="X" size={12}/></button>
                                                        </div>
                                                    </div>
                                                    {isViewing && diff.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {diff.map((f, i) => (
                                                                <div key={i} className="text-[9px] grid grid-cols-3 gap-1 bg-input-light dark:bg-input-dark rounded p-1.5">
                                                                    <div className="font-bold text-textMuted-light dark:text-textMuted-dark truncate">{f.label}</div>
                                                                    <div className="text-red-500 truncate line-through opacity-70">{f.old || '(empty)'}</div>
                                                                    <div className="text-green-500 truncate">{f.cur || '(empty)'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-4 border-t border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                            <button onClick={() => setShowDependencyGraph(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${ showDependencyGraph ? 'bg-primary/20 border-primary/60 text-primary' : 'text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:bg-base-light dark:hover:bg-border-dark' }`}>
                                <Icon name="Link" size={13}/> Deps
                            </button>
                            <button onClick={() => setShowGenrePacks(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${ showGenrePacks ? 'bg-fuchsia-500/20 border-fuchsia-500/60 text-fuchsia-500' : 'text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:bg-base-light dark:hover:bg-border-dark' }`}>
                                <Icon name="Sparkles" size={13}/> Genre Packs
                            </button>
                            <button onClick={() => setShowVersionHistory(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${ showVersionHistory ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-500' : 'text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:bg-base-light dark:hover:bg-border-dark' }`}>
                                <Icon name="Clock" size={13}/> History {storyVersions.length > 0 && <span className="bg-indigo-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">{storyVersions.length}</span>}
                            </button>
                            <button onClick={generateBeatSheet} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${ showBeatSheet ? 'bg-green-500/20 border-green-500/60 text-green-500' : 'text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:bg-base-light dark:hover:bg-border-dark' }`}>
                                <Icon name="ListVideo" size={13}/> Beat Sheet
                            </button>
                            </div>
                            <div className="flex items-center space-x-3">
                            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-textMuted-light dark:text-textMuted-dark hover:bg-base-light dark:hover:bg-border-dark transition-all border border-border-light dark:border-border-dark shadow-sm">Cancel</button>
                            {selectedStoryId && (() => {
                                    const story = stories.find(s => s.id === selectedStoryId);
                                    const proj = story ? projects.find(p => p.id === story.projectId) : null;
                                    const sceneList = proj?.scenes || [];
                                    if (sceneList.length <= 1) return null;
                                    return (
                                        <div className="flex items-center gap-2 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 shadow-sm mr-2">
                                            <Icon name="Folder" size={14} className="text-amber-500 shrink-0" />
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Route Acts to Scenes</span>
                                                <div className="flex items-center gap-2">
                                                    {[['act1','Act 1','text-primary'],['act2','Act 2','text-cyan-500'],['act3','Act 3','text-rose-500']].map(([act, label, color]) => (
                                                        <div key={act} className="flex items-center gap-1">
                                                            <span className={`text-[9px] font-bold ${color}`}>{label}</span>
                                                            <select
                                                                value={actSceneMap[act]}
                                                                onChange={e => setActSceneMap(prev => ({ ...prev, [act]: Number(e.target.value) }))}
                                                                className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded px-1.5 py-0.5 text-[10px] font-bold outline-none cursor-pointer"
                                                            >
                                                                {sceneList.map((scene, idx) => (
                                                                    <option key={scene.id} value={idx}>{scene.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="flex items-center gap-2 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 shadow-sm mr-2">
                                    <Icon name="Camera" size={14} className="text-cyan-500 shrink-0" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Shot Type per Act</span>
                                        <div className="flex items-center gap-2">
                                            {[['act1','A1','text-primary'],['act2','A2','text-cyan-500'],['act3','A3','text-rose-500']].map(([act, label, color]) => (
                                                <div key={act} className="flex items-center gap-1">
                                                    <span className={`text-[9px] font-bold ${color}`}>{label}</span>
                                                    <select
                                                        value={actShotTypeMap[act]}
                                                        onChange={e => setActShotTypeMap(prev => ({ ...prev, [act]: e.target.value }))}
                                                        className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded px-1 py-0.5 text-[9px] font-bold outline-none cursor-pointer max-w-[90px]"
                                                    >
                                                        <option value="">Auto</option>
                                                        {['Extreme Wide Shot (EWS)','Wide Shot (WS)','Full Shot (FS)','Medium Shot (MS)','Close-Up (CU)','Extreme Close-Up (ECU)','Point of View (POV)','Over the Shoulder (OTS)',"Bird's Eye View","Worm's Eye View"].map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 shadow-sm mr-2">
                                    <Icon name="Clapperboard" size={14} className="text-primary shrink-0" />
                                    <div className="flex flex-col min-w-[160px]">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">Shot Count</span>
                                            <span className="text-sm font-bold text-primary font-mono">{shotCountTarget} shots</span>
                                        </div>
                                        <input type="range" min="3" max="24" step="1" value={shotCountTarget} onChange={e => setShotCountTarget(Number(e.target.value))} className="w-full accent-primary cursor-pointer" />
                                        <div className="flex justify-between text-[8px] text-textMuted-light dark:text-textMuted-dark font-mono mt-0.5">
                                            <span>A1:{Math.max(1,Math.round(shotCountTarget*0.25))}</span>
                                            <span>A2:{Math.max(1,Math.round(shotCountTarget*0.42))}</span>
                                            <span>A3:{Math.max(1,shotCountTarget-Math.max(1,Math.round(shotCountTarget*0.25))-Math.max(1,Math.round(shotCountTarget*0.42)))}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setShowTonePreview(v => !v)} className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${showTonePreview ? 'bg-amber-500/20 border-amber-500/60 text-amber-500' : 'text-textMuted-light dark:text-textMuted-dark border-border-light dark:border-border-dark hover:bg-base-light dark:hover:bg-border-dark'}`}>
                                    <Icon name="Sliders" size={14} /> Preview
                                </button>
                                <button onClick={() => { convertToPromptData(); if (isRevising) { setIsRevising(false); onClose(); } }} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98] flex items-center gap-2 ${isRevising ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-primary hover:bg-primaryHover text-white'}`}>
                                    <Icon name={isRevising ? "RotateCcw" : "Sparkles"} size={16} />
                                    {isRevising ? 'Update Story' : `Convert to ${shotCountTarget} Shots`}
                                </button>
                            </div>
                        {showTonePreview && (() => {
                            const ACT_LABELS = ['Act 1 â€” Setup', 'Act 2 â€” Conflict', 'Act 3 â€” Resolution'];
                            const ACT_KEYS = ['act1', 'act2', 'act3'];
                            const ACT_TENSION_IDX = [[0,1,2], [3,4], [5,6]];
                            const ACT_COLORS = ['text-primary border-primary/30 bg-primary/5', 'text-cyan-500 border-cyan-500/30 bg-cyan-500/5', 'text-rose-500 border-rose-500/30 bg-rose-500/5'];
                            const getLighting = (t) => t >= 70 ? 'Harsh Shadows' : t >= 40 ? 'Cinematic Rim Lighting' : 'Natural Daylight';
                            const getMovement = (t) => t >= 70 ? 'Handheld / Shaky' : t >= 40 ? 'Tracking / Follow' : 'Static / Tripod';
                            const getSpeed   = (t) => t >= 70 ? 'Speed Ramp' : t >= 40 ? 'Normal Speed' : 'Slow Motion';
                            const getShotType = (act, t) => {
                                const override = actShotTypeMap[ACT_KEYS[act]];
                                if (override) return override + ' âœŽ';
                                return ['Wide Shot (WS)', 'Medium Shot (MS)', 'Close-Up (CU)'][act];
                            };
                            return (
                                <div className="border-t border-border-light dark:border-border-dark pt-3 mt-1 animate-slide-up">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon name="Sliders" size={12} className="text-amber-500" />
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Tone-to-Camera Mapping Preview</span>
                                        <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark italic">Based on your arc tension values â€” approve before converting</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ACT_LABELS.map((label, i) => {
                                            const tensionVals = ACT_TENSION_IDX[i].map(idx => arcTension[idx] || 50);
                                            const avgTension = Math.round(tensionVals.reduce((a,b) => a+b, 0) / tensionVals.length);
                                            const lighting  = getLighting(avgTension);
                                            const movement  = getMovement(avgTension);
                                            const speed     = getSpeed(avgTension);
                                            const shotType  = getShotType(i, avgTension);
                                            const tColor    = avgTension >= 70 ? 'text-red-500' : avgTension >= 40 ? 'text-amber-500' : 'text-green-500';
                                            return (
                                                <div key={i} className={`p-3 rounded-lg border text-[10px] flex flex-col gap-1.5 ${ACT_COLORS[i]}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-[11px]">{label}</span>
                                                        <span className={`font-black font-mono text-xs ${tColor}`}>{avgTension}</span>
                                                    </div>
                                                    <div className="w-full h-1 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${avgTension >= 70 ? 'bg-red-500' : avgTension >= 40 ? 'bg-amber-500' : 'bg-green-500'}`} style={{width: `${avgTension}%`}} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                                                        <span className="text-textMuted-light dark:text-textMuted-dark">Shot</span>
                                                        <span className="font-bold text-textMain-light dark:text-textMain-dark truncate">{shotType}</span>
                                                        <span className="text-textMuted-light dark:text-textMuted-dark">Lighting</span>
                                                        <span className="font-bold text-textMain-light dark:text-textMain-dark truncate">{lighting}</span>
                                                        <span className="text-textMuted-light dark:text-textMuted-dark">Movement</span>
                                                        <span className="font-bold text-textMain-light dark:text-textMain-dark truncate">{movement}</span>
                                                        <span className="text-textMuted-light dark:text-textMuted-dark">Speed</span>
                                                        <span className="font-bold text-textMain-light dark:text-textMain-dark truncate">{speed}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                        </div>
                    </div>
                </div>
            );
        };

