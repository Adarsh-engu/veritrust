from backend.agents.splitter import split_claims

def test_split_claims_basic():
    draft = "First sentence. Second sentence."
    claims = split_claims(draft)
    assert len(claims) == 2
    assert claims[0].text == "First sentence."
    assert draft[claims[0].start:claims[0].end] == claims[0].text
    assert claims[1].text == "Second sentence."
    assert draft[claims[1].start:claims[1].end] == claims[1].text

def test_split_claims_decimals_thousands():
    draft = "The price is ₹1,999.00 today."
    claims = split_claims(draft)
    assert len(claims) == 1
    assert claims[0].text == "The price is ₹1,999.00 today."
    assert draft[claims[0].start:claims[0].end] == claims[0].text

def test_split_claims_abbreviations():
    draft = "It takes approx. 5 days. For e.g. Dr. Smith."
    claims = split_claims(draft)
    assert len(claims) == 2
    assert claims[0].text == "It takes approx. 5 days."
    assert claims[1].text == "For e.g. Dr. Smith."

def test_split_claims_newlines_and_bullets():
    draft = "Here are the rules:\n- Rule one.\n- Rule two."
    claims = split_claims(draft)
    assert len(claims) == 3
    assert claims[0].text == "Here are the rules:"
    assert claims[1].text == "Rule one."
    assert claims[2].text == "Rule two."

def test_exact_spans():
    draft = "  \n  Sentence one. \n\n Sentence two!  \n"
    claims = split_claims(draft)
    assert len(claims) == 2
    assert claims[0].text == "Sentence one."
    assert draft[claims[0].start:claims[0].end] == claims[0].text
    assert claims[1].text == "Sentence two!"
    assert draft[claims[1].start:claims[1].end] == claims[1].text
