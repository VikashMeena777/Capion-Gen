#!/usr/bin/env python3
"""
enhance_captions.py — AI Post-Processing for Whisper Captions

Uses Groq API (free tier) to fix common Whisper errors in Hinglish:
- Spelling corrections (Hindi transliteration)
- Proper word boundaries
- Basic punctuation
- Confidence-based flagging

Usage:
    python enhance_captions.py captions.json --output enhanced_captions.json
    python enhance_captions.py captions.json --groq-key YOUR_KEY --output enhanced_captions.json
"""

import argparse
import json
import os
import sys
from pathlib import Path


def enhance_with_groq(captions_data: dict, api_key: str) -> dict:
    """Use Groq to fix Whisper Hinglish transcription errors."""
    
    try:
        import requests
    except ImportError:
        print("⚠️  requests not installed, skipping AI enhancement")
        return captions_data
    
    # Extract just the text for correction
    words = [c["text"] for c in captions_data["captions"]]
    full_text = " ".join(words)
    
    prompt = f"""You are a Hinglish text corrector. Fix spelling and transliteration errors in this Whisper-transcribed Hinglish text.

Rules:
- Keep words in Roman script (no Devanagari)
- Fix common Whisper misheard words (e.g., "ka" → "kya", "hay" → "hai")
- Maintain the EXACT number of words — do NOT add or remove words
- Return ONLY the corrected text, nothing else

Original: {full_text}

Corrected:"""

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": len(full_text) * 2,
            },
            timeout=30,
        )
        
        if response.status_code == 200:
            corrected = response.json()["choices"][0]["message"]["content"].strip()
            corrected_words = corrected.split()
            
            # Only apply if word count matches (safety check)
            if len(corrected_words) == len(captions_data["captions"]):
                for i, caption in enumerate(captions_data["captions"]):
                    if caption["text"] != corrected_words[i]:
                        caption["original"] = caption["text"]
                        caption["text"] = corrected_words[i]
                        caption["enhanced"] = True
                
                enhanced_count = sum(1 for c in captions_data["captions"] if c.get("enhanced"))
                print(f"✨ Enhanced {enhanced_count} words via Groq AI")
            else:
                print(f"⚠️  Word count mismatch ({len(corrected_words)} vs {len(captions_data['captions'])}), skipping AI fixes")
        else:
            print(f"⚠️  Groq API error: {response.status_code}")
    
    except Exception as e:
        print(f"⚠️  AI enhancement failed: {e}")
    
    return captions_data


def flag_low_confidence(captions_data: dict, threshold: float = 0.7) -> dict:
    """Flag words with low Whisper confidence for manual review."""
    flagged = []
    for caption in captions_data["captions"]:
        if caption["confidence"] < threshold:
            caption["lowConfidence"] = True
            flagged.append(f"  ⚠️  '{caption['text']}' (confidence: {caption['confidence']:.0%})")
    
    if flagged:
        print(f"\n🔍 {len(flagged)} low-confidence words flagged:")
        for f in flagged[:10]:
            print(f)
        if len(flagged) > 10:
            print(f"  ... and {len(flagged) - 10} more")
    
    return captions_data


def main():
    parser = argparse.ArgumentParser(description="Enhance Whisper Hinglish captions via AI")
    parser.add_argument("input", help="Input captions JSON file")
    parser.add_argument("--output", "-o", default=None, help="Output file (default: overwrite input)")
    parser.add_argument("--groq-key", default=None, help="Groq API key (or set GROQ_API_KEY env)")
    parser.add_argument("--confidence-threshold", type=float, default=0.7, help="Low confidence threshold")
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ File not found: {args.input}")
        sys.exit(1)
    
    captions_data = json.loads(input_path.read_text(encoding="utf-8"))
    
    # Step 1: Flag low confidence words
    captions_data = flag_low_confidence(captions_data, args.confidence_threshold)
    
    # Step 2: AI enhancement (if API key available)
    api_key = args.groq_key or os.environ.get("GROQ_API_KEY", "")
    if api_key:
        captions_data = enhance_with_groq(captions_data, api_key)
    else:
        print("ℹ️  No Groq API key provided, skipping AI enhancement")
    
    # Write output
    output_path = args.output or args.input
    Path(output_path).write_text(
        json.dumps(captions_data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"\n💾 Saved to: {output_path}")


if __name__ == "__main__":
    main()
