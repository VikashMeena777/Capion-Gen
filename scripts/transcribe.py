#!/usr/bin/env python3
"""
transcribe.py - Transcribe audio to Hinglish using oriserve/whisper-hindi2hinglish-apex

Uses the HuggingFace transformers pipeline for ASR with word-level timestamps.
This model is fine-tuned on 700+ hours of noisy Indian audio for Hindi-to-Hinglish
(Roman script) transcription.

Usage:
    python transcribe.py audio.wav --output captions.json
    python transcribe.py audio.wav --model oriserve/whisper-hindi2hinglish-apex --output captions.json
"""

import argparse
import json
import sys
import time
from pathlib import Path


def transcribe_audio(audio_path: str, model_name: str, output_path: str):
    """Transcribe audio using HuggingFace transformers pipeline."""

    print(f"Loading model: {model_name}")
    print(f"Audio file: {audio_path}")
    start_time = time.time()

    import torch
    from transformers import pipeline

    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    print(f"Device: {device}, dtype: {torch_dtype}")

    # Load ASR pipeline with word-level timestamps
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

    # Parse output into caption format
    # Use chunk-level timestamps and distribute words evenly within each chunk
    captions = []
    full_text_parts = []

    if "chunks" in result:
        for chunk in result["chunks"]:
            chunk_text = chunk["text"].strip()
            if not chunk_text:
                continue

            timestamps = chunk.get("timestamp", (0, 0))
            chunk_start_s = timestamps[0] or 0
            chunk_end_s = timestamps[1] or (chunk_start_s + 1)

            words = chunk_text.split()
            if not words:
                continue

            # Distribute time evenly across words in the chunk
            chunk_duration = chunk_end_s - chunk_start_s
            word_duration = chunk_duration / len(words)

            for i, word in enumerate(words):
                start_ms = int((chunk_start_s + i * word_duration) * 1000)
                end_ms = int((chunk_start_s + (i + 1) * word_duration) * 1000)

                captions.append({
                    "text": word,
                    "startMs": start_ms,
                    "endMs": end_ms,
                    "confidence": 0.9,
                })
                full_text_parts.append(word)
    else:
        # Fallback: no timestamps at all
        text = result.get("text", "")
        words = text.split()
        for i, word in enumerate(words):
            start_ms = i * 300
            end_ms = start_ms + 280
            captions.append({
                "text": word,
                "startMs": start_ms,
                "endMs": end_ms,
                "confidence": 0.5,
            })
            full_text_parts.append(word)

    full_text = " ".join(full_text_parts)

    output = {
        "text": full_text,
        "language": "hi",
        "model": model_name,
        "captions": captions,
        "stats": {
            "total_words": len(captions),
            "duration_ms": captions[-1]["endMs"] if captions else 0,
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
    print(f"  Duration: {output['stats']['duration_ms']}ms")
    print(f"  Text: {full_text[:200]}...")
    print(f"  Saved to: {output_path}")

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
