import subprocess
import os
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

# --- Load spaCy NLP Model ---
print("Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_trf", disable=["ner"])  # Disable NER for performance
    print("✅ spaCy model loaded successfully")
except OSError:
    print("⚠️  spaCy model 'en_core_web_trf' not found. Please install it:")
    print("    python -m spacy download en_core_web_trf")
    nlp = None

# Simple word-to-sign mapping

WORD_TO_SIGN_MAPPING = {
    # Original Words
    'hello': 'HELLO',
    'hi': 'HELLO', 
    'world': 'WORLD',
    'how': 'HOW',
    'are': 'YOU',
    'you': 'YOU',
    'doing': 'DO',
    'do': 'DO',
    'i': 'I',
    'am': 'AM',
    'fine': 'FINE',
    'good': 'GOOD',
    'thank': 'THANK',
    'thanks': 'THANK',
    'yes': 'YES',
    'no': 'NO',
    'please': 'PLEASE',
    'sorry': 'SORRY',
    'bad': 'BAD',
    'nice': 'GOOD',
    'great': 'GOOD',
    'awesome': 'GOOD',

    # --- New Words from Transcription ---
    'again': 'AGAIN',
    'air': 'AIR',
    'all': 'ALL',
    'animal': 'ANIMAL',
    'at': 'AT',
    'because': 'BECAUSE',
    'bottom': 'BOTTOM',
    'die': 'DIE',
    'died': 'DIE',
    'down': 'DOWN',
    'fire': 'FIRE',
    'for': 'FOR',
    'from': 'FROM',
    'gas': 'GAS',
    'get': 'GET',
    'got': 'GET',
    'happen': 'HAPPEN',
    'happened': 'HAPPEN',
    'human': 'HUMAN',
    'in': 'IN',
    'is': 'IS',
    'it': 'IT',
    'kill': 'KILL',
    'killed': 'KILL',
    'lake': 'LAKE',
    'live': 'LIVE',
    'lived': 'LIVE',
    'make': 'MAKE',
    'minute': 'MINUTE',
    'near': 'NEAR',
    'never': 'NEVER',
    'night': 'NIGHT',
    'old': 'OLD',
    'on': 'ON',
    'one': 'ONE',
    'people': 'PEOPLE',
    'sat': 'SIT',
    'see': 'SEE',
    'sit': 'SIT',
    'sleep': 'SLEEP',
    'story': 'STORY',
    'sure': 'SURE',
    'that': 'THAT',
    'their': 'THEIR',
    'them': 'THEM',
    'they': 'THEY',
    'this': 'THIS',
    'today': 'TODAY',
    'tomorrow': 'TOMORROW',
    'top': 'TOP',
    'under': 'UNDER',
    'village': 'VILLAGE',
    'volcano': 'VOLCANO',
    'was': 'IS', # Mapping past tense to the base sign
    'what': 'WHAT',
    'why': 'WHY',
    'with': 'WITH',
    'without': 'WITHOUT'
}

# --- Build GIF Index ---
def build_gif_index():
    """
    Scan the extension/gif folder and build a mapping of lowercase words to GIF filenames.
    Returns dict like: {"volcano": "Volcano.gif", "kill": "Kill.gif"}
    """
    gif_index = {}
    
    # Get the path to the gif folder (relative to this script)
    script_dir = Path(__file__).parent
    gif_dir = script_dir.parent / "extension" / "gif"
    
    if not gif_dir.exists():
        print(f"⚠️  GIF directory not found: {gif_dir}")
        return gif_index
    
    # Scan for all .gif files
    for gif_file in gif_dir.glob("*.gif"):
        # Remove .gif extension and convert to lowercase for matching
        word = gif_file.stem.lower()
        gif_index[word] = gif_file.name
    
    print(f"✅ Built GIF index with {len(gif_index)} entries")
    return gif_index

# Build the GIF index at startup
GIF_INDEX = build_gif_index()

# --- Time words for ASL grammar ---
TIME_WORDS = {
    "yesterday", "today", "tomorrow", "evening", "morning", "night",
    "now", "later", "soon", "always", "never", "sometimes",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
}

