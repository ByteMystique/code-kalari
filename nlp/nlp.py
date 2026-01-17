from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import spacy

app = Flask(__name__)
CORS(app)

# Load Transformer (BERT-based) spaCy model
nlp = spacy.load("en_core_web_trf", disable=["ner"])  # faster on CPU

def parse_sentence(text):
    return nlp(text)

def reorder_asl(doc):
    asl_sentences = []

    for sent in doc.sents:
        time_words = []
        subject = []
        verb = []
        obj = []

        for token in sent:
            # Time words (explicit + NER)
            if token.text.lower() in ["yesterday", "today", "tomorrow", "evening", "morning", "night"] \
               or token.ent_type_ in ["DATE", "TIME"]:
                time_words.append(token.text.upper())

            # Subject (topic)
            elif token.dep_ == "nsubj" and token.pos_ == "PRON":
                subject.append(token.lemma_.upper())

            # Main verb (root)
            elif token.dep_ == "ROOT" and token.pos_ == "VERB":
                verb.append(token.lemma_.upper())

            # Objects / places (ignore pronouns like 'us', 'we')
            elif token.dep_ in ["dobj", "pobj"] and token.pos_ in ["NOUN", "PROPN"]:
                obj.append(token.lemma_.upper())

        asl = time_words + subject + verb + obj
        asl_sentences.append(" ".join(asl))

    return asl_sentences

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/convert", methods=["POST"])
def convert():
    data = request.json
    text = data["text"]

    doc = parse_sentence(text)
    asl_list = reorder_asl(doc)

    return jsonify({
        "english": text,
        "asl_gloss": " ".join(asl_list),
        "model": "spaCy Transformer (BERT-based)",
        "grammar": "TIME → SUBJECT → VERB → OBJECT"
    })

if __name__ == "__main__":
    app.run(debug=True)
