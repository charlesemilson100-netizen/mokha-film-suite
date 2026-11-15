import { DIRECTOR_SHOT_PRESETS } from '../../data/catalog';

// ── Director Agentic Mode: PresetPalette component ────────────────────
        export const PresetPalette = ({ isOpen, onClose, onSelectPreset, projectSnapshot }) => {
            if (!isOpen) return null;

            // Contextual relevance scoring: match active scene's lighting and mood
            const activeScene = projectSnapshot && projectSnapshot.activeScene;
            const activeShots = activeScene && activeScene.shots ? activeScene.shots : [];

            // Gather lighting/mood values from active scene shots
            const sceneLightings = new Set(activeShots.map(s => (s.selections && s.selections.lighting) || '').filter(Boolean));
            const sceneMoods     = new Set(activeShots.map(s => (s.selections && s.selections.mood) || '').filter(Boolean));

            const scorePreset = (preset) => {
                let score = 0;
                if (sceneLightings.has(preset.lighting)) score += 2;
                if (sceneMoods.has(preset.mood)) score += 2;
                return score;
            };

            const sortedPresets = [...DIRECTOR_SHOT_PRESETS].sort((a, b) => scorePreset(b) - scorePreset(a));

            // Category badge color map
            const categoryColor = {
                Emotional: 'rgb(var(--color-primary))',
                Tension:   '#ef4444',
                Action:    '#f97316',
                Style:     'rgb(var(--color-accent))',
            };

            return (
                <div
                    className="animate-slide-in-right absolute inset-y-0 right-0 z-20 flex flex-col"
                    style={{
                        width: '100%',
                        background: 'var(--lg-bg)',
                        borderLeft: '1px solid var(--lg-border)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                    }}
                >
                    {/* Header */}
                    <div className="lg-header flex items-center justify-between px-4 py-3 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--lg-text)' }}>Shot Presets</span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--color-primary)/0.12)', color: 'rgb(var(--color-primary))' }}>
                                {sortedPresets.length}
                            </span>
                        </div>
                        <button
                            className="text-xs px-2 py-1 rounded"
                            style={{ color: 'var(--lg-text-muted)', background: 'rgba(255,255,255,0.06)' }}
                            onClick={onClose}
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Preset cards list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
                        {sortedPresets.map((preset, idx) => {
                            const relevance = scorePreset(preset);
                            const catColor  = categoryColor[preset.category] || 'var(--lg-text-muted)';
                            return (
                                <div
                                    key={idx}
                                    className="rounded-lg border p-3"
                                    style={{
                                        borderColor: relevance > 0 ? 'rgb(var(--color-primary)/0.5)' : 'var(--lg-border)',
                                        background: relevance > 0 ? 'rgb(var(--color-primary)/0.04)' : 'rgba(255,255,255,0.03)',
                                        fontSize: '0.78rem',
                                    }}
                                >
                                    {/* Preset name + shot type badge */}
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-semibold" style={{ color: 'var(--lg-text)' }}>{preset.name}</span>
                                        <span
                                            className="text-xs px-1.5 py-0.5 rounded font-bold"
                                            style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}40` }}
                                        >
                                            {preset.shotType}
                                        </span>
                                        {relevance > 0 && (
                                            <span className="ml-auto text-xs" style={{ color: 'rgb(var(--color-primary)/0.8)' }}>
                                                ★ Match
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="text-xs mb-2" style={{ color: 'var(--lg-text-muted)' }}>
                                        {preset.description}
                                    </div>

                                    {/* Lens / Lighting / Mood meta */}
                                    <div className="flex gap-3 text-xs mb-2 flex-wrap" style={{ color: 'var(--lg-text-muted)', opacity: 0.75 }}>
                                        <span>🔭 {preset.lens}</span>
                                        <span>💡 {preset.lighting}</span>
                                        <span>🎭 {preset.mood}</span>
                                    </div>

                                    {/* Apply button */}
                                    <button
                                        className="text-xs px-3 py-1 rounded font-semibold"
                                        style={{ background: 'rgb(var(--color-primary)/0.12)', border: '1px solid rgb(var(--color-primary)/0.4)', color: 'rgb(var(--color-primary))' }}
                                        onClick={() => { onSelectPreset && onSelectPreset(preset); onClose && onClose(); }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

