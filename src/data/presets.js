// ── DIRECTOR STYLE PRESETS (Feature #4) ─────────────────────────────
        export const DIRECTOR_STYLES = {
            'kubrick': { camera: 'ARRI Alexa 65', lens: '14mm Ultra-Wide', angle: 'Eye Level', lighting: 'High Key (Bright)', movement: 'Dolly In', shotStyle: 'Cinematic', shotType: 'Wide Shot (WS)', filmStock: 'ARRI LogC', label: 'Stanley Kubrick', signature: 'Perfect symmetry, cold clinical framing, slow dolly, wide angle distortion.' },
            'nolan': { camera: 'IMAX 70mm', lens: '24mm Wide', angle: 'Low Angle', lighting: 'Natural Daylight', movement: 'Handheld / Shaky', shotStyle: 'Cinematic', shotType: 'Wide Shot (WS)', filmStock: 'Kodak Vision3 500T', label: 'Christopher Nolan', signature: 'IMAX scale, practical lighting, non-linear tension, epic scope.' },
            'wong kar-wai': { camera: 'Vintage 35mm Film', lens: '35mm Standard', angle: 'Dutch Angle / Canted', lighting: 'Neon / Cyberpunk', movement: 'Handheld / Shaky', shotStyle: 'Candid / Street', shotType: 'Close-Up (CU)', filmStock: 'Fujifilm CineStill 800T', label: 'Wong Kar-wai', signature: 'Neon-soaked intimacy, blurred motion, emotional close-ups, urban loneliness.' },
            'fincher': { camera: 'RED V-Raptor', lens: '50mm Prime', angle: 'High Angle', lighting: 'Low Key (Dark/Moody)', movement: 'Dolly In', shotStyle: 'Film Noir', shotType: 'Medium Shot (MS)', filmStock: 'ARRI LogC', label: 'David Fincher', signature: 'Dark, precise, controlled. Every frame is a trap. Cold color grade, obsessive detail.' },
            'villeneuve': { camera: 'IMAX 70mm', lens: '14mm Ultra-Wide', angle: "Bird's Eye View", lighting: 'Volumetric Lighting (God Rays)', movement: 'Drone Fly-Through', shotStyle: 'Sci-Fi Epic', shotType: 'Extreme Wide Shot (EWS)', filmStock: 'Kodak Vision3 500T', label: 'Denis Villeneuve', signature: 'Vast scale, silence as tension, god-ray atmospherics, awe-inspiring wide shots.' },
            'tarantino': { camera: 'Vintage 35mm Film', lens: '35mm Standard', angle: "Worm's Eye View", lighting: 'Natural Daylight', movement: 'Static / Tripod', shotStyle: 'Vintage 90s', shotType: 'Close-Up (CU)', filmStock: 'Kodak Portra 400', label: 'Quentin Tarantino', signature: 'Trunk shots, extreme close-ups, static wide masters, pop culture energy.' },
            'spielberg': { camera: 'ARRI Alexa 65', lens: '85mm Portrait', angle: 'Low Angle', lighting: 'Golden Hour', movement: 'Dolly In', shotStyle: 'Cinematic', shotType: 'Medium Shot (MS)', filmStock: 'Kodak Portra 400', label: 'Steven Spielberg', signature: 'Warm golden light, emotional dolly-ins, low angles for wonder, heart-first storytelling.' },
            'lynch': { camera: 'Vintage 35mm Film', lens: '35mm Standard', angle: 'Dutch Angle / Canted', lighting: 'Low Key (Dark/Moody)', movement: 'Dolly In', shotStyle: 'Surreal', shotType: 'Close-Up (CU)', filmStock: 'Ilford HP5', label: 'David Lynch', signature: 'Dreamlike dread, industrial sound design, red curtains, surreal mundane horror.' },
            'scorsese': { camera: 'Vintage 35mm Film', lens: '24mm Wide', angle: 'Low Angle', lighting: 'Neon / Cyberpunk', movement: 'Tracking / Follow', shotStyle: 'Candid / Street', shotType: 'Wide Shot (WS)', filmStock: 'Kodak Vision3 500T', label: 'Martin Scorsese', signature: 'Kinetic tracking shots, freeze frames, rock soundtrack energy, street-level grit.' },
            'wes anderson': { camera: 'Canon EOS R5', lens: '50mm Prime', angle: 'Eye Level', lighting: 'High Key (Bright)', movement: 'Pan Left', shotStyle: 'Cinematic', shotType: 'Wide Shot (WS)', filmStock: 'Agfa Technicolor', label: 'Wes Anderson', signature: 'Perfect symmetry, pastel palette, deadpan humor, flat 2D compositions.' },
            'james cameron': { camera: 'IMAX 70mm', lens: '24mm Wide', angle: 'Low Angle', lighting: 'Volumetric Lighting (God Rays)', movement: 'Tracking / Follow', shotStyle: 'Sci-Fi Epic', shotType: 'Wide Shot (WS)', filmStock: 'ARRI LogC', label: 'James Cameron', signature: 'Epic world-building, underwater grandeur, motion-control precision, emotional spectacle at maximum scale.' },
            'ryan coogler': { camera: 'ARRI Alexa 65', lens: '35mm Standard', angle: 'Eye Level', lighting: 'Natural Daylight', movement: 'Tracking / Follow', shotStyle: 'Cinematic', shotType: 'Medium Shot (MS)', filmStock: 'Kodak Vision3 500T', label: 'Ryan Coogler', signature: 'Long one-take action sequences, intimate close-ups, practical lighting, cultural richness, humanity inside spectacle.' },
            'zack snyder': { camera: 'RED V-Raptor', lens: '14mm Ultra-Wide', angle: 'Low Angle', lighting: 'Low Key (Dark/Moody)', movement: 'Speed Ramp', shotStyle: 'Cinematic', shotType: 'Wide Shot (WS)', filmStock: 'ARRI LogC', actionSpeed: 'Ultra Slow Motion', label: 'Zack Snyder', signature: 'Ramping slow-motion, desaturated dark palette, graphic novel framing, operatic scale, mythic hero poses.' },
            'charles emilson': { camera: 'GoPro Hero 11', lens: '14mm Ultra-Wide', angle: 'Low Angle', lighting: 'Low Key (Dark/Moody)', movement: 'Handheld / Shaky', shotStyle: 'Cinematic', shotType: 'Medium Shot (MS)', filmStock: 'Ilford HP5', actionSpeed: 'Speed Ramp', label: 'Charles Emilson', signature: 'Raw shaky energy, desaturated horror-action aesthetic, dynamic handheld movement, soft dark light, visceral street-level intensity.' },
        };

