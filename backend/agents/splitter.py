import re
from backend.contracts import ClaimSpan

_ABBREV_PATTERN = re.compile(r'\b(?:e\.g|i\.e|approx|mr|mrs|ms|dr|vs|etc)\.$', re.IGNORECASE)

def _is_boundary(match: re.Match, text: str) -> bool:
    sep = match.group(0)
    if '\n' in sep or '\r' in sep:
        return True
    
    if match.end() == len(text):
        return True
    
    prefix = text[:match.start()]
    last_word_match = re.search(r'\S+$', prefix)
    if last_word_match:
        last_word = last_word_match.group(0) + sep.strip()
        if _ABBREV_PATTERN.search(last_word):
            return False
            
    next_char_match = re.search(r'\S', text[match.end():])
    if next_char_match:
        c = next_char_match.group(0)
        if c.isupper() or c in '-*':
            return True
    return False

def split_claims(draft: str) -> list[ClaimSpan]:
    """
    Split draft into sentences, returning exact ClaimSpans.
    Do not split on decimals, thousands separators, or abbreviations.
    Newlines and bullet markers are boundaries.
    """
    if not draft:
        return []
        
    try:
        matches = list(re.finditer(r'[.!?]+(?:\s+|$)|[\n\r]+', draft))
        boundaries = [0]
        for m in matches:
            if _is_boundary(m, draft):
                boundaries.append(m.end())
                
        if boundaries[-1] != len(draft):
            boundaries.append(len(draft))
            
        claims = []
        cid = 1
        for i in range(len(boundaries)-1):
            start = boundaries[i]
            end = boundaries[i+1]
            
            while start < end and draft[start].isspace():
                start += 1
            while end > start and draft[end-1].isspace():
                end -= 1
                
            m = re.match(r'^[-*]\s+', draft[start:end])
            if m:
                start += m.end()
                
            if start < end:
                text = draft[start:end]
                claims.append(ClaimSpan(id=cid, text=text, start=start, end=end))
                cid += 1
                
        return claims
    except Exception:
        # Fallback to plain sentence split if something goes wrong
        parts = re.split(r'(?<=[.!?])\s+', draft.strip())
        claims = []
        cid = 1
        for p in parts:
            if not p.strip(): continue
            idx = draft.find(p)
            start = idx if idx != -1 else 0
            end = start + len(p) if idx != -1 else 0
            claims.append(ClaimSpan(id=cid, text=p, start=start, end=end))
            cid += 1
        return claims
