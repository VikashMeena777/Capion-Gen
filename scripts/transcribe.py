#!/usr/bin/env python3
"""
transcribe.py - Transcribe audio to Hinglish using oriserve/whisper-hindi2hinglish-apex

Uses the HuggingFace transformers pipeline for ASR.
Since this model produces compressed timestamps, we use the actual
audio duration (via ffprobe) to distribute word timings accurately.

Usage:
    python transcribe.py audio.wav --output captions.json
    python transcribe.py audio.wav --model oriserve/whisper-hindi2hinglish-apex --output captions.json
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path


def get_audio_duration_ms(audio_path: str) -> int:
    """Get audio duration in milliseconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                audio_path,
            ],
            capture_output=True, text=True,
        )
        duration_s = float(result.stdout.strip())
        return int(duration_s * 1000)
    except Exception as e:
        print(f"Warning: ffprobe failed ({e}), will estimate from word count")
        return 0


def transcribe_audio(audio_path: str, model_name: str, output_path: str):
    """Transcribe audio using HuggingFace transformers pipeline."""

    print(f"Loading model: {model_name}")
    print(f"Audio file: {audio_path}")
    start_time = time.time()

    # Get actual audio duration FIRST
    audio_duration_ms = get_audio_duration_ms(audio_path)
    if audio_duration_ms > 0:
        print(f"Audio duration: {audio_duration_ms / 1000:.1f}s")

    import torch
    from transformers import pipeline

    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    print(f"Device: {device}, dtype: {torch_dtype}")

    # Load ASR pipeline
    pipe = pipeline(
        "automatic-speech-recognition",
        model=model_name,
        torch_dtype=torch_dtype,
        device=device,
    )

    load_time = time.time() - start_time
    print(f"Model loaded in {load_time:.1f}s")

    # Transcribe with timestamps
    print("Transcribing...")
    transcribe_start = time.time()

    result = pipe(
        audio_path,
        return_timestamps=True,
        chunk_length_s=30,
        batch_size=1,
    )

    transcribe_time = time.time() - transcribe_start
    print(f"Transcription complete in {transcribe_time:.1f}s")

    # Collect all words from chunks
    all_words = []
    if "chunks" in result:
        for chunk in result["chunks"]:
            chunk_text = chunk["text"].strip()
            if not chunk_text:
                continue
            for w in chunk_text.split():
                all_words.append(w)
        print(f"Extracted {len(all_words)} words from {len(result['chunks'])} chunks")
    else:
        text = result.get("text", "")
        all_words = text.split()
        print(f"Extracted {len(all_words)} words (no chunks)")

    if not all_words:
        print("ERROR: No words transcribed!")
        sys.exit(1)

    # Use actual audio duration to distribute words evenly
    if audio_duration_ms <= 0:
        audio_duration_ms = len(all_words) * 300  # fallback ~300ms/word
        print(f"Estimated duration: {audio_duration_ms / 1000:.1f}s")

    # Leave small buffer at start/end
    start_offset_ms = 200
    end_buffer_ms = 500
    usable_duration = audio_duration_ms - start_offset_ms - end_buffer_ms
    word_duration_ms = usable_duration / len(all_words)

    captions = []
    for i, word in enumerate(all_words):
        s = int(start_offset_ms + i * word_duration_ms)
        e = int(start_offset_ms + (i + 1) * word_duration_ms)
        captions.append({
            "text": word,
            "startMs": s,
            "endMs": e,
            "confidence": 0.9,
        })

    print(f"Distributed {len(captions)} words across {audio_duration_ms / 1000:.1f}s (~{word_duration_ms:.0f}ms/word)")

    full_text = " ".join(all_words)

    output = {
        "text": full_text,
        "language": "hi",
        "model": model_name,
        "captions": captions,
        "stats": {
            "total_words": len(captions),
            "audio_duration_ms": audio_duration_ms,
            "first_word_ms": captions[0]["startMs"],
            "last_word_ms": captions[-1]["endMs"],
            "model_load_time_s": round(load_time, 1),
            "transcribe_time_s": round(transcribe_time, 1),
        },
    }

    # Save output
    Path(output_path).write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"\nResults:")
    print(f"  Words: {len(captions)}")
    print(f"  First: '{captions[0]['text']}' at {captions[0]['startMs']}ms")
    print(f"  Last:  '{captions[-1]['text']}' at {captions[-1]['endMs']}ms")
    print(f"  Audio: {audio_duration_ms / 1000:.1f}s")
    print(f"  Text:  {full_text[:200]}...")
    print(f"  Saved: {output_path}")

    return output


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio to Hinglish")
    parser.add_argument("audio", help="Path to audio file (WAV/MP3)")
    parser.add_argument(
        "--model",
        default="oriserve/whisper-hindi2hinglish-apex",
        help="HuggingFace model name (default: oriserve/whisper-hindi2hinglish-apex)",
    )
    parser.add_argument(
        "--output",
        default="captions.json",
        help="Output JSON file path (default: captions.json)",
    )

    args = parser.parse_args()

    if not Path(args.audio).exists():
        print(f"Error: Audio file not found: {args.audio}")
        sys.exit(1)

    transcribe_audio(args.audio, args.model, args.output)


if __name__ == "__main__":
    main()
