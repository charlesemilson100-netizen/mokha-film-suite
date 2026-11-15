import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { FIGHT_BEATS, FIGHT_DURATIONS, FIGHT_LEVELS, FIGHT_SKILLS, FIGHT_STRIKES, FIGHT_STYLES } from '../../data/fightClub';
import { buildFightPrompt, draftFromEditorShot } from '../../engine/fightPrompt';

const STORAGE_KEY = 'mokha_fight_projects';
const fieldClass = 'mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs';
const press = 'transition-transform duration-100 active:scale-95';
const STYLE_LOOK = {
    hand: { icon: 'Zap', tint: 'from-rose-600/80 to-orange-950/50', tag: 'Close' },
    boxing: { icon: 'Activity', tint: 'from-amber-500/80 to-red-950/50', tag: 'Ring' },
    karate: { icon: 'Move', tint: 'from-sky-500/80 to-slate-950/50', tag: 'Line' },
    kungfu: { icon: 'Sparkles', tint: 'from-emerald-500/70 to-teal-950/60', tag: 'Form' },
    superhero: { icon: 'Zap', tint: 'from-blue-600/80 to-indigo-950/60', tag: 'Impact' },
    alien: { icon: 'Globe', tint: 'from-lime-500/70 to-emerald-950/60', tag: 'Other' },
    hero: { icon: 'Users', tint: 'from-yellow-500/70 to-red-950/50', tag: 'Sides' },
    women: { icon: 'Users', tint: 'from-fuchsia-500/70 to-purple-950/60', tag: 'Even' },
    natural: { icon: 'Home', tint: 'from-stone-400/70 to-stone-950/60', tag: 'Messy' },
    gun: { icon: 'Aperture', tint: 'from-zinc-400/80 to-black/70', tag: 'One shot' },
    street: { icon: 'MapPin', tint: 'from-orange-500/70 to-stone-950/60', tag: 'Wall' },
    arena: { icon: 'Film', tint: 'from-violet-500/80 to-black/60', tag: 'Wide' }
};
const GUIDE = [
    { icon: 'Layout', title: 'Pick a style', body: 'The picture is the distance. The line under it is the secret of that fight.' },
    { icon: 'Users', title: 'Keep the sides', body: 'The hero stays screen left. The threat stays screen right. One landmark does not move.' },
    { icon: 'Zap', title: 'Name one hit', body: 'Limb, target, direction, result. The next beat repeats that same damage.' },
    { icon: 'Link', title: 'Send it back', body: 'Update the shot you opened, or send a new scene. The editor can send that shot here again.' }
];

const emptyFighter = (role = 'protagonist') => ({
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    role,
    count: 3,
    nameStyle: 'villain',
    dress: 'same',
    skill: 'hand',
    level: 'trained',
    customSkill: ''
});
const freshDraft = () => ({
    projectName: 'New fight',
    description: '',
    stakes: '',
    outcome: '',
    styleId: 'hand',
    strikeId: 'elbow',
    beat: 'clash',
    duration: '5s',
    location: '',
    note: '',
    lines: [],
    fighters: [emptyFighter()],
    source: null
});
const layerColor = {
    Characters: 'text-amber-400',
    Location: 'text-cyan-400',
    Action: 'text-white',
    Dialogue: 'text-fuchsia-400',
    Camera: 'text-sky-400',
    Sound: 'text-emerald-400',
    Frame: 'text-slate-300',
    Geography: 'text-lime-300',
    Hit: 'text-orange-400',
    Avoid: 'text-red-400'
};
const loadSaved = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const remember = (key, value) => localStorage.setItem(key, value);

const ViewSwitch = ({ value, onChange }) => (
    <div className="flex rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
        <button title="Grid" onClick={() => onChange('grid')} className={`p-1.5 ${press} ${value === 'grid' ? 'bg-primary text-white' : 'hover:bg-input-light dark:hover:bg-border-dark'}`}><Icon name="Layout" size={12} /></button>
        <button title="List" onClick={() => onChange('list')} className={`p-1.5 ${press} ${value === 'list' ? 'bg-primary text-white' : 'hover:bg-input-light dark:hover:bg-border-dark'}`}><Icon name="AlignLeft" size={12} /></button>
    </div>
);

