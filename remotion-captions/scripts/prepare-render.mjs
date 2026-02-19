#!/usr/bin/env node
/**
 * prepare-render.mjs — Pre-render script for GitHub Actions
 *
 * Reads captions.json from Whisper and the input video,
 * calculates the correct duration, and writes inputProps.json
 * for Remotion render CLI.
 */

import { readFileSync, writeFileSync, statSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const args = process.argv.slice(2);
const videoPath = args[0] || "input.mp4";
const captionsPath = args[1] || "captions.json";
const outputPath = args[2] || "inputProps.json";

// Config from environment or defaults
const HIGHLIGHT_COLOR = process.env.HIGHLIGHT_COLOR || "#FFD700";
const FONT_SIZE = parseInt(process.env.FONT_SIZE || "90", 10);
const CAPTION_Y = parseInt(process.env.CAPTION_Y_POSITION || "72", 10);
const MAX_WORDS = parseInt(process.env.MAX_WORDS_PER_PAGE || "3", 10);
const BG_OPACITY = parseFloat(process.env.BG_OPACITY || "0.6");
const STROKE_WIDTH = parseInt(process.env.STROKE_WIDTH || "4", 10);

console.log("📦 Preparing Remotion render props...");

// 1. Read captions
const captionsRaw = readFileSync(captionsPath, "utf-8");
const captionsData = JSON.parse(captionsRaw);

// Convert to Remotion Caption format
const captions = captionsData.captions.map((w) => ({
    text: w.text,
    startMs: w.startMs,
    endMs: w.endMs,
    timestampMs: w.startMs,
    confidence: w.confidence,
}));

console.log(`   📝 Loaded ${captions.length} words`);

// 2. Get video duration via ffprobe
let videoDurationMs = 30000; // fallback 30s
try {
    const ffprobeOutput = execSync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`,
        { encoding: "utf-8" }
    ).trim();
    videoDurationMs = Math.ceil(parseFloat(ffprobeOutput) * 1000);
    console.log(`   🎥 Video duration: ${(videoDurationMs / 1000).toFixed(1)}s`);
} catch (e) {
    console.log(`   ⚠️  ffprobe failed, using caption duration`);
    if (captions.length > 0) {
        videoDurationMs = captions[captions.length - 1].endMs + 1000;
    }
}

// 3. Calculate frames (30fps)
const fps = 30;
const durationInFrames = Math.ceil((videoDurationMs / 1000) * fps);

// 4. Build inputProps
const inputProps = {
    videoSrc: resolve(videoPath),
    captions,
    highlightColor: HIGHLIGHT_COLOR,
    fontSize: FONT_SIZE,
    captionYPosition: CAPTION_Y,
    maxWordsPerPage: MAX_WORDS,
    backgroundOpacity: BG_OPACITY,
    strokeWidth: STROKE_WIDTH,
};

writeFileSync(outputPath, JSON.stringify(inputProps, null, 2));

console.log(`   ✅ Props written to ${outputPath}`);
console.log(`   📊 Duration: ${durationInFrames} frames (${(videoDurationMs / 1000).toFixed(1)}s @ ${fps}fps)`);
console.log(`   🎨 Highlight: ${HIGHLIGHT_COLOR} | Font: ${FONT_SIZE}px | Y: ${CAPTION_Y}%`);
