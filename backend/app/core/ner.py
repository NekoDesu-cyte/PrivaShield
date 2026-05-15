import re
from transformers import pipeline
import torch

class NERProcessor:
    def __init__(self):
        # Patterns for common PII, including addresses and referral codes
        self.patterns = {
            "EMAIL": r'[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            "PHONE": r'(08|\+62)[0-9\-\s]{8,15}',
            "ACCOUNT": r'\b\d{10,16}\b',
            "NIK": r'\b\d{16}\b',
            "USERNAME": r'@[a-zA-Z0-9_]{3,}',
            "URL": r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+',
            "REFERRAL": r'(?i)\b(?:referral|ref|kode|code)[:\s]*([a-z0-9]{4,10})\b',
            "ADDRESS": r'(?i)\b(?:jl|jalan|perum|blok|rt|rw|kel|kec|desa)\.?\s+[a-z0-9\s.,/-]{10,}\b'
        }
        
        print("Loading IndoBERT NER model...")
        # Using a model pre-trained for Token Classification (NER)
        # and aggregation_strategy="simple" to group sub-words into single entities
        self.nlp = pipeline(
            "ner", 
            model="cahya/bert-base-indonesian-ner", 
            aggregation_strategy="simple"
        )
        print("IndoBERT NER model loaded successfully!")

    def detect_pii(self, text: str):
        text = text.strip()
        
        # 1. Regex check (usually faster and more accurate for fixed patterns)
        for label, pattern in self.patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                return label
        
        # 2. IndoBERT NER check for Names and Locations
        try:
            ner_results = self.nlp(text)
            for entity in ner_results:
                if entity['entity_group'] == 'PER' and entity['score'] > 0.7:
                    return "NAME"
                if entity['entity_group'] == 'LOC' and entity['score'] > 0.7:
                    return "ADDRESS"
        except Exception as e:
            print(f"NER Error: {e}")

        # 3. Heuristic check for Names (Fallback)
        if re.search(r'(?i)(nama\s+lengkap|an\.)\s+([a-z\s]{3,20})', text, re.IGNORECASE):
            return "NAME"
            
        return None
