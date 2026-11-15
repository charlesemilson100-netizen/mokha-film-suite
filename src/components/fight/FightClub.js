import React, { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';
import { FIGHT_BEATS, FIGHT_DURATIONS, FIGHT_LEVELS, FIGHT_SKILLS, FIGHT_STYLES } from '../../data/fightClub';
import { buildFightPrompt } from '../../engine/fightPrompt';

const emptyFighter = () => ({
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    role: 'protagonist',
    count: 3,
    nameStyle: 'villain',
    dress: 'same',
    skill: 'hand',
    level: 'trained',
    customSkill: ''
});

export const FightClub = ({ onClose, onApply }) => {
    const [styleId, setStyleId] = useState('hand');
    const [beat, setBeat] = useState('clash');
    const [duration, setDuration] = useState('5s');
    const [location, setLocation] = useState('');
    const [fighters, setFighters] = useState([emptyFighter()]);
    const style = FIGHT_STYLES.find(item => item.id === styleId) || FIGHT_STYLES[0];
    const draft = useMemo(() => ({ styleId, beat, duration, location, fighters }), [styleId, beat, duration, location, fighters]);
    const prompt = useMemo(() => buildFightPrompt(draft), [draft]);

    const updateFighter = (id, patch) => setFighters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

    return (
        <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-3">
            <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black tracking-wide">Fight Club</h2>
                        <p className="text-[11px] text-textMuted-light dark:text-textMuted-dark">One fight move. One camera move. Built only for a fight.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-input-light dark:hover:bg-border-dark"><Icon name="X" size={16} /></button>
                </div>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0">
                    <div className="overflow-y-auto custom-scrollbar p-3 border-r border-border-light dark:border-border-dark space-y-2">
                        {FIGHT_STYLES.map(item => (
                            <button key={item.id} onClick={() => setStyleId(item.id)} className={`w-full text-left p-3 rounded-xl border ${styleId === item.id ? 'border-primary bg-primary/10' : 'border-border-light dark:border-border-dark'}`}>
                                <div className="text-sm font-bold">{item.name}</div>
                                <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-1 leading-snug">{item.sauce}</div>
                            </button>
                        ))}
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-3 space-y-3 border-r border-border-light dark:border-border-dark">
                        <label className="block text-[10px] font-bold uppercase">Beat
                            <select value={beat} onChange={e => setBeat(e.target.value)} className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs">
                                {FIGHT_BEATS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </label>
                        <label className="block text-[10px] font-bold uppercase">Shot length
                            <select value={duration} onChange={e => setDuration(e.target.value)} className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs">
                                {FIGHT_DURATIONS.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                        <label className="block text-[10px] font-bold uppercase">Location
                            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Alley, ring, stairwell" className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 text-xs" />
                        </label>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase">Fighters</span>
                            <button onClick={() => setFighters(prev => [...prev, { ...emptyFighter(), role: 'group' }])} className="text-[10px] font-bold px-2 py-1 rounded border border-primary/40 text-primary">Add fighter</button>
                        </div>
                        {fighters.map(f => (
                            <div key={f.id} className="p-2 rounded-xl border border-border-light dark:border-border-dark space-y-2">
                                <div className="flex gap-2">
                                    <input value={f.name} onChange={e => updateFighter(f.id, { name: e.target.value })} placeholder={f.role === 'group' ? 'Group label' : 'Name'} className="flex-1 bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                                    <button onClick={() => setFighters(prev => prev.filter(item => item.id !== f.id))} className="text-red-500 text-xs px-2">Remove</button>
                                </div>
                                <select value={f.role} onChange={e => updateFighter(f.id, { role: e.target.value })} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs">
                                    <option value="protagonist">Protagonist</option>
                                    <option value="antagonist">Antagonist</option>
                                    <option value="villain">Villain</option>
                                    <option value="group">Group</option>
                                </select>
                                {f.role === 'group' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="text-[10px]">Count, 1 to 15
                                            <input type="number" min="1" max="15" value={f.count} onChange={e => updateFighter(f.id, { count: Math.min(15, Math.max(1, Number(e.target.value) || 1)) })} className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs" />
                                        </label>
                                        <label className="text-[10px]">Names
                                            <select value={f.nameStyle} onChange={e => updateFighter(f.id, { nameStyle: e.target.value })} className="mt-1 w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 text-xs">
                                                <option value="villain">Villain 1, Villain 2</option>
                                                <option value="antagonist">Antagonist 1, Antagonist 2</option>
                                            </select>
                                        </label>
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
                        <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{style.sauce}</p>
                    </div>
                    <div className="flex flex-col min-h-0 p-3">
                        <div className="text-[10px] font-bold uppercase mb-2">Fight prompt</div>
                        <pre className="flex-1 overflow-auto custom-scrollbar text-[11px] whitespace-pre-wrap leading-relaxed bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-xl p-3">{prompt}</pre>
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => navigator.clipboard.writeText(prompt)} className="flex-1 py-2 rounded-lg border border-border-light dark:border-border-dark text-xs font-bold">Copy</button>
                            <button onClick={() => onApply(draft, prompt, style)} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold">Send to editor</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