# --- NLP Processing Functions ---
def extract_asl_tokens(doc):
    """
    Extract and reorder tokens according to ASL grammar: TIME → SUBJECT → VERB → OBJECT → OTHER
    Returns a list of uppercase lemmatized tokens.
    """
    time_words = []
    subject = []
    verb = []
    obj = []
    other_important = []
    
    for token in doc:
        # Skip punctuation and whitespace
        if token.is_punct or token.is_space:
            continue
        
        # Time expressions (explicit words + NER)
        if token.text.lower() in TIME_WORDS or token.ent_type_ in ["DATE", "TIME"]:
            time_words.append(token.lemma_.upper())
        
        # Subject (pronouns + nouns in subject position)
        elif token.dep_ == "nsubj":
            subject.append(token.lemma_.upper())
        
        # Main verb (root of sentence)
        elif token.dep_ == "ROOT" and token.pos_ == "VERB":
            verb.append(token.lemma_.upper())
        
        # Objects (direct objects, prepositional objects)
        elif token.dep_ in ["dobj", "pobj"] and token.pos_ in ["NOUN", "PROPN"]:
            obj.append(token.lemma_.upper())
        
        # Other important words (adjectives, important nouns, adverbs)
        elif token.pos_ in ["NOUN", "PROPN", "ADJ"] and not token.is_stop:
            other_important.append(token.lemma_.upper())
        
        # Negation words
        elif token.dep_ == "neg" or token.text.lower() in ["not", "never", "no"]:
            verb.insert(0, token.lemma_.upper())  # Put negation before verb
    
    # ASL order: TIME → SUBJECT → VERB → OBJECT → OTHER
    all_tokens = time_words + subject + verb + obj + other_important
    
    # Remove duplicates while preserving order
    seen = set()
    unique_tokens = []
    for token in all_tokens:
        if token not in seen:
            seen.add(token)
            unique_tokens.append(token)
    
    return unique_tokens

def process_text_with_nlp(text):
    """
    Process text with spaCy NLP to extract ASL-ordered tokens.
    Falls back to simple word extraction if NLP is not available.
    Returns list of uppercase tokens.
    """
    if nlp is None:
        # Fallback: simple word extraction with dictionary lookup
        print("⚠️  NLP not available, using fallback dictionary lookup")
        tokens = [
            WORD_TO_SIGN_MAPPING[word.lower()] 
            for word in text.strip().replace('.', '').replace(',', '').split() 
            if word and word.lower() in WORD_TO_SIGN_MAPPING
        ]
        return tokens
    
    # Parse text with spaCy
    doc = nlp(text)
    
    # Extract ASL-ordered tokens
    tokens = extract_asl_tokens(doc)
    
    print(f"🔍 Extracted tokens before filtering: {tokens}")
    
    # Filter to only include tokens that have corresponding GIF files
    available_tokens = []
    for token in tokens:
        token_lower = token.lower()
        matched = False
        
        # Try exact match (e.g., "VOLCANO" -> "volcano.gif")
        if token_lower in GIF_INDEX:
            available_tokens.append(token)
            matched = True
            print(f"  ✅ Matched '{token}' -> {GIF_INDEX[token_lower]}")
        
        # Try fallback to dictionary mapping (e.g., "GO" might map to something else)
        elif token_lower in WORD_TO_SIGN_MAPPING:
            mapped_token = WORD_TO_SIGN_MAPPING[token_lower]
            mapped_lower = mapped_token.lower()
            if mapped_lower in GIF_INDEX:
                available_tokens.append(mapped_token)
                matched = True
                print(f"  ✅ Mapped '{token}' -> '{mapped_token}' -> {GIF_INDEX[mapped_lower]}")
        
        if not matched:
            print(f"  ❌ No GIF found for '{token}'")
    
    return available_tokens



def time_to_seconds(time_str):
    """
    Convert VTT timestamp (e.g., [hh:mm:ss.mmm] or hh:mm:ss.mmm) to seconds as float.
    Returns None if the timestamp is invalid.
    """
    try:
        # FIX: More robustly remove whitespace and any surrounding brackets
        time_str = time_str.strip().strip('[]')
        parts = time_str.split(':')
        ms = 0.0
        if len(parts) == 3:
            h, m, s = parts
            if '.' in s:
                s, ms_str = s.split('.')
                ms = float(ms_str) / 1000
            return float(h) * 3600 + float(m) * 60 + float(s) + ms
        elif len(parts) == 2:
            m, s = parts
            if '.' in s:
                s, ms_str = s.split('.')
                ms = float(ms_str) / 1000
            return float(m) * 60 + float(s) + ms
        else:
            print(f"Invalid timestamp format: {time_str}")
            return None
    except (ValueError, Exception) as e:
        print(f"Error parsing timestamp '{time_str}': {e}")
        return None

