import subprocess
import os
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import spacy
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
    Scan the gif folder and build a mapping of lowercase words to GIF filenames.
    Returns dict like: {"volcano": "Volcano.gif", "kill": "Kill.gif"}
    """
    gif_index = {}
    
    # Get the path to the gif folder (relative to this script)
    script_dir = Path(__file__).parent
    gif_dir = script_dir.parent / "gif"
    
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
    
    print(f"🔍 Extracted tokens: {tokens}")
    
    # Log which tokens have GIFs available (but don't filter them out!)
    # The frontend will handle GIF vs 3D fallback
    for token in tokens:
        token_lower = token.lower()
        
        # Try exact match (e.g., "VOLCANO" -> "volcano.gif")
        if token_lower in GIF_INDEX:
            print(f"  ✅ GIF available for '{token}' -> {GIF_INDEX[token_lower]}")
        
        # Try fallback to dictionary mapping
        elif token_lower in WORD_TO_SIGN_MAPPING:
            mapped_token = WORD_TO_SIGN_MAPPING[token_lower]
            mapped_lower = mapped_token.lower()
            if mapped_lower in GIF_INDEX:
                print(f"  ✅ GIF available for '{token}' (mapped to '{mapped_token}') -> {GIF_INDEX[mapped_lower]}")
            else:
                print(f"  ⚠️  No GIF for '{token}' (will use 3D animation)")
        else:
            print(f"  ⚠️  No GIF for '{token}' (will use 3D animation)")
    
    return tokens


def parse_groq_segments(segments):
    """
    Parse Groq Whisper API segments into list of dicts with start, end, and tokens.
    Segments are in the format: [{"start": 0.0, "end": 2.5, "text": "Hello world"}, ...]
    """
    sign_tokens = []
    
    for segment in segments:
        start = segment.get("start", 0)
        end = segment.get("end", 0)
        text = segment.get("text", "").strip()
        
        if not text:
            continue
        
        # Process text with NLP to extract ASL-ordered tokens
        tokens = process_text_with_nlp(text)
        
        # Log for debugging
        if tokens:
            print(f"🔍 Segment text: '{text}' → Tokens: {tokens}")
        
        if tokens:
            sign_tokens.append({
                "start": start,
                "end": end,
                "tokens": tokens
            })
    
    return sign_tokens


# --- Health Check Endpoint ---
@app.route('/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint to verify backend is running.
    """
    return jsonify({
        "status": "healthy",
        "message": "Sign Language Backend is running",
        "version": "2.0.0 (Groq Whisper)"
    })


# --- GIF File Serving Endpoint ---
@app.route('/gif/<filename>', methods=['GET'])
def serve_gif(filename):
    """
    Serve GIF files from the gif directory.
    """
    gif_dir = Path(__file__).parent.parent / 'gif'
    
    # Security: Only allow .gif and .webp files
    if not (filename.endswith('.gif') or filename.endswith('.webp')):
        return jsonify({"error": "Invalid file type"}), 400
    
    # Check if file exists
    file_path = gif_dir / filename
    if not file_path.exists():
        return jsonify({"error": "GIF not found"}), 404
    
    return send_from_directory(gif_dir, filename)


# --- API Endpoint for YouTube Transcription ---
@app.route('/transcribe-youtube', methods=['POST'])
def transcribe_youtube():
    """
    Accepts a YouTube URL in a JSON POST request, downloads the audio,
    transcribes it using Groq's Whisper API, and returns sign tokens with timestamps.
    """
    # 1. Get the YouTube URL from the incoming JSON request
    data = request.get_json()
    if not data or 'youtube_url' not in data:
        return jsonify({"success": False, "error": "youtube_url not provided in request body"}), 400
    
    youtube_url = data['youtube_url']
    print(f"Received YouTube URL: {youtube_url}")

    actual_audio_path = None

    try:
        # 2. Create a temporary directory and file path
        temp_dir = tempfile.gettempdir()
        temp_audio_path = os.path.join(temp_dir, f"youtube_audio_{os.getpid()}.%(ext)s")
        
        print(f"Temporary audio path template: {temp_audio_path}")

        # 3. Use yt-dlp to download the audio
        print("Downloading audio with yt-dlp...")
        yt_dlp_command = [
            "yt-dlp",
            "-f", "bestaudio",
            "-o", temp_audio_path,
            "--extract-audio",
            "--audio-format", "mp3",
            youtube_url
        ]
        
        result = subprocess.run(yt_dlp_command, check=True, capture_output=True, text=True)
        print("✅ Audio downloaded successfully")
        
        # The actual filename after download (yt-dlp replaces %(ext)s with the actual extension)
        actual_audio_path = temp_audio_path.replace("%(ext)s", "mp3")
        
        # Verify the file exists and has content
        if not os.path.exists(actual_audio_path):
            raise FileNotFoundError(f"Audio file not found at {actual_audio_path}")
        
        file_size = os.path.getsize(actual_audio_path)
        if file_size == 0:
            raise ValueError("Downloaded audio file is empty")
        
        print(f"✅ Audio file size: {file_size / 1024 / 1024:.2f} MB")

        # 4. Transcribe using Groq's Whisper API
        print("Transcribing with Groq Whisper API...")
        with open(actual_audio_path, "rb") as file:
            audio_data = file.read()
            print(f"✅ Read {len(audio_data)} bytes from audio file")
            
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(actual_audio_path), audio_data),
                model="whisper-large-v3-turbo",
                response_format="verbose_json",  # Get timestamps
                language="en",
                temperature=0.0
            )
        
        print("✅ Transcription completed")
        
        # 5. Parse the transcription segments
        segments = transcription.segments if hasattr(transcription, 'segments') else []
        sign_tokens = parse_groq_segments(segments)
        
        response = {
            "success": True,
            "signTokens": sign_tokens,
            "fullText": transcription.text
        }
        
        return jsonify(response)

    except subprocess.CalledProcessError as e:
        print(f"Error with yt-dlp: {e}")
        return jsonify({
            "success": False, 
            "error": "Failed to download audio from YouTube URL.", 
            "details": e.stderr.decode('utf-8') if e.stderr else str(e)
        }), 500
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({
            "success": False, 
            "error": "An error occurred during transcription.", 
            "details": str(e)
        }), 500
    
    finally:
        # 6. Clean up temporary file
        try:
            if actual_audio_path and os.path.exists(actual_audio_path):
                os.unlink(actual_audio_path)
                print(f"✅ Cleaned up temporary file: {actual_audio_path}")
        except Exception as e:
            print(f"⚠️  Failed to delete temporary file: {e}")


# --- Run the App ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)