// Auto-Update Handler for MOKHA FILM Suite
// This script listens for update events from Electron and shows notifications

(function() {
    if (!window.require) {
        console.log('Not running in Electron, update handler disabled');
        return;
    }

    const { ipcRenderer } = window.require('electron');
    let updateToast = null;

    // Styles for update notifications
    const styles = `
        .mokha-update-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            border: 1px solid rgba(234, 179, 8, 0.3);
            border-radius: 12px;
            padding: 20px;
            min-width: 350px;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .mokha-update-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .mokha-update-icon {
            font-size: 24px;
        }

        .mokha-update-title {
            font-size: 16px;
            font-weight: 700;
            color: #eab308;
        }

        .mokha-update-message {
            font-size: 14px;
            color: #aaa;
            margin-bottom: 16px;
            line-height: 1.5;
        }

        .mokha-update-progress {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 16px;
        }

        .mokha-update-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #eab308, #06b6d4);
            transition: width 0.3s ease;
        }

        .mokha-update-actions {
            display: flex;
            gap: 10px;
        }

        .mokha-update-btn {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
        }

        .mokha-update-btn-primary {
            background: linear-gradient(135deg, #eab308, #06b6d4);
            color: white;
        }

        .mokha-update-btn-primary:hover {
            transform: scale(1.05);
        }

        .mokha-update-btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #aaa;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .mokha-update-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
        }

        .mokha-update-close {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: #666;
            font-size: 20px;
            cursor: pointer;
            padding: 5px;
            line-height: 1;
        }

        .mokha-update-close:hover {
            color: #fff;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    function showToast(content) {
        // Remove existing toast
        if (updateToast) {
            updateToast.remove();
        }

        updateToast = document.createElement('div');
        updateToast.className = 'mokha-update-toast';
        updateToast.innerHTML = content;
        document.body.appendChild(updateToast);

        return updateToast;
    }

    function dismissToast() {
        if (updateToast) {
            updateToast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (updateToast) updateToast.remove();
                updateToast = null;
            }, 300);
        }
    }

    // Update available
    ipcRenderer.on('update-available', (event, info) => {
        console.log('Update available:', info);
        
        const content = `
            <button class="mokha-update-close" onclick="this.parentElement.remove()">×</button>
            <div class="mokha-update-header">
                <span class="mokha-update-icon">🎉</span>
                <span class="mokha-update-title">Update Available!</span>
            </div>
            <div class="mokha-update-message">
                Version ${info.version} is ready to download.<br>
                <small style="color: #666;">Current: ${require('electron').remote?.app.getVersion() || '2.11.0'}</small>
            </div>
            <div class="mokha-update-actions">
                <button class="mokha-update-btn mokha-update-btn-primary" id="downloadUpdateBtn">
                    Download Now
                </button>
                <button class="mokha-update-btn mokha-update-btn-secondary" onclick="this.closest('.mokha-update-toast').remove()">
                    Later
                </button>
            </div>
        `;

        const toast = showToast(content);
        
        toast.querySelector('#downloadUpdateBtn').addEventListener('click', () => {
            ipcRenderer.send('download-update');
            toast.querySelector('.mokha-update-message').textContent = 'Downloading update...';
            toast.querySelector('.mokha-update-actions').innerHTML = '<div class="mokha-update-progress"><div class="mokha-update-progress-bar" id="progressBar" style="width: 0%"></div></div>';
        });
    });

    // Download progress
    ipcRenderer.on('download-progress', (event, progress) => {
        console.log('Download progress:', progress.percent + '%');
        
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = progress.percent + '%';
        }
    });

    // Update downloaded
    ipcRenderer.on('update-downloaded', (event, info) => {
        console.log('Update downloaded:', info);
        
        const content = `
            <button class="mokha-update-close" onclick="this.parentElement.remove()">×</button>
            <div class="mokha-update-header">
                <span class="mokha-update-icon">✅</span>
                <span class="mokha-update-title">Update Ready!</span>
            </div>
            <div class="mokha-update-message">
                Version ${info.version} has been downloaded.<br>
                Restart the app to install the update.
            </div>
            <div class="mokha-update-actions">
                <button class="mokha-update-btn mokha-update-btn-primary" id="installUpdateBtn">
                    Restart Now
                </button>
                <button class="mokha-update-btn mokha-update-btn-secondary" onclick="this.closest('.mokha-update-toast').remove()">
                    Later
                </button>
            </div>
        `;

        const toast = showToast(content);
        
        toast.querySelector('#installUpdateBtn').addEventListener('click', () => {
            ipcRenderer.send('install-update');
        });
    });

    // Update error
    ipcRenderer.on('update-error', (event, error) => {
        console.error('Update error:', error);
        
        const content = `
            <button class="mokha-update-close" onclick="this.parentElement.remove()">×</button>
            <div class="mokha-update-header">
                <span class="mokha-update-icon">⚠️</span>
                <span class="mokha-update-title">Update Error</span>
            </div>
            <div class="mokha-update-message">
                Failed to check for updates. Please try again later.
            </div>
            <div class="mokha-update-actions">
                <button class="mokha-update-btn mokha-update-btn-secondary" onclick="this.closest('.mokha-update-toast').remove()">
                    Close
                </button>
            </div>
        `;

        showToast(content);
    });

    console.log('MOKHA Auto-Update Handler initialized');
})();
