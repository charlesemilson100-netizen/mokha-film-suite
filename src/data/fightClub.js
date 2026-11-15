export const FIGHT_BEATS = [
    { id: 'setup', name: 'Setup', hint: 'Space and threat. No strike yet.' },
    { id: 'clash', name: 'Clash', hint: 'The first named move and who receives it.' },
    { id: 'impact', name: 'Impact', hint: 'Contact only. The hit, then the body reacts.' },
    { id: 'aftermath', name: 'Aftermath', hint: 'Who is standing, and what it cost.' },
    { id: 'exchange', name: 'Full exchange', hint: 'Four short beats. One move in each.' }
];

export const FIGHT_DURATIONS = ['5s', '8s', '10s', '12s', '15s'];

export const FIGHT_SKILLS = [
    { id: 'untrained', name: 'Untrained', level: 'weak', line: 'Untrained. Weight on the heels, arms wide, swings from the shoulder.' },
    { id: 'street', name: 'Street fight', level: 'trained', line: 'Street fighting. Clinch, dirty hands, uneven footing, no kata.' },
    { id: 'box', name: 'Boxing', level: 'strong', line: 'Boxing. Snap jab, guard stays up, feet reset after every punch.' },
    { id: 'karate', name: 'Karate', level: 'strong', line: 'Karate. Chamber, hip turn, full extension, then the foot comes back.' },
    { id: 'kungfu', name: 'Kung fu', level: 'strong', line: 'Kung fu. The technique is readable. Weight returns to the floor.' },
    { id: 'hand', name: 'Hand to hand', level: 'trained', line: 'Hand to hand. Short punches, elbows in the clinch, one clean level change.' },
    { id: 'gun', name: 'Gun fight', level: 'trained', line: 'Gun handling. Eyes on the sight, one shot or one reload, real recoil.' },
    { id: 'super', name: 'Superhuman', level: 'elite', line: 'Superhuman power with a human center of balance. One environment hit, then weight comes down.' },
    { id: 'arena', name: 'Arena special', level: 'elite', line: 'Stylized arena fighting. One special strike, silhouette stays readable.' }
];

export const FIGHT_LEVELS = [
    { id: 'weak', name: 'Weak' },
    { id: 'trained', name: 'Trained' },
    { id: 'strong', name: 'Strong' },
    { id: 'elite', name: 'Elite' }
];

