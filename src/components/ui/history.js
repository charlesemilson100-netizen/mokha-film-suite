import { useState } from 'react';
import { Icon } from './Icon';

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 3 — PROMPT HISTORY
        // ═══════════════════════════════════════════════════════════════════
        export const usePromptHistory = () => {
            const [history, setHistory] = useState(() => {
                try { return JSON.parse(localStorage.getItem('mokha_prompt_history') || '[]'); } catch { return []; }
            });
            const addToHistory = (prompt, meta = {}) => {
                if (!prompt?.trim()) return;
                setHistory(prev => {
                    const entry = { id: Date.now(), text: prompt, meta, ts: new Date().toLocaleTimeString() };
                    const next = [entry, ...prev.filter(h => h.text !== prompt)].slice(0, 25);
                    localStorage.setItem('mokha_prompt_history', JSON.stringify(next));
                    return next;
                });
            };
            const clearHistory = () => { setHistory([]); localStorage.removeItem('mokha_prompt_history'); };
            return { history, addToHistory, clearHistory };
        };

export const PromptHistoryPanel = ({ history, onRestore, onClear }) => (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border-light dark:border-border-dark shrink-0">
                    <span className="text-xs font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest flex items-center gap-1.5"><Icon name="Clock" size={13} className="text-primary"/>Prompt History</span>
                    {history.length > 0 && <button onClick={onClear} className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors">Clear All</button>}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
                    {history.length === 0 && <div className="text-center text-textMuted-light dark:text-textMuted-dark text-xs py-8">No history yet.<br/>Generate prompts to see them here.</div>}
                    {history.map((h, i) => (
                        <div key={h.id} className="group bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg p-2 hover:border-primary/40 transition-all cursor-pointer" onClick={() => onRestore(h.text)}>
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[10px] text-textMain-light dark:text-textMain-dark leading-relaxed line-clamp-3 flex-1">{h.text}</p>
                                <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primaryHover" title="Restore"><Icon name="RotateCcw" size={12}/></button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] text-textMuted-light dark:text-textMuted-dark">{h.ts}</span>
                                {h.meta?.mode && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold">{h.meta.mode}</span>}
                                {h.meta?.platform && <span className="text-[8px] px-1 py-0.5 rounded bg-accent/10 text-accent font-bold">{h.meta.platform}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 4 — FAVORITES / PINNED SHOTS
        // ═══════════════════════════════════════════════════════════════════
        export const useFavorites = () => {
            const [favorites, setFavorites] = useState(() => {
                try { return JSON.parse(localStorage.getItem('mokha_favorites') || '[]'); } catch { return []; }
            });
            const toggleFavorite = (shot) => {
                setFavorites(prev => {
                    const exists = prev.find(f => f.id === shot.id);
                    const next = exists ? prev.filter(f => f.id !== shot.id) : [{ ...shot, pinnedAt: Date.now() }, ...prev].slice(0, 50);
                    localStorage.setItem('mokha_favorites', JSON.stringify(next));
                    return next;
                });
            };
            const updateFavorites = (updater) => {
                setFavorites(prev => {
                    const next = typeof updater === 'function' ? updater(prev) : updater;
                    localStorage.setItem('mokha_favorites', JSON.stringify(next));
                    return next;
                });
            };
            const isFavorite = (id) => favorites.some(f => f.id === id);
            return { favorites, toggleFavorite, isFavorite, updateFavorites };
        };

