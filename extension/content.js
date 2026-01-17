// Content script for YouTube sign language overlay
console.log('Sign Language Extension: Content script loaded');

let signOverlay = null;
let currentSignTokens = null;
let isOverlayEnabled = false;
let videoElement = null;
let animationInterval = null;
let signQueue = [];
let currentlyPlayingSign = null;
let isPlayingAnimation = false;

// Initialize when YouTube video player is ready
function initializeExtension() {
    // Find the YouTube video element
    videoElement = document.querySelector('video');

    if (!videoElement) {
        console.log('Video element not found, retrying...');
        setTimeout(initializeExtension, 1000);
        return;
    }

    console.log('Video element found');

    // Create the sign language overlay
    createSignOverlay();

    // Add toggle button to YouTube controls
    addToggleButton();

    // Load saved preferences
    chrome.storage.local.get(['overlayEnabled'], (result) => {
        if (result.overlayEnabled) {
            enableOverlay();
        }
    });
}

// Create the sign language overlay container
function createSignOverlay() {
    if (signOverlay) return;

    signOverlay = document.createElement('div');
    signOverlay.id = 'sign-language-overlay';
    signOverlay.style.display = 'none';

    signOverlay.innerHTML = `
    <div class="sign-container">
      <div class="sign-header">
        <span class="sign-title">Sign Language</span>
        <button class="sign-close" id="closeSignOverlay">×</button>
      </div>
      <div class="sign-animation">
        <img id="signGif" src="" alt="Sign language animation">
      </div>
      <div class="sign-status" id="signStatus">Loading...</div>
    </div>
  `;

    document.body.appendChild(signOverlay);

    // Close button handler
    document.getElementById('closeSignOverlay').addEventListener('click', () => {
        disableOverlay();
    });
}

// Add toggle button to YouTube controls
function addToggleButton() {
    const controls = document.querySelector('.ytp-right-controls');
    if (!controls) {
        setTimeout(addToggleButton, 1000);
        return;
    }

    // Check if button already exists
    if (document.getElementById('signLanguageToggle')) return;

    const toggleButton = document.createElement('button');
    toggleButton.id = 'signLanguageToggle';
    toggleButton.className = 'ytp-button sign-toggle-btn';
    toggleButton.title = 'Toggle Sign Language';
    toggleButton.innerHTML = `
    <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
      <path fill="#fff" d="M12,8 L12,28 M18,8 L18,28 M24,8 L24,28 M8,14 L28,14 M8,22 L28,22"></path>
    </svg>
  `;

    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isOverlayEnabled) {
            disableOverlay();
        } else {
            enableOverlay();
        }
    });

    controls.insertBefore(toggleButton, controls.firstChild);
}

// Enable the sign language overlay
async function enableOverlay() {
    isOverlayEnabled = true;
    signOverlay.style.display = 'block';

    const toggleBtn = document.getElementById('signLanguageToggle');
    if (toggleBtn) {
        toggleBtn.style.opacity = '1';
        toggleBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
    }

    chrome.storage.local.set({ overlayEnabled: true });

    // Get current video URL
    const videoUrl = window.location.href;
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
        showStatus('Invalid YouTube URL', 'error');
        return;
    }

    // Check if we have cached transcription
    const cacheKey = `transcription_${videoId}`;
    chrome.storage.local.get([cacheKey], async (result) => {
        if (result[cacheKey]) {
            console.log('Using cached transcription');
            currentSignTokens = result[cacheKey];
            showStatus('Ready', 'success');
            startSignAnimation();
        } else {
            // Request transcription from background script
            showStatus('Transcribing video...', 'loading');
            requestTranscription(videoUrl);
        }
    });
}

// Disable the sign language overlay
function disableOverlay() {
    isOverlayEnabled = false;
    signOverlay.style.display = 'none';

    const toggleBtn = document.getElementById('signLanguageToggle');
    if (toggleBtn) {
        toggleBtn.style.opacity = '0.7';
        toggleBtn.style.backgroundColor = 'transparent';
    }

    chrome.storage.local.set({ overlayEnabled: false });
    stopSignAnimation();
}

// Request transcription from background script
function requestTranscription(videoUrl) {
    chrome.runtime.sendMessage(
        { action: 'transcribe', url: videoUrl },
        (response) => {
            if (response.success) {
                currentSignTokens = response.signTokens;

                // Cache the result
                const videoId = extractVideoId(videoUrl);
                const cacheKey = `transcription_${videoId}`;
                chrome.storage.local.set({ [cacheKey]: response.signTokens });

                showStatus('Ready', 'success');
                startSignAnimation();
            } else {
                showStatus(response.error || 'Transcription failed', 'error');
            }
        }
    );
}

