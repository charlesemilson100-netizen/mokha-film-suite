// ── Director Intelligence Suite: SuggestionChip ───────────────────────
        export const SuggestionChip = ({ suggestion, onAccept }) => (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-dashed border-border-light dark:border-border-dark opacity-60 hover:opacity-100 transition-opacity cursor-pointer" onClick={onAccept} title={suggestion.rationale}>
                <span className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase">{suggestion.nextShotType}</span>
                <span className="w-4 h-4 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-black flex items-center justify-center hover:bg-primary/40">+</span>
            </div>
        );

