// Auto-Update Handler for MOKHA FILM Suite
// Uses the electronAPI bridge exposed via preload.js (context-isolated)

(function() {
    const api = window.electronAPI;
    if (!api) {
        console.log('electronAPI not available, update handler disabled');
        return;
    }

    let updateToast = null;

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: mokhaSlideIn 0.3s ease;
        }

        @keyframes mokhaSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
        }

        .mokha-update-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .mokha-update-icon { font-size: 24px; }

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

        .mokha-update-btn-primary:hover { transform: scale(1.05); }

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

        .mokha-update-close:hover { color: #fff; }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    function showToast(content) {
        if (updateToast) updateToast.remove();
        updateToast = document.createElement('div');
        updateToast.className = 'mokha-update-toast';
        updateToast.innerHTML = content;
        document.body.appendChild(updateToast);
        return updateToast;
    }

    // Update available
    api.onUpdateAvailable(function(info) {
        console.log('Update available:', info);

        var content =
            '<button class="mokha-update-close" onclick="this.parentElement.remove()">&times;</button>' +
            '<div class="mokha-update-header">' +
            '  <span class="mokha-update-icon">&#127881;</span>' +
            '  <span class="mokha-update-title">Update Available!</span>' +
            '</div>' +
            '<div class="mokha-update-message">' +
            '  Version ' + info.version + ' is ready to download.' +
            '</div>' +
            '<div class="mokha-update-actions">' +
            '  <button class="mokha-update-btn mokha-update-btn-primary" id="downloadUpdateBtn">Download Now</button>' +
            '  <button class="mokha-update-btn mokha-update-btn-secondary" onclick="this.closest(\'.mokha-update-toast\').remove()">Later</button>' +
            '</div>';

        var toast = showToast(content);

        toast.querySelector('#downloadUpdateBtn').addEventListener('click', function() {
            api.downloadUpdate();
            toast.querySelector('.mokha-update-message').textContent = 'Downloading update...';
            toast.querySelector('.mokha-update-actions').innerHTML =
                '<div class="mokha-update-progress"><div class="mokha-update-progress-bar" id="progressBar" style="width: 0%"></div></div>';
        });
    });

    // Download progress
    api.onDownloadProgress(function(progress) {
        var bar = document.getElementById('progressBar');
        if (bar) bar.style.width = progress.percent + '%';
    });

    // Update downloaded
    api.onUpdateDownloaded(function(info) {
        console.log('Update downloaded:', info);

        var content =
            '<button class="mokha-update-close" onclick="this.parentElement.remove()">&times;</button>' +
            '<div class="mokha-update-header">' +
            '  <span class="mokha-update-icon">&#9989;</span>' +
            '  <span class="mokha-update-title">Update Ready!</span>' +
            '</div>' +
            '<div class="mokha-update-message">' +
            '  Version ' + info.version + ' has been downloaded.<br>Restart the app to install.' +
            '</div>' +
            '<div class="mokha-update-actions">' +
            '  <button class="mokha-update-btn mokha-update-btn-primary" id="installUpdateBtn">Restart Now</button>' +
            '  <button class="mokha-update-btn mokha-update-btn-secondary" onclick="this.closest(\'.mokha-update-toast\').remove()">Later</button>' +
            '</div>';

        var toast = showToast(content);

        toast.querySelector('#installUpdateBtn').addEventListener('click', function() {
            api.installUpdate();
        });
    });

    // Update error
    api.onUpdateError(function(error) {
        console.error('Update error:', error);

        var content =
            '<button class="mokha-update-close" onclick="this.parentElement.remove()">&times;</button>' +
            '<div class="mokha-update-header">' +
            '  <span class="mokha-update-icon">&#9888;&#65039;</span>' +
            '  <span class="mokha-update-title">Update Error</span>' +
            '</div>' +
            '<div class="mokha-update-message">Failed to check for updates. Please try again later.</div>' +
            '<div class="mokha-update-actions">' +
            '  <button class="mokha-update-btn mokha-update-btn-secondary" onclick="this.closest(\'.mokha-update-toast\').remove()">Close</button>' +
            '</div>';

        showToast(content);
    });

    console.log('MOKHA Auto-Update Handler initialized');
})();
