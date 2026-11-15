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
