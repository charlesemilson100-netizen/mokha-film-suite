import React from 'react';

// ── Error Boundary ──────────────────────────────────────────────────
        export class ErrorBoundary extends React.Component {
            constructor(props) { super(props); this.state = { hasError: false, error: null }; }
            static getDerivedStateFromError(error) { return { hasError: true, error }; }
            componentDidCatch(error, info) { console.error('MOKHA Error Boundary caught:', error, info); }
            render() {
                if (this.state.hasError) {
                    return (
                        <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111',color:'#f5f5f5',fontFamily:'monospace',padding:'32px'}}>
                            <div style={{maxWidth:'480px',textAlign:'center'}}>
                                <div style={{fontSize:'48px',marginBottom:'16px'}}>🎬</div>
                                <h2 style={{fontSize:'18px',fontWeight:'900',marginBottom:'8px',color:'#eab308'}}>MOKHA encountered an error</h2>
                                <p style={{fontSize:'12px',color:'#8a8a8a',marginBottom:'24px',lineHeight:'1.6'}}>
                                    {this.state.error?.message || 'An unexpected error occurred.'}
                                </p>
                                <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
                                    <button onClick={() => this.setState({ hasError: false, error: null })}
                                        style={{padding:'10px 20px',background:'#eab308',color:'#000',border:'none',borderRadius:'6px',fontWeight:'900',fontSize:'12px',cursor:'pointer'}}>
                                        Try Again
                                    </button>
                                    <button onClick={() => window.location.reload()}
                                        style={{padding:'10px 20px',background:'transparent',color:'#f5f5f5',border:'1px solid #333',borderRadius:'6px',fontWeight:'900',fontSize:'12px',cursor:'pointer'}}>
                                        Reload App
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }
                return this.props.children;
            }
        }

