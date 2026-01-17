// Popup script
document.addEventListener('DOMContentLoaded', () => {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const overlayToggle = document.getElementById('overlayToggle');
    const refreshBtn = document.getElementById('refreshBtn');

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

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        checkServerStatus();
    });

    // Initial status check
    checkServerStatus();
});
