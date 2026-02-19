import React from "react";
import { Composition, staticFile } from "remotion";
import { CaptionedVideo } from "./CaptionedVideo";
import type { Caption } from "@remotion/captions";

/**
 * Sample captions for Remotion Studio preview.
 * In production, real Whisper captions are passed as inputProps from CLI.
 */
const sampleCaptions: Caption[] = [
    { text: "Bhai", startMs: 0, endMs: 400, timestampMs: 0, confidence: 0.99 },
    { text: "kya", startMs: 400, endMs: 700, timestampMs: 400, confidence: 0.97 },
    { text: "scene", startMs: 700, endMs: 1100, timestampMs: 700, confidence: 0.95 },
    { text: "hai", startMs: 1100, endMs: 1500, timestampMs: 1100, confidence: 0.98 },
    { text: "Yaar", startMs: 2000, endMs: 2400, timestampMs: 2000, confidence: 0.96 },
    { text: "mast", startMs: 2400, endMs: 2800, timestampMs: 2400, confidence: 0.94 },
    { text: "lag", startMs: 2800, endMs: 3100, timestampMs: 2800, confidence: 0.97 },
    { text: "raha", startMs: 3100, endMs: 3500, timestampMs: 3100, confidence: 0.95 },
    { text: "hai", startMs: 3500, endMs: 3900, timestampMs: 3500, confidence: 0.99 },
    { text: "Dekh", startMs: 4500, endMs: 4900, timestampMs: 4500, confidence: 0.93 },
    { text: "bhai", startMs: 4900, endMs: 5200, timestampMs: 4900, confidence: 0.98 },
    { text: "kuch", startMs: 5200, endMs: 5600, timestampMs: 5200, confidence: 0.96 },
    { text: "naya", startMs: 5600, endMs: 6000, timestampMs: 5600, confidence: 0.97 },
    { text: "try", startMs: 6000, endMs: 6400, timestampMs: 6000, confidence: 0.95 },
    { text: "karte", startMs: 6400, endMs: 6800, timestampMs: 6400, confidence: 0.94 },
    { text: "hain", startMs: 6800, endMs: 7200, timestampMs: 6800, confidence: 0.96 },
    { text: "Aur", startMs: 7800, endMs: 8100, timestampMs: 7800, confidence: 0.98 },
    { text: "phir", startMs: 8100, endMs: 8500, timestampMs: 8100, confidence: 0.95 },
    { text: "dekhte", startMs: 8500, endMs: 9000, timestampMs: 8500, confidence: 0.97 },
    { text: "hain", startMs: 9000, endMs: 9400, timestampMs: 9000, confidence: 0.96 },
];

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="CaptionedVideo"
                component={CaptionedVideo}
                durationInFrames={300} // 10 seconds at 30fps for preview
                fps={30}
                width={1080}
                height={1920}
                calculateMetadata={({ props }) => {
                    // In production, calculate duration from last caption timestamp
                    const captions = (props as any).captions || [];
                    if (captions.length > 0) {
                        const lastCaption = captions[captions.length - 1];
                        const endMs = lastCaption.endMs || lastCaption.startMs + 500;
                        // Add 1 second padding after last caption
                        const durationInFrames = Math.ceil(((endMs + 1000) / 1000) * 30);
                        return {
                            durationInFrames: Math.max(durationInFrames, 150), // min 5s
                        };
                    }
                    return { durationInFrames: 300 };
                }}
                defaultProps={{
                    videoSrc: "sample.mp4", // Place a sample.mp4 in public/ for preview
                    captions: sampleCaptions,
                    highlightColor: "#FFD700",
                    fontSize: 90,
                    captionYPosition: 72,
                    maxWordsPerPage: 3,
                    backgroundOpacity: 0.6,
                    strokeWidth: 4,
                }}
            />
        </>
    );
};
