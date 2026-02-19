import React from "react";
import { Composition } from "remotion";
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
];

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="CaptionedVideo"
                component={CaptionedVideo}
                durationInFrames={300}
                fps={30}
                width={1080}
                height={1920}
                calculateMetadata={({ props }) => {
                    const p = props as any;

                    // Use durationInFrames from inputProps (set by prepare-render.mjs via ffprobe)
                    // This is the ACTUAL video duration, not just the caption duration
                    const duration = p.durationInFrames || 300;

                    // Use actual video dimensions if provided
                    const width = p.videoWidth || 1080;
                    const height = p.videoHeight || 1920;

                    return {
                        durationInFrames: Math.max(duration, 150),
                        width,
                        height,
                    };
                }}
                defaultProps={{
                    videoSrc: "sample.mp4",
                    captions: sampleCaptions,
                    durationInFrames: 300,
                    videoWidth: 1080,
                    videoHeight: 1920,
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
