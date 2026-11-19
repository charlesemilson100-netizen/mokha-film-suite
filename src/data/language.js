// ── NLP PREPROCESSING ENGINE ──────────────────────────────────────────────
        // Strips filler words, corrects common typos, expands synonyms
        // so the agent understands natural/broken language like a real LLM

        export const FILLER_WORDS = /\b(please|pls|plz|can you|could you|would you|i want|i need|i would like|i'd like|yo|hey|ok|okay|so|just|maybe|actually|basically|literally|like|um|uh|well|right|you know|make me|give me|show me|help me|let me|i want to|i need to|i would like to|can you please|could you please|for me|for now|quickly|fast|now|asap)\b/gi;

export const TYPO_MAP = {
            // Chain Mode
            'cain mode':'chain mode', 'chian mode':'chain mode', 'chain mde':'chain mode',
            'chaine mode':'chain mode', 'chan mode':'chain mode', 'chian':'chain',
            'sequnce':'sequence', 'sequense':'sequence', 'seqence':'sequence',
            // Shot
            'sht':'shot', 'shto':'shot', 'shoht':'shot', 'shott':'shot',
            // Scene
            'scne':'scene', 'sceen':'scene', 'sceene':'scene',
            // Character
            'charcter':'character', 'charachter':'character', 'caracter':'character',
            // Location
            'locaton':'location', 'locaiton':'location', 'loaction':'location',
            // Lighting
            'lighing':'lighting', 'lighitng':'lighting', 'ligthing':'lighting',
            // Camera
            'camra':'camera', 'camear':'camera', 'camrea':'camera',
            // Director
            'directr':'director', 'direcor':'director', 'dirctor':'director',
            // Story
            'sotry':'story', 'strory':'story', 'stoyr':'story',
            // Project
            'proejct':'project', 'projct':'project', 'proect':'project',
            // Activate
            'activte':'activate', 'actiavte':'activate', 'actiate':'activate',
            // Deactivate
            'deactivte':'deactivate', 'deactiavte':'deactivate',
            // Shotify
            'shotfy':'shotify', 'shotifiy':'shotify', 'shotifiy':'shotify',
            // Build
            'biuld':'build', 'buidl':'build', 'buld':'build',
            // Create
            'crate':'create', 'creat':'create', 'craete':'create',
            // Delete
            'delet':'delete', 'dleet':'delete', 'delte':'delete',
            // Add
            'addd':'add', 'aad':'add',
            // Lock
            'lok':'lock', 'lcok':'lock',
            // Unlock
            'unlok':'unlock', 'unlcok':'unlock',
        };

export const SYNONYM_MAP = {
            // Chain Mode synonyms
            'chain sequence':'chain mode', 'chain flow':'chain mode', 'chain series':'chain mode',
            'sequence mode':'chain mode', 'series mode':'chain mode', 'flow mode':'chain mode',
            'start chain':'activate chain mode', 'begin chain':'activate chain mode',
            'stop chain':'deactivate chain mode', 'end chain':'deactivate chain mode', 'exit chain':'deactivate chain mode',
            // Shot synonyms
            'frame':'shot', 'clip':'shot', 'take':'shot', 'panel':'shot',
            'add frame':'add shot', 'new frame':'add shot', 'create frame':'add shot',
            // Scene synonyms
            'act':'scene', 'sequence':'scene', 'section':'scene',
            'new act':'create scene', 'add act':'create scene',
            // Lighting synonyms
            'light':'lighting', 'lights':'lighting', 'illumination':'lighting',
            'dark':'low key', 'bright':'high key', 'moody':'low key',
            'golden':'golden hour', 'sunset':'golden hour', 'sunrise':'golden hour',
            'neon':'neon / cyberpunk', 'cyberpunk lights':'neon / cyberpunk',
            // Camera synonyms
            'cam':'camera', 'lens type':'lens',
            'wide':'wide shot', 'close':'close-up', 'closeup':'close-up',
            'extreme close':'extreme close-up', 'ecm':'extreme close-up',
            // Movement synonyms
            'move':'movement', 'motion':'movement', 'camera move':'movement',
            'handheld':'handheld / shaky', 'shaky':'handheld / shaky', 'shaky cam':'handheld / shaky',
            'dolly':'dolly in', 'push in':'dolly in', 'pull back':'dolly out',
            'pan':'pan left', 'tracking':'tracking / follow', 'follow':'tracking / follow',
            // Style synonyms
            'noir':'film noir', 'black and white':'film noir', 'bw':'film noir',
            'sci fi':'sci-fi epic', 'scifi':'sci-fi epic', 'science fiction':'sci-fi epic',
            'horror style':'film noir', 'dark style':'film noir',
            // Speed synonyms
            'slow mo':'slow motion', 'slowmo':'slow motion', 'slo mo':'slow motion',
            'fast':'2x fast forward', 'speed up':'2x fast forward',
            'ultra slow':'ultra slow motion', 'super slow':'ultra slow motion',
            // Platform synonyms
            'kling':'kling ai', 'runway ai':'runway', 'veo':'veo 3', 'google veo':'veo 3',
            // Action synonyms
            'make':'create', 'build':'create', 'generate':'create', 'new':'create',
            'remove':'delete', 'erase':'delete', 'get rid of':'delete', 'trash':'delete',
            'show':'list', 'display':'list', 'what are':'list', 'see all':'list',
            'switch to':'activate', 'turn on':'activate', 'enable':'activate',
            'turn off':'deactivate', 'disable':'deactivate', 'stop':'deactivate',
            // Shotify synonyms
            'compress':'shotify on', 'shorten prompt':'shotify on', 'optimize prompt':'shotify on',
            'full prompt':'shotify off', 'expand prompt':'shotify off',
            // Analysis synonyms
            'check pacing':'analyze rhythm', 'pacing check':'analyze rhythm',
            'what genre':'detect genre', 'my genre':'detect genre',
            // Friendly openers that mean nothing
            'yo ':'', 'hey ':'', 'ok ':'', 'okay ':'', 'so ':'',
        };

