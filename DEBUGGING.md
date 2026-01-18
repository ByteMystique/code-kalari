# Debugging Guide - 3D Animation Not Working

## Quick Checklist

Please check the following and let me know what you see:

### 1. Backend Server Status

**Did you restart the backend server after the code changes?**
- [ ] Yes, I stopped it with Ctrl+C and ran `python app.py` again
- [ ] No, it's still running the old code

**To restart:**
```bash
# In the terminal running the backend:
# Press Ctrl+C to stop
# Then run:
python backend/app.py
```

### 2. Check Backend Console Logs

When you enable the sign language overlay on YouTube, what do you see in the backend console?

**Look for these lines:**
```
🔍 Extracted tokens: ['WORD1', 'WORD2', ...]
  ✅ GIF available for 'WORD1' -> word1.gif
  ⚠️  No GIF for 'WORD2' (will use 3D animation)
```

**Question:** Do you see the `⚠️ No GIF for '...' (will use 3D animation)` messages?

### 3. Check Browser Console (Chrome DevTools)

Open Chrome DevTools (F12) and go to the Console tab.

**When a word without GIF appears, you should see:**
```
🎬 Requesting GIF for word: "WORD" from http://localhost:5001/gif/word.gif
❌ GIF not found or failed for word: "WORD". Falling back to 3D.
SignAnimator: Playing word "WORD"
```

**Question:** What do you see in the browser console?

### 4. Visual Check

**When a word without GIF appears:**
- [ ] I see nothing (blank overlay)
- [ ] I see "Listening..." status
- [ ] I see "Spelling: WORD" status
- [ ] I see the 3D avatar but it's not moving
- [ ] I see the 3D avatar moving (letter-by-letter)

### 5. Test with Specific Words

Try this test video or search for a video that says these words:
- **Words WITH GIFs:** "hello", "world", "today", "people", "video"
- **Words WITHOUT GIFs:** "volcano", "eruption", "catastrophe", "algorithm"

**Question:** 
- Do words WITH GIFs show animations? (Yes/No)
- Do words WITHOUT GIFs show 3D spelling? (Yes/No)

## Common Issues

### Issue A: Server Not Restarted
**Symptom:** Backend logs still show old messages like "Extracted tokens before filtering"
**Solution:** Restart the backend server

### Issue B: Extension Not Reloaded
**Symptom:** Browser console shows old code behavior
**Solution:** 
1. Go to `chrome://extensions`
2. Find your extension
3. Click the reload icon (circular arrow)
4. Refresh the YouTube page

### Issue C: 3D Animator Not Initialized
**Symptom:** Console shows "SignAnimator not initialized, skipping"
**Solution:** This is a loading issue - refresh the page

### Issue D: No Tokens Being Extracted
**Symptom:** Backend shows `🔍 Extracted tokens: []` (empty)
**Solution:** The NLP might not be extracting tokens properly - check if spaCy model is loaded

## Please Provide

To help me debug further, please share:

1. **Backend console output** when you enable the overlay
2. **Browser console output** (from Chrome DevTools)
3. **What you see visually** in the sign language overlay
4. **Which specific YouTube video** you're testing with (URL)

This will help me identify exactly what's not working!