// ── MOOD → SHOT TRANSLATOR (Feature #5) ─────────────────────────────
        export const MOOD_PRESETS = {
            'lonely': { lighting: 'Blue Hour', movement: 'Static / Tripod', shotType: 'Wide Shot (WS)', angle: 'High Angle', shotStyle: 'Cinematic', filmStock: 'Ilford HP5', sfx: 'distant wind, silence', bgm: 'sparse piano, ambient drone', desc: 'Isolation. Small figure in a vast, cold world.' },
            'epic': { lighting: 'Golden Hour', movement: 'Drone Fly-Through', shotType: 'Extreme Wide Shot (EWS)', angle: "Bird's Eye View", shotStyle: 'Sci-Fi Epic', filmStock: 'Kodak Vision3 500T', sfx: 'thunderous ambience, crowd roar', bgm: 'epic orchestral swell, Hans Zimmer style', desc: 'Scale and grandeur. The world holds its breath.' },
            'paranoid': { lighting: 'Low Key (Dark/Moody)', movement: 'Handheld / Shaky', shotType: 'Close-Up (CU)', angle: 'Dutch Angle / Canted', shotStyle: 'Film Noir', filmStock: 'Fujifilm CineStill 800T', sfx: 'heartbeat, distant footsteps', bgm: 'tense strings, dissonant tones', desc: 'Nothing is safe. The camera itself feels unstable.' },
            'romantic': { lighting: 'Golden Hour', movement: 'Dolly In', shotType: 'Medium Shot (MS)', angle: 'Eye Level', shotStyle: 'Cinematic', filmStock: 'Kodak Portra 400', sfx: 'soft breeze, distant city hum', bgm: 'gentle strings, soft piano', desc: 'Warmth and closeness. Time slows down.' },
            'tense': { lighting: 'Harsh Shadows', movement: 'Dolly In', shotType: 'Extreme Close-Up (ECU)', angle: 'Low Angle', shotStyle: 'Film Noir', filmStock: 'Ilford HP5', sfx: 'silence, clock ticking', bgm: 'low drone, rising tension', desc: 'Every second matters. Sweat on the brow.' },
            'dreamy': { lighting: 'Volumetric Lighting (God Rays)', movement: 'Orbit', shotType: 'Medium Shot (MS)', angle: 'Eye Level', shotStyle: 'Surreal', filmStock: 'Kodak Ektachrome', sfx: 'soft wind chimes, ethereal hum', bgm: 'ambient synth, floating pads', desc: 'Reality dissolves. Everything glows.' },
            'action': { lighting: 'Natural Daylight', movement: 'Handheld / Shaky', shotType: 'Wide Shot (WS)', angle: 'Low Angle', shotStyle: 'Cinematic', filmStock: 'Kodak Vision3 500T', sfx: 'impacts, debris, rapid footsteps', bgm: 'percussive action score, fast tempo', desc: 'Pure kinetic energy. No time to think.' },
            'melancholic': { lighting: 'Blue Hour', movement: 'Dolly Out', shotType: 'Medium Shot (MS)', angle: 'Eye Level', shotStyle: 'Documentary', filmStock: 'Kodak Portra 400', sfx: 'rain, distant traffic', bgm: 'slow cello, minor key', desc: 'Something beautiful is ending.' },
            'mysterious': { lighting: 'Low Key (Dark/Moody)', movement: 'Tracking / Follow', shotType: 'Over the Shoulder (OTS)', angle: 'High Angle', shotStyle: 'Film Noir', filmStock: 'Fujifilm CineStill 800T', sfx: 'creaking, distant whispers', bgm: 'sparse jazz, minor chords', desc: 'Something is hidden. The answer is just out of frame.' },
            'hopeful': { lighting: 'Golden Hour', movement: 'Tilt Up', shotType: 'Wide Shot (WS)', angle: 'Low Angle', shotStyle: 'Cinematic', filmStock: 'Kodak Portra 400', sfx: 'birds, gentle wind', bgm: 'uplifting strings, building crescendo', desc: 'After the storm. Light returns.' },
            'cyberpunk': { lighting: 'Neon / Cyberpunk', movement: 'Tracking / Follow', shotType: 'Wide Shot (WS)', angle: 'Low Angle', shotStyle: 'Cyberpunk', filmStock: 'Fujifilm CineStill 800T', sfx: 'rain on neon streets, distant sirens', bgm: 'synthwave, dark electronic', desc: 'Rain-slicked streets. Neon reflections. The future is now.' },
            'horror': { lighting: 'Low Key (Dark/Moody)', movement: 'Dolly In', shotType: 'Close-Up (CU)', angle: 'Dutch Angle / Canted', shotStyle: 'Cinematic', filmStock: 'Ilford HP5', sfx: 'silence, sudden sharp sound', bgm: 'dissonant strings, jump scare sting', desc: 'Something is wrong. You can feel it.' },
        };

