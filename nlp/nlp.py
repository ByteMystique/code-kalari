from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import spacy

app = Flask(__name__)
CORS(app)   # <---- ADD THIS LINE

nlp = spacy.load("en_core_web_sm")

def parse_sentence(text):
    return nlp(text)

def reorder_asl(doc):
    time_words = []
    subject = []
    verb = []
    obj = []

    for token in doc:
        if token.ent_type_ == "DATE" or token.dep_ in ["npadvmod", "advmod"]:
            time_words.append(token.text.upper())
        elif token.dep_ == "nsubj":
            subject.append(token.lemma_.upper())
        elif token.pos_ == "VERB":
            verb.append(token.lemma_.upper())
        elif token.dep_ in ["dobj", "pobj"]:
            obj.append(token.lemma_.upper())

    return time_words + subject + verb + obj

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/convert", methods=["POST"])
def convert():
    data = request.json
    text = data["text"]
    doc = parse_sentence(text)
    asl = reorder_asl(doc)
    return jsonify({"asl_gloss": " ".join(asl)})

if __name__ == "__main__":
    app.run(debug=True)
