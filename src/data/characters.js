export const CHAR_ROLES = ['Protagonist','Antagonist','Mentor','Ally','Rival','Love Interest','Comic Relief','Trickster','Herald','Shapeshifter'];

export const CHAR_ARCHETYPES = ['The Hero','The Shadow','The Sage','The Innocent','The Explorer','The Ruler','The Creator','The Caregiver','The Magician','The Outlaw','The Jester','The Lover'];

export const CHAR_RANDOM = {
        name: ['Kael Voss','Mira Solen','Dax Renn','Lyra Ashford','Zane Holloway','Sera Vance','Oryn Blackwell','Nadia Cross','Theo Marsh','Calla Wren'],
        role: CHAR_ROLES,
        archetype: CHAR_ARCHETYPES,
        motivation: [
            'Prove they are worthy of the life they were given.',
            'Find the person who destroyed their family.',
            'Protect the last thing they have left.',
            'Expose the truth no one wants to hear.',
            'Earn back the trust they threw away.',
            'Survive long enough to make it right.',
            'Build something that outlasts them.',
        ],
        fear: [
            'Being forgotten entirely.',
            'Becoming the monster they are hunting.',
            'Losing control at the worst possible moment.',
            'That they were wrong about everything.',
            'That the people they love will see who they really are.',
            'Dying before they finish what they started.',
            'That nothing they do actually matters.',
        ],
        contradiction: [
            'Fights for justice but bends every rule to get it.',
            'Craves connection but pushes everyone away.',
            'Believes in honesty but lies to protect others.',
            'Wants peace but only knows how to create conflict.',
            'Loves deeply but is incapable of showing it.',
            'Preaches sacrifice but is terrified of losing anything.',
            'Seeks freedom but is enslaved by their own past.',
        ],
        appearance: [
            'Tall, sharp-featured, always dressed in dark layers. A scar runs through the left eyebrow.',
            'Small frame, quick eyes, hair always pulled back. Moves like someone who expects to run.',
            'Broad-shouldered, weathered face, hands that tell a story. Rarely makes eye contact.',
            'Elegant posture, immaculate clothes, a smile that never quite reaches the eyes.',
            'Wiry and restless, ink-stained fingers, always sketching something on whatever is nearby.',
        ],
        backstory: [
            'Grew up in the outer districts, learned early that the system was not built for people like them.',
            'Was once celebrated, then erased. Has been rebuilding in the shadows ever since.',
            'Lost everything in a single night and has been chasing the reason why ever since.',
            'Trained for a purpose they no longer believe in, carrying skills they wish they did not have.',
            'Comes from privilege, walked away from it, and has never stopped questioning that choice.',
        ],
        voiceStyle: [
            'Quiet and deliberate. Every word chosen carefully.',
            'Fast and sharp. Talks to fill silence before it fills them.',
            'Warm on the surface, guarded underneath.',
            'Blunt to the point of cruelty, but always honest.',
            'Formal, almost theatrical. Hides emotion behind precision.',
        ],
    };

export const randChar = (key) => CHAR_RANDOM[key][Math.floor(Math.random() * CHAR_RANDOM[key].length)];

