import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { PARAMETER_THUMBNAILS } from '../../data/catalog';

export const Tooltip = ({ text, children }) => (
            <div className="relative group flex items-center">
                {children}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-black text-white text-[10px] rounded shadow-lg z-[100] pointer-events-none font-normal normal-case tracking-normal text-center">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></div>
                </div>
            </div>
        );

export const getGradient = (str) => {
            const colors = [
                'from-blue-500 to-purple-600', 'from-emerald-400 to-cyan-600',
                'from-amber-400 to-orange-600', 'from-rose-400 to-red-600',
                'from-fuchsia-500 to-pink-600', 'from-slate-600 to-slate-800',
                'from-indigo-500 to-blue-600', 'from-teal-400 to-emerald-600'
            ];
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            return colors[Math.abs(hash) % colors.length];
        };

export const SpeedCurvePreview = ({ speed }) => {
            let d = "M5,45 L45,5"; // Normal
            if (speed === 'Speed Ramp') d = "M5,45 C25,45 25,5 45,5";
            else if (speed === 'Ultra Slow Motion') d = "M5,45 C20,40 30,30 45,25";
            else if (speed === 'Slow Motion') d = "M5,45 C20,35 30,25 45,15";
            else if (speed === '2x Fast Forward') d = "M5,45 C15,10 25,5 45,5";
            else if (speed === 'Time-Lapse') d = "M5,45 Q10,5 45,5";
            else if (speed === 'Stop Motion') d = "M5,45 L15,45 L15,35 L25,35 L25,25 L35,25 L35,15 L45,15 L45,5";
            
            return (
                <svg className="w-6 h-6 mr-2 shrink-0 text-cyan-500 overflow-visible" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d={d} />
                </svg>
            );
        };

export const ShotTypePreview = ({ type }) => {
            let innerClass = "w-2 h-6 bg-current mx-auto"; // Default
            if (type.includes('Extreme Wide')) innerClass = "w-1.5 h-3 bg-current mx-auto mt-8";
            else if (type.includes('Wide')) innerClass = "w-2.5 h-5 bg-current mx-auto mt-6";
            else if (type.includes('Full')) innerClass = "w-4 h-8 bg-current mx-auto mt-3";
            else if (type.includes('Medium')) innerClass = "w-6 h-10 bg-current mx-auto mt-2";
            else if (type.includes('Extreme Close')) innerClass = "w-12 h-12 bg-current mx-auto mt-0 rounded-full";
            else if (type.includes('Close-Up')) innerClass = "w-10 h-12 bg-current mx-auto mt-0";
            else if (type.includes('Bird')) return <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center opacity-70"><div className="w-2 h-2 bg-current rounded-full"></div></div>;
            else if (type.includes('Worm')) return <div className="w-10 h-4 border-b-2 border-current mt-8 flex items-end justify-center opacity-70"><div className="w-4 h-4 bg-current rounded-t-full"></div></div>;
            
            return (
                <div className="w-12 h-12 border-2 border-current rounded-lg overflow-hidden flex items-end justify-center opacity-70"><div className={innerClass}></div></div>
            );
        };

export const CameraAnglePreview = ({ angle }) => {
            let lineClass = "w-10 h-0.5 bg-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
            if (angle.includes('High')) lineClass += " rotate-45";
            else if (angle.includes('Low')) lineClass += " -rotate-45";
            else if (angle.includes('Dutch')) lineClass += " rotate-12";
            else if (angle.includes('Overhead')) return <div className="w-6 h-6 rounded-full border-4 border-current opacity-70"></div>;
            
            return (
                <div className="w-12 h-12 relative opacity-70">
                    <div className={lineClass}></div>
                    <div className="w-4 h-4 bg-current rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                </div>
            );
        };