// ── FAMOUS SHOTS DATABASE (Feature #8) ──────────────────────────────
        export const FAMOUS_SHOTS = [
            { title: 'Blade Runner 2049 — Opening Wasteland', film: 'Blade Runner 2049 (2017)', subject: 'Vast orange wasteland stretching to the horizon, a lone figure walking through endless rows of solar panels', selections: { shotType: 'Extreme Wide Shot (EWS)', shotStyle: 'Sci-Fi Epic', camera: 'ARRI Alexa 65', lens: '14mm Ultra-Wide', angle: "Bird's Eye View", lighting: 'Golden Hour', movement: 'Drone Fly-Through', actionSpeed: 'Slow Motion', duration: '5.0s', transition: 'Cross Dissolve', filmStock: 'ARRI LogC', aspectRatio: '--ar 2.39:1' }, sfx: 'wind, distant hum', bgm: 'Hans Zimmer ambient drone' },
            { title: '2001: A Space Odyssey — Star Gate', film: '2001: A Space Odyssey (1968)', subject: 'Abstract tunnel of light and color, infinite geometric patterns rushing past the camera at impossible speed', selections: { shotType: 'Point of View (POV)', shotStyle: 'Surreal', camera: 'IMAX 70mm', lens: '8mm Fisheye', angle: 'Eye Level', lighting: 'Volumetric Lighting (God Rays)', movement: 'Dolly In', actionSpeed: 'Speed Ramp', duration: '5.0s', transition: 'Fade to White', filmStock: 'Agfa Technicolor', aspectRatio: '--ar 2.39:1' }, sfx: 'cosmic hum, silence', bgm: 'György Ligeti orchestral' },
            { title: 'The Godfather — Baptism Sequence', film: 'The Godfather (1972)', subject: 'A priest performing a baptism ceremony, intercut with men being executed across the city, cold and methodical', selections: { shotType: 'Close-Up (CU)', shotStyle: 'Film Noir', camera: 'Vintage 35mm Film', lens: '50mm Prime', angle: 'Eye Level', lighting: 'Low Key (Dark/Moody)', movement: 'Static / Tripod', actionSpeed: 'Normal Speed', duration: '3.0s', transition: 'Match Cut', filmStock: 'Kodak Vision3 500T', aspectRatio: '--ar 1.85:1' }, sfx: 'church organ, gunshots', bgm: 'Nino Rota orchestral' },
            { title: 'Mad Max: Fury Road — War Rig Chase', film: 'Mad Max: Fury Road (2015)', subject: 'Massive war rig truck racing through a post-apocalyptic desert canyon, surrounded by flaming vehicles and war boys', selections: { shotType: 'Wide Shot (WS)', shotStyle: 'Cinematic', camera: 'RED V-Raptor', lens: '24mm Wide', angle: 'Low Angle', lighting: 'Harsh Shadows', movement: 'Tracking / Follow', actionSpeed: 'Speed Ramp', duration: '4.0s', transition: 'Hard Cut', filmStock: 'Kodak Vision3 500T', aspectRatio: '--ar 2.39:1' }, sfx: 'engine roar, explosions, metal crashing', bgm: 'Junkie XL percussion score' },
            { title: 'Amélie — Montmartre Morning', film: 'Amélie (2001)', subject: 'A whimsical young woman walking through the colorful streets of Montmartre at dawn, noticing small beautiful details', selections: { shotType: 'Medium Shot (MS)', shotStyle: 'Cinematic', camera: 'Vintage 35mm Film', lens: '35mm Standard', angle: 'Eye Level', lighting: 'Golden Hour', movement: 'Tracking / Follow', actionSpeed: 'Normal Speed', duration: '3.0s', transition: 'Cross Dissolve', filmStock: 'Agfa Technicolor', aspectRatio: '--ar 1.85:1' }, sfx: 'Paris street ambience, accordion', bgm: 'Yann Tiersen piano waltz' },
            { title: 'No Country for Old Men — Coin Toss', film: 'No Country for Old Men (2007)', subject: 'A menacing man in a gas station staring down a terrified cashier, a coin on the counter between them, silence', selections: { shotType: 'Close-Up (CU)', shotStyle: 'Film Noir', camera: 'Vintage 35mm Film', lens: '85mm Portrait', angle: 'Eye Level', lighting: 'Natural Daylight', movement: 'Static / Tripod', actionSpeed: 'Normal Speed', duration: '4.0s', transition: 'Hard Cut', filmStock: 'Kodak Portra 400', aspectRatio: '--ar 1.85:1' }, sfx: 'fluorescent hum, silence', bgm: 'none' },
            { title: 'Interstellar — Docking Scene', film: 'Interstellar (2014)', subject: 'A damaged spacecraft spinning out of control in orbit, another ship attempting a desperate docking maneuver', selections: { shotType: 'Wide Shot (WS)', shotStyle: 'Sci-Fi Epic', camera: 'IMAX 70mm', lens: '24mm Wide', angle: 'Eye Level', lighting: 'Natural Daylight', movement: 'Orbit', actionSpeed: 'Speed Ramp', duration: '5.0s', transition: 'Hard Cut', filmStock: 'ARRI LogC', aspectRatio: '--ar 2.39:1' }, sfx: 'silence of space, metal stress', bgm: 'Hans Zimmer organ crescendo' },
            { title: 'Parasite — The Basement Reveal', film: 'Parasite (2019)', subject: 'A hidden staircase descending into a secret underground bunker beneath a wealthy family home, fluorescent light flickering', selections: { shotType: 'Wide Shot (WS)', shotStyle: 'Cinematic', camera: 'ARRI Alexa 65', lens: '24mm Wide', angle: 'High Angle', lighting: 'Low Key (Dark/Moody)', movement: 'Tilt Down', actionSpeed: 'Normal Speed', duration: '3.5s', transition: 'Hard Cut', filmStock: 'ARRI LogC', aspectRatio: '--ar 2.39:1' }, sfx: 'fluorescent buzz, footsteps on concrete', bgm: 'tense minimal score' },
        ];

