import type { Caption } from "@remotion/captions";

/**
 * WhisperWord — Shape from our transcribe.py output.
 */
interface WhisperWord {
    text: string;
    startMs: number;
    endMs: number;
    confidence: number;
}

interface WhisperOutput {
    captions: WhisperWord[];
    language: string;
}

/**
 * Convert Whisper JSON output to Remotion Caption[] format.
 *
 * Whisper gives us: { text, startMs, endMs, confidence }
 * Remotion expects: { text, startMs, endMs, timestampMs, confidence }
 */
export function parseWhisperOutput(whisperJson: WhisperOutput): Caption[] {
    return whisperJson.captions.map((word) => ({
        text: word.text,
        startMs: word.startMs,
        endMs: word.endMs,
        timestampMs: word.startMs,
        confidence: word.confidence,
    }));
}

/**
 * Load and parse a captions JSON file (used in GitHub Actions render).
 * In the Remotion composition, captions come as props, so this is
 * primarily for the render script.
 */
export function loadCaptionsFromFile(jsonString: string): Caption[] {
    const parsed: WhisperOutput = JSON.parse(jsonString);
    return parseWhisperOutput(parsed);
}
