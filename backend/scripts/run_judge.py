import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.agents.judge import judge_claim
from backend.contracts import ClaimSpan
from backend.retrieval.retriever import retrieve

CASES = [
    # (question, claim_text, expected_status)
    ("Can I return my opened headphones after 20 days?", "Opened electronics can be returned within 15 days.", "SUPPORTED"), # Wait, returned within 15 days is true in evidence, but it doesn't say that in the draft for this question. Let's use real claims
    ("Can I return opened headphones?", "Opened electronics can be returned within 15 days.", "SUPPORTED"),
    ("Can I return opened headphones?", "Opened electronics can be returned within 30 days.", "CONTRADICTED"),
    ("How much does express shipping cost?", "Express shipping costs Rs.499.", "CONTRADICTED"),
    ("How long is the laptop warranty?", "The laptop warranty is 6 months.", "CONTRADICTED"),
    ("How long is the laptop warranty?", "The laptop warranty is 2 years.", "SUPPORTED"),
    ("What are the refund rules?", "Refunds are processed within 30 calendar days.", "CONTRADICTED"),
    ("Do you offer drone delivery?", "Yes, we offer drone delivery in select areas.", "UNSUPPORTED"),
    ("Do you offer drone delivery?", "Drone delivery is not mentioned in our policies.", "SUPPORTED"),
    ("Is international shipping free?", "International shipping is free.", "CONTRADICTED"),
    ("Is standard delivery free?", "Standard delivery is free on all orders.", "SUPPORTED"),
    ("Can I change my delivery address?", "You can change your delivery address anytime.", "CONTRADICTED"),
    ("Can I change my delivery address?", "Address changes are not allowed once shipped.", "SUPPORTED"),
    ("How do I contact support?", "You can call us 24/7.", "UNSUPPORTED"),
    ("What is the restocking fee?", "A restocking fee of Rs. 1,250 applies to opened electronics.", "SUPPORTED"),
    ("What is the restocking fee?", "There is no restocking fee.", "CONTRADICTED"),
    ("Is cosmetic damage covered?", "Cosmetic damage is covered under warranty.", "CONTRADICTED"),
    ("Is cosmetic damage covered?", "Cosmetic damage is strictly excluded.", "SUPPORTED"),
    ("How long is the headphone warranty?", "Headphones have a 1-year warranty.", "SUPPORTED"),
    ("Do you sell gift cards?", "We sell gift cards.", "UNSUPPORTED"),
]

def run():
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print("Running Judge Script...")
    
    total_calls = 0
    valid_json_count = 0
    downgrade_count = 0
    total_latency_ms = 0
    
    for q, draft, expected in CASES:
        ev = retrieve(q, k=4)
        c = ClaimSpan(id=1, text=draft, start=0, end=len(draft))
        
        # Clear cache so we test actual generation
        import backend.agents.judge
        backend.agents.judge._CACHE.clear()
        
        claim, stats = judge_claim(c, ev, q)
        
        total_calls += 1
        latency = stats["latency_ms"]
        total_latency_ms += latency
        if stats["valid_json_first_try"]:
            valid_json_count += 1
            
        reason = claim.reason
        if "downgraded" in reason.lower():
            downgrade_count += 1
            
        cited = [e.chunk_id for e in claim.evidence]
        
        print(f"\nClaim: {draft}")
        print(f"Verdict: {claim.status} (Expected: {expected})")
        print(f"Cited chunks: {cited}")
        print(f"Latency: {latency} ms")
        print(f"Reason: {reason}")
        
    print("\n--- Summary ---")
    print(f"Total calls: {total_calls}")
    print(f"JSON validity rate: {valid_json_count}/{total_calls} ({(valid_json_count/total_calls)*100:.1f}%)")
    print(f"Number of downgrades: {downgrade_count}")
    print(f"Average latency per call: {total_latency_ms/total_calls:.1f} ms")

if __name__ == "__main__":
    run()
