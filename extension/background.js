// Background service worker for API communication
console.log('Sign Language Extension: Background script loaded');

const API_BASE_URL = 'http://localhost:5001';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'transcribe') {
        handleTranscriptionRequest(request.url, sendResponse);
        return true; // Keep channel open for async response
    } else if (request.action === 'checkHealth') {
        checkBackendHealth(sendResponse);
        return true;
    }
});

// Handle transcription request
async function handleTranscriptionRequest(youtubeUrl, sendResponse) {
    try {
        console.log('Requesting transcription for:', youtubeUrl);

        const response = await fetch(`${API_BASE_URL}/transcribe-youtube`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ youtube_url: youtubeUrl })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log('Transcription successful:', data.signTokens.length, 'segments');
            sendResponse({
                success: true,
                signTokens: data.signTokens,
                warnings: data.warnings
            });
        } else {
            console.error('Transcription failed:', data.error);
            sendResponse({
                success: false,
                error: data.error || 'Transcription failed'
            });
        }
    } catch (error) {
        console.error('Error during transcription:', error);

        let errorMessage = 'Failed to connect to backend server. ';

        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Make sure the Flask server is running on http://localhost:5000';
        } else {
            errorMessage += error.message;
        }

        sendResponse({
            success: false,
            error: errorMessage
        });
    }
}

// Check backend health
async function checkBackendHealth(sendResponse) {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (response.ok) {
            const data = await response.json();
            sendResponse({
                success: true,
                status: 'connected',
                data: data
            });
        } else {
            sendResponse({
                success: false,
                status: 'error',
                message: `Server returned ${response.status}`
            });
        }
    } catch (error) {
        sendResponse({
            success: false,
            status: 'offline',
            message: 'Backend server is not running'
        });
    }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension installed');

        // Set default preferences
        chrome.storage.local.set({
            overlayEnabled: false,
            animationSpeed: 1.0,
            overlayPosition: 'bottom-right'
        });

        // Open welcome page or instructions
        // chrome.tabs.create({ url: 'welcome.html' });
    } else if (details.reason === 'update') {
        console.log('Extension updated');
    }
});
