import React from 'react';
import { Icon } from './Icon';
import { APP_VERSION } from '../../data/version';
import { DeepBrain } from '../../engine/directorBrain';

export const PerformanceSettingsModal = ({ settings, onSave, onClose, isLlmReady, onUnloadLLM, brainMode, deepBrainLoadingProgress, deepBrainModelId, setDeepBrainModelId, onBrainModeChange, updateAvailable }) => {
            const [local, setLocal] = React.useState({ ...settings });
            const [gpuInfo, setGpuInfo] = React.useState('Detecting...');
            const maxThreads = navigator.hardwareConcurrency || 8;

            React.useEffect(() => {
                if (navigator.gpu) {
                    navigator.gpu.requestAdapter().then(adapter => {
                        if (adapter) {
                            const info = adapter.name || adapter.info?.device || 'GPU Detected';
                            setGpuInfo('GPU: ' + info);
                        } else {
                            setGpuInfo('CPU Fallback — No GPU detected');
                        }
                    }).catch(() => setGpuInfo('CPU Fallback — No GPU detected'));
                } else {
                    setGpuInfo('CPU Fallback — No GPU detected');
                }
            }, []);

            const sliderPct = (val, min, max) => Math.round(((val - min) / (max - min)) * 100) + '%';

            const set = (key, val) => setLocal(p => ({ ...p, [key]: val }));

            const handleSave = () => {
                localStorage.setItem('perf_ram_limit', local.ramLimit);
                localStorage.setItem('perf_cpu_threads', local.cpuThreads);
                localStorage.setItem('perf_vram_limit', local.vramLimit);
                localStorage.setItem('perf_render_quality', local.renderQuality);
                localStorage.setItem('perf_auto_optimize', local.autoOptimize);
                onSave(local);
                onClose();
            };

            const labelCls = "text-[10px] font-bold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark mb-1 block";
            const valueCls = "font-mono text-xs font-bold text-primary";
            const rowCls = "mb-5";

            return (
                <div className="settings-overlay" onClick={onClose}>
                    <div className="settings-panel bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
                            <div className="flex items-center gap-2">
                                <Icon name="Settings" size={16} className="text-primary" />
                                <span className="text-sm font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Settings</span>
                            </div>
                            <button onClick={onClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors">
                                <Icon name="X" size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-5">
                            <div className="flex items-center gap-2 mb-5">
                                <Icon name="Activity" size={14} className="text-primary" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-textMain-light dark:text-textMain-dark">Performance</span>
                            </div>

                            {/* Auto-Optimize Toggle */}
                            <div className={rowCls + " flex items-center justify-between p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"}>
                                <div>
                                    <span className={labelCls} style={{marginBottom:0}}>Auto-Optimize</span>
                                    <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Auto-detect hardware and set smart defaults</p>
                                </div>
                                <label className="perf-toggle">
                                    <input type="checkbox" checked={local.autoOptimize} onChange={e => set('autoOptimize', e.target.checked)} />
                                    <span className="perf-toggle-track"></span>
                                    <span className="perf-toggle-thumb"></span>
                                </label>
                            </div>

                            {/* RAM Limit */}
                            <div className={rowCls}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={labelCls} style={{marginBottom:0}}>RAM Limit</span>
                                    <span className={valueCls}>{local.ramLimit >= 1024 ? (local.ramLimit / 1024).toFixed(1) + ' GB' : local.ramLimit + ' MB'}</span>
                                </div>
                                <input type="range" className="perf-slider" min={512} max={32768} step={512}
                                    value={local.ramLimit}
                                    style={{'--val': sliderPct(local.ramLimit, 512, 32768)}}
                                    onChange={e => set('ramLimit', parseInt(e.target.value))} />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono">512 MB</span>
                                    <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono">32 GB</span>
                                </div>
                            </div>

                            {/* CPU Threads */}
                            <div className={rowCls}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={labelCls} style={{marginBottom:0}}>CPU Threads</span>
                                    <span className={valueCls}>{local.cpuThreads} / {maxThreads} available</span>
                                </div>
                                <input type="range" className="perf-slider" min={1} max={maxThreads} step={1}
                                    value={local.cpuThreads}
                                    style={{'--val': sliderPct(local.cpuThreads, 1, maxThreads)}}
                                    onChange={e => set('cpuThreads', parseInt(e.target.value))} />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono">1 thread</span>
                                    <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono">{maxThreads} threads</span>
                                </div>
                            </div>

                            {/* VRAM */}
                            <div className={rowCls}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={labelCls} style={{marginBottom:0}}>VRAM Budget</span>
                                    <span className={valueCls}>{local.vramLimit} GB</span>
                                </div>
                                <input type="range" className="perf-slider" min={1} max={24} step={1}
                                    value={local.vramLimit}
                                    style={{'--val': sliderPct(local.vramLimit, 1, 24)}}
                                    onChange={e => set('vramLimit', parseInt(e.target.value))} />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono">1 GB</span>
                                    <span className="text-[9px] text-textMuted-light dark:text-textMuted-dark font-mono">24 GB</span>
                                </div>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                                    <span className="text-[9px] font-mono text-textMuted-light dark:text-textMuted-dark">{gpuInfo}</span>
                                </div>
                            </div>

                            {/* Rendering Quality */}
                            <div className={rowCls}>
                                <span className={labelCls}>Rendering Quality</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {['Low', 'Balanced', 'High', 'Ultra'].map(q => (
                                        <button key={q} onClick={() => set('renderQuality', q)}
                                            className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${local.renderQuality === q
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-primary/50'}`}>
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-textMuted-light dark:text-textMuted-dark mt-2">
                                    {local.renderQuality === 'Low' && 'Disables animations for maximum speed.'}
                                    {local.renderQuality === 'Balanced' && 'Recommended for most systems.'}
                                    {local.renderQuality === 'High' && 'Full animations and effects enabled.'}
                                    {local.renderQuality === 'Ultra' && 'All effects at maximum quality.'}
                                </p>
                            </div>
                        {/* AI Model */}
                            <div className={rowCls + " p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className={labelCls} style={{marginBottom:0}}>AI Model (WebLLM)</span>
                                        <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">
                                            {isLlmReady ? 'Phi-3 loaded — using VRAM/RAM' : 'Not loaded'}
                                        </p>
                                    </div>
                                    {isLlmReady ? (
                                        <button onClick={() => { onUnloadLLM(); }}
                                            className="text-[10px] px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold transition-all">
                                            Unload Model
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-mono text-textMuted-light dark:text-textMuted-dark">Not loaded</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* AI Intelligence */}
                        <div className="px-5 pb-2">
                            <div className="border-t border-border-light dark:border-border-dark pt-4 mt-2">
                                <div className="text-[10px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Icon name="Brain" size={12}/> AI Intelligence
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-xs font-bold text-textMain-light dark:text-textMain-dark">Brain Mode</div>
                                        <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Fast: instant rule-based · Deep: WebLLM model</div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark p-0.5">
                                        <button
                                            onClick={() => { if (brainMode !== 'fast') onBrainModeChange('fast'); }}
                                            className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${brainMode === 'fast' ? 'bg-primary/20 text-primary border border-primary/40' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`}>
                                            ⚡ FAST
                                        </button>
                                        <button
                                            onClick={() => { if (brainMode === 'fast') onBrainModeChange('deep'); }}
                                            className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${brainMode === 'deep' || brainMode === 'deep-loading' ? 'bg-accent/20 text-accent border border-accent/40' : 'text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`}>
                                            🧠 DEEP
                                        </button>
                                    </div>
                                </div>
                                {(brainMode === 'deep' || brainMode === 'deep-loading') && (
                                    <div className="mb-3">
                                        <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark mb-1.5">Model</div>
                                        <select
                                            value={deepBrainModelId}
                                            onChange={e => { setDeepBrainModelId(e.target.value); localStorage.setItem('deepBrainModelId', e.target.value); }}
                                            className="w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark outline-none">
                                            {DeepBrain.SUPPORTED_MODELS.map(m => (
                                                <option key={m.id} value={m.id}>{m.label}</option>
                                            ))}
                                        </select>
                                        {brainMode === 'deep-loading' && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-input-light dark:bg-input-dark rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent rounded-full transition-all" style={{width: `${deepBrainLoadingProgress}%`}}/>
                                                </div>
                                                <span className="text-[9px] text-accent font-bold">{deepBrainLoadingProgress}%</span>
                                            </div>
                                        )}
                                        {brainMode === 'deep' && (
                                            <div className="mt-1.5 text-[9px] text-green-500 font-bold">✓ Model loaded and ready</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 pb-5">
                            <button onClick={handleSave}
                                className="w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-black transition-all btn-premium"
                                style={{background: 'rgb(var(--color-primary))'}}>
                                Apply &amp; Save
                            </button>
                            <p className="text-center text-[9px] font-mono text-textMuted-light dark:text-textMuted-dark mt-3 opacity-50">MOKHA FILM Suite v{APP_VERSION}</p>
                            <p className="text-center text-[8px] font-mono text-textMuted-light dark:text-textMuted-dark opacity-30 mt-0.5">Designed &amp; Developed by <span className="text-primary opacity-70">Charles Emilson</span> · Senior Filmmaker</p>
                            {updateAvailable && (
                                <div className="mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"/>
                                    <span className="text-[9px] text-accent font-bold">v{updateAvailable.version} available</span>
                                    <button onClick={() => { if(window.require) { const {shell} = window.require('electron'); shell.openExternal(updateAvailable.url); } else { window.open(updateAvailable.url, '_blank'); } }} className="text-[9px] text-accent underline hover:no-underline font-bold">Download →</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };

