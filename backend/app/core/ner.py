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

    def detect_pii_granular(self, text: str):
        """
        Detects PII and returns list of occurrences with char offsets.
        Example: [{"text": "Aldo", "start": 7, "end": 11, "label": "NAME"}]
        """
        pii_results = []
        
        # 1. Regex check with offsets
        # Updated patterns for better ID detection without being too broad
        advanced_patterns = {
            "EMAIL": r'[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            "PHONE": r'(?:(?:\+62)|0)8[0-9\-\s]{8,13}',
            "ACCOUNT": r'\b\d{10,16}\b',
            "NIK": r'\b\d{16}\b',
            "EMP_ID": r'\b[A-Z]{2,4}-\d{4}-\d{4,}\b', # Employee IDs like EMP-2024-0892
            "URL": r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+',
        }

        for label, pattern in advanced_patterns.items():
            for match in re.finditer(pattern, text, re.IGNORECASE):
                pii_results.append({
                    "text": match.group(),
                    "start": match.start(),
                    "end": match.end(),
                    "label": label
                })

        # 2. Context-based ID detection (Smart trigger)
        # If keywords like NIK/NIP/ID are present, look for the next alphanumeric token
        # Using a non-greedy lookahead for the ID part to avoid capturing long generic strings
        context_keywords = r'(?i)\b(nik|nip|ktp|id|no\.?|nomor|kode)\b[:\s]*([A-Z0-9\-/]{6,20})\b'
        for match in re.finditer(context_keywords, text):
            # match.group(2) is the actual ID
            id_part = match.group(2)
            # Skip if the ID part is just a common word (not numeric enough or mixed)
            if not any(char.isdigit() for char in id_part):
                continue
            start_offset = match.start(2)
            end_offset = match.end(2)
            
            # Avoid overlapping with existing regex results
            if not any(r['start'] <= start_offset < r['end'] for r in pii_results):
                pii_results.append({
                    "text": id_part,
                    "start": start_offset,
                    "end": end_offset,
                    "label": "ID_CONTEXT"
                })

        # 3. IndoBERT NER check
        # Stopwords to clean from the start/end of NER results to avoid "Astaga Aldo" issue
        stopwords = {"astaga", "wah", "halo", "hai", "duh", "loh", "kok", "ia", "si", "bu", "pak", "mbak", "mas"}
        
        try:
            ner_results = self.nlp(text)
            for entity in ner_results:
                label = None
                if entity['entity_group'] == 'PER' and entity['score'] > 0.8:
                    label = "NAME"
                elif entity['entity_group'] == 'LOC' and entity['score'] > 0.8:
                    label = "ADDRESS"
                
                if label:
                    ent_text = entity['word']
                    start = entity['start']
                    end = entity['end']
                    
                    # Refine offsets: remove leading/trailing non-alphanumeric or stopwords
                    # This prevents "Astaga Aldo" from being blurred entirely
                    words_in_ent = ent_text.lower().split()
                    
                    current_start = start
                    for word in words_in_ent:
                        if word in stopwords or len(word) <= 1:
                            current_start += len(word) + 1 # +1 for space
                        else:
                            break
                    
                    # If we trimmed everything or it's empty, skip
                    if current_start >= end:
                        continue
                        
                    # Final check for overlap
                    if not any(r['start'] <= current_start < r['end'] for r in pii_results):
                        pii_results.append({
                            "text": text[current_start:end].strip(),
                            "start": current_start,
                            "end": end,
                            "label": label
                        })
        except Exception as e:
            print(f"NER Error: {e}")

        return pii_results

    def detect_pii(self, text: str):
        # Backward compatibility for existing API calls
        results = self.detect_pii_granular(text)
        return results[0]['label'] if results else None
