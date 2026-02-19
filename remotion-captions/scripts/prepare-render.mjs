#!/usr/bin/env node
/**
 * prepare-render.mjs — Pre-render script for GitHub Actions
 *
 * Reads captions.json from Whisper and the input video,
 * calculates the correct duration, and writes inputProps.json
 * for Remotion render CLI.
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

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
const FPS = 30;

console.log("Preparing Remotion render props...");

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

console.log(`  Loaded ${captions.length} words`);
if (captions.length > 0) {
    console.log(`  First caption: "${captions[0].text}" at ${captions[0].startMs}ms`);
    console.log(`  Last caption: "${captions[captions.length - 1].text}" at ${captions[captions.length - 1].endMs}ms`);
}

// 2. Get video duration and dimensions via ffprobe
let videoDurationMs = 30000; // fallback 30s
let videoWidth = 1080;
let videoHeight = 1920;

try {
    // Get duration
    const durationOutput = execSync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`,
        { encoding: "utf-8" }
    ).trim();
    videoDurationMs = Math.ceil(parseFloat(durationOutput) * 1000);
    console.log(`  Video duration: ${(videoDurationMs / 1000).toFixed(1)}s`);

    // Get dimensions
    const dimensionsOutput = execSync(
        `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${videoPath}"`,
        { encoding: "utf-8" }
    ).trim();
    const [w, h] = dimensionsOutput.split(",").map(Number);
    if (w && h) {
        videoWidth = w;
        videoHeight = h;
        console.log(`  Video dimensions: ${videoWidth}x${videoHeight}`);
    }
} catch (e) {
    console.log(`  ffprobe failed, using caption duration as fallback`);
    if (captions.length > 0) {
        videoDurationMs = captions[captions.length - 1].endMs + 1000;
    }
}

// 3. Calculate frames
const durationInFrames = Math.ceil((videoDurationMs / 1000) * FPS);
console.log(`  Duration: ${durationInFrames} frames (${(videoDurationMs / 1000).toFixed(1)}s @ ${FPS}fps)`);

// 4. Build inputProps — INCLUDING durationInFrames and video dimensions
const inputProps = {
    videoSrc: videoPath.replace(/^.*[/\\]/, ""),
    captions,
    durationInFrames,
    videoWidth,
    videoHeight,
    highlightColor: HIGHLIGHT_COLOR,
    fontSize: FONT_SIZE,
    captionYPosition: CAPTION_Y,
    maxWordsPerPage: MAX_WORDS,
    backgroundOpacity: BG_OPACITY,
    strokeWidth: STROKE_WIDTH,
};

writeFileSync(outputPath, JSON.stringify(inputProps, null, 2));

console.log(`  Props written to ${outputPath}`);
console.log(`  Highlight: ${HIGHLIGHT_COLOR} | Font: ${FONT_SIZE}px | Y: ${CAPTION_Y}%`);
