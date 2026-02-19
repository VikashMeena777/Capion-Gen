#!/usr/bin/env python3
"""
transcribe.py — Whisper Transcription for Hinglish Video Captions

Uses faster-whisper with the best available model for accurate
Hinglish (Hindi-English code-mixed) transcription with word-level timestamps.

Usage:
    python transcribe.py audio.wav --model large-v3 --output captions.json
    python transcribe.py audio.wav --model oriserve/whisper-hindi2hinglish-apex --output captions.json

Output format (compatible with Remotion @remotion/captions):
{
    "captions": [
        {"text": "Bhai", "startMs": 0, "endMs": 400, "confidence": 0.99},
        {"text": "kya", "startMs": 400, "endMs": 700, "confidence": 0.97},
        ...
    ],
    "language": "hi",
    "totalDurationMs": 45000
}
"""

import argparse
import json
import sys
import time
from pathlib import Path


def transcribe(audio_path: str, model_name: str = "large-v3", output_path: str = "captions.json"):
    """Transcribe audio file with word-level timestamps for Hinglish content."""
    
    print(f"🎙️  Loading Whisper model: {model_name}")
    start_time = time.time()
    
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("❌ faster-whisper not installed. Run: pip install faster-whisper")
        sys.exit(1)
    
    # Use int8 for CPU (GitHub Actions), float16 for GPU
    model = WhisperModel(
        model_name,
        device="cpu",
        compute_type="int8",
        download_root="./models"
    )
    
    load_time = time.time() - start_time
    print(f"✅ Model loaded in {load_time:.1f}s")
    
    print(f"🔊 Transcribing: {audio_path}")
    transcribe_start = time.time()
    
    segments, info = model.transcribe(
        audio_path,
        language="hi",                    # Hindi as primary (handles Hinglish code-switching)
        task="transcribe",                # Don't translate, keep original Hinglish
        word_timestamps=True,             # Required for word-level caption sync
        beam_size=5,                      # Higher beam = better accuracy
        best_of=5,                        # Sample 5 candidates, pick best
        temperature=0,                    # Deterministic output
        condition_on_previous_text=True,  # Better context flow
        vad_filter=True,                  # Skip silence for faster processing
        vad_parameters=dict(
            min_silence_duration_ms=300,   # Silence threshold
            speech_pad_ms=200,             # Padding around speech
        ),
        initial_prompt=(
            "This is a Hinglish conversation with Hindi and English words mixed together. "
            "Common words: bhai, yaar, kya, hai, nahi, accha, theek, dekho, suno, chalo."
        ),
    )
    
    print(f"📝 Detected language: {info.language} (probability: {info.language_probability:.2f})")
    
    captions = []
    total_segments = 0
    
    for segment in segments:
        total_segments += 1
        if segment.words:
            for word in segment.words:
                cleaned_text = word.word.strip()
                if cleaned_text:  # Skip empty words
                    captions.append({
                        "text": cleaned_text,
                        "startMs": int(word.start * 1000),
                        "endMs": int(word.end * 1000),
                        "confidence": round(word.probability, 3),
                    })
    
    transcribe_time = time.time() - transcribe_start
    
    # Calculate total duration
    total_duration_ms = captions[-1]["endMs"] if captions else 0
    
    # Build output
    output = {
        "captions": captions,
        "language": info.language,
        "totalDurationMs": total_duration_ms,
        "metadata": {
            "model": model_name,
            "totalWords": len(captions),
            "totalSegments": total_segments,
            "transcriptionTimeSec": round(transcribe_time, 1),
            "audioDurationSec": round(total_duration_ms / 1000, 1),
            "avgConfidence": round(
                sum(c["confidence"] for c in captions) / len(captions), 3
            ) if captions else 0,
        }
    }
    
    # Write output
    output_file = Path(output_path)
    output_file.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    
    print(f"\n{'='*50}")
    print(f"✅ Transcription complete!")
    print(f"   📊 Words: {len(captions)}")
    print(f"   📊 Segments: {total_segments}")
    print(f"   📊 Duration: {total_duration_ms / 1000:.1f}s")
    print(f"   📊 Avg confidence: {output['metadata']['avgConfidence']:.1%}")
    print(f"   ⏱️  Processing time: {transcribe_time:.1f}s")
    print(f"   💾 Output: {output_path}")
    print(f"{'='*50}")
    
    return output


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio to Hinglish captions with word-level timestamps"
    )
    parser.add_argument("audio", help="Path to audio file (WAV, MP3, etc.)")
    parser.add_argument(
        "--model", "-m",
        default="large-v3",
        help="Whisper model name (default: large-v3). Use 'oriserve/whisper-hindi2hinglish-apex' for best Hinglish."
    )
    parser.add_argument(
        "--output", "-o",
        default="captions.json",
        help="Output JSON file path (default: captions.json)"
    )
    
    args = parser.parse_args()
    
    if not Path(args.audio).exists():
        print(f"❌ Audio file not found: {args.audio}")
        sys.exit(1)
    
    transcribe(args.audio, args.model, args.output)


if __name__ == "__main__":
    main()