export const FIGHT_STYLES = [
    {
        id: 'hand',
        name: 'Hand to hand',
        sauce: 'Real time. One strike. The camera sits inside the fight and cuts on the hit, not before it.',
        shotType: 'Over the Shoulder (OTS)',
        camera: 'Handheld close, operator inside the choreography',
        lens: '24mm Wide',
        movement: 'Handheld / Shaky',
        lighting: 'Natural Daylight',
        position: 'Just behind the attacking shoulder so the fist travels toward the lens',
        cut: 'Cut on impact, from the attacker to the body that receives the hit',
        sfx: 'Breath, cloth, a dull body hit, shoe scuff on the floor',
        avoid: 'Slow motion, extra limbs, fists that pass through the body'
    },
    {
        id: 'boxing',
        name: 'Boxing',
        sauce: 'Ringside, like a live broadcast. The jab is a snap. The guard never drops for the pose.',
        shotType: 'Medium Shot (MS)',
        camera: 'Ringside handheld just above the second rope',
        lens: '35mm Standard',
        movement: 'Handheld / Shaky',
        lighting: 'High Key (Bright)',
        position: 'Outside the ropes, on the lead-hand side',
        cut: 'Cut on the glove connecting, then the head snap',
        sfx: 'Glove leather, a sharp exhale, a low crowd, a distant bell',
        avoid: 'Wild haymakers, dropped guards, gloves merging into one shape'
    },
    {
        id: 'karate',
        name: 'Karate',
        sauce: 'Show the whole line of the kick. Hip turns with the strike. The foot chambers and returns.',
        shotType: 'Full Shot (FS)',
        camera: 'Side camera, locked or a slow lateral track',
        lens: '35mm Standard',
        movement: 'Tracking / Follow',
        lighting: 'Studio Lighting',
        position: 'Ninety degrees to the kick so the extension is honest',
        cut: 'Hold through the retraction. Cut only after the foot is back',
        sfx: 'Gi snap, a bare foot, one short kiai, mat impact',
        avoid: 'A kick that hangs in the air, bent chamber, slow-motion posing'
    },
    {
        id: 'kungfu',
        name: 'Kung fu',
        sauce: 'Action and reaction stay in the same frame. The camera is placed for the technique, not for coverage.',
        shotType: 'Wide Shot (WS)',
        camera: 'Lateral track with the bodies, hidden cut when a body passes the lens',
        lens: '24mm Wide',
        movement: 'Tracking / Follow',
        lighting: 'Natural Daylight',
        position: 'Wide enough to see both fighters and the floor',
        cut: 'Do not punch in. If a cut is required, hide it behind a body or a pillar',
        sfx: 'Fabric, controlled breath, floor contact, wood if a weapon is present',
        avoid: 'Shaky coverage that hides the technique, floating bodies, cloned faces'
    },
    {
        id: 'superhero',
        name: 'Superhero',
        sauce: 'One vertical or environment move, then weight comes back down. A two-frame hit freeze, then motion returns.',
        shotType: 'Low Angle',
        camera: 'Low angle push toward the strike',
        lens: '24mm Wide',
        movement: 'Dolly In',
        lighting: 'Cinematic Rim Lighting',
        position: 'Below the fighters so the hit reads against the sky or the room',
        cut: 'Freeze on contact for a blink, then release into the reaction',
        sfx: 'Air displacement, cloth delayed by two frames, concrete or debris',
        avoid: 'A montage of poses, capes that ignore gravity, extra fingers'
    },
    {
        id: 'alien',
        name: 'Alien',
        sauce: 'The alien silhouette stays the same. Human anatomy stays human. They never swap faces.',
        shotType: 'Wide Shot (WS)',
        camera: 'Wider than the alien reach, then a close shot of the unfamiliar joint',
        lens: '35mm Standard',
        movement: 'Dolly In',
        lighting: 'Low Key (Dark/Moody)',
        position: 'Far enough that the extra limb is readable before the hit',
        cut: 'Wide for the reach, close only for the joint that strikes',
        sfx: 'A non-human impact, human breath against it, no stock monster roar',
        avoid: 'Melting anatomy, swapped faces, the alien changing limb count'
    },
    {
        id: 'hero',
        name: 'Hero and villain',
        sauce: 'Screen left stays the hero. Screen right stays the villain. Opposite fighting logic. One of them lands the hit.',
        shotType: 'Over the Shoulder (OTS)',
        camera: 'On the hero side of the line, never crossing it in this beat',
        lens: '35mm Standard',
        movement: 'Tracking / Follow',
        lighting: 'Cinematic Rim Lighting',
        position: 'Hero screen left facing right, villain screen right facing left',
        cut: 'Start on the attacker, cut to the receiver at the moment of contact',
        sfx: 'One clean impact, breath, cloth, the room they are actually in',
        avoid: 'Crossing the line, identical costumes, a hit with no result'
    },
    {
        id: 'women',
        name: 'Women\'s fight',
        sauce: 'Same honest coverage as any fight. Technique matches the body. Hair moves as hair. Not a glamour angle.',
        shotType: 'Medium Shot (MS)',
        camera: 'Chest height, inside the clinch, shoulder line visible',
        lens: '35mm Standard',
        movement: 'Handheld / Shaky',
        lighting: 'Natural Daylight',
        position: 'On the line of the strike, not below the costume',
        cut: 'Cut on contact. Show the reset of the feet',
        sfx: 'Breath, cloth, a real body hit, shoes on the actual floor',
        avoid: 'Posing, cloned faces, hair used as a weapon unless the user asks'
    },
    {
        id: 'natural',
        name: 'Natural fight',
        sauce: 'Untrained people. Fear, bad balance, missed swings, grabbing clothes. The sloppy move is the right move.',
        shotType: 'Medium Close-Up',
        camera: 'Documentary handheld, too close, furniture in the way',
        lens: '24mm Wide',
        movement: 'Handheld / Shaky',
        lighting: 'Practical room light',
        position: 'Where a bystander would stand',
        cut: 'Late and messy. Do not polish the hit into a technique',
        sfx: 'Furniture, breath, a miss, cloth tearing, no score',
        avoid: 'Kata, perfect guards, slow motion, clean gym footwork'
    },
    {
        id: 'gun',
        name: 'Gun fight',
        sauce: 'One shot or one reload. Recoil is visible. Eyes stay on the sight. Cover is a real object.',
        shotType: 'Over the Shoulder (OTS)',
        camera: 'Down the weapon line, then the person who receives the shot',
        lens: '50mm Prime',
        movement: 'Static / Tripod',
        lighting: 'Low Key (Dark/Moody)',
        position: 'Behind the shooter, landmark of cover on screen',
        cut: 'Cut from the shot to the reaction. Do not spray a ballet of muzzle flashes',
        sfx: 'Mechanical action, one report, ringing, a shell, breath',
        avoid: 'Endless ammo, guns that bend, muzzle flash with no recoil'
    },
    {
        id: 'street',
        name: 'Street fight',
        sauce: 'Sidewalk and wall are the landmarks. Uneven ground. One dirty move. The crowd stays far.',
        shotType: 'Medium Shot (MS)',
        camera: 'Chest or phone height, 24mm, wall on one side',
        lens: '24mm Wide',
        movement: 'Handheld / Shaky',
        lighting: 'Blue Hour',
        position: 'Against the wall the clinch will hit',
        cut: 'On the shove into the wall, then the answer',
        sfx: 'Traffic far away, shoes on concrete, a body against brick',
        avoid: 'A clean dojo, identical attackers, floating feet'
    },
    {
        id: 'arena',
        name: 'Arena special',
        sauce: 'One special strike. Silhouette stays readable. The arena does not swallow the bodies.',
        shotType: 'Wide Shot (WS)',
        camera: 'Arena wide, then a crash zoom on the special hit',
        lens: '24mm Wide',
        movement: 'Zoom In',
        lighting: 'Harsh Shadows',
        position: 'Both fighters full figure, arena edge as a landmark',
        cut: 'Wide, then the impact, then a hold on who is still standing',
        sfx: 'One designed impact, crowd far, no wall of effects',
        avoid: 'Blur of particles, cloned costumes, extra limbs'
    }
];

