// Popup script
document.addEventListener('DOMContentLoaded', () => {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const overlayToggle = document.getElementById('overlayToggle');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const notification = document.getElementById('notification');

    // Show notification message
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.className = isError ? 'notification error' : 'notification';
        notification.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Check backend server status
    function checkServerStatus() {
        statusDot.className = 'status-dot checking';
        statusText.textContent = 'Checking...';

        chrome.runtime.sendMessage({ action: 'checkHealth' }, (response) => {
            if (response && response.success) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Connected';
            } else {
                statusDot.className = 'status-dot disconnected';
                statusText.textContent = 'Offline';
            }
        });
    }

    // Load overlay toggle state
    chrome.storage.local.get(['overlayEnabled'], (result) => {
        if (result.overlayEnabled) {
            overlayToggle.classList.add('active');
        }
    });

    // Toggle overlay
    overlayToggle.addEventListener('click', () => {
        const isActive = overlayToggle.classList.toggle('active');
        chrome.storage.local.set({ overlayEnabled: isActive });

        // Notify content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleOverlay',
                    enabled: isActive
                });
            }
        });
    });

    // Clear cache button
    clearCacheBtn.addEventListener('click', () => {
        // Get all storage keys
        chrome.storage.local.get(null, (items) => {
            // Find all transcription cache keys
            const cacheKeys = Object.keys(items).filter(key => key.startsWith('transcription_'));

            if (cacheKeys.length === 0) {
                showNotification('No cached transcriptions found.', true);
                return;
            }

            // Remove all cache keys
            chrome.storage.local.remove(cacheKeys, () => {
                showNotification(`✅ Cleared ${cacheKeys.length} cached transcription(s). You can now re-process videos.`);
                console.log('Cleared cache keys:', cacheKeys);
            });
        });
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        checkServerStatus();
    });

    // Contribute button - opens the contribution portal
    const contributeBtn = document.getElementById('contributeBtn');
    contributeBtn.addEventListener('click', () => {
        // Open the Next.js frontend contribution portal
        chrome.tabs.create({ url: 'http://localhost:3000' });
    });

    // Initial status check
    checkServerStatus();
});
