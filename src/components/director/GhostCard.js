// ── Director Intelligence Suite: GhostCard ────────────────────────────
        export const GhostCard = ({ suggestion, onAccept }) => (
            <div
                onClick={onAccept}
                className="filmstrip-frame flex-shrink-0 w-28 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl opacity-50 hover:opacity-90 transition-opacity flex flex-col items-center justify-center gap-2 p-2 cursor-pointer"
                style={{minHeight:'100px'}}
                title={suggestion.rationale}>
                <div className="text-[8px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest text-center leading-tight">
                    {suggestion.fullName}
                </div>
                <div className="text-[7px] text-textMuted-light dark:text-textMuted-dark text-center italic leading-tight px-1">
                    {suggestion.rationale}
                </div>
                <div className="text-[8px] px-2 py-0.5 rounded bg-primary/20 border border-primary/40 text-primary font-bold hover:bg-primary/30 transition-colors">
                    + Add
                </div>
            </div>
        );

