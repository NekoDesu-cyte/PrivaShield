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
        advanced_patterns = {
            "EMAIL": r'[a-zA-Z0-9._%+-]+\s*(?:@|at)\s*[a-zA-Z0-9.-]+\s*(?:[\.\,]\s*(?:co|id|com|net|org|edu|gov|io|ai)\b|(?:\.com|net|org|edu|gov|io|ai|id)|[a-z]{2,4})?',
            "PHONE": r'(?:(?:\+62)|0)8[0-9\-\s]{8,13}',
            "ACCOUNT": r'\b\d{10,16}\b',
            "NIK": r'\b\d{16}\b',
            "EMP_ID": r'\b[A-Z]{2,4}-\d{4}-\d{4,}\b', 
            "URL": r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+',
            "USERNAME": r'@[a-zA-Z0-9_]{3,}',
            "ADDRESS_HINT": r'(?i)\b(?:jl|jalan|perum|blok|rt|rw|kel|kec|desa|pabrik|kantor|hub)\.?\s+[a-z0-9\s.,/:-]{5,}\b',
            "OCR_FIX_ADDRESS": r'(?i)\b(?:ji|jaian|rto|rwo|rt|rw)\b[a-z0-9\s.,/:-]{5,}\b'
        }

        for label, pattern in advanced_patterns.items():
            for match in re.finditer(pattern, text, re.IGNORECASE):
                # Validation for EMAIL: must contain '@' or ' at '
                if label == "EMAIL":
                    email_candidate = match.group()
                    if not re.search(r'@|\bat\b', email_candidate, re.I):
                        continue
                
                pii_results.append({
                    "text": match.group(),
                    "start": match.start(),
                    "end": match.end(),
                    "label": label
                })

        # Extra EMAIL check for spaced OCR noise like "dimas p@gmailcom"
        # This catch-all handles "name p@domain" or "name.p @ domain"
        spaced_email_pattern = r'\b[a-zA-Z0-9._%+-]+(?:\s+|\.)[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*(?:\.[a-z]{2,4}|[a-z]{3,})?'
        for match in re.finditer(spaced_email_pattern, text):
             pii_results.append({
                "text": match.group(),
                "start": match.start(),
                "end": match.end(),
                "label": "EMAIL"
            })

        # 2. Context-based Name detection (IndoBERT)
        # Using IndoBERT for NER (Names, Organizations, Locations)
        try:
            # IndoBERT NER is optimized for Title Case sentences.
            # 1. Ensure sentence boundary
            ner_text = text if text.endswith(('.', '!', '?')) else text + "."
            
            # 2. Force Title Case on the whole segment if it's mostly lowercase OCR
            # This is a major booster for IndoBERT which is very sensitive to casing
            words = ner_text.split()
            title_text = " ".join([w.capitalize() for w in words])

            # Detect on TitleCase version to get better recall on names
            ner_results = self.nlp(title_text)
            
            for ent in ner_results:
                if ent['entity_group'] in ['PER', 'ORG', 'LOC']:
                    label_map = {'PER': 'NAME', 'ORG': 'ORG', 'LOC': 'ADDRESS'}
                    
                    # --- SMART CONTEXTUAL FILTERING (Google AI Standard) ---
                    word = ent['word'].strip()
                    label = label_map.get(ent['entity_group'], 'OTHER')
                    score = ent.get('score', 0)
                    
                    # 1. Fragment Suppression: Kill single/double letter names (e.g. 'He', 'Gu', 'De')
                    if len(word) <= 2 and label == 'NAME':
                        continue
                    
                    # 2. Sub-word Artifact Filtering: Ignore Transformer fragments (##)
                    if word.startswith("##"):
                        continue

                    # 3. Proper Casing Heuristic: Names/Orgs in PII context MUST be Title Case
                    # We map back to original text to check the real casing
                    pattern = re.escape(word)
                    orig_match = re.search(pattern, text, re.IGNORECASE)
                    text_to_report = orig_match.group() if orig_match else word
                    
                    is_proper_case = any(c.isupper() for c in text_to_report)
                    
                    # 4. Stop-Word & Conversational Noise Filter
                    lowercased = word.lower()
                    conversational_noise = [
                        'tim', 'divisi', 'ops', 'gue', 'lo', 'you', 'loh', 'apaan', 'valid', 
                        'target', 'marketing', 'manager', 'maka', 'maaf', 'ini', 'keapus', 
                        'hehe', 'oke', 'iya', 'halo', 'semua', 'ada', 'wah', 'dismiss', 'add', 'listen'
                    ]
                    if lowercased in conversational_noise:
                        continue

                    # 5. Non-PII Org Suppression: Don't blur Bank Names (BCA, BRI) - Bad UX
                    if label == 'ORG' and word.upper() in ['BCA', 'BRI', 'BNI', 'MANDIRI', 'OVO', 'GOPAY']:
                        continue

                    # 6. Dynamic Thresholding
                    # Title Case names are trusted more (0.3), Lowercase fragments need near-perfection (0.99)
                    threshold = 0.30 if is_proper_case else 0.99
                    
                    if score < threshold:
                        continue
                    
                    # 7. Keyword conflict check
                    if lowercased in ['nik', 'no', 'id', 'rekening', 'nomor']:
                        continue
                    # -------------------------------------------------------

                    pii_results.append({
                        "text": text_to_report,
                        "start": ent['start'],
                        "end": ent['end'],
                        "label": label
                    })
        except Exception as e:
            print(f"NER Error: {e}")

        # 3. Context-based ID detection (Smart trigger)
        id_keywords = r'(?i)\b(?:nik|id|nomor|no|pegawai|emp|rekening|acc|bank|va|nik)\b'
        if re.search(id_keywords, text):
            # If keywords found, be more aggressive with generic digit patterns
            for match in re.finditer(r'\b\d{8,16}\b', text):
                pii_results.append({
                    "text": match.group(),
                    "start": match.start(),
                    "end": match.end(),
                    "label": "POTENTIAL_ID"
                })

        # 4. Cleanup: Sort and remove redundant matches
        pii_results = sorted(pii_results, key=lambda x: (x['start'], -(x['end'] - x['start'])))
        final_results = []
        if pii_results:
            curr = pii_results[0]
            for next_match in pii_results[1:]:
                # If overlap or very close (within 2 chars like comma/space), merge if both are address-like
                is_address_merge = ("ADDRESS" in curr['label'] and "ADDRESS" in next_match['label'])
                
                # Check for overlap: if next starts before current ends
                if next_match['start'] < curr['end']:
                    # Priority logic: EMAIL/PHONE/EMP_ID/NIK > NAME/USERNAME/ADDRESS_HINT
                    high_priority = ["EMAIL", "PHONE", "NIK", "ACCOUNT", "EMP_ID"]
                    
                    if (next_match['label'] in high_priority) and (curr['label'] not in high_priority):
                        # Replace current with the stronger match
                        curr = next_match
                    elif (curr['label'] in high_priority) and (next_match['label'] not in high_priority):
                        # Keep current, ignore the overlap
                        continue
                    # Check if next_match is fully contained within curr
                    elif next_match['start'] >= curr['start'] and next_match['end'] <= curr['end']:
                        # Skip next_match as it is a sub-segment of curr
                        continue
                    else:
                        # General overlap merge logic
                        curr['end'] = max(curr['end'], next_match['end'])
                        curr['text'] = text[curr['start']:curr['end']]
                elif next_match['start'] <= curr['end'] + 5 and is_address_merge:
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
