import { Icon } from '../ui/Icon';

export const InputField = ({ label, value, onChange, placeholder, onAutoFill, onLLaVA, isLlavaReady, isProcessing }) => (
        <div className={`relative transition-all ${isProcessing ? 'ring-1 ring-violet-500/60 rounded-lg shadow-[0_0_12px_rgba(139,92,246,0.3)]' : ''}`}>
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">{label}</label>
                <div className="flex items-center gap-1">
                    {onLLaVA && (
                        <button
                            type="button"
                            onClick={onLLaVA}
                            disabled={isProcessing}
                            title={isLlavaReady ? "Analyze image with LLaVA-1.5" : "LLaVA not connected"}
                            className={`text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all ${isProcessing ? 'bg-violet-500/20 border-violet-500/50 text-violet-500 cursor-wait' : isLlavaReady ? 'bg-violet-500/10 border-violet-500/30 text-violet-500 hover:bg-violet-500/20' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark opacity-50 cursor-not-allowed'}`}
                        >
                            {isProcessing ? <Icon name="Timer" size={10} className="animate-spin" /> : <Icon name="Camera" size={10} />}
                            {isProcessing ? 'Analyzing...' : 'LLaVA'}
                        </button>
                    )}
                    {onAutoFill && (
                        <button
                            type="button"
                            onClick={onAutoFill}
                            title="Auto-fill randomly"
                            className="text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:border-primary hover:text-primary transition-all"
                        >
                            <Icon name="Sparkles" size={10} />
                            Auto
                        </button>
                    )}
                </div>
            </div>
            <div className="relative">
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark rounded-lg p-2 text-sm focus:border-primary outline-none shadow-inner resize-y min-h-[60px] custom-scrollbar transition-all ${isProcessing ? 'blur-sm pointer-events-none select-none' : ''}`}
                />
                {isProcessing && (
                    <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-violet-900/20 backdrop-blur-[1px]">
                        <div className="flex items-center gap-2 bg-panel-light dark:bg-[#1a1020] border border-violet-500/50 rounded-full px-3 py-1.5 shadow-xl">
                            <div className="flex gap-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'0ms'}}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'120ms'}}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'240ms'}}></div>
                            </div>
                            <span className="text-[9px] font-black text-violet-300 tracking-widest uppercase">LLaVA Analyzing...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

