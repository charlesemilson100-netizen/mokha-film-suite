import React from 'react';

// ── Director Intelligence Suite: CritiqueBadge ────────────────────────
        export const CritiqueBadge = ({ annotation, onDismiss }) => {
            const [expanded, setExpanded] = React.useState(false);
            const isWarning = annotation.severity === 'warning';
            const colorCls = isWarning
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-accent/20 border-accent/40 text-accent';
            return (
                <div className="relative inline-block">
                    <button
                        onClick={() => setExpanded(p => !p)}
                        className={`text-[7px] font-black px-1 py-0.5 rounded border ${colorCls} uppercase tracking-wide leading-none`}
                        title={annotation.message}>
                        {isWarning ? '⚠' : '💡'} {annotation.code}
                    </button>
                    {expanded && (
                        <div className="absolute bottom-full left-0 mb-1 w-52 p-2.5 rounded-xl bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark shadow-2xl z-[9999] text-[10px]" onClick={e => e.stopPropagation()}>
                            <p className="text-textMain-light dark:text-textMain-dark mb-1 font-bold">{annotation.message}</p>
                            {annotation.suggestion && <p className="text-textMuted-light dark:text-textMuted-dark italic text-[9px]">{annotation.suggestion}</p>}
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => { onDismiss(annotation.id); setExpanded(false); }} className="text-[9px] text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors">Dismiss</button>
                                <button onClick={() => setExpanded(false)} className="text-[9px] text-textMuted-light dark:text-textMuted-dark hover:text-primary transition-colors">Close</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