export const FightClub = ({ onClose, onApply, onUpdateShot, incoming, editorShot, characters = [], locations = [] }) => {
    const [draft, setDraft] = useState(freshDraft);
    const [saved, setSaved] = useState(loadSaved);
    const [frame, setFrame] = useState({ x: 40, y: 24, w: 1180, h: 760 });
    const [menu, setMenu] = useState(null);
    const [styleView, setStyleView] = useState(() => localStorage.getItem('mokha_fight_style_view') || 'grid');
    const [projectView, setProjectView] = useState(() => localStorage.getItem('mokha_fight_project_view') || 'grid');
    const [showGuide, setShowGuide] = useState(() => localStorage.getItem('mokha_fight_guide') !== 'closed');
    const history = useRef([]);
    const drag = useRef(null);
    const style = FIGHT_STYLES.find(item => item.id === draft.styleId) || FIGHT_STYLES[0];
    const prompt = useMemo(() => buildFightPrompt(draft, { characters, locations }), [draft, characters, locations]);
    const names = (draft.fighters || []).flatMap(fighter => fighter.role === 'group'
        ? Array.from({ length: Math.min(15, Math.max(1, Number(fighter.count) || 1)) }, (_, i) => `${fighter.nameStyle === 'antagonist' ? 'Antagonist' : 'Villain'} ${i + 1}`)
        : [fighter.name].filter(Boolean));
    const durations = [...new Set([...FIGHT_DURATIONS, draft.duration].filter(Boolean))];
    const checks = [
        { ok: draft.projectName.trim() && draft.projectName.trim() !== 'New fight', label: 'Name' },
        { ok: names.length > 0, label: 'Fighter' },
        { ok: Boolean((draft.location || '').trim()), label: 'Place' },
        { ok: draft.beat === 'setup' || Boolean(draft.strikeId), label: 'Hit' }
    ];

    const commit = (updater) => {
        setDraft(prev => {
            history.current.push(prev);
            if (history.current.length > 40) history.current.shift();
            return typeof updater === 'function' ? updater(prev) : updater;
        });
    };
    const undo = () => {
        const prev = history.current.pop();
        if (prev) setDraft(prev);
    };
    useEffect(() => {
        if (!incoming?.draft) return;
        setDraft(prev => {
            history.current.push(prev);
            const next = { ...freshDraft(), ...incoming.draft };
            if (!next.fighters?.length) next.fighters = freshDraft().fighters;
            return next;
        });
    }, [incoming?.token]);
    useEffect(() => {
        const onKey = (event) => {
            const key = typeof event.key === 'string' ? event.key : '';
            const altGraph = event.ctrlKey && event.altKey && !event.metaKey;
            if (altGraph || !key) return;
            if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });
    useEffect(() => {
        const move = (event) => {
            if (!drag.current) return;
            if (drag.current.kind === 'move') {
                setFrame(prev => ({ ...prev, x: event.clientX - drag.current.dx, y: event.clientY - drag.current.dy }));
            } else {
                setFrame(prev => ({ ...prev, w: Math.max(860, event.clientX - prev.x), h: Math.max(520, event.clientY - prev.y) }));
            }
        };
        const up = () => { drag.current = null; };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    }, []);

    const patch = (partial) => commit(prev => ({ ...prev, ...partial }));
    const updateFighter = (id, partial) => commit(prev => ({ ...prev, fighters: prev.fighters.map(f => f.id === id ? { ...f, ...partial } : f) }));
    const saveProject = () => {
        const record = { ...draft, id: draft.id || `fight_${Date.now()}`, savedAt: Date.now() };
        const next = [record, ...saved.filter(item => item.id !== record.id)];
        setSaved(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setDraft(record);
    };
    const removeProject = (id) => {
        const next = saved.filter(item => item.id !== id);
        setSaved(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };
    const openMenu = (event, items) => {
        event.preventDefault();
        event.stopPropagation();
        setMenu({ x: event.clientX, y: event.clientY, items });
    };
    const useStyle = (item) => patch({ styleId: item.id, strikeId: (FIGHT_STRIKES[item.id] || [])[0]?.id });
    const bringEditor = () => {
        if (!editorShot?.shot) return;
        const imported = draftFromEditorShot(editorShot.shot, editorShot);
        commit({ ...freshDraft(), ...imported, fighters: imported.fighters?.length ? imported.fighters : freshDraft().fighters, lines: imported.lines || [] });
    };
    const canUpdate = Boolean(draft.source?.shotId || draft.source?.label);

    return (
        <div className="fixed inset-0 z-[120] pointer-events-none">
            <div className="pointer-events-auto absolute bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}>
                <div className="px-3 py-2 border-b border-border-light dark:border-border-dark flex items-center gap-2 cursor-move" onMouseDown={(event) => { if (event.target.closest('input, button')) return; drag.current = { kind: 'move', dx: event.clientX - frame.x, dy: event.clientY - frame.y }; }}>
                    <Icon name="Activity" size={16} className="text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <input value={draft.projectName} onChange={e => patch({ projectName: e.target.value })} className="bg-transparent font-black text-sm outline-none w-full" />
                        <input value={draft.description} onChange={e => patch({ description: e.target.value })} placeholder="What this fight is about" className="bg-transparent text-[10px] text-textMuted-light dark:text-textMuted-dark outline-none w-full" />
                    </div>
                    <button title="New fight" onClick={() => commit(freshDraft())} className={`p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark ${press}`}><Icon name="Plus" size={14} /></button>
                    <button title="Guide" onClick={() => { const next = !showGuide; setShowGuide(next); remember('mokha_fight_guide', next ? 'open' : 'closed'); }} className={`p-2 rounded-lg ${press} ${showGuide ? 'bg-primary/15 text-primary' : 'hover:bg-input-light dark:hover:bg-border-dark'}`}><Icon name="BookOpen" size={14} /></button>
                    <button title="Undo (Ctrl+Z)" onClick={undo} className={`p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark ${press}`}><Icon name="Undo" size={14} /></button>
                    <button title="Save fight" onClick={saveProject} className={`p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark ${press}`}><Icon name="Save" size={14} /></button>
                    <button title="Expand" onClick={() => setFrame(prev => prev.w > 1300 ? { x: 40, y: 24, w: 1180, h: 760 } : { x: 16, y: 16, w: window.innerWidth - 32, h: window.innerHeight - 32 })} className={`p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark ${press}`}><Icon name="Maximize" size={14} /></button>
                    <button onClick={onClose} className={`p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark ${press}`}><Icon name="X" size={14} /></button>
                </div>
                <div className="px-3 py-2 border-b border-border-light dark:border-border-dark grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <label className="text-[10px] font-bold uppercase"><Icon name="AlertTriangle" size={11} className="inline mr-1" />Stakes
                        <input value={draft.stakes || ''} onChange={e => patch({ stakes: e.target.value })} placeholder="What can be lost" className={fieldClass} />
                    </label>
                    <label className="text-[10px] font-bold uppercase"><Icon name="Check" size={11} className="inline mr-1" />Outcome
                        <input value={draft.outcome || ''} onChange={e => patch({ outcome: e.target.value })} placeholder="Who is left standing" className={fieldClass} />
                    </label>
                    <div className="flex items-center gap-2 pb-0.5">
                        {draft.source?.shotId || draft.source?.label ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1"><Icon name="Link" size={11} />{draft.source.label}</span>
                        ) : (
                            <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Not linked yet</span>
                        )}
                        {editorShot?.shot && (
                            <button onClick={bringEditor} className={`text-[10px] font-bold px-2 py-1 rounded-lg border border-primary/40 text-primary ${press}`}>Bring in {editorShot.label}</button>
                        )}
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] min-h-0">
                    <div className="overflow-y-auto custom-scrollbar p-3 border-r border-border-light dark:border-border-dark">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase">Fight styles</span>
                            <ViewSwitch value={styleView} onChange={(value) => { setStyleView(value); remember('mokha_fight_style_view', value); }} />
                        </div>
                        <div className={styleView === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                            {FIGHT_STYLES.map(item => {
                                const look = STYLE_LOOK[item.id] || STYLE_LOOK.hand;
                                const selected = draft.styleId === item.id;
                                return (
                                    <button key={item.id} onClick={() => useStyle(item)} onDoubleClick={() => patch({ styleId: item.id, strikeId: (FIGHT_STRIKES[item.id] || [])[0]?.id, projectName: draft.projectName === 'New fight' ? `${item.name} fight` : draft.projectName })} onContextMenu={(event) => openMenu(event, [
                                        { label: 'Use this style', icon: 'Check', run: () => useStyle(item) },
                                        { label: 'Name the fight after it', icon: 'Edit', run: () => patch({ styleId: item.id, strikeId: (FIGHT_STRIKES[item.id] || [])[0]?.id, projectName: `${item.name} fight` }) },
                                        { label: 'Copy its secret', icon: 'Copy', run: () => navigator.clipboard.writeText(item.sauce) }
                                    ])} className={`text-left rounded-xl border ${press} hover:border-primary/60 ${selected ? 'border-primary bg-primary/15 shadow-[0_0_0_1px_rgba(234,179,8,0.35)]' : 'border-border-light dark:border-border-dark'}`}>
                                        {styleView === 'grid' ? (
                                            <>
                                                <div className={`h-16 rounded-t-xl bg-gradient-to-br ${look.tint} flex items-center justify-center relative`}>
                                                    <Icon name={look.icon} size={26} className="text-white drop-shadow" />
                                                    <span className="absolute bottom-1 left-1.5 text-[8px] font-black uppercase tracking-wider text-white/90">{look.tag}</span>
                                                </div>
                                                <div className="p-2">
                                                    <div className="text-xs font-bold">{item.name}</div>
                                                    <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mt-0.5 leading-snug line-clamp-3">{item.sauce}</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2">
                                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${look.tint} flex items-center justify-center shrink-0`}><Icon name={look.icon} size={16} className="text-white" /></div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold">{item.name}</div>
                                                    <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark truncate">{item.sauce}</div>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-3 space-y-3 border-r border-border-light dark:border-border-dark">
                        {showGuide && (
                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">How a fight is built</span>
                                    <button onClick={() => { setShowGuide(false); remember('mokha_fight_guide', 'closed'); }} className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Hide</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {GUIDE.map((step, index) => (
                                        <div key={step.title} className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center shrink-0">{index + 1}</div>
                                            <div>
                                                <div className="text-[11px] font-bold flex items-center gap-1"><Icon name={step.icon} size={11} />{step.title}</div>
                                                <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark leading-snug">{step.body}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-1">
                            {FIGHT_BEATS.filter(item => item.id !== 'exchange').map(item => (
                                <button key={item.id} onClick={() => patch({ beat: item.id })} className={`rounded-lg border px-1.5 py-1.5 text-left ${press} ${draft.beat === item.id ? 'border-primary bg-primary/15' : 'border-border-light dark:border-border-dark hover:border-primary/40'}`}>
                                    <div className="text-[10px] font-black">{item.name}</div>
                                    <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark leading-tight">{item.hint}</div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => patch({ beat: 'exchange' })} className={`w-full text-left rounded-lg border px-2 py-1.5 text-[10px] font-bold ${press} ${draft.beat === 'exchange' ? 'border-primary bg-primary/15' : 'border-border-light dark:border-border-dark'}`}>Full exchange. Four shots: setup, clash, impact, aftermath.</button>
                        <label className="block text-[10px] font-bold uppercase"><Icon name="AlignLeft" size={11} className="inline mr-1" />Fight note
                            <textarea value={draft.note} onChange={e => patch({ note: e.target.value })} placeholder="Write the beat. Use @Name for a character you already have." className={`${fieldClass} h-16`} />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {draft.beat !== 'setup' && (
                                <label className="text-[10px] font-bold uppercase"><Icon name="Zap" size={11} className="inline mr-1" />Named hit
                                    <select value={draft.strikeId || (FIGHT_STRIKES[draft.styleId] || [])[0]?.id} onChange={e => patch({ strikeId: e.target.value })} className={fieldClass}>
                                        {(FIGHT_STRIKES[draft.styleId] || FIGHT_STRIKES.hand).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </label>
                            )}
                            <label className="text-[10px] font-bold uppercase">Length
                                <select value={draft.duration} onChange={e => patch({ duration: e.target.value })} className={fieldClass}>
                                    {durations.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                        </div>
                        <label className="block text-[10px] font-bold uppercase"><Icon name="MapPin" size={11} className="inline mr-1" />Location
                            <input value={draft.location} onChange={e => patch({ location: e.target.value })} placeholder="Alley, ring, stairwell" className={fieldClass} />
                        </label>
                        {locations.length > 0 && (
                            <select value="" onChange={e => e.target.value && patch({ location: e.target.value })} className={fieldClass}>
                                <option value="">Pick a saved location</option>
                                {locations.map(loc => <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>)}
                            </select>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase"><Icon name="Users" size={11} className="inline mr-1" />Fighters</span>
                            <button onClick={() => commit(prev => ({ ...prev, fighters: [...prev.fighters, emptyFighter('group')] }))} className={`text-[10px] font-bold px-2 py-1 rounded border border-primary/40 text-primary ${press}`}>Add fighter</button>
                        </div>
                        {characters.length > 0 && (
                            <select value="" onChange={e => {
                                const found = characters.find(char => char.name === e.target.value);
                                if (!found) return;
                                commit(prev => ({ ...prev, fighters: [...prev.fighters, { ...emptyFighter('protagonist'), name: found.name, customSkill: found.appearance || found.role || '' }] }));
                            }} className={fieldClass}>
                                <option value="">Add someone from your cast</option>
                                {characters.map(char => <option key={char.id || char.name} value={char.name}>{char.name}</option>)}
                            </select>
                        )}
                        {(draft.fighters || []).map(f => (
                            <div key={f.id} onDoubleClick={() => updateFighter(f.id, { role: 'protagonist' })} onContextMenu={(event) => openMenu(event, [
                                { label: 'Make protagonist', icon: 'UserPlus', run: () => updateFighter(f.id, { role: 'protagonist' }) },
                                { label: 'Duplicate', icon: 'Copy', run: () => commit(prev => ({ ...prev, fighters: [...prev.fighters, { ...f, id: emptyFighter().id }] })) },
                                { label: 'Remove', icon: 'Trash2', run: () => commit(prev => ({ ...prev, fighters: prev.fighters.filter(item => item.id !== f.id) })) }
                            ])} className="p-2 rounded-xl border border-border-light dark:border-border-dark space-y-2 hover:border-amber-500/40">
                                <div className="flex gap-2">
                                    <input value={f.name} onChange={e => updateFighter(f.id, { name: e.target.value })} placeholder={f.role === 'group' ? 'Group label' : 'Name'} className="flex-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                                    <button onClick={() => commit(prev => ({ ...prev, fighters: prev.fighters.filter(item => item.id !== f.id) }))} className="text-red-500 text-xs px-2">Remove</button>
                                </div>
                                <select value={f.role} onChange={e => updateFighter(f.id, { role: e.target.value })} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs">
                                    <option value="protagonist">Protagonist</option>
                                    <option value="antagonist">Antagonist</option>
                                    <option value="villain">Villain</option>
                                    <option value="group">Group</option>
                                </select>
                                {f.role === 'group' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" min="1" max="15" value={f.count} onChange={e => updateFighter(f.id, { count: Math.min(15, Math.max(1, Number(e.target.value) || 1)) })} className="bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                                        <select value={f.nameStyle} onChange={e => updateFighter(f.id, { nameStyle: e.target.value })} className="bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs">
                                            <option value="villain">Villain 1…</option>
                                            <option value="antagonist">Antagonist 1…</option>
                                        </select>
                                        <select value={f.dress} onChange={e => updateFighter(f.id, { dress: e.target.value })} className="col-span-2 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs">
                                            <option value="same">Same clothes, different faces</option>
                                            <option value="different">Different clothes</option>
                                        </select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={f.skill} onChange={e => updateFighter(f.id, { skill: e.target.value })} className="bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs">
                                        {FIGHT_SKILLS.map(skill => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
                                    </select>
                                    <select value={f.level} onChange={e => updateFighter(f.id, { level: e.target.value })} className="bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs">
                                        {FIGHT_LEVELS.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                                    </select>
                                </div>
                                <input value={f.customSkill} onChange={e => updateFighter(f.id, { customSkill: e.target.value })} placeholder="Or type a skill" className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                            </div>
                        ))}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase"><Icon name="MessageSquare" size={11} className="inline mr-1" />Lines</span>
                            <button onClick={() => commit(prev => ({ ...prev, lines: [...(prev.lines || []), { id: emptyFighter().id, speaker: names[0] || '', text: '' }] }))} className={`text-[10px] font-bold px-2 py-1 rounded border border-fuchsia-500/40 text-fuchsia-400 ${press}`}>Add line</button>
                        </div>
                        {(draft.lines || []).map(line => (
                            <div key={line.id} className="flex gap-2">
                                <input value={line.speaker} onChange={e => { const value = e.target.value; commit(prev => ({ ...prev, lines: prev.lines.map(item => item.id === line.id ? { ...item, speaker: value } : item) })); }} placeholder="Who" list="fight-speakers" className="w-28 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                                <input value={line.text} onChange={e => { const value = e.target.value; commit(prev => ({ ...prev, lines: prev.lines.map(item => item.id === line.id ? { ...item, text: value } : item) })); }} placeholder="A short line" className="flex-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                            </div>
                        ))}
                        <datalist id="fight-speakers">{[...names, ...characters.map(c => c.name)].filter(Boolean).map(name => <option key={name} value={name} />)}</datalist>
                        <div className="pt-2 border-t border-border-light dark:border-border-dark">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase">Fight projects</span>
                                <ViewSwitch value={projectView} onChange={(value) => { setProjectView(value); remember('mokha_fight_project_view', value); }} />
                            </div>
                            {saved.length === 0 && <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Save a fight to keep its name, stakes, and outcome.</div>}
                            <div className={projectView === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
                                {saved.map(item => {
                                    const look = STYLE_LOOK[item.styleId] || STYLE_LOOK.hand;
                                    return (
                                        <button key={item.id} onClick={() => commit(item)} onContextMenu={(event) => openMenu(event, [
                                            { label: 'Open', icon: 'Folder', run: () => commit(item) },
                                            { label: 'Delete', icon: 'Trash2', run: () => removeProject(item.id) }
                                        ])} className={`text-left rounded-xl border border-border-light dark:border-border-dark hover:border-primary/50 ${press} ${projectView === 'grid' ? 'p-2' : 'px-2 py-1.5 flex items-center gap-2'}`}>
                                            <div className={`rounded-lg bg-gradient-to-br ${look.tint} flex items-center justify-center shrink-0 ${projectView === 'grid' ? 'h-10 mb-1' : 'w-7 h-7'}`}><Icon name={look.icon} size={14} className="text-white" /></div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-bold truncate">{item.projectName}</div>
                                                <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark truncate">{item.description || item.stakes || 'No description yet'}</div>
                                                {projectView === 'grid' && item.outcome && <div className="text-[9px] text-emerald-300 truncate">Outcome: {item.outcome}</div>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col min-h-0 p-3" onContextMenu={(event) => openMenu(event, [
                        { label: 'Copy prompt', icon: 'Copy', run: () => navigator.clipboard.writeText(prompt) },
                        { label: 'Send as a scene', icon: 'Film', run: () => onApply(draft) },
                        ...(canUpdate ? [{ label: 'Update the linked shot', icon: 'Link', run: () => onUpdateShot(draft) }] : [])
                    ])}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase">Fight prompt</span>
                            <div className="flex gap-1">
                                {checks.map(item => <span key={item.label} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${item.ok ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' : 'border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark'}`}>{item.label}</span>)}
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar text-[11px] leading-relaxed bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl p-3 space-y-3">
                            {prompt.split('\n\n').map(block => {
                                const splitAt = block.indexOf(':');
                                const label = splitAt > 0 ? block.slice(0, splitAt) : 'Note';
                                const body = splitAt > 0 ? block.slice(splitAt + 1).trim() : block;
                                const terms = [...names, draft.location, draft.duration].filter(item => typeof item === 'string' && item);
                                const highlighted = body.split(new RegExp(`(${terms.map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '$^'})`, 'gi'));
                                return (
                                    <p key={block}>
                                        <span className={`font-black ${layerColor[label] || ''}`}>{label}</span>
                                        <span>: </span>
                                        {highlighted.map((part, index) => {
                                            if (typeof part !== 'string') return null;
                                            const hit = terms.some(item => part.toLowerCase() === item.toLowerCase());
                                            return <span key={`${part}-${index}`} className={hit ? 'bg-amber-500/20 text-amber-300 rounded px-0.5' : ''}>{part}</span>;
                                        })}
                                    </p>
                                );
                            })}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => navigator.clipboard.writeText(prompt)} className={`py-2 px-3 rounded-lg border border-border-light dark:border-border-dark text-xs font-bold ${press}`}>Copy</button>
                            {canUpdate && <button onClick={() => onUpdateShot(draft)} className={`flex-1 py-2 rounded-lg border border-sky-500/40 text-sky-300 text-xs font-bold ${press}`}>Update {draft.source.label}</button>}
                            <button onClick={() => onApply(draft)} className={`flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold ${press}`}>Send as scene</button>
                        </div>
                    </div>
                </div>
                <div className="absolute right-1 bottom-1 w-4 h-4 cursor-nwse-resize" onMouseDown={() => { drag.current = { kind: 'resize' }; }} />
            </div>
            {menu && (
                <div className="pointer-events-auto fixed z-[130] bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl py-1 min-w-[180px]" style={{ left: menu.x, top: menu.y }} onMouseLeave={() => setMenu(null)}>
                    {menu.items.map(item => (
                        <button key={item.label} onClick={() => { item.run(); setMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary/10 flex items-center gap-2"><Icon name={item.icon} size={12} />{item.label}</button>
                    ))}
                </div>
            )}
        </div>
    );
};
