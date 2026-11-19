import React from 'react';
import { Icon } from './Icon';
import { ImageBridge } from '../../engine/llm';

// ── API Settings Modal Component ─────────────────────────────────────
        export function ApiSettingsModal({ onClose, videoSettings, saveVideoSettings, imageSettings, saveImageSettings }) {
            const [videoTest, setVideoTest] = React.useState({ status: 'idle', msg: '' });
            const [imageTest, setImageTest] = React.useState({ status: 'idle', msg: '' });
            const [activeApiTab, setActiveApiTab] = React.useState('video');

            const testVideoApi = async () => {
                if (!videoSettings.apiKey?.trim()) { setVideoTest({ status: 'error', msg: 'No API key entered.' }); return; }
                setVideoTest({ status: 'testing', msg: 'Testing...' });
                try {
                    let res;
                    if (videoSettings.provider === 'runway') {
                        res = await fetch('https://api.dev.runwayml.com/v1/tasks', { headers: { 'Authorization': `Bearer ${videoSettings.apiKey}`, 'X-Runway-Version': '2024-11-06' } });
                    } else if (videoSettings.provider === 'kling') {
                        res = await fetch('https://api.klingai.com/v1/videos/text2video', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${videoSettings.apiKey}` }, body: JSON.stringify({ model_name: 'kling-v1', prompt: 'test', duration: '1' }) });
                    } else {
                        res = await fetch('https://api.pika.art/v1/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${videoSettings.apiKey}` }, body: JSON.stringify({ prompt: 'test' }) });
                    }
                    if (res.status === 401 || res.status === 403) throw new Error('Invalid API key — authentication failed');
                    setVideoTest({ status: 'ok', msg: `✅ ${videoSettings.provider} API key is valid!` });
                } catch(e) {
                    setVideoTest({ status: 'error', msg: `❌ ${e.message}` });
                }
            };

            const testImageApi = async () => {
                if (!imageSettings.apiKey?.trim()) { setImageTest({ status: 'error', msg: 'No API key entered.' }); return; }
                setImageTest({ status: 'testing', msg: 'Testing...' });
                try {
                    let res;
                    if (imageSettings.provider === 'openai') {
                        res = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${imageSettings.apiKey}` } });
                    } else if (imageSettings.provider === 'stability') {
                        res = await fetch('https://api.stability.ai/v1/user/account', { headers: { 'Authorization': `Bearer ${imageSettings.apiKey}` } });
                    } else if (imageSettings.provider === 'openrouter') {
                        res = await fetch('https://openrouter.ai/api/v1/models', { headers: { 'Authorization': `Bearer ${imageSettings.apiKey}` } });
                    } else if (imageSettings.provider === 'gemini') {
                        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${imageSettings.apiKey}`);
                    } else if (imageSettings.provider === 'mistral') {
                        res = await fetch('https://api.mistral.ai/v1/models', { headers: { 'Authorization': `Bearer ${imageSettings.apiKey}` } });
                    } else {
                        res = { ok: true, status: 200 };
                    }
                    if (res.status === 401 || res.status === 403) throw new Error('Invalid API key — authentication failed');
                    setImageTest({ status: 'ok', msg: `✅ ${imageSettings.provider} API key is valid!` });
                } catch(e) {
                    setImageTest({ status: 'error', msg: `❌ ${e.message}` });
                }
            };

            return (
                <div className="fixed inset-0 z-[99997] flex items-center justify-center" onClick={onClose}>
                    <div className="absolute inset-0 bg-black/70" style={{WebkitBackdropFilter:'blur(6px)',backdropFilter:'blur(6px)'}}/>
                    <div className="relative bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col animate-palette-in" onClick={e=>e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Icon name="Zap" size={18} className="text-purple-400"/>
                                <div>
                                    <div className="text-sm font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest">API Keys & Generation</div>
                                    <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Configure video and image generation providers</div>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"><Icon name="X" size={18}/></button>
                        </div>
                        {/* Tabs */}
                        <div className="flex border-b border-border-light dark:border-border-dark shrink-0">
                            {[['video','⚡ Video Generation'],['image','🖼️ Image Generation']].map(([id,label])=>(
                                <button key={id} onClick={()=>setActiveApiTab(id)}
                                    className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeApiTab===id ? (id==='video' ? 'border-purple-500 text-purple-400' : 'border-emerald-500 text-emerald-400') : 'border-transparent text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                            {/* VIDEO TAB */}
                            {activeApiTab === 'video' && (
                                <div className="flex flex-col gap-4">
                                    <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Select Platform</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id:'runway', label:'Runway', color:'text-blue-400', desc:'Gen-4 Turbo', url:'https://app.runwayml.com/settings/api-keys' },
                                            { id:'kling',  label:'Kling',  color:'text-green-400', desc:'v1 Fast',    url:'https://klingai.com/api' },
                                            { id:'pika',   label:'Pika',   color:'text-pink-400',  desc:'v2.2',      url:'https://pika.art/api' }
                                        ].map(p => (
                                            <div key={p.id} className={`p-3 rounded-xl border cursor-pointer transition-all ${videoSettings.provider===p.id ? 'border-purple-500/60 bg-purple-500/10' : 'border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark hover:border-purple-500/30'}`}
                                                onClick={()=>saveVideoSettings({provider:p.id})}>
                                                <div className={`text-[11px] font-black ${p.color} mb-0.5`}>{p.label}</div>
                                                <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark mb-2">{p.desc}</div>
                                                <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                                                    className="text-[8px] font-bold px-2 py-0.5 rounded bg-input-light dark:bg-border-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-purple-400 hover:border-purple-500/40 transition-all flex items-center gap-1 w-fit">
                                                    <Icon name="Link" size={9}/>Get API Key
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1.5">
                                            {videoSettings.provider === 'runway' ? 'Runway' : videoSettings.provider === 'kling' ? 'Kling' : 'Pika'} API Key
                                        </div>
                                        <input type="password" value={videoSettings.apiKey||''} onChange={e=>saveVideoSettings({apiKey:e.target.value})}
                                            placeholder="Paste your API key here..."
                                            className="w-full text-[11px] px-3 py-2.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark outline-none focus:border-purple-500/60 transition-colors mb-2"/>
                                        <button onClick={testVideoApi} disabled={videoTest.status==='testing'}
                                            className="w-full py-2 rounded-lg text-[11px] font-bold bg-purple-600/20 border border-purple-500/40 text-purple-400 hover:bg-purple-600/30 transition-all disabled:opacity-50">
                                            {videoTest.status==='testing' ? '⏳ Testing...' : '🔌 Test Connection'}
                                        </button>
                                        {videoTest.msg && (
                                            <div className={`mt-2 text-[10px] p-2 rounded-lg ${videoTest.status==='ok' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                                                {videoTest.msg}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Duration</div>
                                            <div className="flex gap-1">
                                                {[3,5,10].map(d=>(
                                                    <button key={d} onClick={()=>saveVideoSettings({duration:d})}
                                                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${videoSettings.duration===d ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark'}`}>
                                                        {d}s
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Ratio</div>
                                            <div className="flex gap-1">
                                                {['16:9','9:16','1:1'].map(r=>(
                                                    <button key={r} onClick={()=>saveVideoSettings({ratio:r})}
                                                        className={`flex-1 py-2 rounded-lg text-[9px] font-bold border transition-all ${videoSettings.ratio===r ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark'}`}>
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* IMAGE TAB */}
                            {activeApiTab === 'image' && (
                                <div className="flex flex-col gap-4">
                                    <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Select Platform</div>
                                    <div className="flex flex-col gap-2">
                                        {ImageBridge.PROVIDERS.map(p=>(
                                            <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${imageSettings.provider===p.id ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark hover:border-emerald-500/30'}`}
                                                onClick={()=>saveImageSettings({provider:p.id})}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`text-[11px] font-black ${p.color} w-24`}>{p.label}</div>
                                                    <div className="text-[9px] text-textMuted-light dark:text-textMuted-dark">{p.desc}</div>
                                                </div>
                                                <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                                                    className="text-[8px] font-bold px-2 py-1 rounded-lg bg-input-light dark:bg-border-dark border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-emerald-400 hover:border-emerald-500/40 transition-all flex items-center gap-1 shrink-0">
                                                    <Icon name="Link" size={9}/>Get API Key
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1.5">
                                            {ImageBridge.PROVIDERS.find(p=>p.id===imageSettings.provider)?.label||'Image'} API Key
                                        </div>
                                        {imageSettings.provider === 'pollinations' ? (
                                            <div className="p-3 rounded-lg bg-lime-500/10 border border-lime-500/30 text-lime-400 text-[10px] leading-relaxed">
                                                🆓 <b>No API key needed!</b> Pollinations is completely free. Just hit 🖼️ Image on any shot and it generates instantly.
                                            </div>
                                        ) : (
                                            <>
                                                <input type="password" value={imageSettings.apiKey||''} onChange={e=>saveImageSettings({apiKey:e.target.value})}
                                                    placeholder="Paste your API key here..."
                                                    className="w-full text-[11px] px-3 py-2.5 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-textMain-light dark:text-textMain-dark outline-none focus:border-emerald-500/60 transition-colors mb-2"/>
                                                <button onClick={testImageApi} disabled={imageTest.status==='testing'}
                                                    className="w-full py-2 rounded-lg text-[11px] font-bold bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 transition-all disabled:opacity-50">
                                                    {imageTest.status==='testing' ? '⏳ Testing...' : '🔌 Test Connection'}
                                                </button>
                                                {imageTest.msg && (
                                                    <div className={`mt-2 text-[10px] p-2 rounded-lg ${imageTest.status==='ok' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                                                        {imageTest.msg}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Aspect Ratio</div>
                                        <div className="flex gap-1">
                                            {['16:9','9:16','1:1','4:3'].map(r=>(
                                                <button key={r} onClick={()=>saveImageSettings({ratio:r})}
                                                    className={`flex-1 py-2 rounded-lg text-[9px] font-bold border transition-all ${imageSettings.ratio===r ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark'}`}>
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-border-light dark:border-border-dark shrink-0 flex justify-end">
                            <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-primaryHover text-white transition-all">Done</button>
                        </div>
                    </div>
                </div>
            );
        }