def parse_vtt(vtt_str):
    """
    Parse VTT content into list of dicts with start, end, and tokens (filtered by WORD_TO_SIGN_MAPPING).
    Skips invalid timestamps and logs them for debugging.
    """
    lines = vtt_str.splitlines()
    sign_tokens = []
    invalid_timestamps = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line == 'WEBVTT':
            i += 1
            continue
        
        # FIX: Handle cases where timestamp and text are on the same line
        if '-->' in line:
            try:
                # Separate the timestamp part from the potential text on the same line
                time_part, *text_on_same_line_parts = line.split(maxsplit=2) if ']' not in line else line.split(']', 1)
                start_str, end_str = time_part.split(' --> ')
                
                start = time_to_seconds(start_str)
                end = time_to_seconds(end_str)

                if start is None or end is None:
                    invalid_timestamps.append(line)
                    i += 1
                    continue
                
                # Join any text found on the same line
                text = "".join(text_on_same_line_parts).strip()
                i += 1
                
                # Collect any additional multi-line text
                while i < len(lines) and lines[i].strip() and '-->' not in lines[i]:
                    text += ' ' + lines[i].strip()
                    i += 1


                # Process text with NLP to extract ASL-ordered tokens
                # This replaces the old dictionary lookup approach
                tokens = process_text_with_nlp(text)
                
                # Log for debugging
                if tokens:
                    print(f"📝 VTT text: '{text}' → Tokens: {tokens}")

                
                if tokens:
                    sign_tokens.append({
                        "start": start,
                        "end": end,
                        "tokens": tokens
                    })

            except ValueError:
                # This handles malformed '-->' lines that can't be split properly
                i += 1
                continue
        else:
            i += 1
            
    return sign_tokens, invalid_timestamps


# --- Health Check Endpoint ---
@app.route('/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint to verify backend is running.
    """
    return jsonify({
        "status": "healthy",
        "message": "Sign Language Backend is running",
        "version": "1.0.0"
    })


# --- API Endpoint for YouTube Transcription ---
@app.route('/transcribe-youtube', methods=['POST'])
def transcribe_youtube():
    """
    Accepts a YouTube URL in a JSON POST request, transcribes the audio,
    parses the VTT transcription, and returns relevant words from WORD_TO_SIGN_MAPPING with timestamps as JSON.
    """
    # 1. Get the YouTube URL from the incoming JSON request
    data = request.get_json()
    if not data or 'youtube_url' not in data:
        return jsonify({"success": False, "error": "youtube_url not provided in request body"}), 400
    
    youtube_url = data['youtube_url']
    print(f"Received YouTube URL: {youtube_url}")

    ffmpeg_process = None
    whisper_process = None

    try:
        # 2. Use yt-dlp to get the best audio-only stream URL
        print("Fetching direct audio URL with yt-dlp...")
        yt_dlp_command = ["yt-dlp", "-f", "bestaudio", "-g", youtube_url]
        audio_url = subprocess.check_output(yt_dlp_command, text=True).strip()
        print(f"✅ Got audio stream URL: {audio_url}")

        # 3. Define the ffmpeg and whisper commands for the pipeline
        print("Starting ffmpeg and whisper pipeline...")
        ffmpeg_command = [
            "ffmpeg",
            "-i", audio_url,
            "-f", "wav",
            "-ar", "16000",
            "-ac", "1",
            "-",  # Pipe output to stdout
            "-loglevel", "error"  # Suppress verbose ffmpeg info
        ]
        
        whisper_command = [
            "whisper",
            "-",  # Read audio from stdin
            "--model", "base",
            "--output_format", "vtt"
        ]

        # 4. Start the ffmpeg process
        ffmpeg_process = subprocess.Popen(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # 5. Start the whisper process, piping ffmpeg's output to its input
        whisper_process = subprocess.Popen(
            whisper_command, 
            stdin=ffmpeg_process.stdout, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        )

        # 6. Get the final VTT output and any errors
        vtt_content_bytes, whisper_err_bytes = whisper_process.communicate()
        _, ffmpeg_err_bytes = ffmpeg_process.communicate()

        if ffmpeg_process.returncode != 0:
            raise RuntimeError(f"FFmpeg failed with error: {ffmpeg_err_bytes.decode('utf-8')}")

        if whisper_process.returncode != 0:
            raise RuntimeError(f"Whisper failed with error: {whisper_err_bytes.decode('utf-8')}")

        print("✅ Pipeline finished successfully.")
        
        # 7. Parse the VTT content into the desired JSON format
        vtt_content = vtt_content_bytes.decode('utf-8')
        print(f"Raw VTT content:\n{vtt_content}")  # Log for debugging
        sign_tokens, invalid_timestamps = parse_vtt(vtt_content)
        
        response = {
            "success": True,
            "signTokens": sign_tokens
        }
        if invalid_timestamps:
            response["warnings"] = f"Skipped {len(invalid_timestamps)} invalid timestamps: {invalid_timestamps}"
        
        return jsonify(response)

    except subprocess.CalledProcessError as e:
        print(f"Error with yt-dlp: {e}")
        return jsonify({"success": False, "error": "Failed to fetch audio from YouTube URL.", "details": str(e)}), 500
    except (RuntimeError, Exception) as e:
        print(f"An error occurred in the pipeline: {e}")
        return jsonify({"success": False, "error": "An error occurred during transcription.", "details": str(e)}), 500

# --- Run the App ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)