export const FIGHT_LANDMARKS = {
    hand: 'the nearest wall',
    boxing: 'the ring rope',
    karate: 'the mat edge',
    kungfu: 'a pillar',
    superhero: 'a cracked wall',
    alien: 'a support beam',
    hero: 'a doorway',
    women: 'a table edge',
    natural: 'a tipped chair',
    gun: 'a block of cover',
    street: 'the brick wall',
    arena: 'the arena edge'
};

export const FIGHT_ROOMS = {
    hand: 'cloth shifts and the floor takes the scuff',
    boxing: 'the rope shivers and the bell stays distant',
    karate: 'the mat prints the foot',
    kungfu: 'dust leaves the floor a beat late',
    superhero: 'debris hangs, then drops',
    alien: 'the human breath fogs against the other body',
    hero: 'dust comes off the doorway',
    women: 'cloth and hair move after the body',
    natural: 'a chair leg scrapes',
    gun: 'a shell hits the floor and the ears ring',
    street: 'grit lifts off the brick',
    arena: 'the arena floor marks the landing'
};

export const FIGHT_STRIKES = {
    hand: [
        { id: 'elbow', name: 'Short elbow', limb: 'lead elbow', verb: 'drives', direction: 'in a short upward line', target: 'jaw', result: 'The head turns a few degrees. The elbow stays on the bone for a blink.', damage: 'the jaw guard drops an inch', contact: 'a dull bone knock' },
        { id: 'shove', name: 'Shoulder shove', limb: 'shoulder', verb: 'drives', direction: 'straight forward', target: 'chest', result: 'The feet slide back one step. The hands stay up.', damage: 'one foot is still recovering', contact: 'a body thud' },
        { id: 'knee', name: 'Clinch knee', limb: 'rear knee', verb: 'lifts', direction: 'up through the clinch', target: 'ribs', result: 'The breath leaves in one grunt. The clinch does not break.', damage: 'a hand clamps the ribs', contact: 'a muffled body hit' }
    ],
    boxing: [
        { id: 'jab', name: 'Lead jab', limb: 'lead hand', verb: 'snaps', direction: 'straight', target: 'guard', result: 'The head turns a few degrees. The glove stays on the jaw for a blink, then the guard comes back up.', damage: 'the lead guard sits an inch lower', contact: 'a sharp glove crack' },
        { id: 'cross', name: 'Rear cross', limb: 'rear hand', verb: 'drives', direction: 'through the guard', target: 'chin', result: 'The rear heel turns. The head snaps off the center line and the gloves find each other again.', damage: 'the chin stays tucked a beat late', contact: 'a heavier glove crack' },
        { id: 'hook', name: 'Lead hook', limb: 'lead hook', verb: 'turns', direction: 'across the guard', target: 'temple', result: 'The lead hip turns. The head tilts and the gloves reset.', damage: 'the high guard is late on that side', contact: 'a leather slap' }
    ],
    karate: [
        { id: 'mae', name: 'Front kick', limb: 'rear foot', verb: 'extends', direction: 'straight out and back', target: 'midsection', result: 'The hip turns, the foot chambers, and it returns to the floor.', damage: 'the receiving hand drops to the ribs', contact: 'a flat foot thud' },
        { id: 'mawashi', name: 'Round kick', limb: 'rear shin', verb: 'cuts', direction: 'across the body', target: 'thigh', result: 'The standing foot pivots. The kicked leg checks and the kicker retracts.', damage: 'the checked thigh stays lifted', contact: 'a sharp shin knock' },
        { id: 'gyaku', name: 'Reverse punch', limb: 'rear fist', verb: 'drives', direction: 'from the hip', target: 'chest', result: 'The fist turns over at the end and pulls straight back.', damage: 'the chest guard is an inch open', contact: 'a short knuckle knock' }
    ],
    kungfu: [
        { id: 'palm', name: 'Palm strike', limb: 'lead palm', verb: 'presses', direction: 'from the waist', target: 'chest', result: 'Both feet stay readable. The palm leaves and the weight returns to the floor.', damage: 'the chest hand is still back', contact: 'a flat palm slap' },
        { id: 'sweep', name: 'Low sweep', limb: 'lead foot', verb: 'cuts', direction: 'along the floor', target: 'lead ankle', result: 'The standing leg stays bent. The swept foot leaves the floor and finds it again.', damage: 'the lead foot is not fully planted', contact: 'a foot scraping the floor' },
        { id: 'knee', name: 'Flying knee', limb: 'rear knee', verb: 'rises', direction: 'up the center', target: 'ribs', result: 'The knee meets the body and both feet come back down.', damage: 'the ribs stay covered', contact: 'a heavy knee thud' }
    ],
    superhero: [
        { id: 'slam', name: 'Environment slam', limb: 'both hands', verb: 'drive', direction: 'down into the floor', target: 'shoulders', result: 'The body hits, dust jumps, and the weight stays down for a blink.', damage: 'one shoulder is still on the ground', contact: 'a concrete crack' },
        { id: 'throw', name: 'One-arm throw', limb: 'lead arm', verb: 'turns', direction: 'across the body', target: 'torso', result: 'The thrown body leaves the line and lands on the same side they started.', damage: 'the thrown fighter is still on a knee', contact: 'air and a body landing' },
        { id: 'charge', name: 'Shoulder charge', limb: 'shoulder', verb: 'drives', direction: 'through a wall', target: 'chest', result: 'The wall gives. Both fighters stay on their own sides of the hole.', damage: 'dust sits on the receiving chest', contact: 'plaster breaking' }
    ],
    alien: [
        { id: 'reach', name: 'Long reach', limb: 'the alien striking limb', verb: 'extends', direction: 'across the gap', target: 'shoulder', result: 'The limb count does not change. The human shoulder turns away.', damage: 'the human shoulder stays turned in', contact: 'a hard non-human knock' },
        { id: 'grab', name: 'Joint grab', limb: 'the alien hand', verb: 'closes', direction: 'onto the wrist', target: 'wrist', result: 'The human hand stays a human hand. The alien grip does not grow new fingers.', damage: 'the wrist is still caught', contact: 'a wet hard click' },
        { id: 'shove', name: 'Mass shove', limb: 'the alien torso', verb: 'drives', direction: 'forward', target: 'ribs', result: 'The human slides, feet still human, and the alien silhouette stays the same.', damage: 'the human is a step off balance', contact: 'a heavy body press' }
    ],
    hero: [
        { id: 'press', name: 'Hero press', limb: 'lead fist', verb: 'drives', direction: 'from screen left', target: 'guard', result: 'The hero stays screen left. The villain gives one step and does not cross the line.', damage: 'the villain guard is open on the hero side', contact: 'a clean knuckle hit' },
        { id: 'answer', name: 'Villain answer', limb: 'villain lead hand', verb: 'snaps', direction: 'back toward screen left', target: 'shoulder', result: 'The answer is one beat. The hero remains screen left.', damage: 'the hero shoulder is turned', contact: 'a short counter hit' },
        { id: 'finish', name: 'Line-holding finish', limb: 'rear hand', verb: 'drives', direction: 'down the original line', target: 'chest', result: 'Someone lands the hit. Nobody swaps sides.', damage: 'the receiver is on a knee, still on their side', contact: 'one heavy impact' }
    ],
    women: [
        { id: 'cross', name: 'Rear cross', limb: 'rear hand', verb: 'drives', direction: 'from the hip', target: 'cheek guard', result: 'The shoulder line stays visible. The feet reset. Hair follows the head, it does not strike.', damage: 'the cheek guard is late', contact: 'a clean knuckle hit' },
        { id: 'clinch', name: 'Clinch break', limb: 'forearms', verb: 'frame', direction: 'off the collar', target: 'shoulders', result: 'The clinch opens one inch. Both fighters find their feet.', damage: 'one hand is still on the collar', contact: 'cloth and a short shove' },
        { id: 'knee', name: 'Close knee', limb: 'rear knee', verb: 'lifts', direction: 'through the clinch', target: 'thigh', result: 'The hips stay under the body. The knee returns.', damage: 'the thigh check is still up', contact: 'a short thigh knock' }
    ],
    natural: [
        { id: 'swing', name: 'Wild swing', limb: 'a loose arm', verb: 'swings', direction: 'from too far away', target: 'shoulder', result: 'The swing misses the chin and grabs cloth instead. Balance is bad.', damage: 'a fistful of shirt is still caught', contact: 'a miss and cloth' },
        { id: 'shove', name: 'Two-hand shove', limb: 'both hands', verb: 'shove', direction: 'into furniture', target: 'chest', result: 'A chair moves. Nobody looks trained.', damage: 'one person is against the furniture', contact: 'hands on cloth and a chair scrape' },
        { id: 'grab', name: 'Hair and collar', limb: 'both hands', verb: 'grab', direction: 'down', target: 'collar', result: 'It is ugly and short. The grab breaks because the feet slip.', damage: 'the collar is stretched', contact: 'cloth tearing' }
    ],
    gun: [
        { id: 'shot', name: 'One shot', limb: 'the firing hand', verb: 'fires', direction: 'down the sight', target: 'cover, not a ballet of flashes', result: 'One report. The gun kicks. The eyes stay on the sight.', damage: 'the receiver is behind cover and hit or pinned', contact: 'one report and a shell' },
        { id: 'reload', name: 'Reload', limb: 'the support hand', verb: 'seats', direction: 'a magazine', target: 'the weapon', result: 'The eyes leave the sight for the reload and come back.', damage: 'the weapon is not ready for one beat', contact: 'a magazine click' },
        { id: 'peek', name: 'Peek and shot', limb: 'the firing hand', verb: 'fires', direction: 'from the edge of cover', target: 'the opposite cover', result: 'One shot, then the shooter returns behind the same cover.', damage: 'the receiver stays behind their cover', contact: 'one report off the cover edge' }
    ],
    street: [
        { id: 'wall', name: 'Wall shove', limb: 'both hands', verb: 'drive', direction: 'into the brick', target: 'shoulders', result: 'The back hits the wall. The feet stay on uneven ground.', damage: 'the shoulders are still on the brick', contact: 'a body against brick' },
        { id: 'dirty', name: 'Dirty hand', limb: 'lead hand', verb: 'clubs', direction: 'down', target: 'ear', result: 'It is one dirty hit, then a grab. No kata.', damage: 'the ear side hand is down', contact: 'a slap and a grab' },
        { id: 'knee', name: 'Street knee', limb: 'rear knee', verb: 'lifts', direction: 'up in the clinch', target: 'thigh', result: 'The wall stays behind the receiver. The knee comes down onto the pavement.', damage: 'the thigh is still checked', contact: 'a knee and grit' }
    ],
    arena: [
        { id: 'special', name: 'Special strike', limb: 'the lead striking limb', verb: 'cuts', direction: 'across the arena', target: 'chest', result: 'The silhouette stays readable. One special hit, then a hold.', damage: 'the receiver is on a knee at the arena edge', contact: 'one designed impact' },
        { id: 'launcher', name: 'Launcher', limb: 'both hands', verb: 'drive', direction: 'up off the floor', target: 'ribs', result: 'The body leaves the floor and lands on the same side.', damage: 'the landing knee is still down', contact: 'a lift and a hard landing' },
        { id: 'stamp', name: 'Stamp', limb: 'the lead foot', verb: 'drives', direction: 'down', target: 'the floor beside the body', result: 'The stamp hits the floor, not through the body. Dust jumps.', damage: 'dust is still on the downed fighter', contact: 'a floor crack' }
    ]
};
