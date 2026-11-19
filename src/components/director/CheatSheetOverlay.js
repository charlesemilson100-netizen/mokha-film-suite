import React from 'react';
import ReactDOM from 'react-dom';
import { Icon } from '../ui/Icon';
import { SHORTCUT_GROUPS } from '../../data/catalog';

// ── Director Intelligence Suite: CheatSheetOverlay ───────────────────
        export const CheatSheetOverlay = ({ isOpen, onClose }) => {
            React.useEffect(() => {
                const handler = (e) => { if (e.key === 'Escape' || e.key === '?') onClose(); };
                if (isOpen) document.addEventListener('keydown', handler);
                return () => document.removeEventListener('keydown', handler);
            }, [isOpen, onClose]);

            if (!isOpen) return null;
            return ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
                    <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl animate-palette-in" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 flex items-center justify-between px-5 py-3 border-b border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark z-10">
                            <span className="text-sm font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest">⌨ Keyboard Shortcuts</span>
                            <button onClick={onClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors"><Icon name="X" size={16}/></button>
                        </div>
                        {/* Groups */}
                        <div className="p-5 space-y-5">
                            {SHORTCUT_GROUPS.map(group => (
                                <div key={group.label}>
                                    <div className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-2">{group.label}</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {group.shortcuts.map(s => (
                                            <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark">
                                                <span className="text-xs text-textMain-light dark:text-textMain-dark">{s.description}</span>
                                                <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-primary ml-2 shrink-0">{s.display}</kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 pb-4 text-[9px] text-textMuted-light dark:text-textMuted-dark text-center">Press <kbd className="font-mono bg-input-light dark:bg-input-dark px-1 rounded border border-border-light dark:border-border-dark">?</kbd> or <kbd className="font-mono bg-input-light dark:bg-input-dark px-1 rounded border border-border-light dark:border-border-dark">Esc</kbd> to close</div>
                    </div>
                </div>,
                document.body
            );
        };