export const VisualSelect = ({ value, onChange, optionsKey, optionsList, disabledOptions = [], onContextMenu }) => {
            const [isOpen, setIsOpen] = useState(false);
            const dropdownRef = useRef(null);

            useEffect(() => {
                const handleClickOutside = (event) => {
                    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
                };
                document.addEventListener("mousedown", handleClickOutside);
                return () => document.removeEventListener("mousedown", handleClickOutside);
            }, []);

            const getSwatch = (optName) => {
                if (!optName) return null;
                if (optionsKey === 'filmStocks') {
                    if (optName.includes('Portra')) return 'bg-[#F5D0A9]';
                    if (optName.includes('CineStill')) return 'bg-gradient-to-r from-teal-700 to-red-500';
                    if (optName.includes('Vision3')) return 'bg-slate-600';
                    if (optName.includes('Technicolor')) return 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500';
                    if (optName.includes('HP5')) return 'bg-gradient-to-r from-black to-white';
                    if (optName.includes('Ektachrome')) return 'bg-blue-500';
                    if (optName.includes('LogC')) return 'bg-gray-400';
                }
                if (optionsKey === 'lighting') {
                    if (optName.includes('Natural')) return 'bg-[#FDE047]';
                    if (optName.includes('Golden')) return 'bg-[#F59E0B]';
                    if (optName.includes('Blue')) return 'bg-[#3B82F6]';
                    if (optName.includes('Neon')) return 'bg-gradient-to-r from-fuchsia-500 to-cyan-500';
                    if (optName.includes('High Key')) return 'bg-white border border-gray-300';
                    if (optName.includes('Low Key')) return 'bg-gray-800';
                    if (optName.includes('Rim')) return 'bg-gradient-to-t from-transparent to-blue-300';
                    return 'bg-gray-300';
                }
                return null;
            };
            
            const getVisualPreview = (optName) => {
                if (optionsKey === 'actionSpeeds') return <SpeedCurvePreview speed={optName} />;
                if (optionsKey === 'shotTypes') return <ShotTypePreview type={optName} />;
                if (optionsKey === 'angles') return <CameraAnglePreview angle={optName} />;
                return null;
            };

            const selectedOpt = optionsList.find(o => (typeof o === 'object' ? o.name : o) === value) || value;
            const displayValue = typeof selectedOpt === 'object' ? selectedOpt.name : selectedOpt;

            return (
                <div className="relative w-full" ref={dropdownRef}>
                    <button type="button" onClick={() => setIsOpen(!isOpen)} onContextMenu={onContextMenu} className="w-full flex items-center justify-between bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2.5 hover:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all duration-300 text-sm text-left">
                        <div className="flex items-center truncate">
                            {value && getSwatch(displayValue) && <span className={`w-3 h-3 rounded-full mr-2 shrink-0 shadow-sm ${getSwatch(displayValue)}`}></span>}
                            {value && getVisualPreview(displayValue)}
                            {value && PARAMETER_THUMBNAILS[displayValue] ? (
                                <img src={PARAMETER_THUMBNAILS[displayValue]} alt={displayValue} className="w-5 h-5 rounded object-cover mr-2 shrink-0 shadow-sm border border-border-light dark:border-border-dark" />
                            ) : value && getSwatch(displayValue) ? (
                                <span className={`w-3 h-3 rounded-full mr-2 shrink-0 shadow-sm ${getSwatch(displayValue)}`}></span>
                            ) : value && getVisualPreview(displayValue)}
                            <span className="truncate">{displayValue || '-- Auto --'}</span>
                        </div>
                        <Icon name="ChevronDown" size={14} className={`shrink-0 text-textMuted-light transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                        <div className="absolute z-[100] top-full left-0 w-[280px] sm:w-[320px] max-w-[90vw] mt-2 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                            <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className={`w-full text-center px-3 py-2.5 text-xs rounded-lg hover:bg-input-light dark:hover:bg-input-dark mb-2 border border-dashed border-border-light dark:border-border-dark transition-all ${!value ? 'bg-primary/10 text-primary font-bold border-primary/50 shadow-sm' : 'text-textMuted-light dark:text-textMuted-dark'}`}>
                                -- Auto / Let AI Decide --
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                {optionsList.map((opt, idx) => {
                                    const val = typeof opt === 'object' ? opt.name : opt;
                                    const desc = typeof opt === 'object' ? opt.desc : null;
                                    const isSelected = value === val;
                                    const gradient = getGradient(val);
                                    const swatch = getSwatch(val);
                                    const visualPreview = getVisualPreview(val);
                                    const isDisabled = disabledOptions.includes(val);

                                    return (
                                        <button key={idx} type="button" disabled={isDisabled} onClick={() => { onChange(val); setIsOpen(false); }} className={`relative flex flex-col items-center justify-start p-2 rounded-lg border transition-all ${isDisabled ? 'opacity-30 cursor-not-allowed grayscale border-border-light dark:border-border-dark bg-base-light dark:bg-base-dark' : isSelected ? 'hover:-translate-y-0.5 border-primary bg-primary/10 shadow-md ring-1 ring-primary' : 'hover:-translate-y-0.5 border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark hover:border-primary/50 hover:shadow-sm'}`} title={isDisabled ? "Unsupported by selected AI Platform" : ""}>
                                            <div className={`w-full h-16 rounded-md mb-2 overflow-hidden relative flex items-center justify-center shadow-inner ${swatch ? swatch : (visualPreview ? 'bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark' : `bg-gradient-to-br ${gradient}`)}`}>
                                                {!swatch && !visualPreview && <span className="text-white/20 font-black text-4xl uppercase absolute inset-0 flex items-center justify-center mix-blend-overlay select-none">{val.substring(0, 2)}</span>}
                                                {visualPreview && <div className="scale-100">{visualPreview}</div>}
                                            </div>
                                            <span className={`text-[10px] font-bold text-center leading-tight w-full ${isSelected ? 'text-primary' : 'text-textMain-light dark:text-textMain-dark'}`}>{val}</span>
                                            {desc && <span className="text-[8px] text-textMuted-light dark:text-textMuted-dark mt-1 text-center leading-tight line-clamp-2 w-full">{desc}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

export const ScriptHighlighter = ({ text, className = "" }) => {
            const lines = text.split('\n');
            return (
                <div className={`whitespace-pre-wrap ${className}`}>
                    {lines.map((line, i) => {
                        if (line.startsWith('Shot ') || line.startsWith('Panel ')) {
                            return <div key={i} className="text-primary font-bold mt-2 mb-1">{line}</div>;
                        }
                        if (line.startsWith('=== ')) {
                            return <div key={i} className="text-amber-500 font-bold mt-4 mb-2">{line}</div>;
                        }
                        if (line.includes('[DIALOGUE]') || line.includes('[NEGATIVE PROMPT]')) {
                            return <div key={i} className="text-red-500 dark:text-red-400 font-bold mt-2">{line}</div>;
                        }
                        
                        const parts = line.split(/(@[\w-]+|\[.*?\]|\(.*?\))/g);
                        return (
                            <div key={i} className="min-h-[1em] mb-1">
                                {parts.map((part, j) => {
                                    if (!part) return null;
                                    if (part.startsWith('@')) return <span key={j} className="text-accent font-bold">{part}</span>;
                                    if (part.startsWith('[')) return <span key={j} className="text-indigo-600 dark:text-indigo-400">{part}</span>;
                                    if (part.startsWith('(')) return <span key={j} className="text-amber-600 dark:text-amber-500 italic">{part}</span>;
                                    return <span key={j}>{part}</span>;
                                })}
                            </div>
                        );
                    })}
                </div>
            );
        };

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 5 — QUICK COPY BUTTON (inline component)
        // ═══════════════════════════════════════════════════════════════════
        export const QuickCopyBtn = ({ text, className = "" }) => {
            const [copied, setCopied] = useState(false);
            const handleCopy = (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                });
            };
            return (
                <button onClick={handleCopy} title="Copy prompt" className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${copied ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-primary hover:border-primary/50'} ${className}`}>
                    <Icon name={copied ? "Check" : "Copy"} size={11}/>
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            );
        };

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 7 — SHOT STATUS KANBAN BADGE (inline)
        // ═══════════════════════════════════════════════════════════════════
        export const StatusBadge = ({ status, onClick, onContextMenu }) => {
            const map = { Planning: 'status-planning', Ready: 'status-ready', Rendering: 'status-rendering', Completed: 'status-completed', Approved: 'status-approved' };
            const next = { Planning:'Ready', Ready:'Rendering', Rendering:'Completed', Completed:'Approved', Approved:'Planning' };
            return (
                <button onClick={onClick} onContextMenu={onContextMenu} title={`Status: ${status} — click to advance | Right-click for options`}
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all hover:scale-105 ${map[status] || 'status-planning'}`}>
                    {status || 'Planning'}
                </button>
            );
        };

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 8 — AUTO-SAVE INDICATOR
        // ═══════════════════════════════════════════════════════════════════
        export const AutoSaveIndicator = ({ lastSaved, isSaving }) => (
            <div className="flex items-center gap-1.5 text-[9px] text-textMuted-light dark:text-textMuted-dark">
                {isSaving
                    ? <><div className="w-1.5 h-1.5 rounded-full bg-primary saving-pulse"/><span>Saving...</span></>
                    : <><div className="w-1.5 h-1.5 rounded-full bg-green-500"/><span>Saved {lastSaved}</span></>
                }
            </div>
        );

// ═══════════════════════════════════════════════════════════════════
        // FEATURE 10 — ASPECT RATIO FRAME PREVIEW
        // ═══════════════════════════════════════════════════════════════════
        export const AspectRatioPreview = ({ ratio, shotType, lighting }) => {
            const ratios = {
                '--ar 16:9': { w: 16, h: 9, label: '16:9 Widescreen' },
                '--ar 2.39:1': { w: 2.39, h: 1, label: '2.39:1 Anamorphic' },
                '--ar 1.85:1': { w: 1.85, h: 1, label: '1.85:1 Theatrical' },
                '--ar 4:3': { w: 4, h: 3, label: '4:3 Classic' },
                '--ar 1:1': { w: 1, h: 1, label: '1:1 Square' },
                '--ar 9:16': { w: 9, h: 16, label: '9:16 Vertical' },
            };
            const r = ratios[ratio] || ratios['--ar 16:9'];
            const maxW = 120, maxH = 68;
            const scale = Math.min(maxW / r.w, maxH / r.h);
            const fw = Math.round(r.w * scale), fh = Math.round(r.h * scale);
            const lightGrad = lighting?.includes('Golden') ? 'linear-gradient(135deg,#1a0a00,#3d1f00,#7c3d00)' : lighting?.includes('Blue') ? 'linear-gradient(135deg,#000a1a,#001a3d,#003d7c)' : lighting?.includes('Neon') ? 'linear-gradient(135deg,#0a001a,#1a003d,#2d0066)' : lighting?.includes('Low Key') ? 'linear-gradient(135deg,#050505,#0d0d0d,#1a1a1a)' : 'linear-gradient(135deg,#0d0d0d,#1a1a1a,#2d2d2d)';
            return (
                <div className="flex flex-col items-center gap-1">
                    <div className="ar-frame rounded border border-border-light dark:border-border-dark overflow-hidden flex items-center justify-center" style={{width:`${fw}px`, height:`${fh}px`, background: lightGrad}}>
                        <div className="text-center">
                            {shotType && <div className="text-[7px] text-white/40 font-bold">{shotType.split('(')[0].trim()}</div>}
                        </div>
                    </div>
                    <span className="text-[8px] text-textMuted-light dark:text-textMuted-dark font-mono">{r.label}</span>
                </div>
            );
        };

