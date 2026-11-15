import { CINEMATIC_THEMES } from '../../data/themes';

export const CinematicThemePicker = ({ currentTheme, onThemeChange }) => (
            <div className="flex flex-wrap gap-2 p-1">
                {CINEMATIC_THEMES.map(t => (
                    <button key={t.id} onClick={() => onThemeChange(t)} title={t.label}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${currentTheme === t.id ? 'border-white/40 bg-white/10 text-white scale-105' : 'border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark text-textMuted-light dark:text-textMuted-dark hover:border-white/30'}`}>
                        <span className="flex gap-0.5">
                            <span className="w-3 h-3 rounded-full" style={{background:`rgb(${t.primary})`}}/>
                            <span className="w-3 h-3 rounded-full" style={{background:`rgb(${t.accent})`}}/>
                        </span>
                        {t.label}
                    </button>
                ))}
            </div>
        );

