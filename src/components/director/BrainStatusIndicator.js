// ── Director Intelligence Suite: BrainStatusIndicator ────────────────
        export const BrainStatusIndicator = ({ brainMode, loadingProgress, onClick }) => {
            if (brainMode === 'deep-loading') return (
                <button onClick={onClick} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent/40 bg-accent/10 text-[9px] font-black text-accent uppercase tracking-widest cursor-pointer hover:bg-accent/20 transition-colors" title="Deep Brain loading...">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"/>
                    {loadingProgress > 0 ? `${loadingProgress}%` : 'Loading...'}
                </button>
            );
            if (brainMode === 'deep') return (
                <button onClick={onClick} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent/40 bg-accent/10 text-[9px] font-black text-accent uppercase tracking-widest cursor-pointer hover:bg-accent/20 transition-colors" title="Deep Brain active — click to switch to Fast Mode">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent"/>
                    DEEP 🧠
                </button>
            );
            return (
                <button onClick={onClick} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-[9px] font-black text-primary uppercase tracking-widest cursor-pointer hover:bg-primary/20 transition-colors" title="Fast Brain active — click Settings to enable Deep Mode">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"/>
                    FAST ⚡
                </button>
            );
        };

