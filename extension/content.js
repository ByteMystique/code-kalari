// Content script for YouTube sign language overlay
console.log('Sign Language Extension: Content script loaded');

// Backend URL for API and GIF serving
const BACKEND_URL = 'http://localhost:5001';

let signOverlay = null;
let currentSignTokens = null;
let isOverlayEnabled = false;
let videoElement = null;
let animationInterval = null;
let signQueue = [];
let currentlyPlayingSign = null;
let isPlayingAnimation = false;

// 3D Animator Instance
let signAnimator = null;

// Dynamic Import Helper
async function loadSignAnimator() {
    try {
        const src = chrome.runtime.getURL('sign-animator.js');
        const module = await import(src);
        return module.SignAnimator;
    } catch (e) {
        console.error('Failed to load SignAnimator module', e);
        return null;
    }
}

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
async function createSignOverlay() {
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
      <div class="sign-animation" id="signAnimationContainer" style="position: relative; min-height: 200px;">
        <img id="signGif" src="" alt="Sign language animation" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 2;">
        <div id="sign3DCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;"></div>
      </div>
      <div class="sign-status" id="signStatus">Loading...</div>
    </div>
  `;

    document.body.appendChild(signOverlay);

    // Initialize 3D Animator
    const SignAnimatorClass = await loadSignAnimator();
    if (SignAnimatorClass) {
        // Pass a callback to update the UI text when the 3D avatar signs a letter
        signAnimator = new SignAnimatorClass('sign3DCanvas', (text) => {
            // For 3D, we are getting single letters. We might want to append them or show them.
            // The user asked to "show entire word as mixture of letters".
            // Let's assume we show the current letter being signed, or build up the word.
            // For now, let's show the current letter clearly.

            // Get current text content
            const statusEl = document.getElementById('signStatus');
            if (statusEl) {
                if (text === '') statusEl.innerHTML = '';
                else statusEl.innerHTML = `Spelling: <b>${text}</b>`;
            }
        });
        await signAnimator.init();
    }

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

let lastTokenStart = -1;

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

    // Update every 50ms for smooth transitions
    animationInterval = setInterval(updateAnimation, 50);

    // Also update on video events
    videoElement.addEventListener('play', updateAnimation);
    videoElement.addEventListener('pause', updateAnimation);
    videoElement.addEventListener('seeked', () => {
        lastTokenStart = -1; // Reset tracking on seek
        signQueue = []; // Clear queue on seek? Maybe better to clear to avoid stale signs
        isPlayingAnimation = false;
        // Also clear 3D/GIF
        const signGif = document.getElementById('signGif');
        if (signGif) signGif.style.display = 'none';
        if (signAnimator) signAnimator.clear();

        updateAnimation();
    });

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
        // Only add to queue if it's a NEW segment we haven't processed
        // Use a small epsilon for float comparison just in case
        if (Math.abs(currentToken.start - lastTokenStart) > 0.1) {
            console.log("New segment detected:", currentToken.tokens);
            lastTokenStart = currentToken.start;

            // Safety: If queue is massively backed up (e.g. paused video but queue kept filling?), clear it
            if (signQueue.length > 50) {
                console.warn("Queue too long, clearing...", signQueue);
                signQueue = [];
            }

            // Smart Append: Avoid pushing duplicates that might result from overlapping segments
            // Only add word if it's different from the last word in the queue
            currentToken.tokens.forEach(word => {
                if (signQueue.length === 0 || signQueue[signQueue.length - 1].toLowerCase() !== word.toLowerCase()) {
                    signQueue.push(word);
                }
            });

            // If not currently playing, start the queue
            if (!isPlayingAnimation) {
                playNextSignInQueue();
            }
        }
    } else if (!isPlayingAnimation && signQueue.length === 0) {
        // Only show listening if idle AND nothing in queue
        showSign('', 'Listening...');
    }
}

// Play the next sign in the queue
function playNextSignInQueue() {
    if (signQueue.length === 0) {
        isPlayingAnimation = false;
        currentlyPlayingSign = null;
        showSign('', 'Listening...');
        // Reset 3D animator if idle
        if (signAnimator) signAnimator.clear();
        return;
    }

    isPlayingAnimation = true;
    const word = signQueue.shift(); // Get the first word from queue
    currentlyPlayingSign = word;

    const signGif = document.getElementById('signGif');
    const sign3DCanvas = document.getElementById('sign3DCanvas');

    if (!signGif) {
        playNextSignInQueue(); // Skip if element not found
        return;
    }

    // Update status to show what we are playing
    showSign(word, `Signing: ${word.toUpperCase()}`);

    if (word) {
        const gifPath = `${BACKEND_URL}/gif/${word.toLowerCase()}.gif`;
        console.log(`🎬 Requesting GIF for word: "${word}" from ${gifPath}`);

        // Fetch GIF via background script to bypass Mixed Content (HTTP vs HTTPS)
        chrome.runtime.sendMessage({ action: 'fetchGif', url: gifPath }, (response) => {
            // Handle async response
            if (response && response.success && response.dataUrl) {
                console.log(`✅ GIF loaded successfully for word: "${word}"`);

                // Show GIF, Hide 3D
                signGif.src = response.dataUrl;
                signGif.style.display = 'block';
                if (sign3DCanvas) sign3DCanvas.style.opacity = '0';

                if (signAnimator) signAnimator.clear(); // Stop 3D if it was playing

                const gifDuration = 1500;

                setTimeout(() => {
                    playNextSignInQueue();
                }, gifDuration);
            } else {
                // Fallback to 3D
                console.warn(`❌ GIF not found or failed for word: "${word}". Falling back to 3D.`);

                // Hide GIF, Show 3D
                signGif.style.display = 'none';
                signGif.src = '';

                if (sign3DCanvas) {
                    sign3DCanvas.style.opacity = '1';
                    sign3DCanvas.style.zIndex = '10';
                }

                if (signAnimator) {
                    showSign(null, `Spelling: ${word.toUpperCase()}`);
                    if (signAnimator.handleResize) signAnimator.handleResize();

                    // Use closure to handle async await in callback
                    (async () => {
                        try {
                            await signAnimator.playWord(word);
                        } catch (e) { console.error(e); }
                        playNextSignInQueue();
                    })();
                } else {
                    console.error("SignAnimator not initialized, skipping.");
                    setTimeout(() => { playNextSignInQueue(); }, 1000);
                }
            }
        });
    } else {
        playNextSignInQueue();
    }
}

// Show sign language animation (Simplified status update mainly)
function showSign(word, displayText) {
    const signStatus = document.getElementById('signStatus');
    if (signStatus) signStatus.textContent = displayText;
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