// Start sign language animation synchronized with video
function startSignAnimation() {
    if (!videoElement || !currentSignTokens) return;

    stopSignAnimation(); // Clear any existing interval

    // Update animation based on current video time
    const updateAnimation = () => {
        if (!videoElement.paused && isOverlayEnabled) {
            const currentTime = videoElement.currentTime;
            displaySignForTime(currentTime);
        }
    };

    // Update every 100ms for smooth transitions
    animationInterval = setInterval(updateAnimation, 100);

    // Also update on video events
    videoElement.addEventListener('play', updateAnimation);
    videoElement.addEventListener('pause', updateAnimation);
    videoElement.addEventListener('seeked', updateAnimation);

    // Initial update
    updateAnimation();
}

// Stop sign language animation
function stopSignAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

// Display sign language for current time
function displaySignForTime(currentTime) {
    if (!currentSignTokens || currentSignTokens.length === 0) {
        showSign('', 'No signs available');
        return;
    }

    // Find the sign token for current time
    const currentToken = currentSignTokens.find(
        token => currentTime >= token.start && currentTime <= token.end
    );

    if (currentToken && currentToken.tokens.length > 0) {
        // Add all tokens from this segment to the queue if not already playing
        if (!isPlayingAnimation) {
            signQueue = [...currentToken.tokens];
            playNextSignInQueue();
        }
    } else if (!isPlayingAnimation) {
        showSign('', 'Listening...');
    }
}

// Play the next sign in the queue
function playNextSignInQueue() {
    if (signQueue.length === 0) {
        isPlayingAnimation = false;
        currentlyPlayingSign = null;
        showSign('', 'Listening...');
        return;
    }

    isPlayingAnimation = true;
    const word = signQueue.shift(); // Get the first word from queue
    currentlyPlayingSign = word;

    const signGif = document.getElementById('signGif');

    if (!signGif) {
        playNextSignInQueue(); // Skip if element not found
        return;
    }

    if (word) {
        const gifPath = chrome.runtime.getURL(`gif/${word.toLowerCase()}.gif`);
        console.log(`🎬 Playing GIF for word: "${word}" from ${gifPath}`);

        // Create a new image to get the GIF duration
        const tempImg = new Image();
        tempImg.src = gifPath;

        tempImg.onload = () => {
            console.log(`✅ GIF loaded successfully for word: "${word}"`);

            // Set the GIF
            signGif.src = gifPath;
            signGif.style.display = 'block';

            // Estimate GIF duration (most sign language GIFs are 2-3 seconds)
            // You can adjust this based on your actual GIF durations
            const gifDuration = 2500; // 2.5 seconds default

            // Wait for the GIF to complete before playing next
            setTimeout(() => {
                playNextSignInQueue();
            }, gifDuration);
        };

        tempImg.onerror = () => {
            console.warn(`❌ GIF not found for word: "${word}" (${word.toLowerCase()}.gif)`);
            signGif.style.display = 'none';

            // Move to next sign after a short delay
            setTimeout(() => {
                playNextSignInQueue();
            }, 1000);
        };
    } else {
        playNextSignInQueue();
    }
}

// Show sign language animation
function showSign(word, displayText) {
    const signGif = document.getElementById('signGif');
    const signWord = document.getElementById('signWord');

    if (!signGif || !signWord) return;

    if (word) {
        // Try to load the GIF for this word
        const gifPath = chrome.runtime.getURL(`gif/${word.toLowerCase()}.gif`);

        console.log(`🎬 Trying to load GIF for word: "${word}" from ${gifPath}`);

        signGif.src = gifPath;
        signGif.style.display = 'block';
        signGif.onerror = () => {
            // Fallback if GIF not found
            console.warn(`❌ GIF not found for word: "${word}" (${word.toLowerCase()}.gif)`);
            signGif.style.display = 'none';
        };
        signGif.onload = () => {
            console.log(`✅ GIF loaded successfully for word: "${word}"`);
        };
    } else {
        signGif.style.display = 'none';
    }

    signWord.textContent = displayText;
}

// Show status message
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('signStatus');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `sign-status ${type}`;
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Re-initialize on YouTube navigation (SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('YouTube navigation detected');
        currentSignTokens = null;
        if (isOverlayEnabled) {
            enableOverlay();
        }
    }
}).observe(document, { subtree: true, childList: true });
