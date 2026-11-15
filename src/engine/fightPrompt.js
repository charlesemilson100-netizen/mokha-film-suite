import { cleanPromptText } from './prompt.js';
import { FIGHT_SKILLS, FIGHT_STYLES } from '../data/fightClub.js';

const levelLine = {
    weak: 'Weak. The first clean hit wobbles them.',
    trained: 'Trained. They recover their feet.',
    strong: 'Strong. They keep coming after a real hit.',
    elite: 'Elite. They choose the distance.'
};

export const fighterNames = (fighter) => {
    const count = Math.min(15, Math.max(1, Number(fighter.count) || 1));
    if (fighter.role !== 'group') {
        const name = cleanPromptText(fighter.name) || 'Fighter';
        return [name];
    }
    const word = fighter.nameStyle === 'antagonist' ? 'Antagonist' : 'Villain';
    return Array.from({ length: count }, (_, index) => `${word} ${index + 1}`);
};

const dressLine = (fighter) => {
    if (fighter.role !== 'group') return '';
    if (fighter.dress === 'different') return 'Each one dresses differently.';
    return 'They wear the same cut of clothes and different faces. Different ages, noses, and hair. They are not clones.';
};

const skillLine = (fighter) => {
    const preset = FIGHT_SKILLS.find(item => item.id === fighter.skill);
    const custom = cleanPromptText(fighter.customSkill);
    const level = levelLine[fighter.level] || levelLine.trained;
    return [preset?.line, custom, level].filter(Boolean).join(' ');
};

export const describeFighter = (fighter) => {
    const names = fighterNames(fighter);
    const role = fighter.role === 'group'
        ? `a group of ${names.length}`
        : fighter.role || 'fighter';
    return `${names.join(', ')}. ${role}. ${skillLine(fighter)} ${dressLine(fighter)}`.replace(/\s+/g, ' ').trim();
};

const beatAction = (style, draft) => {
    const hero = fighterNames(draft.fighters.find(f => f.role === 'protagonist') || draft.fighters[0] || { name: 'the fighter', role: 'protagonist' })[0];
    const other = draft.fighters.find(f => f.role !== 'protagonist');
    const foe = other ? fighterNames(other)[0] : 'the other fighter';
    const place = cleanPromptText(draft.location);
    const where = place ? ` in ${place}` : '';
    if (draft.beat === 'setup') return `${hero} and ${foe} face each other${where}. No strike yet. The distance is readable.`;
    if (draft.beat === 'clash') return `${hero} commits one named strike at ${foe}${where}. ${foe} answers once.`;
    if (draft.beat === 'impact') return `The strike lands on ${foe}. Impact, then the body reacts. One hit only.`;
    if (draft.beat === 'aftermath') return `${hero} is still up. ${foe} shows what the hit cost. Hold on the result.`;
    return [
        `1. Setup. ${hero} and ${foe} hold their ground${where}. Camera ${style.movement}.`,
        `2. Clash. ${hero} throws one strike. Camera stays on the attacking side.`,
        `3. Impact. Contact, then ${foe} reacts. Cut on the hit.`,
        `4. Aftermath. Show who is standing. Camera eases wide.`
    ].join(' ');
};

const textMentions = (text, name) => {
    if (!name || !text) return false;
    const safe = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:@)?\\b${safe}\\b`, 'i').test(text);
};

export const buildFightPrompt = (draft, libraries = {}) => {
    const style = FIGHT_STYLES.find(item => item.id === draft.styleId) || FIGHT_STYLES[0];
    const fighters = (draft.fighters || []).filter(Boolean);
    const note = cleanPromptText(draft.note);
    const place = cleanPromptText(draft.location);
    const mentioned = [];
    (libraries.characters || []).forEach(char => {
        if (!char?.name || !textMentions(note, char.name)) return;
        const already = fighters.some(fighter => fighterNames(fighter).some(name => name.toLowerCase() === char.name.toLowerCase()));
        if (!already) mentioned.push(`${cleanPromptText(char.name)}${char.role ? `, ${cleanPromptText(char.role)}` : ''}`);
    });
    (libraries.locations || []).forEach(loc => {
        if (loc?.name && textMentions(note, loc.name) && !place.toLowerCase().includes(loc.name.toLowerCase())) {
            mentioned.push(`${cleanPromptText(loc.name)} at the location`);
        }
    });
    const layers = [];
    const cast = [...fighters.map(describeFighter), ...mentioned].filter(Boolean);
    if (cast.length) layers.push(`Characters: ${cast.join(' ')}`);
    if (place) layers.push(`Location: ${place}`);
    const action = `${beatAction(style, { ...draft, fighters })} ${style.sauce}${note ? ` ${note}` : ''}`;
    layers.push(`Action: ${cleanPromptText(action)}`);
    const spoken = (draft.lines || []).filter(line => cleanPromptText(line.text));
    if (spoken.length && (draft.beat === 'clash' || draft.beat === 'impact' || draft.beat === 'exchange')) {
        layers.push(`Dialogue: ${spoken.map(line => `${cleanPromptText(line.speaker) || 'Fighter'}: ${cleanPromptText(line.text)}`).join('. ')}`);
    }
    layers.push(`Camera: ${style.position}. ${style.camera}. ${style.lens}. ${style.movement}. ${draft.duration || '5s'}. ${style.cut}`);
    layers.push(`Sound: ${style.sfx}`);
    layers.push('Frame: 16:9');
    layers.push(`Avoid: ${style.avoid}`);
    return layers.join('\n\n');
};

export const buildFightScene = (draft) => {
    const style = FIGHT_STYLES.find(item => item.id === draft.styleId) || FIGHT_STYLES[0];
    const beats = draft.beat === 'exchange' ? ['setup', 'clash', 'impact', 'aftermath'] : [draft.beat || 'clash'];
    const shots = beats.map((beat, index) => {
        const one = { ...draft, beat, lines: beat === 'clash' || beat === 'impact' || beats.length === 1 ? draft.lines : [] };
        const prompt = buildFightPrompt(one);
        const subject = (prompt.split('\n\n').find(line => line.startsWith('Action:')) || 'Action: The fight turns.').replace(/^Action:\s*/, '');
        return {
            id: `fight_shot_${Date.now()}_${index}`,
            subject,
            negativePrompt: 'cloned faces, identical bodies, extra limbs, swapped faces',
            selections: {
                shotType: style.shotType,
                shotStyle: '',
                camera: style.camera,
                lens: style.lens,
                aperture: 'f/2.8',
                angle: '',
                lighting: style.lighting,
                movement: style.movement,
                actionSpeed: 'Normal Speed',
                duration: draft.duration || '5s',
                transition: 'Hard Cut',
                filmStock: '',
                aspectRatio: '--ar 16:9'
            },
            sfx: style.sfx,
            bgm: '',
            dialogues: (one.lines || []).filter(line => cleanPromptText(line.text)).map(line => ({
                character: line.speaker || '',
                text: line.text,
                mood: '',
                reaction: '',
                event: '',
                voiceStyle: '',
                placement: 'during'
            })),
            mode: 'video',
            status: 'Planning',
            tags: ['fight', style.name],
            referenceImages: [],
            customPromptOverride: prompt
        };
    });
    return {
        id: `fight_scene_${Date.now()}`,
        name: cleanPromptText(draft.projectName) || `${style.name} fight`,
        description: cleanPromptText(draft.description),
        shots
    };
};
