import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 2 — SHOT TIMELINE / FILMSTRIP
        // ═══════════════════════════════════════════════════════════════════
        export const ShotFilmstrip = ({ shots, activeIndex, onSelect, onDelete, onContextMenu }) => {
            const scrollRef = useRef(null);
            useEffect(() => {
                if (scrollRef.current && activeIndex >= 0) {
                    const el = scrollRef.current.children[activeIndex];
                    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }, [activeIndex]);
            if (!shots || shots.length === 0) return null;
            const statusColors = { Planning:'bg-indigo-500', Ready:'bg-primary', Rendering:'bg-accent', Completed:'bg-green-500', Approved:'bg-purple-500' };
            return (
                <div className="w-full bg-base-light dark:bg-[#0d0d0d] border-t border-border-light dark:border-border-dark px-3 py-2 shrink-0">
                    <div className="flex items-center gap-1 mb-1.5">
                        <Icon name="Film" size={11} className="text-textMuted-light dark:text-textMuted-dark"/>
                        <span className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Timeline — {shots.length} shots</span>
                    </div>
                    <div ref={scrollRef} className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        {shots.map((shot, i) => (
                            <div key={shot.id || i} onClick={() => onSelect(i)}
                                onContextMenu={(e) => onContextMenu && onContextMenu(e, i)}
                                className={`filmstrip-frame cursor-pointer rounded-lg border overflow-hidden bg-panel-light dark:bg-panel-dark ${i === activeIndex ? 'active border-primary' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}
                                style={{minWidth:'72px', maxWidth:'72px'}}>
                                <div className="h-10 flex items-center justify-center bg-input-light dark:bg-input-dark relative overflow-hidden">
                                    <span className="text-[8px] font-black text-textMuted-light dark:text-textMuted-dark opacity-40 absolute">{shot.mode === 'image' ? '🖼' : '🎬'}</span>
                                    <span className="text-[9px] font-black text-primary z-10">{i + 1}</span>
                                    {shot.selections?.lighting && <span className="absolute bottom-0 left-0 right-0 h-1" style={{background: shot.selections.lighting.includes('Golden') ? '#f59e0b' : shot.selections.lighting.includes('Blue') ? '#3b82f6' : shot.selections.lighting.includes('Neon') ? '#a855f7' : shot.selections.lighting.includes('Low Key') ? '#1f2937' : '#6b7280'}}/>}
                                </div>
                                <div className="px-1 py-0.5">
                                    <div className="text-[7px] text-textMain-light dark:text-textMain-dark font-bold truncate leading-tight">{(shot.subject || shot.customPromptOverride || 'Shot').substring(0,18)}</div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[shot.status] || 'bg-gray-500'}`}/>
                                        <span className="text-[6px] text-textMuted-light dark:text-textMuted-dark">{shot.selections?.duration || ''}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