export const DEFAULT_LOCATIONS = [
            { id: 'loc_1', name: 'Cyberpunk Alley', description: 'Neon-drenched narrow street, rain-slicked pavement, holographic signs, steam venting from grates' },
            { id: 'loc_2', name: 'Abandoned Warehouse', description: 'Dark, empty industrial space, broken windows, shafts of dusty light, concrete floor' },
        ];

export const DEFAULT_MYSTYLE_PRESETS = [
            {
                id: 'ms_preset_1',
                name: 'Gritty Hyperreal Pop',
                template: "Photographic shot of {subject}. {shotType}, {angle}, {shotStyle}. Equipment: {camera} with {lens}. Lighting setup: {lighting}. Camera motion: {movement}. Audio: {sfx} {bgm}",
                customModifiers: "STYLE: Gritty Cine Verité, 35mm handheld, natural shake. LIGHTING: Bright, high-altitude sun, pure blue sky. QUALITY: 8K photorealistic, correct physics, fabric motion blur, no artifacts.",
                strictDefaults: { shotStyle: "", camera: "", lens: "", angle: "", lighting: "", movement: "" }
            },
            {
                id: 'ms_preset_2',
                name: 'Ultra 8K Flawless Studio',
                template: "Photographic shot of {subject}. {shotType}, {angle}, {shotStyle}. Equipment: {camera} with {lens}. Lighting setup: {lighting}. Camera motion: {movement}. Audio: {sfx} {bgm}",
                customModifiers: "ULTRA HIGH QUALITY 8K output, extremely sharp focus, no noise, no grain artifacts, perfect facial structure, clean edges, cinematic realism.",
                strictDefaults: { shotStyle: "", camera: "", lens: "", angle: "", lighting: "", movement: "" }
            }
        ];

