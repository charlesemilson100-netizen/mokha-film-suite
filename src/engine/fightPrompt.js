import { cleanPromptText } from './prompt.js';
import { FIGHT_LANDMARKS, FIGHT_RANGES, FIGHT_ROOMS, FIGHT_SKILLS, FIGHT_STRIKES, FIGHT_STYLE_RANGE, FIGHT_STYLES, FIGHT_TEMPOS } from '../data/fightClub.js';

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

const skillOf = (fighter) => FIGHT_SKILLS.find(item => item.id === fighter?.skill) || FIGHT_SKILLS.find(item => item.id === 'hand');

const skillLine = (fighter) => {
    const preset = skillOf(fighter);
    const custom = cleanPromptText(fighter.customSkill);
    const level = levelLine[fighter.level] || levelLine[preset?.level] || levelLine.trained;
    return [preset?.line, preset?.stance && `Stance: ${preset.stance}.`, preset?.limit, custom, level].filter(Boolean).join(' ');
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

const RANK = { weak: 0, trained: 1, strong: 2, elite: 3 };

const holdMarks = (fighter, lead, side) => {
    if (!fighter || fighter.role !== 'group') return '';
    const rest = fighterNames(fighter).slice(1);
    if (!rest.length) return '';
    return `${rest.join(', ')} hold marks behind ${lead}, still screen ${side}. They do not swing.`;
};

const sides = (draft) => {
    const fighters = draft.fighters || [];
    const heroFighter = fighters.find(f => f.role === 'protagonist') || fighters[0] || { name: 'the fighter', role: 'protagonist', skill: 'hand', level: 'trained' };
    const foeFighter = fighters.find(f => f !== heroFighter && f.role !== 'protagonist') || null;
    const hero = fighterNames(heroFighter)[0];
    const foe = foeFighter ? fighterNames(foeFighter)[0] : 'the other fighter';
    const marks = [holdMarks(heroFighter, hero, 'left'), foeFighter ? holdMarks(foeFighter, foe, 'right') : ''].filter(Boolean).join(' ');
    return { hero, foe, heroFighter, foeFighter, marks };
};

const roles = (draft) => {
    const cast = sides(draft);
    const threatAttacks = draft.initiator === 'threat' && cast.foeFighter;
    const attackerFighter = threatAttacks ? cast.foeFighter : cast.heroFighter;
    const receiverFighter = threatAttacks ? cast.heroFighter : (cast.foeFighter || { name: cast.foe, role: 'antagonist', skill: 'hand', level: 'trained' });
    const attacker = threatAttacks ? cast.foe : cast.hero;
    const receiver = threatAttacks ? cast.hero : cast.foe;
    const attackerSkill = skillOf(attackerFighter);
    const rank = (fighter, skill) => RANK[fighter?.level] ?? RANK[skill?.level] ?? 1;
    const attackerRank = rank(attackerFighter, attackerSkill);
    const receiverRank = rank(receiverFighter, skillOf(receiverFighter));
    const match = receiverRank > attackerRank ? 'check' : receiverRank < attackerRank ? 'sell' : 'even';
    return { ...cast, attacker, receiver, attackerSkill, match };
};

export const resolveRange = (styleId, rangeId) => FIGHT_RANGES.find(item => item.id === (rangeId || FIGHT_STYLE_RANGE[styleId])) || FIGHT_RANGES[2];
export const resolveTempo = (tempoId) => FIGHT_TEMPOS.find(item => item.id === tempoId) || FIGHT_TEMPOS[0];

const strikeSentence = (attacker, receiver, strike, skill, match) => {
    const tell = skill?.tell || 'the weight shift';
    if (match === 'check') return `${attacker}'s ${strike.limb} ${strike.verb} ${strike.direction} toward ${receiver}'s guard. The tell is ${tell}. The strike stops on the guard.`;
    const landed = `${attacker}'s ${strike.limb} ${strike.verb} ${strike.direction} into ${receiver}'s ${strike.target}. The tell is ${tell}. ${strike.result}`;
    if (match === 'sell') return `${landed} ${receiver}'s foot slides and the guard is late.`;
    return landed;
};

const sellLine = (receiver, strike, match) => {
    if (match === 'check') return `The strike stops on ${receiver}'s guard. ${receiver} still shows ${strike.damage}.`;
    if (match === 'sell') return `${receiver}'s foot slides and the guard is late. ${receiver} still shows ${strike.damage}.`;
    return `${receiver} takes the hit and the feet reset. ${receiver} still shows ${strike.damage}.`;
};

const beatAction = (style, draft, strike) => {
    const { hero, foe, attacker, receiver, attackerSkill, match, marks } = roles(draft);
    const place = cleanPromptText(draft.location);
    const where = place ? ` in ${place}` : '';
    const tell = attackerSkill?.tell || 'the weight shift';
    const thrown = strikeSentence(attacker, receiver, strike, attackerSkill, match);
    const extras = marks ? ` ${marks}` : '';
    if (draft.beat === 'setup') return `${hero} is screen left and ${foe} is screen right${where}. No strike yet. The distance is readable.${extras}`;
    if (draft.beat === 'clash') return `${attacker} steps in on one count. The tell is ${tell}. The ${strike.limb} starts ${strike.direction} toward ${receiver}'s ${match === 'check' ? 'guard' : strike.target}. ${receiver} has not answered yet.${extras}`;
    if (draft.beat === 'impact') return `${thrown} One hit only.${extras}`;
    if (draft.beat === 'aftermath') return `${hero} is still screen left. ${foe} is still screen right. ${receiver} still shows ${strike.damage}. No new injury.${extras}`;
    return [
        `1. Setup. ${hero} is screen left and ${foe} is screen right${where}. No strike yet.${extras}`,
        `2. Clash. ${thrown}`,
        `3. Impact. ${sellLine(receiver, strike, match)}`,
        `4. Aftermath. ${receiver} still shows ${strike.damage}. No new injury.${extras}`
    ].join(' ');
};

const geographyLine = (style, draft) => {
    const { hero, foe, marks } = sides(draft);
    const place = cleanPromptText(draft.location);
    const landmark = place ? `the edge of ${place}` : (FIGHT_LANDMARKS[style.id] || 'the nearest wall');
    return `${hero} is screen left, facing right. ${foe} is screen right, facing left. The camera stays on ${hero}'s side of the line. Landmark: ${landmark}.${marks ? ` ${marks}` : ''}`;
};

const fightLine = (style, draft, strike) => {
    const card = roles(draft);
    const range = resolveRange(style.id, draft.range);
    const tempo = resolveTempo(draft.tempo);
    const tell = card.attackerSkill?.tell || 'the weight shift';
    const head = `Range: ${range.name.toLowerCase()}. ${range.line}`;
    const marks = card.marks ? ` ${card.marks}` : '';
    if (draft.beat === 'setup') return `${head} ${card.attacker} and ${card.receiver} have not moved. No strike yet.${marks}`;
    if (draft.beat === 'clash') return `${head} ${card.attacker} steps in on one count. The tell is ${tell}. ${tempo.line}${marks}`;
    if (draft.beat === 'impact') return `${head} Contact. ${sellLine(card.receiver, strike, card.match)} ${tempo.line}${marks}`;
    if (draft.beat === 'aftermath') return `${head} ${card.hero} is screen left. ${card.foe} is screen right. Both feet find their marks. ${card.receiver} still shows ${strike.damage}.${marks}`;
    return `${head} ${card.attacker} steps in on one count. The tell is ${tell}. Contact, then both feet find their marks.${marks}`;
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
    layers.push(`Fight: ${fightLine(style, { ...draft, fighters }, strike)}`);
    const stakes = cleanPromptText(draft.stakes);
    const outcome = cleanPromptText(draft.outcome);
    const detail = [stakes && `Stakes: ${stakes}.`, outcome && `Outcome: ${outcome}.`].filter(Boolean).join(' ');
    const action = `${beatAction(style, { ...draft, fighters }, strike)} ${style.sauce}${note ? ` ${note}` : ''}${detail ? ` ${detail}` : ''}`;
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

export const draftFromEditorShot = (shot, meta = {}) => {
    const saved = shot?.fightDraft && typeof shot.fightDraft === 'object' ? shot.fightDraft : {};
    const spoken = (shot?.dialogues || []).filter(line => cleanPromptText(line?.text));
    const lines = spoken.length
        ? spoken.map((line, index) => ({ id: `line_${shot?.id || 'open'}_${index}`, speaker: line.character || '', text: line.text }))
        : (saved.lines || []);
    const index = Number.isInteger(meta.index) ? meta.index : -1;
    const subject = cleanPromptText(shot?.subject);
    const note = saved.lastAction && subject === saved.lastAction ? (saved.note || '') : (subject || saved.note || '');
    return {
        ...saved,
        projectName: saved.projectName || (index >= 0 ? `Shot ${index + 1} fight` : 'This prompt'),
        description: saved.description || '',
        stakes: saved.stakes || '',
        outcome: saved.outcome || '',
        styleId: saved.styleId || 'hand',
        strikeId: saved.strikeId || 'elbow',
        beat: saved.beat || 'clash',
        duration: shot?.selections?.duration || saved.duration || '5s',
        location: saved.location || '',
        note,
        lines,
        fighters: Array.isArray(saved.fighters) && saved.fighters.length ? saved.fighters : undefined,
        source: {
            sceneId: meta.sceneId || saved.source?.sceneId || '',
            shotId: shot?.id || '',
            shotIndex: index,
            label: meta.label || (index >= 0 ? `Shot ${index + 1}` : 'This prompt')
        }
    };
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
