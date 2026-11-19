import React from 'react';
import { Icon } from '../ui/Icon';
import { getGradient } from '../ui/widgets';
import { CHAR_ARCHETYPES, CHAR_RANDOM, CHAR_ROLES, randChar } from '../../data/characters';

export const CharacterNode = ({ char, draggingChar, handleCharMouseDown, handleConnectorMouseDown, handleCharacterChange, removeCharacter, charCount }) => {
        const [expanded, setExpanded] = React.useState(false);
        const gradient = getGradient(char.name || 'char');
        return (
            <div
                className="character-node absolute bg-panel-light dark:bg-panel-dark rounded-xl border border-border-light dark:border-border-dark/60 shadow-xl cursor-grab active:cursor-grabbing transition-all"
                style={{ left: `${char.x}px`, top: `${char.y}px`, width: expanded ? '320px' : '220px', transform: draggingChar?.id === char.id ? 'scale(1.03)' : 'scale(1)', zIndex: draggingChar?.id === char.id ? 50 : 1 }}
                onMouseDown={(e) => handleCharMouseDown(e, char.id)}
                data-char-id={char.id}
            >
                {/* Header */}
                <div className={`flex items-center gap-2 p-2.5 rounded-t-xl bg-gradient-to-r ${gradient} bg-opacity-20`}>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-sm shrink-0 shadow`}>
                        {(char.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <input
                        value={char.name}
                        onChange={e => handleCharacterChange(char.id, 'name', e.target.value)}
                        className="bg-transparent font-bold text-white text-sm outline-none w-full placeholder-white/50 drop-shadow"
                        placeholder="Character name..."
                    />
                    <div className="flex items-center shrink-0 gap-0.5">
                        <button onMouseDown={(e) => handleConnectorMouseDown(e, char.id)} className="text-white/70 hover:text-white p-1 cursor-crosshair" title="Link to another character"><Icon name="Link" size={13}/></button>
                        <button onClick={() => setExpanded(v => !v)} className="text-white/70 hover:text-white p-1" title={expanded ? 'Collapse' : 'Expand'}><Icon name={expanded ? 'Minimize' : 'Maximize'} size={13}/></button>
                        <button onClick={() => removeCharacter(char.id)} disabled={charCount <= 1} className="text-white/50 hover:text-red-300 p-1 disabled:opacity-20 disabled:cursor-not-allowed"><Icon name="Trash2" size={13}/></button>
                    </div>
                </div>

                {/* Role + Archetype row */}
                <div className="flex gap-1.5 px-2.5 pt-2">
                    <div className="flex-1">
                        <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase mb-0.5">Role</div>
                        <select value={char.role || ''} onChange={e => handleCharacterChange(char.id, 'role', e.target.value)} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1 text-[10px] outline-none focus:border-amber-500 text-textMain-light dark:text-textMain-dark">
                            <option value="">-- Role --</option>
                            {CHAR_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase mb-0.5">Archetype</div>
                        <select value={char.archetype || ''} onChange={e => handleCharacterChange(char.id, 'archetype', e.target.value)} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1 text-[10px] outline-none focus:border-amber-500 text-textMain-light dark:text-textMain-dark">
                            <option value="">-- Archetype --</option>
                            {CHAR_ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>

                {/* Core fields */}
                <div className="flex flex-col gap-1.5 p-2.5 text-xs">
                    {[
                        { key: 'motivation', label: 'Motivation', placeholder: 'What drives them?' },
                        { key: 'fear',       label: 'Fear',       placeholder: 'What terrifies them?' },
                        { key: 'contradiction', label: 'Contradiction', placeholder: 'Their inner conflict...' },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase">{label}</span>
                                <button type="button" onClick={() => handleCharacterChange(char.id, key, randChar(key))} className="text-[8px] px-1 py-0.5 rounded bg-panel-light dark:bg-base-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:border-primary transition-all">✦</button>
                            </div>
                            <input value={char[key] || ''} onChange={e => handleCharacterChange(char.id, key, e.target.value)} placeholder={placeholder} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 outline-none focus:border-amber-500 text-textMain-light dark:text-textMain-dark" />
                        </div>
                    ))}
                </div>

                {/* Expanded fields */}
                {expanded && (
                    <div className="flex flex-col gap-1.5 px-2.5 pb-2.5 text-xs border-t border-border-light dark:border-border-dark pt-2">
                        {[
                            { key: 'appearance', label: 'Appearance', placeholder: 'Physical description...' },
                            { key: 'backstory',  label: 'Backstory',  placeholder: 'Their history...' },
                            { key: 'voiceStyle', label: 'Voice Style', placeholder: 'How they speak...' },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase">{label}</span>
                                    <button type="button" onClick={() => handleCharacterChange(char.id, key, randChar(key))} className="text-[8px] px-1 py-0.5 rounded bg-panel-light dark:bg-base-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:border-primary transition-all">✦</button>
                                </div>
                                <textarea value={char[key] || ''} onChange={e => handleCharacterChange(char.id, key, e.target.value)} placeholder={placeholder} rows={2} className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded p-1.5 outline-none focus:border-amber-500 resize-none text-textMain-light dark:text-textMain-dark custom-scrollbar" />
                            </div>
                        ))}
                        {/* Auto-fill all */}
                        <button type="button" onClick={() => {
                            ['motivation','fear','contradiction','appearance','backstory','voiceStyle','role','archetype'].forEach(k => {
                                if (CHAR_RANDOM[k]) handleCharacterChange(char.id, k, randChar(k));
                            });
                            if (!char.name || char.name.startsWith('Character')) handleCharacterChange(char.id, 'name', randChar('name'));
                        }} className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-all">
                            <Icon name="Sparkles" size={11}/> Auto-Fill All Fields
                        </button>
                    </div>
                )}
            </div>
        );
    };

