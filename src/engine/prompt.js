export const CorrectorEngine = {
            frenchGenders: {
                'maison': 'f', 'voiture': 'f', 'table': 'f', 'chaise': 'f', 'lumière': 'f', 'nuit': 'f', 'ville': 'f', 'forêt': 'f', 'pluie': 'f', 'manman': 'f', 'femme': 'f', 'fille': 'f', 'mère': 'f', 'soeur': 'f', 'tante': 'f', 'eau': 'f', 'terre': 'f', 'mer': 'f', 'fleur': 'f', 'chanson': 'f', 'idée': 'f', 'joie': 'f', 'peur': 'f', 'fenêtre': 'f', 'porte': 'f',
                'garçon': 'm', 'homme': 'm', 'père': 'm', 'frère': 'm', 'livre': 'm', 'ciel': 'm', 'soleil': 'm', 'jour': 'm', 'monde': 'm', 'couteau': 'm', 'chien': 'm', 'chat': 'm', 'arbre': 'm', 'vent': 'm', 'feu': 'm', 'bâtiment': 'm', 'pont': 'm', 'train': 'm', 'avion': 'm', 'ordinateur': 'm', 'téléphone': 'm'
            },

            correctText: (text) => {
                if (!text) return "";
                let correctedText = ` ${text} `; // Pad with spaces for easier regex word boundary matching

                // --- English Corrections ---
                // "a" vs "an"
                correctedText = correctedText.replace(/\s(a)\s+([aeiouAEIOU])/g, ' an $2');
                correctedText = correctedText.replace(/\s(an)\s+([^aeiouAEIOU\s])/g, ' a $2');

                // "I am speak" -> "I am speaking"
                const ingVerbs = ['speak', 'run', 'walk', 'talk', 'eat', 'drink', 'look', 'see', 'go', 'do', 'make', 'take', 'come', 'get', 'give', 'know', 'think', 'feel', 'work', 'try', 'use', 'find', 'tell', 'ask', 'seem'];
                ingVerbs.forEach(verb => {
                    const regex = new RegExp(`\\b(I am|he is|she is|it is|we are|they are|I'm|he's|she's|it's|we're|they're)\\s+(${verb})\\b`, 'gi');
                    correctedText = correctedText.replace(regex, (match, phrase, v) => {
                        let newVerb = v;
                        if (v.endsWith('e') && !v.endsWith('ee')) newVerb = v.slice(0, -1) + 'ing';
                        else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(v)) newVerb = v + v.slice(-1) + 'ing';
                        else newVerb = v + 'ing';
                        return `${phrase} ${newVerb}`;
                    });
                });
                
                // "i am" -> "I am"
                correctedText = correctedText.replace(/\s(i)\s/g, ' I ');
                correctedText = correctedText.replace(/\s(i'm)\s/gi, " I'm ");

                // Simple past tense correction
                correctedText = correctedText.replace(/\b(I|you|we|they) was\b/gi, '$1 were');
                correctedText = correctedText.replace(/\b(he|she|it) were\b/gi, '$1 was');

                // Common misspellings
                const misspellings = {
                    'teh': 'the', 'wierd': 'weird', 'definately': 'definitely', 'seperate': 'separate',
                    'occured': 'occurred', 'acheive': 'achieve', 'beleive': 'believe', 'recieve': 'receive',
                    'adress': 'address', 'grammer': 'grammar', 'hight': 'height', 'untill': 'until',
                    'your a': "you're a", 'youre a': "you're a", 'its a': "it's a"
                };
                Object.entries(misspellings).forEach(([wrong, right]) => {
                    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
                    correctedText = correctedText.replace(regex, right);
                });

                // --- French Corrections ---
                Object.entries(CorrectorEngine.frenchGenders).forEach(([noun, gender]) => {
                    if (gender === 'f') {
                        const regex = new RegExp(`\\b(le|un)\\s+(${noun})\\b`, 'gi');
                        correctedText = correctedText.replace(regex, (match, article, n) => (article.toLowerCase() === 'le' ? 'la' : 'une') + ` ${n}`);
                    } else if (gender === 'm') {
                        const regex = new RegExp(`\\b(la|une)\\s+(${noun})\\b`, 'gi');
                        correctedText = correctedText.replace(regex, (match, article, n) => (article.toLowerCase() === 'la' ? 'le' : 'un') + ` ${n}`);
                    }
                });
                
                const lApostropheRegex = /\b(le|la)\s+([aeiouhAEIOUH][a-zA-Zà-üÀ-Ü]+)\b/gi;
                correctedText = correctedText.replace(lApostropheRegex, "l'$2");

                return correctedText.trim();
            }
        };

// --- 100% LOCAL INTELLIGENCE ENGINE ---
        export const LocalAIEngine = {
            analyzeDialogueForContext: (dialogueText, verb = '', surroundingText = '') => {
                const lowerText = (dialogueText + ' ' + verb + ' ' + surroundingText).toLowerCase();
                let mood = 'Neutral';
                let reaction = '';
                let event = '';

                // Mood detection from verb
                const verbLower = (verb || '').toLowerCase();
                if (['yells', 'shouts', 'screams'].includes(verbLower)) mood = 'Shouting';
                else if (verbLower === 'whispers') mood = 'Whispering';
                else if (verbLower === 'laughs') mood = 'Laughing';
                else if (verbLower === 'cries') mood = 'Crying';
                else if (verbLower === 'stammers') mood = 'Nervous';
                else if (verbLower === 'exclaims') mood = 'Intense';

                // Mood detection from dialogue content
                if (/\b(damn|hell|furious|angry|hate|stupid|idiot)\b/.test(lowerText) && mood === 'Neutral') mood = 'Angry';
                if (/\b(happy|joy|wonderful|great|love|fantastic)\b/.test(lowerText) && mood === 'Neutral') mood = 'Happy';
                if (/\b(sad|awful|terrible|sorry|crying)\b/.test(lowerText) && mood === 'Neutral') mood = 'Sad';
                if (/\b(scared|terrified|help me|watch out)\b/.test(lowerText)) mood = 'Terrified';
                if (/\b(uh|um|nervous|i guess)\b/.test(lowerText) && mood === 'Neutral') mood = 'Nervous';
                if (/\b(really\?|oh sure|as if)\b/.test(lowerText) && mood === 'Neutral') mood = 'Sarcastic';
                if (dialogueText.includes('?')) { if (mood === 'Neutral') mood = 'Neutral'; }
                if (dialogueText.endsWith('!')) { if (mood === 'Neutral') mood = 'Intense'; }

                // Reaction detection from surrounding text (not dialogue itself)
                const surroundingLower = surroundingText.toLowerCase();
                if (/\b(smiles|grins)\b/.test(surroundingLower)) reaction = 'Smiling';
                else if (/\b(frowns|scowls)\b/.test(surroundingLower)) reaction = 'Frowning';
                else if (/\b(nods)\b/.test(surroundingLower)) reaction = 'Nodding';
                else if (/\b(shakes his head|shakes her head)\b/.test(surroundingLower)) reaction = 'Shaking Head';
                else if (/\b(shrugs)\b/.test(surroundingLower)) reaction = 'Shrugging';
                else if (/\b(sighs)\b/.test(surroundingLower)) reaction = 'Sighing';
                else if (/\b(gasps)\b/.test(surroundingLower)) reaction = 'Gasping';
                else if (/\b(glares)\b/.test(surroundingLower)) reaction = 'Glaring';
                else if (/\b(stares)\b/.test(surroundingLower)) reaction = 'Staring';
                else if (/\b(looks away)\b/.test(surroundingLower)) reaction = 'Looking Away';
                else if (/\b(facepalm)\b/.test(surroundingLower)) reaction = 'Facepalming';

                // Event detection from surrounding text
                if (/\b(walks away|turns and leaves)\b/.test(surroundingLower)) event = 'Walking away';
                else if (/\b(gestures|waving his hands)\b/.test(surroundingLower)) event = 'Gesturing hands';
                else if (/\b(sits down)\b/.test(surroundingLower)) event = 'Sitting down';
                else if (/\b(stands up)\b/.test(surroundingLower)) event = 'Standing up';
                else if (/\b(crosses his arms|crosses her arms)\b/.test(surroundingLower)) event = 'Crossing arms';
                else if (/\b(leans forward)\b/.test(surroundingLower)) event = 'Leaning forward';
                else if (/\b(checks phone|looks at his phone)\b/.test(surroundingLower)) event = 'Checking phone';

                return { mood, reaction, event };
            },
            analyzeTextForSuggestions: (text, mode) => {
                const lowerText = text.toLowerCase();
                let suggestions = { selections: {}, sfx: "", bgm: "" };

                if (/\b(close up|face|eye|detail|macro)\b/.test(lowerText)) suggestions.selections.shotType = 'Close-Up (CU)';
                else if (/\b(wide|city|landscape|distance|far|horizon)\b/.test(lowerText)) suggestions.selections.shotType = 'Wide Shot (WS)';
                else if (/\b(sky|bird|drone|aerial|above)\b/.test(lowerText)) suggestions.selections.shotType = "Bird's Eye View";
                else if (/\b(shoulder|talking to)\b/.test(lowerText)) suggestions.selections.shotType = 'Over the Shoulder (OTS)';
                else if (/\b(eyes|point of view|looking through)\b/.test(lowerText)) suggestions.selections.shotType = 'Point of View (POV)';

                if (/\b(neon|cyberpunk|hacker|future|sci-fi|hologram)\b/.test(lowerText)) suggestions.selections.shotStyle = 'Cyberpunk';
                else if (/\b(detective|smoke|noir|1940|fedora|mystery)\b/.test(lowerText)) suggestions.selections.shotStyle = 'Film Noir';
                else if (/\b(anime|cartoon|manga|drawn)\b/.test(lowerText)) suggestions.selections.shotStyle = 'Anime / Cell Shaded';
                else if (/\b(90s|vintage|vhs|retro|camcorder)\b/.test(lowerText)) suggestions.selections.shotStyle = 'Vintage 90s';

                if (/\b(dark|shadow|night|dim|moody)\b/.test(lowerText)) suggestions.selections.lighting = 'Low Key (Dark/Moody)';
                else if (/\b(sun|day|bright|morning)\b/.test(lowerText)) suggestions.selections.lighting = 'Natural Daylight';
                else if (/\b(sunset|sunrise|golden)\b/.test(lowerText)) suggestions.selections.lighting = 'Golden Hour';
                else if (/\b(neon|led|club|cyber)\b/.test(lowerText)) suggestions.selections.lighting = 'Neon / Cyberpunk';

                if (/\b(drone|fly|aerial)\b/.test(lowerText)) suggestions.selections.camera = 'DJI Mavic 3 (Drone)';
                else if (/\b(vhs|90s|camcorder)\b/.test(lowerText)) suggestions.selections.camera = 'VHS Camcorder';
                else if (/\b(action|sports|gopro)\b/.test(lowerText)) suggestions.selections.camera = 'GoPro Hero 11';
                
                if (/\b(macro|bug|eye|detail)\b/.test(lowerText)) suggestions.selections.lens = '100mm Macro';
                else if (/\b(wide|city|landscape)\b/.test(lowerText)) suggestions.selections.lens = '14mm Ultra-Wide';
                else if (/\b(portrait|face|interview)\b/.test(lowerText)) suggestions.selections.lens = '85mm Portrait';

                if (/\b(high angle|looking down|from above)\b/.test(lowerText)) suggestions.selections.angle = 'High Angle';
                else if (/\b(low angle|looking up|from below)\b/.test(lowerText)) suggestions.selections.angle = 'Low Angle';

                if (mode === 'video') {
                    if (/\b(run|chase|follow|behind|walk)\b/.test(lowerText)) suggestions.selections.movement = 'Tracking / Follow';
                    else if (/\b(pan|look around)\b/.test(lowerText)) suggestions.selections.movement = 'Pan Right';
                    else if (/\b(zoom in|closer)\b/.test(lowerText)) suggestions.selections.movement = 'Zoom In';
                    else if (/\b(shake|tremble|handheld)\b/.test(lowerText)) suggestions.selections.movement = 'Handheld / Shaky';

                    if (/\b(slow|bullet time|dramatic)\b/.test(lowerText)) suggestions.selections.actionSpeed = 'Slow Motion';
                    else if (/\b(fast|speed|timelapse|rushing)\b/.test(lowerText)) suggestions.selections.actionSpeed = 'Time-Lapse';

                    const durationRegex = /\b(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds)\b/i;
                    const dMatch = lowerText.match(durationRegex);
                    if (dMatch) suggestions.selections.duration = `${parseFloat(dMatch[1]).toFixed(1)}s`;
                }

                return suggestions;
            },
            extractDialogue: (text, globalCharacters = []) => {
                let extractedDialogues = [];
                let cleanText = text;
                const foundCharacters = new Set();
                const allKnownCharNames = new Set(globalCharacters.map(c => c.name.toLowerCase()));

                const addCharacter = (name) => {
                    const trimmedName = name.trim();
                    if (trimmedName.length > 1 && /^[A-Z]/.test(trimmedName)) {
                        const capitalized = trimmedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
                        foundCharacters.add(capitalized);
                        return capitalized;
                    }
                    return name;
                };

                // Regex 1: Quoted dialogue (e.g., John says, "Hello.")
                const quotedRegex = /(?:@)?([A-Z][a-zA-Z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\s*(?:(?:[a-z]+\s+)?(says|yells|shouts|screams|whispers|laughs|cries|stammers|asks|replies|states|mutters|exclaims|tells|answers)\s*(?:,)?\s*|:\s*)(["'])(.*?)\3/gi;
                cleanText = cleanText.replace(quotedRegex, (fullMatch, character, verb, quoteChar, dialogueText) => {
                    const charName = addCharacter(character);
                    const context = LocalAIEngine.analyzeDialogueForContext(dialogueText, verb || '', fullMatch);
                    extractedDialogues.push({ character: charName, mood: context.mood, reaction: context.reaction, event: context.event, voiceStyle: '', text: dialogueText.trim() });
                    return ''; 
                });

                // Regex 2: Unquoted dialogue with colon (e.g., John: Hello.)
                const unquotedRegex = /(?:@)?([A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\s*:\s*([^"'\n]+?(?:[.!?]|$))/gi;
                cleanText = cleanText.replace(unquotedRegex, (fullMatch, character, dialogueText) => {
                    const trimmedChar = character.trim();
                    const isKnownCharacter = allKnownCharNames.has(trimmedChar.toLowerCase());
                    const hasAtSymbol = fullMatch.trim().startsWith('@');
                    const isProperNoun = /^[A-Z]/.test(trimmedChar);

                    if (isKnownCharacter || hasAtSymbol || isProperNoun) {
                        const charName = addCharacter(trimmedChar);
                        const context = LocalAIEngine.analyzeDialogueForContext(dialogueText, '', fullMatch);
                        extractedDialogues.push({ character: charName, mood: context.mood, reaction: context.reaction, event: context.event, voiceStyle: '', text: dialogueText.trim() });
                        return ''; 
                    }
                    return fullMatch; 
                });

                // Regex 3: Unquoted dialogue with action verb (e.g., John says hello.)
                const actionDialogueRegex = /(?:@)?([A-Z][a-zA-Z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\s+(says|tells|answers|asks|exclaims|whispers|shouts|mutters)\s+([^.!?\n]+(?:[.!?]|$))/gi;
                cleanText = cleanText.replace(actionDialogueRegex, (fullMatch, character, verb, dialogueText) => {
                    const charName = addCharacter(character);
                    const context = LocalAIEngine.analyzeDialogueForContext(dialogueText, verb, fullMatch);
                    extractedDialogues.push({ character: charName, mood: context.mood, reaction: context.reaction, event: context.event, voiceStyle: '', text: dialogueText.trim().replace(/[.!?]$/, '') });
                    return '';
                });

                // Regex 4: Character action detection (e.g., Lara is talking.)
                const characterActionRegex = /\b([A-Z][a-zA-Z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\b\s+(is|was|starts to|begins to)\s+(talking|walking|running|looking|sitting|standing|smiling|frowning|speaking|answering|telling)/gi;
                const matches = text.matchAll(characterActionRegex);
                for (const match of matches) {
                    addCharacter(match[1]);
                }

                cleanText = cleanText.replace(/\s{2,}/g, ' ').replace(/,\s*(?=[.,\s]|$)/g, '').replace(/^[.,\s]+|[.,\s]+$/g, '');
                
                const newCharacters = [...foundCharacters].filter(charName => 
                    !allKnownCharNames.has(charName.toLowerCase())
                );

                return { cleanText, dialogues: extractedDialogues, newCharacters };
            },
            splitTextIntoSequence: (text, mode, globalCharacters = []) => {
                let chunks = text.split(/(?<=[.?!])\s+|(?=\b(?:then|next|after that|panel|shot|suddenly)\b)/i).map(c => c.trim()).filter(c => c.length > 2);
                if (chunks.length === 0) chunks = ["Sequence continues..."];
                let defaultDuration = mode === 'video' && text.match(/(?:cut(?:ting)?\s+every|lasting for)\s*(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds)\b/i) ? `${parseFloat(text.match(/(?:cut(?:ting)?\s+every|lasting for)\s*(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds)\b/i)[1]).toFixed(1)}s` : "";
                
                const allNewCharacters = new Set();
                let currentKnownCharacters = [...globalCharacters];

                const shots = chunks.map((chunkText) => {
                    const { cleanText, dialogues, newCharacters } = LocalAIEngine.extractDialogue(chunkText, currentKnownCharacters);
                    
                    if (newCharacters && newCharacters.length > 0) {
                        newCharacters.forEach(charName => allNewCharacters.add(charName));
                        // Update known characters for the next chunk in the same run
                        const newCharObjects = newCharacters.map(name => ({name}));
                        currentKnownCharacters.push(...newCharObjects);
                    }

                    const suggestions = LocalAIEngine.analyzeTextForSuggestions(cleanText, mode);
                    return {
                        subject: cleanText.replace(/^(then|next|after that|panel|shot|suddenly)[,\s]*/i, ''),
                        selections: { ...suggestions.selections, duration: suggestions.selections.duration || defaultDuration || "" },
                        sfx: mode === 'video' ? (suggestions.sfx || "") : "",
                        bgm: mode === 'video' ? (suggestions.bgm || "") : "",
                        dialogues: mode === 'video' ? dialogues : [],
                        mode: mode
                    };
                });

                return { shots, newCharacters: Array.from(allNewCharacters) };
            },
            parseScreenplay: (text) => {
                const blocks = text.split(/\n\s*\n/);
                let shots = [];
                let currentSubject = "";
                let currentDialogues = [];

                const pushShot = () => {
                    if (currentSubject.trim() || currentDialogues.length > 0) {
                        shots.push({
                            subject: currentSubject.trim() || "[Character Dialogue / Interaction]",
                            selections: { shotType: "", shotStyle: "", camera: "", lens: "", angle: "", lighting: "", movement: "", actionSpeed: "", duration: "", transition: "", filmStock: "" },
                            sfx: "", bgm: "",
                            dialogues: [...currentDialogues],
                            mode: 'video', status: 'Planning', tags: [], referenceImages: [], customPromptOverride: null
                        });
                        currentSubject = "";
                        currentDialogues = [];
                    }
                };

                blocks.forEach(block => {
                    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                    if (lines.length === 0) return;
                    if (/^(INT\.|EXT\.|INT\/EXT)/i.test(lines[0])) { pushShot(); currentSubject = lines.join(' ') + ". "; return; }

                    const firstLine = lines[0];
                    const isLikelyCharacter = /^[^a-z]+$/.test(firstLine) && /[A-Z]/.test(firstLine) && firstLine.length < 50;

                    if (isLikelyCharacter && lines.length > 1) {
                        let charName = firstLine.replace(/\(.*\)/g, '').trim();
                        charName = charName.charAt(0) + charName.slice(1).toLowerCase();
                        let mood = 'Neutral'; let textLines = [];
                        for (let i = 1; i < lines.length; i++) {
                            if (lines[i].startsWith('(') && lines[i].endsWith(')')) mood = lines[i].replace(/[()]/g, '');
                            else textLines.push(lines[i]);
                        }
                        currentDialogues.push({ character: charName, text: textLines.join(' '), mood: mood.length > 15 ? 'Neutral' : mood.charAt(0).toUpperCase() + mood.slice(1), reaction: '', event: '', voiceStyle: '' });
                    } else {
                        if (currentSubject) pushShot();
                        currentSubject = lines.join(' ');
                    }
                });
                pushShot();
                return shots;
            },

            parseScriptToActs: (text) => {
                // Three-Act auto-generator - parses script to fill storyData acts
                const acts = {
                    act1: { character: '', world: '', incident: '' },
                    act2: { obstacles: '', midpoint: '', stakes: '' },
                    act3: { climax: '', resolution: '', aftermath: '' }
                };

                const lowerText = text.toLowerCase();
                const shots = LocalAIEngine.parseScreenplay(text);
                const act1End = Math.ceil(shots.length * 0.25);
                const act2End = Math.ceil(shots.length * 0.75);

                // Act 1: First quarter + setup keywords
                acts.act1.character = shots.slice(0, Math.min(3, shots.length)).map(s => s.subject).join('. ') || 'Protagonist introduced.';
                acts.act1.world = text.match(/(int|ext)\..*?(?=\n\n|$)/i)?.[0] || '';
                acts.act1.incident = shots[act1End - 1]?.subject || shots[shots.length * 0.2 | 0]?.subject || 'Inciting incident.';

                // Act 2: Middle half + conflict keywords
                const act2Shots = shots.slice(act1End, act2End);
                acts.act2.obstacles = act2Shots.filter(s => /fail|problem|obstacle|conflict/i.test(s.subject.toLowerCase())).map(s => s.subject).join('. ') || 'Rising action.';
                acts.act2.midpoint = act2Shots[Math.floor(act2Shots.length / 2)]?.subject?.substring(0, 150) || 'Midpoint reversal.';
                acts.act2.stakes = text.match(/if.*?(fail|lose|die|worse|consequence)/i)?.[0]?.substring(0, 150) || 'Stakes raised.';

                // Act 3: Final quarter + climax keywords
                const act3Shots = shots.slice(act2End);
                acts.act3.climax = act3Shots[0]?.subject || 'Final confrontation.';
                acts.act3.resolution = act3Shots.slice(1, -1).map(s => s.subject).join('. ') || 'Resolution.';
                acts.act3.aftermath = shots[shots.length - 1]?.subject || 'New status quo.';

                // Limit lengths
                Object.values(acts).forEach(act => {
                    Object.values(act).forEach((val, i) => act[Object.keys(act)[i]] = val.substring(0, 200));
                });

                return acts;
            }
        };

const JUNK_MARKS = /[`'"“”]{2,}|[=~*_#]{2,}|-{2,}|\*{2,}|={2,}|\.{2,}/g;

export const cleanPromptText = (value) => String(value || '')
    .replace(JUNK_MARKS, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:]){2,}/g, '$1')
    .replace(/^[\s,;:.-]+|[\s,;:-]+$/g, '')
    .trim();

const escapeName = (name) => String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const textMentions = (text, name) => {
    if (!name || !text) return false;
    return new RegExp(`(?:@)?\\b${escapeName(name)}\\b`, 'i').test(text);
};

const uniqueJoin = (items) => {
    const seen = [];
    items.map(cleanPromptText).filter(Boolean).forEach(item => {
        if (!seen.some(existing => existing.toLowerCase() === item.toLowerCase())) seen.push(item);
    });
    return seen;
};

const characterDetail = (char) => uniqueJoin([char?.role, char?.appearance]).join(', ');

const stripInlineDetails = (text) => cleanPromptText(
    String(text || '')
        .replace(/\[[^\]]*(?:Role|Location|Voice|Reaction|Event)[^\]]*\]/gi, ' ')
        .replace(/@/g, '')
);

const aspectLabel = (value) => cleanPromptText(String(value || '').replace(/--\s*ar/gi, '').replace(/^ar\s*/i, ''));

const dialogueLines = (dialArr, placement, voiceStyles = []) => (dialArr || [])
    .filter(line => (line?.placement || 'after') === placement)
    .map(line => {
        const who = cleanPromptText(line.character);
        const mood = cleanPromptText(line.mood);
        const spoken = cleanPromptText(line.text);
        const voice = cleanPromptText(line.voiceStyle);
        const voiceDetail = voice ? cleanPromptText((voiceStyles || []).find(item => item.name === line.voiceStyle)?.description) : '';
        if (!who && !spoken) return '';
        const speaker = [who, mood].filter(Boolean).join(', ');
        const heard = voice ? `${voice}${voiceDetail ? `, ${voiceDetail}` : ''}` : '';
        const body = [spoken, heard ? `voice ${heard}` : ''].filter(Boolean).join(', ');
        if (!body) return speaker;
        return speaker ? `${speaker}: ${body}` : body;
    })
    .filter(Boolean);

const cameraBitsFor = (sel, mode, platform, sfxStr, bgmStr, rules) => {
    const short = platform === 'Seedance';
    const bits = [];
    const push = (value) => {
        const clean = cleanPromptText(value);
        if (clean && !bits.some(bit => bit.toLowerCase() === clean.toLowerCase())) bits.push(clean);
    };
    push(sel.shotType);
    if (!short) {
        push(sel.shotStyle);
        push(sel.camera);
        push(sel.lens);
        push(sel.aperture);
        push(sel.angle);
    }
    push(sel.lighting);
    if (mode === 'video') {
        push(sel.movement);
        push(sel.actionSpeed);
        push(sel.duration);
        if (sel.transition && sel.transition !== 'None') push(sel.transition);
    }
    if (!short && sel.filmStock) push(String(sel.filmStock).split(',')[0]);
    if (mode === 'video') {
        const audio = [sfxStr, bgmStr].map(cleanPromptText).filter(Boolean);
        if (audio.length) push(`Audio ${audio.join(', ')}`);
    }
    const ruleText = uniqueJoin((rules || []).map(rule => typeof rule === 'string' ? rule : (rule?.text || rule?.name))).join('. ');
    if (ruleText) bits.push(ruleText);
    return bits;
};

export const generatePromptText = (subj, sel = {}, sfxStr, bgmStr, dialArr, mode = 'video', aiModel = 'Nano Banana 2', myStyle = null, globalCharacters = [], globalLocations = [], globalVoiceStyles = [], negPrompt = '', videoPlatform = 'Standard', extras = {}) => {
            const source = cleanPromptText(CorrectorEngine.correctText(subj || ''));
            const platform = videoPlatform === 'GPT V2' || aiModel === 'GPT V2' || aiModel === 'GPT 2.6' ? (videoPlatform === 'Seedance' ? 'Seedance' : videoPlatform) : videoPlatform;
            const rules = extras.directorRules || [];
            const compact = Boolean(extras.compact) || platform === 'Seedance';

            const usedChars = [];
            (globalCharacters || []).forEach(char => {
                if (!char?.name) return;
                const speaks = (dialArr || []).some(line => cleanPromptText(line?.character).toLowerCase() === char.name.toLowerCase());
                if (!textMentions(source, char.name) && !speaks) return;
                const detail = characterDetail(char);
                usedChars.push(detail ? `${cleanPromptText(char.name)}, ${detail}` : cleanPromptText(char.name));
            });
            (dialArr || []).forEach(line => {
                const name = cleanPromptText(line?.character);
                if (!name) return;
                if (!usedChars.some(item => item.toLowerCase() === name.toLowerCase() || item.toLowerCase().startsWith(name.toLowerCase() + ','))) usedChars.push(name);
            });

            const usedLocs = [];
            (globalLocations || []).forEach(loc => {
                if (!loc?.name || !textMentions(source, loc.name)) return;
                const detail = cleanPromptText(loc.description);
                usedLocs.push(detail ? `${cleanPromptText(loc.name)}, ${detail}` : cleanPromptText(loc.name));
            });

            let action = stripInlineDetails(source);
            uniqueJoin([...usedChars, ...usedLocs]).forEach(label => {
                const detail = label.split(',').slice(1).join(',').trim();
                if (detail.length > 2) action = action.replace(new RegExp(escapeName(detail), 'ig'), ' ');
            });
            action = cleanPromptText(action);
            if (myStyle?.customModifiers && aiModel === 'MY STYLE') {
                const extra = cleanPromptText(myStyle.customModifiers);
                if (extra && !action.toLowerCase().includes(extra.toLowerCase())) action = cleanPromptText(`${action} ${extra}`);
            }

            const before = dialogueLines(dialArr, 'before', globalVoiceStyles);
            const during = dialogueLines(dialArr, 'during', globalVoiceStyles);
            const after = dialogueLines(dialArr, 'after', globalVoiceStyles);
            const camera = cameraBitsFor(sel, mode, compact ? 'Seedance' : platform, sfxStr, bgmStr, rules);
            const frame = aspectLabel(sel.aspectRatio);
            const avoid = cleanPromptText(negPrompt);

            const layers = [];
            const characters = uniqueJoin(usedChars);
            const locations = uniqueJoin(usedLocs);
            if (characters.length) layers.push(`Characters: ${characters.join('. ')}`);
            if (locations.length) layers.push(`Location: ${locations.join('. ')}`);
            if (before.length) layers.push(`Dialogue: ${before.join('. ')}`);
            if (action) layers.push(`Action: ${action}`);
            if (during.length) layers.push(`Dialogue: ${during.join('. ')}`);
            if (after.length) layers.push(`Dialogue: ${after.join('. ')}`);
            if (camera.length) layers.push(`Camera: ${camera.join(', ')}`);
            if (frame) layers.push(`Frame: ${frame}`);
            if (avoid) layers.push(`Avoid: ${avoid}`);
            return layers.join('\n\n');
        };

export const generateChainDeltaPrompt = (subject, sel = {}, sfx, bgm, dialogues, mode, chainBase = {}, videoPlatform, negPrompt) => {
            const action = cleanPromptText(subject);
            const camera = [];
            const pushIfChanged = (value, base) => {
                const clean = cleanPromptText(value);
                if (clean && clean.toLowerCase() !== cleanPromptText(base).toLowerCase()) camera.push(clean);
            };
            pushIfChanged(sel.shotType, '');
            pushIfChanged(sel.camera, chainBase.camera);
            pushIfChanged(sel.lens, chainBase.lens);
            pushIfChanged(sel.lighting, chainBase.lighting);
            pushIfChanged(sel.angle, chainBase.angle);
            if (mode === 'video') {
                pushIfChanged(sel.movement, chainBase.movement);
                pushIfChanged(sel.actionSpeed, chainBase.actionSpeed);
                pushIfChanged(sel.duration, chainBase.duration);
                if (sel.transition && sel.transition !== 'None') pushIfChanged(sel.transition, chainBase.transition);
            }
            const spoken = dialogueLines(dialogues, 'before').concat(dialogueLines(dialogues, 'during'), dialogueLines(dialogues, 'after'));
            const layers = [];
            if (action) layers.push(`Action: ${action}`);
            if (spoken.length) layers.push(`Dialogue: ${spoken.join('. ')}`);
            if (camera.length) layers.push(`Camera: ${camera.join(', ')}`);
            const avoid = cleanPromptText(negPrompt);
            if (avoid) layers.push(`Avoid: ${avoid}`);
            return layers.join('\n\n');
        };

export const shotifyPrompt = (subject, sel, sfx, bgm, dialogues, mode, platform, negPrompt, extras = {}) => {
            return generatePromptText(subject, sel, sfx, bgm, dialogues, mode, platform, null, extras.globalCharacters || [], extras.globalLocations || [], extras.globalVoiceStyles || [], negPrompt, platform, { ...extras, compact: true });
        };

export const magicEnhanceSubject = (subject, { platform = 'Standard', model = '' } = {}) => {
            const cleaned = cleanPromptText(subject);
            const words = cleaned.split(/\s+/).filter(Boolean);
            const alreadySpecific = words.length >= 18;
            if (!cleaned) return { text: '', changed: false, skipped: true };
            if (alreadySpecific) return { text: cleaned, changed: cleaned !== String(subject || '').trim(), skipped: true };
            const seedance = platform === 'Seedance';
            const gpt = model === 'GPT 2.6' || model === 'GPT V2';
            let text = cleaned;
            if (seedance && !/\b(walks|turns|looks|runs|stands|sits|opens|holds|steps|reaches)\b/i.test(text)) {
                text = `${text}, one clear physical action`;
            } else if (gpt && !/\b(light|shadow|frame)\b/i.test(text)) {
                text = `${text}, soft cinematic light in a steady frame`;
            } else if (!seedance && words.length < 12 && !/\b(light|frame|motion)\b/i.test(text)) {
                text = `${text}, natural light and one continuous motion`;
            }
            text = cleanPromptText(text);
            return { text, changed: text !== String(subject || '').trim(), skipped: false };
        };