export const DEFAULT_SHORTCUTS = {
            saveProject: { keys: 'ctrl+s', label: 'Save Project' },
            clearForm: { keys: 'alt+n', label: 'Clear Form / New Shot' },
            duplicateShot: { keys: 'ctrl+d', label: 'Duplicate Shot' },
            undo: { keys: 'ctrl+z', label: 'Undo' },
            redo: { keys: 'ctrl+y', label: 'Redo' },
            togglePlayback: { keys: 'space', label: 'Toggle Playback' },
            addShot: { keys: 'ctrl+enter', label: 'Add/Update Shot' },
            nextScene: { keys: 'alt+arrowright', label: 'Next Scene' },
            prevScene: { keys: 'alt+arrowleft', label: 'Previous Scene' }
        };

// ── SHOTIFY ENGINE ─────────────────────────────────────────────────────        // Compresses and optimizes prompts for specific AI platforms
        // Never touches the user's subject text — only trims verbose parameter sentences
        export const PLATFORM_PROMPT_PROFILES = {
            'Runway': {
                maxTokens: 300,
                style: 'bracketed',   // [Camera: X] [Lighting: Y]
                keepFields: ['shotType','camera','lighting','movement','actionSpeed','duration'],
                dropFields: ['filmStock','aperture','dofStr'],
                sentenceStyle: 'compact'
            },
            'Veo 3': {
                maxTokens: 400,
                style: 'natural',     // natural flowing sentences
                keepFields: ['shotType','shotStyle','camera','lens','angle','lighting','movement','actionSpeed','duration','transition'],
                dropFields: ['filmStock'],
                sentenceStyle: 'cinematic'
            },
            'KLING AI': {
                maxTokens: 350,
                style: 'natural',
                keepFields: ['shotType','shotStyle','camera','lens','lighting','movement','actionSpeed','duration'],
                dropFields: ['aperture','filmStock','transition'],
                sentenceStyle: 'compact'
            },
            'Seedance': {
                maxTokens: 200,
                style: 'minimal',     // ultra-short, no verbose sentences
                keepFields: ['shotType','lighting','movement','actionSpeed'],
                dropFields: ['camera','lens','aperture','filmStock','angle','transition'],
                sentenceStyle: 'minimal'
            },
            'Standard': {
                maxTokens: 500,
                style: 'natural',
                keepFields: ['shotType','shotStyle','camera','lens','aperture','angle','lighting','movement','actionSpeed','duration','transition','filmStock'],
                dropFields: [],
                sentenceStyle: 'full'
            }
        };

