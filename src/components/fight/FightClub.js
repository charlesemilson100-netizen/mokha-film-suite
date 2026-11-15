import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { FIGHT_BEATS, FIGHT_DURATIONS, FIGHT_LEVELS, FIGHT_SKILLS, FIGHT_STRIKES, FIGHT_STYLES } from '../../data/fightClub';
import { buildFightPrompt } from '../../engine/fightPrompt';

const STORAGE_KEY = 'mokha_fight_projects';
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
    styleId: 'hand',
    strikeId: 'elbow',
    beat: 'clash',
    duration: '5s',
    location: '',
    note: '',
    lines: [],
    fighters: [emptyFighter()]
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

export const FightClub = ({ onClose, onApply, characters = [], locations = [] }) => {
    const [draft, setDraft] = useState(freshDraft);
    const [saved, setSaved] = useState(loadSaved);
    const [frame, setFrame] = useState({ x: 70, y: 36, w: 1040, h: 700 });
    const [menu, setMenu] = useState(null);
    const history = useRef([]);
    const drag = useRef(null);
    const style = FIGHT_STYLES.find(item => item.id === draft.styleId) || FIGHT_STYLES[0];
    const prompt = useMemo(() => buildFightPrompt(draft, { characters, locations }), [draft, characters, locations]);
    const names = draft.fighters.flatMap(fighter => fighter.role === 'group'
        ? Array.from({ length: Math.min(15, Math.max(1, Number(fighter.count) || 1)) }, (_, i) => `${fighter.nameStyle === 'antagonist' ? 'Antagonist' : 'Villain'} ${i + 1}`)
        : [fighter.name].filter(Boolean));

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
                setFrame(prev => ({ ...prev, w: Math.max(720, event.clientX - prev.x), h: Math.max(460, event.clientY - prev.y) }));
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
    const openMenu = (event, items) => {
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY, items });
    };

    return (
        <div className="fixed inset-0 z-[120] pointer-events-none">
            <div className="pointer-events-auto absolute bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}>
                <div className="px-3 py-2 border-b border-border-light dark:border-border-dark flex items-center gap-2 cursor-move" onMouseDown={(event) => { drag.current = { kind: 'move', dx: event.clientX - frame.x, dy: event.clientY - frame.y }; }}>
                    <Icon name="Activity" size={16} className="text-red-500" />
                    <div className="flex-1">
                        <input value={draft.projectName} onChange={e => patch({ projectName: e.target.value })} className="bg-transparent font-black text-sm outline-none w-full" />
                        <input value={draft.description} onChange={e => patch({ description: e.target.value })} placeholder="What this fight is about" className="bg-transparent text-[10px] text-textMuted-light dark:text-textMuted-dark outline-none w-full" />
                    </div>
                    <button title="Undo (Ctrl+Z)" onClick={undo} className="p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark"><Icon name="Undo" size={14} /></button>
                    <button title="Save fight" onClick={saveProject} className="p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark"><Icon name="Save" size={14} /></button>
                    <button title="Expand" onClick={() => setFrame(prev => prev.w > 1200 ? { x: 70, y: 36, w: 1040, h: 700 } : { x: 16, y: 16, w: window.innerWidth - 32, h: window.innerHeight - 32 })} className="p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark"><Icon name="Maximize" size={14} /></button>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark"><Icon name="X" size={14} /></button>
                </div>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0">
                    <div className="overflow-y-auto custom-scrollbar p-3 border-r border-border-light dark:border-border-dark space-y-2">
                        {FIGHT_STYLES.map(item => (
                            <button key={item.id} onClick={() => patch({ styleId: item.id, strikeId: (FIGHT_STRIKES[item.id] || [])[0]?.id })} onDoubleClick={() => patch({ styleId: item.id, strikeId: (FIGHT_STRIKES[item.id] || [])[0]?.id, projectName: draft.projectName === 'New fight' ? `${item.name} fight` : draft.projectName })} onContextMenu={(event) => openMenu(event, [
                                { label: 'Use this style', icon: 'Check', run: () => patch({ styleId: item.id }) },
                                { label: 'Name the fight after it', icon: 'Edit', run: () => patch({ styleId: item.id, projectName: `${item.name} fight` }) },
                                { label: 'Copy its secret', icon: 'Copy', run: () => navigator.clipboard.writeText(item.sauce) }
                            ])} className={`w-full text-left p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 ${draft.styleId === item.id ? 'border-primary bg-primary/15 shadow-[0_0_0_1px_rgba(234,179,8,0.35)]' : 'border-border-light dark:border-border-dark'}`}>
                                <div className="flex items-center gap-2 text-sm font-bold"><Icon name="Zap" size={12} className="text-red-400" />{item.name}</div>
                                <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-1 leading-snug">{item.sauce}</div>
                            </button>
                        ))}
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-3 space-y-3 border-r border-border-light dark:border-border-dark">
                        <label className="block text-[10px] font-bold uppercase"><Icon name="AlignLeft" size={11} className="inline mr-1" />Your fight note
                            <textarea value={draft.note} onChange={e => patch({ note: e.target.value })} placeholder="Write the beat. Use @Name for a character you already have." className="mt-1 w-full h-20 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs" />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="text-[10px] font-bold uppercase">Beat
                                <select value={draft.beat} onChange={e => patch({ beat: e.target.value })} className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs">
                                    {FIGHT_BEATS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                            </label>
                            {draft.beat !== 'setup' && (
                                <label className="col-span-2 text-[10px] font-bold uppercase"><Icon name="Zap" size={11} className="inline mr-1" />Named hit
                                    <select value={draft.strikeId || (FIGHT_STRIKES[draft.styleId] || [])[0]?.id} onChange={e => patch({ strikeId: e.target.value })} className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs">
                                        {(FIGHT_STRIKES[draft.styleId] || FIGHT_STRIKES.hand).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </label>
                            )}
                            <label className="text-[10px] font-bold uppercase">Length
                                <select value={draft.duration} onChange={e => patch({ duration: e.target.value })} className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs">
                                    {FIGHT_DURATIONS.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                        </div>
                        <label className="block text-[10px] font-bold uppercase"><Icon name="MapPin" size={11} className="inline mr-1" />Location
                            <input value={draft.location} onChange={e => patch({ location: e.target.value })} placeholder="Alley, ring, stairwell" className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs" />
                        </label>
                        {locations.length > 0 && (
                            <select value="" onChange={e => e.target.value && patch({ location: e.target.value })} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs">
                                <option value="">Pick a saved location</option>
                                {locations.map(loc => <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>)}
                            </select>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase"><Icon name="Users" size={11} className="inline mr-1" />Fighters</span>
                            <button onClick={() => commit(prev => ({ ...prev, fighters: [...prev.fighters, emptyFighter('group')] }))} className="text-[10px] font-bold px-2 py-1 rounded border border-primary/40 text-primary">Add fighter</button>
                        </div>
                        {characters.length > 0 && (
                            <select value="" onChange={e => {
                                const found = characters.find(char => char.name === e.target.value);
                                if (!found) return;
                                commit(prev => ({ ...prev, fighters: [...prev.fighters, { ...emptyFighter('protagonist'), name: found.name, customSkill: found.appearance || found.role || '' }] }));
                            }} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs">
                                <option value="">Add someone from your cast</option>
                                {characters.map(char => <option key={char.id || char.name} value={char.name}>{char.name}</option>)}
                            </select>
                        )}
                        {draft.fighters.map(f => (
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
                            <button onClick={() => commit(prev => ({ ...prev, lines: [...(prev.lines || []), { id: emptyFighter().id, speaker: names[0] || '', text: '' }] }))} className="text-[10px] font-bold px-2 py-1 rounded border border-fuchsia-500/40 text-fuchsia-400">Add line</button>
                        </div>
                        {(draft.lines || []).map(line => (
                            <div key={line.id} className="flex gap-2">
                                <input value={line.speaker} onChange={e => { const value = e.target.value; commit(prev => ({ ...prev, lines: prev.lines.map(item => item.id === line.id ? { ...item, speaker: value } : item) })); }} placeholder="Who" list="fight-speakers" className="w-28 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                                <input value={line.text} onChange={e => { const value = e.target.value; commit(prev => ({ ...prev, lines: prev.lines.map(item => item.id === line.id ? { ...item, text: value } : item) })); }} placeholder="A short line" className="flex-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                            </div>
                        ))}
                        <datalist id="fight-speakers">{[...names, ...characters.map(c => c.name)].map(name => <option key={name} value={name} />)}</datalist>
                        {saved.length > 0 && (
                            <div className="pt-2 border-t border-border-light dark:border-border-dark">
                                <div className="text-[10px] font-bold uppercase mb-1">Saved fights</div>
                                {saved.slice(0, 6).map(item => (
                                    <button key={item.id} onDoubleClick={() => commit(item)} onClick={() => commit(item)} className="block w-full text-left text-[11px] py-1 hover:text-primary">{item.projectName}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-h-0 p-3" onContextMenu={(event) => openMenu(event, [
                        { label: 'Copy prompt', icon: 'Copy', run: () => navigator.clipboard.writeText(prompt) },
                        { label: 'Send as a scene', icon: 'Film', run: () => onApply(draft) }
                    ])}>
                        <div className="text-[10px] font-bold uppercase mb-2">Fight prompt</div>
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
                            <button onClick={() => navigator.clipboard.writeText(prompt)} className="flex-1 py-2 rounded-lg border border-border-light dark:border-border-dark text-xs font-bold">Copy</button>
                            <button onClick={() => onApply(draft)} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold">Send as scene</button>
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