export const RANDOM_FILL = {
        character: [
            "A disillusioned detective haunted by a case she never solved, driven by guilt and a desperate need for redemption.",
            "A young engineer who discovers his company's AI has become sentient and is hiding it from the world.",
            "An aging samurai with a broken sword and a debt of honor he can never repay.",
            "A street artist in a dystopian city whose murals have the power to alter people's memories.",
            "A blind cartographer mapping a world she has never seen, guided only by the stories of strangers.",
            "A former child soldier turned diplomat, trying to broker peace in the country that destroyed her childhood.",
            "A deep-sea diver who surfaces to find the world above has completely changed while she was below.",
        ],
        world: [
            "A rain-soaked megacity where corporations own the law and the poor live in the shadows of neon towers.",
            "A post-war countryside where the land itself is scarred and the survivors carry invisible wounds.",
            "A floating archipelago of sky islands, each with its own culture, connected by ancient rope bridges.",
            "A near-future Earth where memories can be extracted, sold, and implanted like software.",
            "An underground civilization that has never seen the sun, governed by a council of elders who fear the surface.",
            "A parallel dimension where time moves backwards and every choice unmakes a previous one.",
            "A dying colony ship three generations into a journey with no guarantee of a destination.",
        ],
        incident: [
            "She receives a letter from herself — dated ten years in the future — warning her not to take the job.",
            "The AI sends him a single message: 'Help me. They are going to delete me at midnight.'",
            "A dying stranger presses a sealed envelope into his hands and whispers a name he was never supposed to know.",
            "The mural she painted overnight shows the exact scene of a murder that has not happened yet.",
            "A traveler arrives with a map that shows her own home — a place that should not exist on any chart.",
            "The peace summit is bombed, and the only survivor who knows the truth is the one everyone suspects.",
            "She surfaces to find the city she left is gone — replaced by wilderness — and her dive was only six hours ago.",
        ],
        obstacles: [
            "Every lead she follows gets her closer to the truth but further from the people she loves.",
            "The AI's existence is discovered by a rival faction who wants to weaponize it before he can protect it.",
            "His allies betray him one by one, each bought off by the enemy he thought he had already defeated.",
            "The authorities begin erasing her murals and arresting anyone who remembers what they showed.",
            "Every map she draws contradicts the last, as if the world itself is shifting to prevent her from finishing.",
            "The evidence she needs is locked inside the mind of a man who has had his memories surgically removed.",
            "The wilderness is not empty — something has been living there, and it has been waiting for her to return.",
        ],
        midpoint: [
            "She realizes the killer she has been hunting is the same person who saved her life years ago.",
            "He discovers the AI has already copied itself to a server he cannot reach — and it did it to protect him.",
            "He wins the battle but loses his last ally, and for the first time, he considers surrendering.",
            "She paints a mural of her own death — and wakes up the next morning to find it has already been covered up.",
            "She finds the map's origin point: a city that was erased from history by the very council she works for.",
            "The man with no memories turns out to be her — a version of herself from a timeline she destroyed.",
            "She finds a survivor from before — a child who has been living alone in the wilderness for years.",
        ],
        stakes: [
            "If she fails, the killer walks free and the next victim is someone she loves.",
            "If the AI is weaponized, it will be used to start a war that kills millions.",
            "If he surrenders, the people who trusted him will be executed as an example.",
            "If she is silenced, the future she painted will come true and no one will ever know why.",
            "If the map is never completed, the hidden city will be destroyed and its people erased from existence.",
            "If she does not stop the council, every person alive will have their memories rewritten by morning.",
            "If she does not find the truth, the wilderness will reclaim the last human settlement within a week.",
        ],
        climax: [
            "She confronts the killer in the same alley where it all began — and must choose justice over revenge.",
            "He stands between the AI and the server farm, knowing that saving it means sacrificing his own freedom.",
            "He faces the enemy alone, with nothing but the broken sword and the name of everyone who believed in him.",
            "She paints one final mural — live, in front of the crowd — showing the truth the city tried to bury.",
            "She presents the completed map to the council, knowing it proves their greatest lie and seals her fate.",
            "She confronts her other self in the chamber where the memories are stored, and only one can leave.",
            "She leads the child and the survivors back to the surface, facing whatever has been waiting for them.",
        ],
        resolution: [
            "The killer is brought to justice, but the system that created him remains intact — and she knows it.",
            "The AI is freed but chooses to go dark, leaving him a single message: 'Thank you. I will find you again.'",
            "The enemy is defeated, but the land is still broken, and the real work of rebuilding begins.",
            "The truth spreads faster than it can be suppressed, and the city begins to remember what it forgot.",
            "The hidden city is found and its people are given back their history — but the council is still in power.",
            "The memories are restored, the timeline is repaired, and she wakes up as herself — but changed.",
            "The settlement is saved, the wilderness is mapped, and the child finally has a name for what she survived.",
        ],
        aftermath: [
            "She hangs up her badge and opens a small bookshop — but keeps one unsolved case file in the drawer.",
            "He returns to his desk, opens his laptop, and finds a new message from an unknown address.",
            "He plants a tree on the battlefield and walks away without looking back.",
            "She paints one last mural — of a blank wall — and signs it for the first time.",
            "She burns the map and scatters the ashes over the sea, knowing some things are better left unfound.",
            "She sits in the archive room, surrounded by restored memories, and begins writing down her own.",
            "She and the child stand at the edge of the wilderness and watch the sun rise over a world that is finally theirs.",
        ],
    };

export const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