export const labelTooltips = {
            shotTypes: "Defines the framing and subject size (e.g., Close-Up, Wide Shot).",
            shotStyles: "The overall visual aesthetic or medium.",
            cameraTypes: "Specific camera body or sensor type to emulate.",
            lenses: "Focal length and lens characteristics.",
            angles: "The camera's position relative to the subject.",
            lighting: "The primary light source and mood.",
            movements: "How the camera moves through space.",
            actionSpeeds: "The playback speed of the footage.",
            durations: "Estimated length of the shot.",
            transitions: "How this shot connects to the next one.",
            filmStocks: "Specific analog film stock emulsion to emulate.",
            apertures: "F-stop defining the depth of field and background blur."
        };

// ── CHAIN MODE SCENE PRESETS (27) ──────────────────────────────────────
        export const CHAIN_SCENE_PRESETS = [
            // ── DIALOGUE & DRAMA ──
            { id:'golden_dialogue', group:'Dialogue & Drama', name:'Golden Hour Dialogue', tag:'Warm · Intimate', color:'#f59e0b',
              p:{ camera:'ARRI Alexa 65', lens:'85mm Portrait', lighting:'Golden Hour', shotStyle:'Cinematic', angle:'Eye Level', movement:'Static / Tripod', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut', filmStock:'Kodak Portra 400' }},
            { id:'noir_interrogation', group:'Dialogue & Drama', name:'Noir Interrogation', tag:'Dark · Tense', color:'#6b7280',
              p:{ camera:'ARRI Alexa 65', lens:'35mm Standard', lighting:'Low Key (Dark/Moody)', shotStyle:'Film Noir', angle:'Eye Level', movement:'Static / Tripod', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut', filmStock:'Ilford HP5' }},
            { id:'boardroom', group:'Dialogue & Drama', name:'Boardroom Tension', tag:'Cold · Corporate', color:'#3b82f6',
              p:{ camera:'Sony A7S III', lens:'50mm Prime', lighting:'High Key (Bright)', shotStyle:'Photorealistic', angle:'Eye Level', movement:'Static / Tripod', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut' }},
            { id:'romantic', group:'Dialogue & Drama', name:'Romantic Encounter', tag:'Soft · Dreamy', color:'#ec4899',
              p:{ camera:'Canon EOS R5', lens:'85mm Portrait', lighting:'Golden Hour', shotStyle:'Cinematic', angle:'Eye Level', movement:'Dolly In', actionSpeed:'Slow Motion', duration:'5.0s', transition:'Cross Dissolve', filmStock:'Kodak Portra 400' }},
            { id:'family_drama', group:'Dialogue & Drama', name:'Family Drama', tag:'Natural · Raw', color:'#22c55e',
              p:{ camera:'Sony A7S III', lens:'35mm Standard', lighting:'Natural Daylight', shotStyle:'Documentary', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut' }},
            { id:'courtroom', group:'Dialogue & Drama', name:'Courtroom Confrontation', tag:'High Contrast · Static', color:'#8b5cf6',
              p:{ camera:'ARRI Alexa 65', lens:'50mm Prime', lighting:'High Key (Bright)', shotStyle:'Cinematic', angle:'Low Angle', movement:'Static / Tripod', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut' }},
            // ── ACTION & THRILLER ──
            { id:'street_chase', group:'Action & Thriller', name:'Street Chase', tag:'Fast · Kinetic', color:'#ef4444',
              p:{ camera:'GoPro Hero 11', lens:'14mm Ultra-Wide', lighting:'Neon / Cyberpunk', shotStyle:'Cyberpunk', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'Speed Ramp', duration:'3.0s', transition:'Whip Pan' }},
            { id:'gunfight', group:'Action & Thriller', name:'Gunfight Standoff', tag:'Slow-Mo · Intense', color:'#dc2626',
              p:{ camera:'RED V-Raptor', lens:'35mm Standard', lighting:'Cinematic Rim Lighting', shotStyle:'Cinematic', angle:'Low Angle', movement:'Static / Tripod', actionSpeed:'Slow Motion', duration:'4.0s', transition:'Smash Cut' }},
            { id:'car_pursuit', group:'Action & Thriller', name:'Car Pursuit', tag:'Speed · Aerial', color:'#f97316',
              p:{ camera:'DJI Mavic 3 (Drone)', lens:'24mm Wide', lighting:'Golden Hour', shotStyle:'Cinematic', angle:'Bird\'s Eye View', movement:'Tracking / Follow', actionSpeed:'Speed Ramp', duration:'5.0s', transition:'Hard Cut' }},
            { id:'heist', group:'Action & Thriller', name:'Heist Infiltration', tag:'Stealth · Blue', color:'#0ea5e9',
              p:{ camera:'Sony A7S III', lens:'24mm Wide', lighting:'Blue Hour', shotStyle:'Cinematic', angle:'Eye Level', movement:'Dolly In', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut', filmStock:'Fujifilm CineStill 800T' }},
            { id:'rooftop', group:'Action & Thriller', name:'Rooftop Showdown', tag:'Epic · Dusk', color:'#f59e0b',
              p:{ camera:'ARRI Alexa 65', lens:'24mm Wide', lighting:'Cinematic Rim Lighting', shotStyle:'Cinematic', angle:'Low Angle', movement:'Crane Shot', actionSpeed:'Slow Motion', duration:'6.0s', transition:'Hard Cut' }},
            { id:'escape', group:'Action & Thriller', name:'Escape Sequence', tag:'POV · Urgent', color:'#ef4444',
              p:{ camera:'GoPro Hero 11', lens:'8mm Fisheye', lighting:'Harsh Shadows', shotStyle:'Documentary', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'2x Fast Forward', duration:'3.0s', transition:'Smash Cut' }},
            // ── SCI-FI & FANTASY ──
            { id:'deep_space', group:'Sci-Fi & Fantasy', name:'Deep Space', tag:'Vast · Cold', color:'#6366f1',
              p:{ camera:'IMAX 70mm', lens:'14mm Ultra-Wide', lighting:'Volumetric Lighting (God Rays)', shotStyle:'Sci-Fi Epic', angle:'Eye Level', movement:'Static / Tripod', actionSpeed:'Slow Motion', duration:'8.0s', transition:'Cross Dissolve' }},
            { id:'cyberpunk', group:'Sci-Fi & Fantasy', name:'Cyberpunk Street', tag:'Neon · Rain', color:'#a855f7',
              p:{ camera:'ARRI Alexa 65', lens:'24mm Wide', lighting:'Neon / Cyberpunk', shotStyle:'Cyberpunk', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut', filmStock:'Fujifilm CineStill 800T' }},
            { id:'fantasy_epic', group:'Sci-Fi & Fantasy', name:'Fantasy Epic', tag:'Grand · Mythic', color:'#d97706',
              p:{ camera:'IMAX 70mm', lens:'14mm Ultra-Wide', lighting:'Golden Hour', shotStyle:'Fantasy', angle:'Low Angle', movement:'Crane Shot', actionSpeed:'Slow Motion', duration:'8.0s', transition:'Cross Dissolve' }},
            { id:'alien', group:'Sci-Fi & Fantasy', name:'Alien Encounter', tag:'Eerie · Volumetric', color:'#10b981',
              p:{ camera:'ARRI Alexa 65', lens:'35mm Standard', lighting:'Volumetric Lighting (God Rays)', shotStyle:'Sci-Fi Epic', angle:'Low Angle', movement:'Dolly In', actionSpeed:'Slow Motion', duration:'6.0s', transition:'Cross Dissolve' }},
            { id:'time_portal', group:'Sci-Fi & Fantasy', name:'Time Portal', tag:'Surreal · Morph', color:'#8b5cf6',
              p:{ camera:'ARRI Alexa 65', lens:'14mm Ultra-Wide', lighting:'Volumetric Lighting (God Rays)', shotStyle:'Surreal', angle:'Dutch Angle / Canted', movement:'Orbit', actionSpeed:'Slow Motion', duration:'6.0s', transition:'Morph' }},
            // ── HORROR & SUSPENSE ──
            { id:'haunted', group:'Horror & Suspense', name:'Haunted Interior', tag:'Dread · Dutch', color:'#374151',
              p:{ camera:'Vintage 35mm Film', lens:'35mm Standard', lighting:'Low Key (Dark/Moody)', shotStyle:'Film Noir', angle:'Dutch Angle / Canted', movement:'Handheld / Shaky', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut', filmStock:'Ilford HP5' }},
            { id:'jump_scare', group:'Horror & Suspense', name:'Jump Scare Setup', tag:'Static · ECU', color:'#dc2626',
              p:{ camera:'Sony A7S III', lens:'50mm Prime', lighting:'Harsh Shadows', shotStyle:'Film Noir', angle:'Eye Level', movement:'Static / Tripod', actionSpeed:'Normal Speed', duration:'4.0s', transition:'Smash Cut' }},
            { id:'psych_dread', group:'Horror & Suspense', name:'Psychological Dread', tag:'Slow · Creeping', color:'#4b5563',
              p:{ camera:'ARRI Alexa 65', lens:'35mm Standard', lighting:'Low Key (Dark/Moody)', shotStyle:'Surreal', angle:'Eye Level', movement:'Dolly In', actionSpeed:'Slow Motion', duration:'7.0s', transition:'Cross Dissolve' }},
            { id:'found_footage', group:'Horror & Suspense', name:'Found Footage', tag:'VHS · Raw', color:'#6b7280',
              p:{ camera:'VHS Camcorder', lens:'8mm Fisheye', lighting:'Harsh Shadows', shotStyle:'Documentary', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut' }},
            // ── DOCUMENTARY & REALISM ──
            { id:'street_doc', group:'Documentary & Realism', name:'Street Documentary', tag:'Candid · Real', color:'#78716c',
              p:{ camera:'Sony A7S III', lens:'35mm Standard', lighting:'Natural Daylight', shotStyle:'Candid / Street', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut' }},
            { id:'war_correspondent', group:'Documentary & Realism', name:'War Correspondent', tag:'Urgent · Gritty', color:'#92400e',
              p:{ camera:'GoPro Hero 11', lens:'14mm Ultra-Wide', lighting:'Harsh Shadows', shotStyle:'Documentary', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'Speed Ramp', duration:'4.0s', transition:'Hard Cut' }},
            { id:'nature', group:'Documentary & Realism', name:'Nature Close-Up', tag:'Macro · Serene', color:'#16a34a',
              p:{ camera:'Canon EOS R5', lens:'100mm Macro', lighting:'Natural Daylight', shotStyle:'Photorealistic', angle:'Eye Level', movement:'Static / Tripod', actionSpeed:'Slow Motion', duration:'6.0s', transition:'Cross Dissolve' }},
            // ── EPIC & CINEMATIC ──
            { id:'blockbuster', group:'Epic & Cinematic', name:'Blockbuster Reveal', tag:'Epic · Crane', color:'#eab308',
              p:{ camera:'IMAX 70mm', lens:'14mm Ultra-Wide', lighting:'Golden Hour', shotStyle:'Cinematic', angle:'Low Angle', movement:'Crane Shot', actionSpeed:'Slow Motion', duration:'8.0s', transition:'Cross Dissolve' }},
            { id:'award_drama', group:'Epic & Cinematic', name:'Award Season Drama', tag:'Intimate · Studio', color:'#c084fc',
              p:{ camera:'ARRI Alexa 65', lens:'85mm Portrait', lighting:'Studio Lighting', shotStyle:'Cinematic', angle:'Eye Level', movement:'Static / Tripod', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut', filmStock:'Kodak Portra 400' }},
            { id:'indie', group:'Epic & Cinematic', name:'Indie Film', tag:'Raw · Available Light', color:'#a3a3a3',
              p:{ camera:'Canon EOS R5', lens:'35mm Standard', lighting:'Natural Daylight', shotStyle:'Documentary', angle:'Eye Level', movement:'Handheld / Shaky', actionSpeed:'Normal Speed', duration:'5.0s', transition:'Hard Cut' }},
        ];

