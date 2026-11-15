import { cleanPromptText } from './prompt.js';
import { FIGHT_LANDMARKS, FIGHT_ROOMS, FIGHT_SKILLS, FIGHT_STRIKES, FIGHT_STYLES } from '../data/fightClub.js';

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

export const resolveStrike = (styleId, strikeId) => {
    const list = FIGHT_STRIKES[styleId] || FIGHT_STRIKES.hand;
    return list.find(item => item.id === strikeId) || list[0];
};

const sides = (draft) => {
    const hero = fighterNames(draft.fighters.find(f => f.role === 'protagonist') || draft.fighters[0] || { name: 'the fighter', role: 'protagonist' })[0];
    const other = draft.fighters.find(f => f.role !== 'protagonist');
    const foe = other ? fighterNames(other)[0] : 'the other fighter';
    return { hero, foe };
};

const strikeSentence = (hero, foe, strike) => `${hero}'s ${strike.limb} ${strike.verb} ${strike.direction} into ${foe}'s ${strike.target}. ${strike.result}`;

const beatAction = (style, draft, strike) => {
    const { hero, foe } = sides(draft);
    const place = cleanPromptText(draft.location);
    const where = place ? ` in ${place}` : '';
    if (draft.beat === 'setup') return `${hero} is screen left and ${foe} is screen right${where}. No strike yet. The distance is readable.`;
    if (draft.beat === 'clash') return `${strikeSentence(hero, foe, strike)} ${foe} has not answered yet.`;
    if (draft.beat === 'impact') return `${strikeSentence(hero, foe, strike)} One hit only.`;
    if (draft.beat === 'aftermath') return `${hero} is still up. ${foe} still shows ${strike.damage}. No new injury.`;
    return [
        `1. Setup. ${hero} is screen left and ${foe} is screen right${where}. No strike yet.`,
        `2. Clash. ${strikeSentence(hero, foe, strike)}`,
        `3. Impact. The same hit lands. ${foe} still shows ${strike.damage}.`,
        `4. Aftermath. ${foe} still shows ${strike.damage}. No new injury.`
    ].join(' ');
};

const geographyLine = (style, draft) => {
    const { hero, foe } = sides(draft);
    const place = cleanPromptText(draft.location);
    const landmark = place ? `the edge of ${place}` : (FIGHT_LANDMARKS[style.id] || 'the nearest wall');
    return `${hero} is screen left, facing right. ${foe} is screen right, facing left. The camera stays on ${hero}'s side of the line. Landmark: ${landmark}.`;
};

const hitLine = (style, strike) => `${strike.contact}. ${strike.damage}. ${FIGHT_ROOMS[style.id] || 'the room takes the hit'}.`;

const avoidLine = (style) => {
    const parts = [style.avoid];
    if (!/slow motion/i.test(style.avoid)) parts.push('slow motion');
    if (!/extra limbs/i.test(style.avoid)) parts.push('extra limbs');
    if (!/pass(?:es)? through/i.test(style.avoid)) parts.push('a fist that passes through the body');
    return parts.filter(Boolean).join('. ');
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
    const strike = resolveStrike(style.id, draft.strikeId);
    const layers = [];
    const cast = [...fighters.map(describeFighter), ...mentioned].filter(Boolean);
    if (cast.length) layers.push(`Characters: ${cast.join(' ')}`);
    if (place) layers.push(`Location: ${place}`);
    layers.push(`Geography: ${geographyLine(style, { ...draft, fighters })}`);
    const action = `${beatAction(style, { ...draft, fighters }, strike)} ${style.sauce}${note ? ` ${note}` : ''}`;
    layers.push(`Action: ${cleanPromptText(action)}`);
    const spoken = (draft.lines || []).filter(line => cleanPromptText(line.text));
    if (spoken.length && (draft.beat === 'clash' || draft.beat === 'impact' || draft.beat === 'exchange')) {
        layers.push(`Dialogue: ${spoken.map(line => `${cleanPromptText(line.speaker) || 'Fighter'}: ${cleanPromptText(line.text)}`).join('. ')}`);
    }
    if (draft.beat !== 'setup') layers.push(`Hit: ${hitLine(style, strike)}`);
    layers.push(`Camera: ${style.position}. ${style.camera}. ${style.lens}. ${style.movement}. ${draft.duration || '5s'}. ${style.cut}`);
    layers.push(`Sound: ${style.sfx}`);
    layers.push('Frame: 16:9');
    layers.push(`Avoid: ${avoidLine(style)}`);
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
