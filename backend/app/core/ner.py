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
            "USERNAME": r'@[a-zA-Z0-9_]{3,}',
            "ADDRESS_HINT": r'(?i)\b(?:jl|jalan|perum|blok|rt|rw|kel|kec|desa|pabrik|kantor|hub)\.?\s+[a-z0-9\s.,/:-]{5,}\b',
            "OCR_FIX_ADDRESS": r'(?i)\b(?:ji|jaian|rto|rwo)\b[a-z0-9\s.,/:-]{5,}\b'
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
        stopwords = {"astaga", "wah", "halo", "hai", "duh", "loh", "kok", "ia", "si", "bu", "pak", "mbak", "mas", "dari", "sama", "makasih", "terima", "kasih"}
        # Triggers that indicate a name might follow (Indonesian context)
        person_triggers = {"si", "sama", "dari", "tim", "nama", "halo", "hai", "pak", "bu", "mbak", "mas"}
        
        # Blacklist for specific words that should NEVER be blurred as NAME (common false positives)
        name_blacklist = {"makasih", "terima", "kasih", "ya", "oke", "sip", "dah", "sudah"}
        
        try:
            ner_results = self.nlp(text)
            for entity in ner_results:
                label = None
                score = entity['score']
                ent_text = entity['word']
                
                if entity['entity_group'] == 'PER':
                    # Context-aware threshold for names
                    # Check text preceding the entity for triggers
                    pre_context = text[max(0, entity['start']-15):entity['start']].lower()
                    has_trigger = any(trigger in pre_context for trigger in person_triggers)
                    
                    if (score > 0.8 or (has_trigger and score > 0.4)) and ent_text.lower() not in name_blacklist:
                        label = "NAME"
                elif entity['entity_group'] in ['LOC', 'GPE'] and score > 0.4:
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
                            # Recalculate start based on word position in original text
                            # (Simple approximation: finding word in the entity slice)
                            word_idx = text[current_start:end].lower().find(word)
                            if word_idx != -1:
                                current_start += word_idx + len(word)
                        else:
                            break
                    
                    # If we trimmed everything or it's empty, skip
                    if current_start >= end:
                        continue
                        
                    # Final check for overlap - prioritizes ADDRESS_HINT/Regex over AI
                    if not any(r['start'] <= current_start < r['end'] for r in pii_results):
                        pii_results.append({
                            "text": text[current_start:end].strip(),
                            "start": current_start,
                            "end": end,
                            "label": label
                        })
        except Exception as e:
            print(f"NER Error: {e}")

        # 4. Cleanup: Sort and remove redundant matches
        pii_results = sorted(pii_results, key=lambda x: x['start'])
        final_results = []
        if pii_results:
            curr = pii_results[0]
            for next_match in pii_results[1:]:
                # If overlap or very close (within 2 chars like comma/space), merge if both are address-like
                is_address_merge = ("ADDRESS" in curr['label'] and "ADDRESS" in next_match['label'])
                
                # Check for overlap: if next starts before current ends
                if next_match['start'] < curr['end']:
                    # Priority logic: EMAIL/PHONE > USERNAME
                    if (next_match['label'] in ["EMAIL", "PHONE"]) and (curr['label'] == "USERNAME"):
                        # Replace current with the stronger match
                        curr = next_match
                    elif (curr['label'] in ["EMAIL", "PHONE"]) and (next_match['label'] == "USERNAME"):
                        # Keep current, ignore the username overlap
                        continue
                    else:
                        # General overlap merge logic
                        curr['end'] = max(curr['end'], next_match['end'])
                        curr['text'] = text[curr['start']:curr['end']]
                elif next_match['start'] <= curr['end'] + 2 and is_address_merge:
                    curr['end'] = max(curr['end'], next_match['end'])
                    curr['text'] = text[curr['start']:curr['end']]
                    curr['label'] = "ADDRESS" # Standardize
                else:
                    final_results.append(curr)
                    curr = next_match
            final_results.append(curr)
            
        return final_results

    def detect_pii(self, text: str):
        # Backward compatibility for existing API calls
        results = self.detect_pii_granular(text)
        return results[0]['label'] if results else None
