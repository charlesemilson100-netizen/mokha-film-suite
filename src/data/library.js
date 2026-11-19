import { DIRECTOR_RULES, OPTIONS } from './catalog';

export const GLOSSARY_DATA = { /* Same as before, keeping short for payload size */ };

export const PROMPT_LIBRARY_DATA = [
            // --- CINEMATOGRAPHY (18) ---
            {
                id: 'lib_prompt_1',
                title: 'Epic Drone Reveal',
                cat: 'Cinematography',
                text: 'A breathtaking drone shot flying backwards through a narrow canyon, revealing a vast, ancient city carved into the rock at sunrise. Volumetric light rays pierce through the morning mist. Cinematic, 8K, hyperrealistic.',
                models: ['Veo 3', 'KLING', 'Runway'],
                prec: { 'Veo 3': 'High', 'KLING': 'High', 'Runway': 'Med' }
            },
            {
                id: 'lib_prompt_2',
                title: 'Tense Dolly Zoom',
                cat: 'Cinematography',
                text: 'A dramatic dolly zoom (Vertigo effect) on a detective\'s face as he realizes a shocking truth. The background warps and stretches behind him. Low key lighting, film noir style, shot on 35mm film.',
                models: ['Runway', 'KLING'],
                prec: { 'Runway': 'High', 'KLING': 'Med' }
            },
            {
                id: 'lib_prompt_3',
                title: 'Handheld Chase Sequence',
                cat: 'Cinematography',
                text: 'Intense handheld tracking shot following a character running through a crowded night market. Neon lights blur past, people scatter. Shaky cam, fast-paced action, cyberpunk aesthetic.',
                models: ['Veo 3', 'Runway', 'Seedance'],
                prec: { 'Veo 3': 'High', 'Runway': 'High', 'Seedance': 'Med' }
            },
            {
                id: 'lib_prompt_4',
                title: 'Macro Probe Lens Journey',
                cat: 'Cinematography',
                text: 'An extreme macro probe lens shot moving through a miniature world of dew-covered grass blades. A ladybug crawls into focus. Shallow depth of field, magical, photorealistic, David Attenborough documentary style.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_5',
                title: 'Orbiting Hero Shot',
                cat: 'Cinematography',
                text: 'A 360-degree orbiting shot around a superhero hovering in the rain, cape billowing dramatically. The city skyline is visible in the background. Slow motion, cinematic, epic, anamorphic lens flare.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_6',
                title: 'POV: Waking Up',
                cat: 'Cinematography',
                text: 'Point-of-view shot of someone waking up. Eyes flutter open, vision is blurry at first, then slowly comes into focus on a sunlit bedroom ceiling. The sound of birds chirping.',
                models: ['Runway', 'Veo 3', 'Seedance'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'Seedance': 'High' }
            },
            {
                id: 'lib_prompt_7',
                title: 'Jib Shot Over a Crowd',
                cat: 'Cinematography',
                text: 'A smooth jib shot starting low and rising high above a cheering crowd at a music festival. The stage lights flash and sweep across the audience. High energy, vibrant colors.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_8',
                title: 'Split Diopter Conversation',
                cat: 'Cinematography',
                text: 'A split diopter shot keeping two characters in sharp focus, one in the extreme foreground and one in the background, during an intense conversation in a dimly lit office.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'Med', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_9',
                title: 'Whip Pan Transition',
                cat: 'Cinematography',
                text: 'An extremely fast whip pan that transitions from a character in a modern city apartment to the same character standing in a lush, fantasy forest. Seamless and disorienting.',
                models: ['Runway', 'KLING'],
                prec: { 'Runway': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_10',
                title: 'Static Long Take',
                cat: 'Cinematography',
                text: 'A static, wide-angle, long take of a family dinner. The camera does not move, capturing the subtle interactions, conversations, and growing tension over several minutes. Naturalistic lighting, Wes Anderson style composition.',
                models: ['Veo 3', 'KLING'],
                prec: { 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_11',
                title: 'Crash Zoom',
                cat: 'Cinematography',
                text: 'A rapid, jarring crash zoom into a character\'s terrified eyes as they see something horrifying off-screen. 70s horror movie aesthetic, grainy film texture.',
                models: ['Runway', 'Seedance'],
                prec: { 'Runway': 'High', 'Seedance': 'High' }
            },
            {
                id: 'lib_prompt_12',
                title: 'God\'s Eye View',
                cat: 'Cinematography',
                text: 'A top-down, "God\'s eye view" shot of a yellow taxi driving through the gridded streets of New York City at night. The city lights create a beautiful, geometric pattern.',
                models: ['Veo 3', 'KLING'],
                prec: { 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_13',
                title: 'SnorriCam Shot',
                cat: 'Cinematography',
                text: 'A SnorriCam shot with the camera rigged to an actor, showing their panicked face as they run, while the background seems to move chaotically around them. Claustrophobic and intense.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'Med' }
            },
            {
                id: 'lib_prompt_14',
                title: 'Silhouette at Sunset',
                cat: 'Cinematography',
                text: 'A beautiful wide shot of a lone cowboy on horseback, silhouetted against a massive, vibrant orange and purple sunset. The camera slowly pushes in. Anamorphic lens, cinematic.',
                models: ['Runway', 'Veo 3', 'KLING'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_15',
                title: 'Reflection Shot',
                cat: 'Cinematography',
                text: 'A close-up shot of a character\'s face reflected in a rain-covered window pane. The city lights are blurred in the background. Moody, introspective, shallow depth of field.',
                models: ['Runway', 'Veo 3', 'Seedance'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'Seedance': 'Med' }
            },
            {
                id: 'lib_prompt_16',
                title: 'Time-lapse of a Flower Blooming',
                cat: 'Cinematography',
                text: 'A stunning time-lapse of a hibiscus flower blooming, from a tight bud to a full, vibrant flower, over the course of 10 seconds. Studio lighting, black background, 8K macro.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_17',
                title: 'Low Angle Skyscraper',
                cat: 'Cinematography',
                text: 'A dramatic low-angle shot tilting up the full height of a futuristic, impossibly tall skyscraper that pierces the clouds. The glass reflects the bustling city below. Sci-fi, epic scale.',
                models: ['Runway', 'Veo 3', 'KLING'],
                prec: { 'Runway': 'Med', 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_18',
                title: 'Car Mount Side View',
                cat: 'Cinematography',
                text: 'A car mount shot from the side of a vintage convertible driving down a coastal highway at golden hour. The driver\'s hair blows in the wind. Lens flare, cinematic, warm color grade.',
                models: ['Runway', 'Veo 3', 'KLING'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'KLING': 'High' }
            },

            // --- ENVIRONMENTS (18) ---
            {
                id: 'lib_prompt_19',
                title: 'Bioluminescent Forest',
                cat: 'Environments',
                text: 'A magical, bioluminescent forest at night. The flora and fungi glow with ethereal blue and green light. A gentle stream reflects the glowing trees. Fantasy, hyper-detailed, volumetric lighting.',
                models: ['Veo 3', 'KLING', 'Runway'],
                prec: { 'Veo 3': 'High', 'KLING': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_20',
                title: 'Cyberpunk Megacity',
                cat: 'Environments',
                text: 'A sprawling, multi-layered cyberpunk megacity at night, choked with neon signs, flying vehicles, and massive holographic advertisements. Rain slicks the streets below. Blade Runner aesthetic.',
                models: ['KLING', 'Veo 3', 'Runway'],
                prec: { 'KLING': 'High', 'Veo 3': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_21',
                title: 'Abandoned Space Station',
                cat: 'Environments',
                text: 'The silent, derelict interior of an abandoned space station. Wires hang from the ceiling, emergency lights flicker, and dust motes float in the zero-gravity. A view of Earth is visible through a large viewport. Sci-fi horror, eerie, cinematic.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_22',
                title: 'Serene Japanese Zen Garden',
                cat: 'Environments',
                text: 'A tranquil Japanese zen garden with meticulously raked white sand, moss-covered rocks, and a single cherry blossom tree in full bloom. A gentle breeze causes petals to drift down. Photorealistic, peaceful, 4K.',
                models: ['Veo 3', 'KLING', 'Seedance'],
                prec: { 'Veo 3': 'High', 'KLING': 'High', 'Seedance': 'High' }
            },
            {
                id: 'lib_prompt_23',
                title: 'Post-Apocalyptic Wasteland',
                cat: 'Environments',
                text: 'A vast, post-apocalyptic wasteland under a hazy, orange sky. The ruins of a city are visible on the horizon. A rusted car is half-buried in the sand. Gritty, desolate, Mad Max style.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_24',
                title: 'Steampunk Library',
                cat: 'Environments',
                text: 'The interior of a grand, multi-story steampunk library. Towering shelves of books, brass pipes, and rotating gears are visible. A large, intricate orrery is at the center. Warm, intricate, detailed.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_25',
                title: 'Underwater Coral Reef',
                cat: 'Environments',
                text: 'A vibrant and bustling coral reef teeming with colorful fish, sea turtles, and other marine life. Sunlight filters down through the crystal-clear turquoise water. National Geographic documentary style, hyperrealistic.',
                models: ['Veo 3', 'KLING'],
                prec: { 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_26',
                title: 'Viking Village in a Fjord',
                cat: 'Environments',
                text: 'A bustling Viking village nestled in a dramatic Norwegian fjord. Longhouses with turf roofs, smoking chimneys, and longships pulled up on the shore. The mountains are shrouded in mist. Historical, cinematic.',
                models: ['Runway', 'Veo 3', 'KLING'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_27',
                title: 'Alien Desert Planet',
                cat: 'Environments',
                text: 'A vast desert on an alien planet with two suns in the sky. Strange, crystalline rock formations dot the landscape of red sand. Sci-fi, epic, Dune aesthetic.',
                models: ['Veo 3', 'Runway'],
                prec: { 'Veo 3': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_28',
                title: '1920s Art Deco Speakeasy',
                cat: 'Environments',
                text: 'The smoky, opulent interior of a 1920s Art Deco speakeasy. A jazz band plays on a small stage, flappers dance, and bartenders mix cocktails. Dimly lit, glamorous, high energy.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_29',
                title: 'Floating Sky Islands',
                cat: 'Environments',
                text: 'A majestic landscape of floating islands in the sky, connected by ancient vine bridges. Waterfalls cascade from the edges of the islands into the clouds below. Fantasy, breathtaking, Studio Ghibli inspired.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_30',
                title: 'Medieval Castle Siege',
                cat: 'Environments',
                text: 'A massive medieval castle under siege at night. Catapults launch flaming projectiles, archers fire from the battlements, and soldiers clash at the gates. Chaotic, epic, cinematic.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_31',
                title: 'Minimalist Sci-Fi Interior',
                cat: 'Environments',
                text: 'The clean, white, minimalist interior of a futuristic spaceship bridge. A large holographic display shows star charts. Sleek, high-tech, sterile, 2001: A Space Odyssey aesthetic.',
                models: ['Runway', 'Veo 3', 'Seedance'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'Seedance': 'Med' }
            },
            {
                id: 'lib_prompt_32',
                title: 'Amazon Rainforest Canopy',
                cat: 'Environments',
                text: 'A drone shot gliding just above the dense canopy of the Amazon rainforest. A toucan flies past the camera. The air is thick with humidity and the sounds of wildlife. Lush, vibrant, documentary style.',
                models: ['Veo 3', 'KLING'],
                prec: { 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_33',
                title: 'Victorian London Street',
                cat: 'Environments',
                text: 'A cobblestone street in Victorian London on a foggy evening. Gas lamps cast a warm glow, and a horse-drawn carriage rattles by. Mysterious, atmospheric, Sherlock Holmes setting.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_34',
                title: 'Surreal Cloudscape',
                cat: 'Environments',
                text: 'An impossible, surreal cloudscape at sunset, with clouds shaped like giant, swimming whales. The colors are vivid pinks, oranges, and purples. Dreamlike, artistic, beautiful.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_35',
                title: 'Hacker\'s Basement Lair',
                cat: 'Environments',
                text: 'A cluttered basement, the lair of a computer hacker. Multiple monitors display scrolling green code, wires are tangled everywhere, and empty pizza boxes are stacked in a corner. Low light, messy, tech-noir.',
                models: ['Runway', 'Seedance', 'Veo 3'],
                prec: { 'Runway': 'High', 'Seedance': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_36',
                title: 'Antarctic Ice Cave',
                cat: 'Environments',
                text: 'The interior of a vast ice cave in Antarctica. The ice is a deep, translucent blue, and sunlight from an opening above creates a magical glow. Ethereal, cold, beautiful, Planet Earth style.',
                models: ['Veo 3', 'KLING'],
                prec: { 'Veo 3': 'High', 'KLING': 'High' }
            },

            // --- CHARACTERS (18) ---
            {
                id: 'lib_prompt_37',
                title: 'Old Wizard Casting a Spell',
                cat: 'Characters',
                text: 'A close-up of an ancient wizard with a long white beard, eyes glowing with power as he chants and casts a complex spell. Magical energy swirls around his hands. Fantasy, detailed, cinematic.',
                models: ['Runway', 'Veo 3', 'KLING'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_38',
                title: 'Cyborg Ninja in Action',
                cat: 'Characters',
                text: 'A sleek cyborg ninja with a katana blade, deflecting laser blasts in a futuristic alleyway. The movements are fluid and impossibly fast. Sparks fly on impact. Action, sci-fi, slow motion.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_39',
                title: 'Child Looking at Stars',
                cat: 'Characters',
                text: 'A medium shot from behind a small child in pajamas, looking out their bedroom window at a sky full of brilliant stars. A sense of wonder and awe. Gentle, heartwarming, shallow depth of field.',
                models: ['Veo 3', 'Runway', 'Seedance'],
                prec: { 'Veo 3': 'High', 'Runway': 'High', 'Seedance': 'High' }
            },
            {
                id: 'lib_prompt_40',
                title: 'Queen on a Throne',
                cat: 'Characters',
                text: 'A powerful queen sitting on an ornate, gothic throne. She wears an elaborate crown and gown, and has a stern, commanding expression. The camera slowly pushes in on her face. Regal, dramatic, low key lighting.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_41',
                title: 'Astronaut on Mars',
                cat: 'Characters',
                text: 'An astronaut in a modern spacesuit plants a flag on the red, dusty surface of Mars. The Earth is a small blue dot in the black sky. The sun creates a long shadow. Photorealistic, epic, inspirational.',
                models: ['Veo 3', 'KLING', 'Runway'],
                prec: { 'Veo 3': 'High', 'KLING': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_42',
                title: 'Chef Plating a Dish',
                cat: 'Characters',
                text: 'An extreme close-up of a chef\'s hands meticulously plating a gourmet dish. They use tweezers to place a delicate microgreen. High-speed camera, slow motion, food cinematography.',
                models: ['KLING', 'Veo 3', 'Seedance'],
                prec: { 'KLING': 'High', 'Veo 3': 'High', 'Seedance': 'High' }
            },
            {
                id: 'lib_prompt_43',
                title: 'Ballerina\'s Perfect Pirouette',
                cat: 'Characters',
                text: 'A ballerina in a white tutu performs a perfect, graceful pirouette in slow motion on a dark stage. A single spotlight illuminates her. Elegant, beautiful, high contrast.',
                models: ['KLING', 'Veo 3', 'Runway'],
                prec: { 'KLING': 'High', 'Veo 3': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_44',
                title: 'Film Noir Detective',
                cat: 'Characters',
                text: 'A hardboiled film noir detective in a trench coat and fedora, standing under a streetlamp in the pouring rain, lighting a cigarette. The smoke curls in the light. Black and white, high contrast, atmospheric.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_45',
                title: 'Tribal Warrior with Face Paint',
                cat: 'Characters',
                text: 'An intense close-up of a tribal warrior with intricate, white face paint, staring directly into the camera. Their eyes are fierce and determined. Shot with a portrait lens, shallow depth of field.',
                models: ['Veo 3', 'Runway'],
                prec: { 'Veo 3': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_46',
                title: 'Laughing Friends',
                cat: 'Characters',
                text: 'A candid shot of a diverse group of friends laughing together around a campfire at night. The firelight flickers on their happy faces. Warm, authentic, joyful.',
                models: ['Veo 3', 'Runway', 'Seedance'],
                prec: { 'Veo 3': 'High', 'Runway': 'High', 'Seedance': 'High' }
            },
            {
                id: 'lib_prompt_47',
                title: 'Sad Man in the Rain',
                cat: 'Characters',
                text: 'A man sits on a park bench in the pouring rain, looking utterly dejected. The camera is far away, emphasizing his loneliness. Wide shot, blue color grade, melancholic.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_48',
                title: 'Mad Scientist\'s Eureka Moment',
                cat: 'Characters',
                text: 'A wild-haired mad scientist in a lab coat laughs maniacally as his strange contraption sparks and whirs to life. Dutch angle, chaotic energy, vintage sci-fi.',
                models: ['KLING', 'Runway'],
                prec: { 'KLING': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_49',
                title: 'Skateboarder Grinding a Rail',
                cat: 'Characters',
                text: 'A low-angle, slow-motion shot of a skateboarder grinding down a long metal handrail. Sparks fly from the trucks. Fisheye lens, dynamic, urban setting.',
                models: ['KLING', 'Veo 3', 'Runway'],
                prec: { 'KLING': 'High', 'Veo 3': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_50',
                title: 'Monk Meditating',
                cat: 'Characters',
                text: 'A serene shot of a Buddhist monk in orange robes, meditating at the entrance of a mountain temple. The camera slowly dollies in. Peaceful, centered, beautiful mountain backdrop.',
                models: ['Veo 3', 'Seedance', 'Runway'],
                prec: { 'Veo 3': 'High', 'Seedance': 'High', 'Runway': 'Med' }
            },
            {
                id: 'lib_prompt_51',
                title: 'Athlete Crossing Finish Line',
                cat: 'Characters',
                text: 'A runner, exhausted but triumphant, breaks through the tape at a marathon finish line. Confetti rains down. Slow motion, emotional, telephoto lens.',
                models: ['Veo 3', 'KLING', 'Runway'],
                prec: { 'Veo 3': 'High', 'KLING': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_52',
                title: 'Dog with Head out Car Window',
                cat: 'Characters',
                text: 'A happy golden retriever with its head out of a moving car window, ears and jowls flapping in the wind. The dog is joyful. Slow motion, sunny day, heartwarming.',
                models: ['Veo 3', 'KLING', 'Runway'],
                prec: { 'Veo 3': 'High', 'KLING': 'High', 'Runway': 'High' }
            },
            {
                id: 'lib_prompt_53',
                title: 'Violinist Playing Passionately',
                cat: 'Characters',
                text: 'A close-up on a violinist\'s face, eyes closed in concentration, as they play a passionate and fast-paced piece. The camera orbits around them. Dramatic lighting, emotional.',
                models: ['Runway', 'Veo 3', 'KLING'],
                prec: { 'Runway': 'High', 'Veo 3': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_54',
                title: 'Old Woman Smiling',
                cat: 'Characters',
                text: 'An extreme close-up of an old woman\'s face, breaking into a warm, genuine smile that crinkles her eyes. Her face is a map of a long life. Natural light, photorealistic, deeply human.',
                models: ['Veo 3', 'Runway', 'Seedance'],
                prec: { 'Veo 3': 'High', 'Runway': 'High', 'Seedance': 'High' }
            },

            // --- STYLES (19) ---
            {
                id: 'lib_prompt_55',
                title: 'Pixar Animation Style',
                cat: 'Styles',
                text: 'A charming scene of a small, curious robot discovering a glowing flower in a junkyard. Rendered in a high-end 3D animated style, resembling Pixar animation, with expressive features and soft, stylized lighting.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_56',
                title: 'Vintage 1980s VHS',
                cat: 'Styles',
                text: 'A group of teenagers hanging out at a mall, drinking milkshakes. The footage has the authentic look of a 1980s VHS home video, complete with tracking lines, soft focus, and washed-out colors.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_57',
                title: 'Japanese Anime Style (90s)',
                cat: 'Styles',
                text: 'A classic 90s anime scene of a magical girl transforming, with ribbons of light and sparkles swirling around her. Hand-drawn cell animation style, vibrant colors, dynamic background.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_58',
                title: 'Stop-Motion Claymation',
                cat: 'Styles',
                text: 'A quirky claymation scene of a penguin slipping and sliding on an iceberg. The texture of the clay is visible, and the movement has a charming, slightly jerky quality. Aardman Animations style.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_59',
                title: 'Wes Anderson Symmetry',
                cat: 'Styles',
                text: 'A perfectly symmetrical, wide-angle shot of a quirky family standing in front of their pastel-colored house. The composition is flat and centered. Wes Anderson aesthetic, deadpan expressions.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_60',
                title: 'Impressionist Painting',
                cat: 'Styles',
                text: 'A boat on a lily pond, animated in the style of a Claude Monet impressionist painting. The brushstrokes are visible and shimmer with light. The colors are soft and blended.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_61',
                title: 'Gritty Film Noir',
                cat: 'Styles',
                text: 'A shadowy figure walks down a rain-slicked alley. The scene is rendered in high-contrast black and white, with deep shadows and dramatic lighting from a single streetlamp. Classic film noir style.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_62',
                title: 'Unreal Engine 5 Render',
                cat: 'Styles',
                text: 'A photorealistic knight in shining armor exploring a hyper-detailed, ancient ruin. The scene is rendered in Unreal Engine 5, with nanite geometry, lumen global illumination, and realistic textures.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_63',
                title: 'Paper Cut-Out Animation',
                cat: 'Styles',
                text: 'A whimsical storybook scene of a fox and a rabbit having a tea party in a forest, animated in a paper cut-out style. The characters and environment have a layered, 2.5D look.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_64',
                title: 'Thermal Vision',
                cat: 'Styles',
                text: 'A POV shot of a soldier scanning a dark forest through a thermal vision scope. A deer is visible as a bright orange shape against the cool blue background. Predator movie style.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_65',
                title: 'Sketchbook Pencil Drawing',
                cat: 'Styles',
                text: 'A beautiful, animated pencil sketch of a bird taking flight from a tree branch. The lines are loose and expressive, and the paper texture is visible. The animation appears to be drawn frame by frame.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_66',
                title: 'David Lynch Surrealism',
                cat: 'Styles',
                text: 'A bizarre and unsettling scene in a red-draped room where a man is talking backwards. The lighting is strange and the atmosphere is dreamlike and menacing. David Lynch style.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_67',
                title: 'Infrared Photography',
                cat: 'Styles',
                text: 'A landscape shot of a forest rendered in the style of infrared photography. The green leaves of the trees are bright white, and the sky is a dark, dramatic black. Ethereal and otherworldly.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_68',
                title: 'LEGO Brickfilm',
                cat: 'Styles',
                text: 'A LEGO minifigure astronaut explores a LEGO moon base. The entire scene is built from LEGO bricks and animated in a stop-motion brickfilm style.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_69',
                title: 'Technicolor Musical (1950s)',
                cat: 'Styles',
                text: 'A man in a suit and hat, joyfully singing and dancing in the street, splashing in puddles. The scene is shot in the style of a 1950s Technicolor musical, with incredibly vibrant, saturated colors.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_70',
                title: 'Glitch Art / Datamosh',
                cat: 'Styles',
                text: 'A portrait of a person that suddenly fractures and dissolves into a cascade of colorful pixels and digital artifacts. The transition is a chaotic and beautiful datamosh effect.',
                models: ['Runway', 'KLING'],
                prec: { 'Runway': 'High', 'KLING': 'High' }
            },
            {
                id: 'lib_prompt_71',
                title: 'Cinematic Food Commercial',
                cat: 'Styles',
                text: 'An ultra slow-motion, macro shot of a juicy burger being assembled. Ingredients fall gracefully into place. High-speed camera, perfect studio lighting, mouth-watering detail.',
                models: ['KLING', 'Veo 3', 'Seedance'],
                prec: { 'KLING': 'High', 'Veo 3': 'High', 'Seedance': 'High' }
            },
            {
                id: 'lib_prompt_72',
                title: 'Bauhaus Graphic Design',
                cat: 'Styles',
                text: 'An abstract animation featuring simple geometric shapes—circles, squares, triangles—moving and interacting. The style is inspired by Bauhaus graphic design, with a limited color palette of red, yellow, blue, black, and white.',
                models: ['KLING', 'Veo 3'],
                prec: { 'KLING': 'High', 'Veo 3': 'High' }
            },
            {
                id: 'lib_prompt_73',
                title: 'Gothic Horror (1930s)',
                cat: 'Styles',
                text: 'A vampire slowly emerges from a coffin in a cobweb-filled crypt. The scene is shot in the style of a 1930s Universal monster movie, with dramatic shadows, German Expressionist angles, and grainy black and white film.',
                models: ['Runway', 'Veo 3'],
                prec: { 'Runway': 'High', 'Veo 3': 'High' }
            }
        ];

export const LIBRARY_CATEGORIES = ["All", "Custom", "Characters", "Environments", "Cinematography", "Styles", "UGC"];

export const RANDOM_WORDS = ['Alpha', 'Bravo', 'Neon', 'Cyber', 'Noir', 'Echo', 'Delta', 'Nova', 'Void', 'Apex', 'Matrix', 'Nexus', 'Pulse', 'Quantum'];

export const getRandomWord = () => RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];

// --- LOCAL AI ASSISTANT KNOWLEDGE BASE & ENGINE (FULL) ---
        export const MOKHA_KB = {
            // APP OVERVIEW
            app: {
                name: "MOKHA FILM Suite v2.0",
                description: "A professional, 100% offline, browser-based AI film prompt builder for generating cinematic shots, scenes, and full movie scripts for AI video/image platforms.",
                features: ["Shot Builder (Image & Video modes)", "Scene Manager", "Story Engine (3-Act structure)", "Prompt Library (73 built-in prompts)", "Character Library", "Location Library", "Voice/Dialogue system", "Director Rules", "AI Suggest (local WebLLM)", "Auto-Build", "PDF & JSON Export", "Dark/Light theme", "Multi-language (EN, FR, RU, HT)", "Platform-specific prompt formatting", "Film Stock emulation", "Quick Shot Presets", "Custom Style Presets (MyStyle)", "Plot Hole Detector", "LLaVA Vision AI integration", "Keyboard shortcuts"]
            },
            // WORKSPACES
            workspaces: {
                DEFAULT: "Default Workspace — full access to all tools: shot builder, scene manager, story engine, libraries.",
                DESIGNER: "Designer (Image) — focused on image/panel prompt building. Video-specific controls are hidden.",
                FILMMAKER: "Filmmaker (Pro) — full cinematic workflow with all video, audio, dialogue, and story tools enabled."
            },
            // MODES
            modes: {
                image: "Image Mode builds prompts for AI image generators. Hides video-only fields like camera movement, duration, and transitions.",
                video: "Video Mode builds full cinematic prompts for AI video platforms like Runway, Veo 3, KLING, and Seedance. Includes movement, speed, duration, transitions, SFX, BGM, and dialogue."
            },
            // AI PLATFORMS
            platforms: {
                "Runway": "Runway Gen-3/Gen-4. Supports [Camera Movement: X] and [Speed: X] syntax. Max 10s duration. Forbidden: blood, gore, violence, guns. Unsupported: Orbit, Drone Fly-Through movements.",
                "Veo 3": "Google Veo 3. Supports native dialogue and audio. Max 5s duration. Forbidden: copyrighted characters (Disney, Marvel, Star Wars, Nintendo). Unsupported: Morph, Glitch, Luma Fade, Zoom Transition.",
                "KLING": "KLING AI. Supports up to 10s. Forbidden: political figures (Biden, Trump, Putin, Xi Jinping). Full movement support.",
                "Seedance": "Seedance. Uses (Camera: X) syntax and --ar 16:9 --v 3 suffix. Max 5s. Unsupported: Orbit, Crane Shot, Tracking/Follow, Speed Ramp, Stop Motion. No lens/aperture controls.",
                "Standard": "Standard mode — no platform restrictions. Generic prompt format for any AI tool."
            },
            // SHOT BUILDER
            shotBuilder: {
                subject: "The 'Base Subject & Action' field is the core of your prompt — describe who/what is in the shot and what they are doing.",
                addShot: "Click 'Add' to add the current prompt as a new shot to the active scene. Click 'Update' when editing an existing shot.",
                promptPreview: "The Prompt Preview panel shows the final assembled prompt in real-time as you adjust parameters.",
                autoBuild: "Auto-Build uses the local AI to automatically suggest and fill in all visual parameters based on your subject text.",
                aiSuggest: "AI Suggest generates a creative subject/action description using the local WebLLM model. No internet required.",
                copyParams: "Copy Params saves all current parameter selections to clipboard. Paste Params restores them.",
                savePreset: "Save Preset stores the current parameter set as a reusable Quick Shot Preset.",
                refImage: "Add Ref lets you attach reference images to a shot for visual consistency guidance.",
                negativePrompt: "The Negative Prompt field tells the AI what to avoid generating (e.g., 'blurry, low quality, artifacts').",
                customOverride: "Custom Prompt Override lets you bypass the auto-builder and write a fully manual prompt for a specific shot."
            },
            // SCENE MANAGER
            sceneManager: {
                overview: "The Scene Manager (right panel) organizes your shots into named scenes. Each project can have multiple scenes.",
                addScene: "Click 'New Scene' to add a scene. Click the scene name to rename it.",
                reorderShots: "Drag shots within a scene to reorder them. The sequence order determines the final script output.",
                deleteShot: "Click the trash icon on a shot card to delete it. This cannot be undone.",
                compileMovie: "Compile MOVIE assembles all scenes and shots into a single master script for the entire film.",
                finalScript: "The Final Script view shows the complete formatted prompt script. You can copy it or export as PDF.",
                editTransitions: "Edit Transitions lets you set the transition type between each shot in a scene.",
                clearScene: "Clear Scene removes all shots from the active scene. Use with caution."
            },
            // STORY ENGINE
            storyEngine: {
                overview: "The Story Engine is a 3-act narrative structure tool. Fill in Act 1 (Setup), Act 2 (Confrontation), and Act 3 (Resolution) fields, then convert to cinematic shots automatically.",
                acts: "Act 1: Character introduction, world-building, inciting incident. Act 2: Obstacles, stakes, midpoint, dark night of the soul. Act 3: Climax, resolution, final image.",
                emotionalArc: "The Emotional Arc visualizer lets you drag tension points across 7 story beats to shape the mood of each act.",
                characterMap: "The Character Map is a visual node-based tool. Add characters, drag them around, and draw relationship lines between them.",
                relationships: "Relationship types: Ally (green), Rival (red), Neutral (gray), Romantic (pink), Mentor (purple), Enemy (orange). Click a line to cycle types.",
                convertToShots: "Click 'Convert to Shots' to automatically generate a full shot list from your story data and add it to your project scenes.",
                shotCount: "Set the target shot count before converting. Shots are distributed across acts proportionally.",
                llava: "LLaVA integration in the Story Engine lets you analyze a reference image with local Ollama AI to extract visual style, mood, and cinematography data."
            },
            // PROMPT LIBRARY
            promptLibrary: {
                overview: "The Prompt Library contains 73 built-in professional prompts across 6 categories: Cinematography, Environments, Characters, Styles, UGC, and Custom.",
                categories: "Categories: Cinematography (camera techniques), Environments (locations/settings), Characters (people/creatures in action), Styles (visual aesthetics), UGC (user-generated content style), Custom (your saved prompts).",
                usePrompt: "Click any prompt card to load it into the shot builder as your base subject.",
                addCustom: "You can save your own prompts to the Custom category using the 'Save to Library' option.",
                modelCompatibility: "Each prompt shows which AI platforms it works best with (Runway, Veo 3, KLING, Seedance) and the expected quality level (High/Med)."
            },
            // CHARACTER LIBRARY
            characterLibrary: {
                overview: "The Character Library stores reusable character profiles with name, description, and visual reference. Characters can be inserted into shot subjects.",
                fields: "Each character has: Name, Description (appearance, personality, costume), and optional reference image URL.",
                roles: "Character roles: Protagonist, Antagonist, Mentor, Ally, Rival, Love Interest, Comic Relief, Trickster, Herald, Shapeshifter.",
                archetypes: "Archetypes: The Hero, The Shadow, The Sage, The Innocent, The Explorer, The Ruler, The Creator, The Caregiver, The Magician, The Outlaw, The Jester, The Lover.",
                randomize: "Click the ✦ button next to any field to randomize it with a cinematic suggestion."
            },
            // LOCATION LIBRARY
            locationLibrary: {
                overview: "The Location Library stores reusable location/environment descriptions. Locations can be inserted into shot subjects.",
                fields: "Each location has: Name and Description (visual details, atmosphere, time of day, weather).",
                defaults: "Default locations include: Cyberpunk Alley, Abandoned Warehouse, and more."
            },
            // VOICE & DIALOGUE
            voiceDialogue: {
                overview: "The Dialogue & Voices section lets you add character dialogue lines to a shot. Each line has a character name, spoken text, mood, reaction, and event.",
                voiceLib: "The Voice Library stores reusable voice style profiles (e.g., 'Deep & Gruff', 'Soft & Whispery'). Assign a voice style to each dialogue line.",
                moods: "Dialogue moods: " + OPTIONS.dialogueMoods.join(', ') + ".",
                reactions: "Character reactions: " + OPTIONS.reactions.slice(0, 10).join(', ') + ", and more.",
                events: "Dialogue events (physical actions during speech): " + OPTIONS.dialogueEvents.slice(0, 6).join(', ') + ", and more.",
                veo3: "Veo 3 natively supports dialogue in prompts. The system formats dialogue with @CharacterName (mood) [Reaction] [Event]: 'text' syntax."
            },
            // DIRECTOR RULES
            directorRules: {
                overview: "Director Rules are global instructions prepended to every shot in the final script. They enforce consistency across the entire production.",
                list: DIRECTOR_RULES.map(r => r.name + ": " + r.text).join('\n'),
                howToEnable: "Enable Director Rules by checking them in the Rules panel (top-right of the editor). Active rules appear in the final compiled script.",
                tip: "Use 'CHARACTER CONSISTENCY' + 'REFERENCE IMAGE MATCH' together for maximum character coherence across shots."
            },
            // VISUAL PARAMETERS
            visualParams: {
                shotTypes: "Shot types define framing/subject size:\n" + OPTIONS.shotTypes.join('\n'),
                shotStyles: "Visual styles/aesthetics:\n" + OPTIONS.shotStyles.join('\n'),
                cameras: "Camera bodies to emulate:\n" + OPTIONS.cameraTypes.join('\n'),
                lenses: "Lens focal lengths:\n" + OPTIONS.lenses.join('\n'),
                angles: "Camera angles:\n" + OPTIONS.angles.join('\n'),
                lighting: "Lighting setups:\n" + OPTIONS.lighting.join('\n'),
                filmStocks: "Film stock emulations:\n" + OPTIONS.filmStocks.map(f => f.name + ' — ' + f.desc).join('\n'),
                apertures: "Aperture (depth of field): f/1.2 (very shallow), f/1.8, f/2.8, f/4, f/5.6, f/8, f/11, f/16 (deep focus)."
            },
            // MOTION & TIMING
            motionTiming: {
                movements: "Camera movements:\n" + OPTIONS.movements.join('\n'),
                speeds: "Action speeds:\n" + OPTIONS.actionSpeeds.join('\n'),
                durations: "Shot duration: 0.1s to 15.0s. Typical shots: 2-5s. Runway max: 10s. Veo 3 max: 5s.",
                transitions: "Transitions between shots:\n" + OPTIONS.transitions.join('\n')
            },
            // AUDIO
            audio: {
                sfx: "SFX (Sound Effects) field: describe ambient or action sounds (e.g., 'rain hitting pavement, distant thunder, footsteps').",
                bgm: "BGM (Background Music) field: describe the musical mood (e.g., 'tense orchestral strings', 'lo-fi hip hop beat', 'epic Hans Zimmer score').",
                tip: "Veo 3 is the only platform that natively generates audio from prompt descriptions. For other platforms, SFX/BGM are metadata notes."
            },
            // EXPORT & SHARING
            exportShare: {
                json: "Export as JSON: saves the entire project (all scenes, shots, settings) as a .json file. Use this for backup or to share with collaborators.",
                pdf: "Export as PDF Storyboard: generates a formatted PDF of the final script from the Script view. Uses html2pdf.js — works 100% offline.",
                share: "Share: generates a shareable link or copies the project data to clipboard.",
                import: "Import: load a previously exported .json project file to restore all your work."
            },
            // QUICK SHOT PRESETS
            quickPresets: {
                overview: "Quick Shot Presets are one-click parameter sets for common cinematic shots. Click a preset to instantly fill all visual parameters.",
                custom: "Save your own presets using 'Save Preset'. Custom presets appear at the top of the preset list.",
                mystyle: "MyStyle Presets are advanced template-based presets with custom prompt templates and strict parameter defaults. Built-in: 'Gritty Hyperreal Pop' and 'Ultra 8K Flawless Studio'."
            },
            // PLATFORM RESTRICTIONS
            platformRestrictions: {
                overview: "Each AI platform has content restrictions. The app automatically warns you and can sanitize forbidden words.",
                runway: "Runway forbids: blood, gore, naked, violence, guns, explosions. Max 10s.",
                veo3: "Veo 3 forbids: Disney, Marvel, Star Wars, Nintendo characters. Max 5s.",
                kling: "KLING forbids: political figures (Biden, Trump, Putin, Xi Jinping). Max 10s.",
                seedance: "Seedance: no lens/aperture controls, limited movements. Max 5s. Uses --ar 16:9 --v 3 suffix.",
                sanitize: "The sanitizer auto-replaces forbidden words with safe alternatives (e.g., 'gun' → 'futuristic metallic device')."
            },
            // GLOSSARY
            glossary: {
                "EWS": "Extreme Wide Shot — subject is tiny in the frame, emphasizes environment/scale.",
                "WS": "Wide Shot — full body visible, some environment shown.",
                "FS": "Full Shot — subject fills the frame from head to toe.",
                "MS": "Medium Shot — waist up. Most common shot type for dialogue.",
                "CU": "Close-Up — face or object fills the frame. Emphasizes emotion.",
                "ECU": "Extreme Close-Up — extreme detail (eyes, hands, object). Very intense.",
                "POV": "Point of View — camera represents a character's eyes.",
                "OTS": "Over the Shoulder — camera behind one character looking at another.",
                "dolly": "Dolly In/Out — camera physically moves toward or away from subject on a track.",
                "pan": "Pan — camera rotates horizontally on a fixed axis.",
                "tilt": "Tilt — camera rotates vertically on a fixed axis.",
                "tracking": "Tracking/Follow — camera moves alongside a moving subject.",
                "handheld": "Handheld/Shaky — camera held by operator, creates organic, documentary feel.",
                "crane": "Crane Shot — camera mounted on a crane, allows sweeping vertical movements.",
                "orbit": "Orbit — camera circles around the subject (360° arc).",
                "speed ramp": "Speed Ramp — shot starts at one speed and transitions to another (e.g., normal to slow-mo).",
                "golden hour": "Golden Hour — the hour after sunrise or before sunset. Warm, soft, directional light.",
                "blue hour": "Blue Hour — twilight period. Cool, diffused, cinematic blue tones.",
                "rim lighting": "Rim/Edge Lighting — light source behind subject creates a glowing outline, separates from background.",
                "volumetric": "Volumetric Lighting — light rays visible through atmosphere (fog, dust, smoke). Also called 'God Rays'.",
                "film grain": "Film Grain — analog texture from photographic film. Adds cinematic warmth and texture.",
                "depth of field": "Depth of Field (DOF) — the range of distance that appears sharp. Shallow DOF = blurry background (bokeh). Deep DOF = everything sharp.",
                "bokeh": "Bokeh — the aesthetic blur of out-of-focus areas. Achieved with wide apertures (f/1.2–f/2.8).",
                "lut": "LUT (Look-Up Table) — a color grading preset that transforms the color palette of footage.",
                "aspect ratio": "Aspect Ratio — the width-to-height ratio of the frame. 16:9 is standard widescreen. 2.39:1 is anamorphic cinematic.",
                "negative prompt": "Negative Prompt — instructions telling the AI what NOT to generate (e.g., 'blurry, artifacts, extra fingers').",
                "webllm": "WebLLM — a local in-browser AI engine that runs LLM models directly in your browser using WebGPU. No server, no API, no internet needed.",
                "llava": "LLaVA — a local Vision-Language AI model. Run via Ollama locally to analyze reference images and extract cinematic data.",
                "ollama": "Ollama — a local AI model runner. Install it at ollama.ai, then run 'ollama pull llava:7b' to enable vision analysis in MOKHA.",
                "3 act structure": "3-Act Structure — the classic narrative framework: Act 1 (Setup/Inciting Incident), Act 2 (Confrontation/Rising Action), Act 3 (Climax/Resolution).",
                "plot hole": "Plot Hole — a continuity error or logical inconsistency in a story (e.g., a character who died reappearing, day/night lighting mismatch).",
                "storyboard": "Storyboard — a sequence of illustrated panels representing each shot in a film. MOKHA generates text-based storyboards.",
                "prompt": "Prompt — a text description given to an AI model to generate an image or video. The more detailed and structured, the better the output.",
                "aspect ratio 16:9": "16:9 — standard widescreen format used by most AI video platforms.",
                "anamorphic": "Anamorphic — ultra-wide cinematic format (2.39:1 or 2.35:1). Creates lens flares and oval bokeh.",
                "color grade": "Color Grade — the process of adjusting colors, contrast, and tone of footage to achieve a specific look.",
                "continuity": "Continuity — maintaining consistent visual details (wardrobe, props, lighting, character appearance) across shots.",
                "b-roll": "B-Roll — supplementary footage that cuts away from the main action. Used for context, transitions, or visual interest.",
                "establishing shot": "Establishing Shot — typically a wide shot at the start of a scene to show the location and context.",
                "match cut": "Match Cut — a transition where the composition or action in one shot matches the next, creating a visual connection.",
                "smash cut": "Smash Cut — an abrupt, jarring cut used for comedic or dramatic effect.",
                "j-cut": "J-Cut — audio from the next scene starts before the visual cut.",
                "l-cut": "L-Cut — audio from the previous scene continues into the next visual.",
                "luma fade": "Luma Fade — a transition where the image fades through a luminance (brightness) mask.",
                "whip pan": "Whip Pan — an extremely fast pan that blurs the image, used as a transition or to show speed."
            },
            // TIPS & BEST PRACTICES
            tips: {
                consistency: "For character consistency across shots: enable 'CHARACTER CONSISTENCY' and 'REFERENCE IMAGE MATCH' director rules, and use the same character name in every shot subject.",
                quality: "For best quality: use '8K QUALITY RULE' director rule, choose ARRI Alexa 65 or RED V-Raptor camera, and add 'masterpiece, highly detailed' to your subject.",
                noir: "For Film Noir style: use 'Ilford HP5' film stock, 'Low Key (Dark/Moody)' lighting, 'High Angle' or 'Dutch Angle', and 'Film Noir' shot style.",
                action: "For action shots: use 'Handheld / Shaky' movement, 'Speed Ramp' action speed, 'Low Angle' for power, and 'Harsh Shadows' lighting.",
                portrait: "For portrait/character shots: use '85mm Portrait' lens, 'Cinematic Rim Lighting', 'Eye Level' angle, and 'Close-Up (CU)' shot type.",
                drone: "For aerial/drone shots: use 'DJI Mavic 3 (Drone)' camera, '14mm Ultra-Wide' lens, 'Bird's Eye View' angle, 'Drone Fly-Through' movement.",
                horror: "For horror: use 'Low Key (Dark/Moody)' lighting, 'Dutch Angle / Canted', 'Handheld / Shaky', 'Kodak Vision3 500T' film stock.",
                scifi: "For sci-fi: use 'Neon / Cyberpunk' lighting, 'Sci-Fi Epic' style, 'ARRI Alexa 65' camera, 'Dolly In' movement for reveals.",
                documentary: "For documentary style: use 'Documentary' shot style, 'Handheld / Shaky', 'Natural Daylight', '35mm Standard' lens.",
                slowmo: "For slow motion: use 'Ultra Slow Motion' or 'Slow Motion' action speed. Works best with KLING and Veo 3.",
                veo3audio: "Veo 3 is the only platform that generates real audio. Fill in SFX and BGM fields for best results with Veo 3.",
                promptLength: "Keep prompts focused. 2-4 sentences is ideal. Too long can confuse the AI. Use Director Rules for global instructions instead of repeating them in every shot."
            },

            // ── NEW FEATURES KNOWLEDGE BASE ──────────────────────────────
            chainMode: {
                overview: "Chain Mode lets you define a master scene once — character, location, camera, lighting — then add shots by typing only the action delta. Shot 1 gets the full setup. Shots 2+ get only what changes from the base. Saves 80% of repetitive typing.",
                howToUse: "Say 'start chain [preset name] with [character] in [location]' to activate. Then say 'chain add: [action]' for each subsequent shot. Say 'start sequence' to create Shot 1 automatically.",
                presets: "27 Hollywood presets available: Golden Hour Dialogue, Noir Interrogation, Boardroom Tension, Romantic Encounter, Family Drama, Courtroom Confrontation, Street Chase, Gunfight Standoff, Car Pursuit, Heist Infiltration, Rooftop Showdown, Escape Sequence, Deep Space, Cyberpunk Street, Fantasy Epic, Alien Encounter, Time Portal, Haunted Interior, Jump Scare Setup, Psychological Dread, Found Footage, Street Documentary, War Correspondent, Nature Close-Up, Blockbuster Reveal, Award Season Drama, Indie Film.",
                commands: "activate chain mode | deactivate chain mode | start chain [preset] | chain add: [action] | start sequence | update shot 1 | chain preset [name]",
                deltaRule: "Shots 2+ only include what DIFFERS from the chain base. If camera/lighting/style match the base, they are silent in the prompt. Only overrides appear."
            },
            continuityLock: {
                overview: "Continuity Lock locks specific parameters across all shots in a scene. When you change a locked param on any shot, it auto-propagates to every unlocked shot. Locked shots are immune.",
                lockable: "Can lock: camera, lens, lighting, style, angle, film stock, aspect ratio, speed.",
                commands: "lock lighting | lock camera | lock lens | lock style | lock angle | unlock all | unlock lighting"
            },
            shotify: {
                overview: "Shotify compresses the final prompt for the selected AI platform. Removes verbose sentences, keeps only what the platform needs. Never touches the user's subject text.",
                profiles: "Runway: bracketed format [Camera: X], max 300 tokens. Veo 3: natural sentences, max 400 tokens. KLING: compact, max 350 tokens. Seedance: ultra-minimal, max 200 tokens.",
                commands: "shotify on | shotify off | enable shotify | disable shotify | compress for [platform]"
            },
            sequenceTemplates: {
                overview: "Pre-built multi-shot sequences for common cinematic patterns. One command loads the full sequence with correct shot types, movements, and transitions.",
                available: "The Reveal (5 shots: EWS→WS→MS→CU→ECU), The Chase (5 shots: POV→Tracking→OTS→Aerial→Wide), The Confrontation (5 shots: OTS↔OTS→CU→ECU→Wide), The Discovery (4 shots: EWS→WS→MS→ECU), Hero Moment (4 shots: Worm's Eye→CU→FS→Epic Wide), The Nightmare (4 shots: Low Key→Dutch→ECU→POV).",
                commands: "load reveal sequence | load chase sequence | load confrontation sequence | load discovery sequence | load hero moment | load nightmare sequence"
            },
            shotLocking: {
                overview: "Lock individual shots to prevent accidental edits or deletion. Locked shots show an amber badge. Edit, duplicate, and delete are disabled for locked shots.",
                commands: "lock shot [N] | unlock shot [N] | lock all shots | unlock all shots"
            },
            findReplace: {
                overview: "Find & Replace searches for a parameter value across shots and replaces it. Can target active scene, active project, or all projects. Skips locked shots.",
                commands: "find [value] replace [value] | find [x] replace [y] in all projects | find [x] replace [y] in scene"
            },
            colorTags: {
                overview: "Color tag shots with red, amber, green, blue, purple, or pink. Tags appear as a colored left border on the shot card. Useful for marking shot status or priority.",
                commands: "tag shot [N] [color] | color tag shot [N] [color] | remove tag from shot [N]"
            },
            rhythmAnalyzer: {
                overview: "Analyzes shot duration pacing across the scene. Shows a bar chart, rhythm score (Monotonous/Balanced/Dynamic), and flags runs of 3+ shots with identical duration.",
                commands: "analyze rhythm | check pacing | show rhythm | shot rhythm"
            },
            genreDNA: {
                overview: "Analyzes all shots across all scenes and outputs a genre fingerprint — percentages of Noir, Thriller, Sci-Fi, Fantasy, Drama, Action, Horror, Romance based on lighting, camera, movement and style.",
                commands: "detect genre | genre dna | what genre is my project | analyze genre"
            },
            promptMutation: {
                overview: "Generates 3 cinematic variations of any shot — Intimate (CU, 85mm, Studio), Epic (EWS, 14mm, Drone, Golden Hour), Abstract (Surreal, Volumetric, Orbit, Slow Motion). Each can be added as a new shot or replace the current one.",
                commands: "mutate shot [N] | generate variations for shot [N] | create variations"
            },
            revisionHistory: {
                overview: "Every time you edit a shot, the previous version is automatically saved. Up to 10 versions per shot. Restore any version with one click.",
                commands: "show history for shot [N] | restore shot [N] version [V]"
            },
            costEstimator: {
                overview: "Shows estimated credit cost for the current scene based on total shot duration × platform rate. Runway: 0.05/s, Veo 3: 0.08/s, KLING: 0.04/s, Seedance: 0.03/s.",
                commands: "estimate cost | how much will this cost | cost for [platform]"
            },
            performanceSettings: {
                overview: "Performance Settings control RAM limit, CPU threads, VRAM budget, and rendering quality. Low quality disables animations for maximum speed. Auto-Optimize sets smart defaults based on detected hardware.",
                commands: "open performance settings | set quality to low | set quality to high | unload ai model"
            }
        };

