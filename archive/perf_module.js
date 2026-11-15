        // ═══════════════════════════════════════════════════════════════════
        // PERFORMANCE MANAGER — MOKHA FILM SUITE
        // ═══════════════════════════════════════════════════════════════════

        const PerformanceManager = (() => {
            const STORAGE_KEY = 'mokha_perf_settings';

            const PRESETS = {
                eco: {
                    id: 'eco', label: 'Eco', icon: '🌿',
                    color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30',
                    desc: 'Minimal resource usage. Slow but stable.',
                    ramPct: 0.25, cpuPct: 0.25, gpuEnabled: false, vramPct: 0.0,
                    batchSize: 1, inferenceThreads: 1, cacheEnabled: false, diskSwap: false
                },
                balanced: {
                    id: 'balanced', label: 'Balanced', icon: '⚖️',
                    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30',
                    desc: 'Moderate usage. Stable performance. (Default)',
                    ramPct: 0.45, cpuPct: 0.50, gpuEnabled: true, vramPct: 0.50,
                    batchSize: 2, inferenceThreads: 2, cacheEnabled: true, diskSwap: false
                },
                performance: {
                    id: 'performance', label: 'Performance', icon: '⚡',
                    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30',
                    desc: 'High RAM & GPU. Fast inference.',
                    ramPct: 0.65, cpuPct: 0.75, gpuEnabled: true, vramPct: 0.70,
                    batchSize: 4, inferenceThreads: 4, cacheEnabled: true, diskSwap: false
                },
                extreme: {
                    id: 'extreme', label: 'Extreme', icon: '🔥',
                    color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30',
                    desc: 'Max resources. Parallel processing. Use with caution.',
                    ramPct: 0.78, cpuPct: 0.95, gpuEnabled: true, vramPct: 0.83,
                    batchSize: 8, inferenceThreads: 8, cacheEnabled: true, diskSwap: true
                },
                render: {
                    id: 'render', label: 'Render Mode', icon: '🎬',
                    color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30',
                    desc: 'Max GPU for heavy generation. Filmmaking workflow.',
                    ramPct: 0.60, cpuPct: 0.50, gpuEnabled: true, vramPct: 0.83,
                    batchSize: 6, inferenceThreads: 3, cacheEnabled: true, diskSwap: false
                },
                storyboard: {
                    id: 'storyboard', label: 'Storyboard', icon: '📋',
                    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30',
                    desc: 'Lightweight & fast. Quick prompt responses.',
                    ramPct: 0.30, cpuPct: 0.35, gpuEnabled: true, vramPct: 0.30,
                    batchSize: 1, inferenceThreads: 2, cacheEnabled: true, diskSwap: false
                }
            };

            const SAFETY = { maxRamPct: 0.80, maxVramPct: 0.85 };

            const DEFAULT_SETTINGS = {
                preset: 'balanced',
                adaptive: false,
                manual: {
                    ramPct: 0.45, cpuPct: 0.50, gpuEnabled: true, vramPct: 0.50,
                    batchSize: 2, inferenceThreads: 2, cacheEnabled: true, diskSwap: false
                }
            };

            function load() {
                try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
                catch { return { ...DEFAULT_SETTINGS }; }
            }

            function save(s) {
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
            }

            function reset() { save({ ...DEFAULT_SETTINGS }); return { ...DEFAULT_SETTINGS }; }

            async function detectHardware() {
                const hw = {
                    totalRAM: null, availRAM: null,
                    cpuCores: navigator.hardwareConcurrency || 4,
                    gpuModel: 'Unknown', vramEstimate: null,
                    hasGPU: false
                };
                // RAM via deviceMemory API (Chrome/Edge, in GB)
                if (navigator.deviceMemory) {
                    hw.totalRAM = navigator.deviceMemory * 1024; // MB
                    hw.availRAM = Math.round(hw.totalRAM * 0.6);
                }
                // GPU via WebGL
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                    if (gl) {
                        const ext = gl.getExtension('WEBGL_debug_renderer_info');
                        if (ext) {
                            hw.gpuModel = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown GPU';
                            hw.hasGPU = true;
                            // Rough VRAM estimate from renderer string
                            const r = hw.gpuModel.toLowerCase();
                            if (r.includes('rtx 4090') || r.includes('rtx 4080')) hw.vramEstimate = 16384;
                            else if (r.includes('rtx 4070') || r.includes('rtx 3080')) hw.vramEstimate = 10240;
                            else if (r.includes('rtx 3070') || r.includes('rtx 4060')) hw.vramEstimate = 8192;
                            else if (r.includes('rtx 3060') || r.includes('rtx 2080')) hw.vramEstimate = 6144;
                            else if (r.includes('rtx') || r.includes('gtx') || r.includes('radeon rx')) hw.vramEstimate = 4096;
                            else if (r.includes('intel') || r.includes('apple m')) hw.vramEstimate = 2048;
                            else hw.vramEstimate = 2048;
                        }
                    }
                } catch {}
                return hw;
            }

            function suggestPreset(hw) {
                if (!hw.totalRAM) return 'balanced';
                const ram = hw.totalRAM;
                const vram = hw.vramEstimate || 0;
                if (ram >= 32768 && vram >= 8192) return 'performance';
                if (ram >= 16384 && vram >= 4096) return 'balanced';
                if (ram >= 8192) return 'balanced';
                return 'eco';
            }

            function clampToSafety(manual) {
                return {
                    ...manual,
                    ramPct: Math.min(manual.ramPct, SAFETY.maxRamPct),
                    vramPct: Math.min(manual.vramPct, SAFETY.maxVramPct)
                };
            }

            function getActiveConfig(settings) {
                if (settings.preset === 'custom') return clampToSafety(settings.manual);
                const p = PRESETS[settings.preset] || PRESETS.balanced;
                return clampToSafety({ ...p });
            }

            return { PRESETS, SAFETY, DEFAULT_SETTINGS, load, save, reset, detectHardware, suggestPreset, getActiveConfig };
        })();

        // ═══════════════════════════════════════════════════════════════════
        // PERFORMANCE SETTINGS PANEL COMPONENT
        // ═══════════════════════════════════════════════════════════════════

        function PerformanceSettingsPanel({ onClose }) {
            const [settings, setSettings] = React.useState(() => PerformanceManager.load());
            const [hw, setHw] = React.useState(null);
            const [detecting, setDetecting] = React.useState(false);
            const [suggested, setSuggested] = React.useState(null);
            const [monitor, setMonitor] = React.useState({ ram: 0, cpu: 0, gpu: 0, vram: 0 });
            const [saved, setSaved] = React.useState(false);
            const [tab, setTab] = React.useState('presets'); // 'presets' | 'manual' | 'monitor'
            const monitorRef = React.useRef(null);

            // Simulate real-time monitoring (browser can't access real system metrics)
            React.useEffect(() => {
                const cfg = PerformanceManager.getActiveConfig(settings);
                const tick = () => {
                    setMonitor({
                        ram: Math.round((cfg.ramPct * 100) * (0.85 + Math.random() * 0.15)),
                        cpu: Math.round((cfg.cpuPct * 100) * (0.70 + Math.random() * 0.30)),
                        gpu: cfg.gpuEnabled ? Math.round((cfg.vramPct * 100) * (0.75 + Math.random() * 0.25)) : 0,
                        vram: cfg.gpuEnabled ? Math.round((cfg.vramPct * 100) * (0.80 + Math.random() * 0.20)) : 0
                    });
                };
                tick();
                monitorRef.current = setInterval(tick, 2000);
                return () => clearInterval(monitorRef.current);
            }, [settings]);

            const detectHW = async () => {
                setDetecting(true);
                const h = await PerformanceManager.detectHardware();
                setHw(h);
                const s = PerformanceManager.suggestPreset(h);
                setSuggested(s);
                setDetecting(false);
            };

            React.useEffect(() => { detectHW(); }, []);

            const applyPreset = (id) => {
                const next = { ...settings, preset: id };
                setSettings(next);
            };

            const updateManual = (key, val) => {
                const next = { ...settings, preset: 'custom', manual: { ...settings.manual, [key]: val } };
                setSettings(next);
            };

            const handleSave = () => {
                PerformanceManager.save(settings);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            };

            const handleReset = () => {
                const def = PerformanceManager.reset();
                setSettings(def);
            };

            const cfg = PerformanceManager.getActiveConfig(settings);
            const isExtreme = settings.preset === 'extreme';
            const lowVRAM = hw && hw.vramEstimate && hw.vramEstimate < 4096;

            const MeterBar = ({ label, value, color, tooltip }) => (
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider" title={tooltip}>{label}</span>
                        <span className={`text-[11px] font-black ${value > 80 ? 'text-red-400' : value > 60 ? 'text-yellow-400' : 'text-green-400'}`}>{value}%</span>
                    </div>
                    <div className="h-1.5 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{width:`${value}%`}}/>
                    </div>
                </div>
            );

            const Tooltip = ({ text }) => (
                <span className="ml-1 text-textMuted-light dark:text-textMuted-dark cursor-help" title={text}>
                    <Icon name="Info" size={11}/>
                </span>
            );

            const SliderRow = ({ label, tooltip, min, max, step, value, onChange, fmt }) => (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider flex items-center">
                            {label}<Tooltip text={tooltip}/>
                        </label>
                        <span className="text-[11px] font-black text-textMain-light dark:text-textMain-dark">{fmt ? fmt(value) : value}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={value}
                        onChange={e => onChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{accentColor:'rgb(var(--color-primary))'}}
                    />
                </div>
            );

            const ToggleRow = ({ label, tooltip, value, onChange }) => (
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider flex items-center">
                        {label}<Tooltip text={tooltip}/>
                    </label>
                    <button onClick={() => onChange(!value)}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0.5'}`}/>
                    </button>
                </div>
            );

            return (
                <div className="fixed inset-0 z-[99998] flex items-center justify-center" onClick={onClose}>
                    <div className="absolute inset-0 bg-black/60" style={{WebkitBackdropFilter:'blur(6px)',backdropFilter:'blur(6px)'}}/>
                    <div className="relative bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-palette-in" onClick={e=>e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Icon name="Sliders" size={18} className="text-primary"/>
                                <div>
                                    <div className="text-sm font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest">Performance Settings</div>
                                    <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Optimize for your hardware</div>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"><Icon name="X" size={18}/></button>
                        </div>

                        {/* Hardware Banner */}
                        {hw && (
                            <div className="px-5 py-2.5 bg-input-light dark:bg-input-dark border-b border-border-light dark:border-border-dark shrink-0">
                                <div className="flex flex-wrap gap-3 items-center text-[10px]">
                                    {hw.totalRAM && <span className="flex items-center gap-1 text-textMuted-light dark:text-textMuted-dark"><Icon name="Database" size={11}/> RAM: <b className="text-textMain-light dark:text-textMain-dark">{(hw.totalRAM/1024).toFixed(0)}GB</b></span>}
                                    <span className="flex items-center gap-1 text-textMuted-light dark:text-textMuted-dark"><Icon name="Activity" size={11}/> CPU: <b className="text-textMain-light dark:text-textMain-dark">{hw.cpuCores} threads</b></span>
                                    {hw.hasGPU && <span className="flex items-center gap-1 text-textMuted-light dark:text-textMuted-dark"><Icon name="Zap" size={11}/> GPU: <b className="text-textMain-light dark:text-textMain-dark truncate max-w-[160px]">{hw.gpuModel.split('/')[0].trim()}</b></span>}
                                    {hw.vramEstimate && <span className="flex items-center gap-1 text-textMuted-light dark:text-textMuted-dark">VRAM: <b className="text-textMain-light dark:text-textMain-dark">{(hw.vramEstimate/1024).toFixed(0)}GB est.</b></span>}
                                    {suggested && <span className="ml-auto flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-black border border-primary/30">✦ Recommended: {PerformanceManager.PRESETS[suggested]?.label}</span>}
                                </div>
                            </div>
                        )}
                        {detecting && <div className="px-5 py-2 text-[10px] text-textMuted-light dark:text-textMuted-dark animate-pulse shrink-0">Detecting hardware...</div>}

                        {/* Tabs */}
                        <div className="flex border-b border-border-light dark:border-border-dark shrink-0">
                            {[['presets','Presets','Aperture'],['manual','Advanced','Sliders'],['monitor','Monitor','Activity']].map(([id,label,icon])=>(
                                <button key={id} onClick={()=>setTab(id)}
                                    className={`flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${tab===id ? 'border-primary text-primary' : 'border-transparent text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`}>
                                    <Icon name={icon} size={13}/>{label}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">

                            {/* ── PRESETS TAB ── */}
                            {tab === 'presets' && (
                                <div>
                                    {/* Smart Adaptive Toggle */}
                                    <div className="flex items-center justify-between mb-5 p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                        <div>
                                            <div className="text-[11px] font-black text-textMain-light dark:text-textMain-dark flex items-center gap-1.5"><Icon name="Brain" size={13} className="text-accent"/>Smart Adaptive Mode</div>
                                            <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Dynamically adjusts performance based on real-time workload</div>
                                        </div>
                                        <button onClick={()=>setSettings(s=>({...s,adaptive:!s.adaptive}))}
                                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${settings.adaptive ? 'bg-accent' : 'bg-border-light dark:bg-border-dark'}`}>
                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${settings.adaptive ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                                        </button>
                                    </div>

                                    {/* Preset Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.values(PerformanceManager.PRESETS).map(p => {
                                            const isActive = settings.preset === p.id;
                                            const isRec = suggested === p.id;
                                            return (
                                                <button key={p.id} onClick={()=>applyPreset(p.id)}
                                                    className={`relative text-left p-3.5 rounded-lg border transition-all ${isActive ? `${p.bg} ${p.border} border` : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark hover:border-primary/40'}`}>
                                                    {isRec && <span className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-black border border-primary/30">✦ Recommended</span>}
                                                    <div className="text-lg mb-1">{p.icon}</div>
                                                    <div className={`text-[11px] font-black ${isActive ? p.color : 'text-textMain-light dark:text-textMain-dark'}`}>{p.label}</div>
                                                    <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mt-0.5 leading-relaxed">{p.desc}</div>
                                                    <div className="mt-2 flex gap-1.5 flex-wrap">
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-border-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark">RAM {Math.round(p.ramPct*100)}%</span>
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-border-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark">CPU {Math.round(p.cpuPct*100)}%</span>
                                                        {p.gpuEnabled && <span className="text-[8px] px-1.5 py-0.5 rounded bg-border-light dark:bg-border-dark text-textMuted-light dark:text-textMuted-dark">GPU ✓</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Extreme Warning */}
                                    {isExtreme && (
                                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                                            <Icon name="AlertTriangle" size={14} className="text-red-400 shrink-0 mt-0.5"/>
                                            <div className="text-[10px] text-red-400 leading-relaxed">
                                                <b>Extreme Mode Warning:</b> This uses up to 78% RAM and 83% VRAM. Your system may become unstable. If performance degrades, the app will automatically revert to Balanced Mode.
                                            </div>
                                        </div>
                                    )}

                                    {/* Low VRAM Warning */}
                                    {lowVRAM && cfg.gpuEnabled && (
                                        <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
                                            <Icon name="AlertTriangle" size={14} className="text-yellow-400 shrink-0 mt-0.5"/>
                                            <div className="text-[10px] text-yellow-400 leading-relaxed">
                                                <b>Low VRAM Detected ({(hw.vramEstimate/1024).toFixed(0)}GB):</b> GPU acceleration may be limited. Consider Eco or Storyboard mode for stability.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── MANUAL TAB ── */}
                            {tab === 'manual' && (
                                <div>
                                    <div className="mb-4 p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-[10px] text-textMuted-light dark:text-textMuted-dark">
                                        Overriding a preset switches to <b className="text-textMain-light dark:text-textMain-dark">Custom</b> mode. Safety caps: RAM ≤ {Math.round(PerformanceManager.SAFETY.maxRamPct*100)}%, VRAM ≤ {Math.round(PerformanceManager.SAFETY.maxVramPct*100)}%.
                                    </div>

                                    <SliderRow label="RAM Allocation" tooltip="Percentage of total system RAM the app may use. Capped at 80% for safety."
                                        min={0.10} max={PerformanceManager.SAFETY.maxRamPct} step={0.01}
                                        value={settings.preset==='custom' ? settings.manual.ramPct : cfg.ramPct}
                                        onChange={v=>updateManual('ramPct',v)}
                                        fmt={v=>`${Math.round(v*100)}%`}/>

                                    <SliderRow label="CPU Usage Limit" tooltip="Maximum CPU thread utilization allowed."
                                        min={0.10} max={1.0} step={0.05}
                                        value={settings.preset==='custom' ? settings.manual.cpuPct : cfg.cpuPct}
                                        onChange={v=>updateManual('cpuPct',v)}
                                        fmt={v=>`${Math.round(v*100)}%`}/>

                                    <SliderRow label="VRAM Allocation" tooltip="GPU memory allocation. Capped at 85% for stability."
                                        min={0.0} max={PerformanceManager.SAFETY.maxVramPct} step={0.05}
                                        value={settings.preset==='custom' ? settings.manual.vramPct : cfg.vramPct}
                                        onChange={v=>updateManual('vramPct',v)}
                                        fmt={v=>cfg.gpuEnabled||settings.manual.gpuEnabled ? `${Math.round(v*100)}%` : 'GPU Off'}/>

                                    <SliderRow label="Batch Size" tooltip="Number of inference requests processed simultaneously. Higher = faster but more memory."
                                        min={1} max={16} step={1}
                                        value={settings.preset==='custom' ? settings.manual.batchSize : cfg.batchSize}
                                        onChange={v=>updateManual('batchSize',v)}
                                        fmt={v=>`${v} req`}/>

                                    <SliderRow label="Inference Threads" tooltip="CPU threads dedicated to model inference."
                                        min={1} max={Math.max(hw?.cpuCores||8, 8)} step={1}
                                        value={settings.preset==='custom' ? settings.manual.inferenceThreads : cfg.inferenceThreads}
                                        onChange={v=>updateManual('inferenceThreads',v)}
                                        fmt={v=>`${v} threads`}/>

                                    <div className="border-t border-border-light dark:border-border-dark pt-4 mt-2">
                                        <ToggleRow label="GPU Acceleration" tooltip="Enable GPU for inference. Faster but requires VRAM."
                                            value={settings.preset==='custom' ? settings.manual.gpuEnabled : cfg.gpuEnabled}
                                            onChange={v=>updateManual('gpuEnabled',v)}/>
                                        <ToggleRow label="Prompt Cache" tooltip="Cache repeated prompts to avoid redundant computation."
                                            value={settings.preset==='custom' ? settings.manual.cacheEnabled : cfg.cacheEnabled}
                                            onChange={v=>updateManual('cacheEnabled',v)}/>
                                        <ToggleRow label="Disk Swap" tooltip="Use disk as overflow memory when RAM is full. Slower but prevents crashes."
                                            value={settings.preset==='custom' ? settings.manual.diskSwap : cfg.diskSwap}
                                            onChange={v=>updateManual('diskSwap',v)}/>
                                    </div>
                                </div>
                            )}

                            {/* ── MONITOR TAB ── */}
                            {tab === 'monitor' && (
                                <div>
                                    <div className="mb-4 text-[10px] text-textMuted-light dark:text-textMuted-dark p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                        Live simulation based on active preset. Browser security limits direct system access — values reflect configured allocation targets.
                                    </div>
                                    <MeterBar label="RAM Usage" value={monitor.ram} color="bg-blue-500" tooltip="Current RAM allocation in use"/>
                                    <MeterBar label="CPU Load" value={monitor.cpu} color="bg-yellow-500" tooltip="CPU thread utilization"/>
                                    <MeterBar label="GPU Load" value={monitor.gpu} color="bg-purple-500" tooltip="GPU compute utilization"/>
                                    <MeterBar label="VRAM Usage" value={monitor.vram} color="bg-cyan-500" tooltip="GPU memory in use"/>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-1">Active Preset</div>
                                            <div className="text-[13px] font-black text-textMain-light dark:text-textMain-dark">{PerformanceManager.PRESETS[settings.preset]?.icon || '⚙️'} {PerformanceManager.PRESETS[settings.preset]?.label || 'Custom'}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-1">Batch Size</div>
                                            <div className="text-[13px] font-black text-textMain-light dark:text-textMain-dark">{cfg.batchSize} req/cycle</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-1">Inference Threads</div>
                                            <div className="text-[13px] font-black text-textMain-light dark:text-textMain-dark">{cfg.inferenceThreads} threads</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-1">Adaptive Mode</div>
                                            <div className={`text-[13px] font-black ${settings.adaptive ? 'text-accent' : 'text-textMuted-light dark:text-textMuted-dark'}`}>{settings.adaptive ? '✓ Active' : 'Off'}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-1">GPU</div>
                                            <div className={`text-[13px] font-black ${cfg.gpuEnabled ? 'text-green-400' : 'text-red-400'}`}>{cfg.gpuEnabled ? '✓ Enabled' : '✗ Off'}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                            <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider mb-1">Cache</div>
                                            <div className={`text-[13px] font-black ${cfg.cacheEnabled ? 'text-green-400' : 'text-textMuted-light dark:text-textMuted-dark'}`}>{cfg.cacheEnabled ? '✓ Active' : 'Off'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 border-t border-border-light dark:border-border-dark flex items-center justify-between shrink-0 bg-input-light/50 dark:bg-input-dark/50">
                            <button onClick={handleReset} className="text-[11px] font-bold text-textMuted-light dark:text-textMuted-dark hover:text-red-400 transition-colors flex items-center gap-1.5">
                                <Icon name="RotateCcw" size={13}/>Reset to Default
                            </button>
                            <div className="flex items-center gap-3">
                                <button onClick={detectHW} disabled={detecting} className="text-[11px] font-bold text-accent hover:text-accentHover transition-colors flex items-center gap-1.5 disabled:opacity-40">
                                    <Icon name="Zap" size={13}/>{detecting ? 'Detecting...' : 'Re-detect HW'}
                                </button>
                                <button onClick={handleSave} className="bg-primary hover:bg-primaryHover text-white px-5 py-2 rounded-lg text-[11px] font-black transition-all shadow-md active:scale-[0.98] flex items-center gap-1.5">
                                    {saved ? <><Icon name="Check" size={13}/>Saved!</> : <><Icon name="Save" size={13}/>Save Settings</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
