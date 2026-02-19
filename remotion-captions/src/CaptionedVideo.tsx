import React from "react";
import {
    AbsoluteFill,
    OffthreadVideo,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { AnimatedCaption } from "./components/AnimatedCaption";

const { fontFamily } = loadFont("normal", {
    weights: ["700", "800", "900"],
    subsets: ["latin"],
});

/**
 * Props for the CaptionedVideo composition.
 * In production, these are passed from GitHub Actions CLI.
 */
export interface CaptionedVideoProps {
    videoSrc: string;
    captions: Caption[];
    durationInFrames?: number;
    videoWidth?: number;
    videoHeight?: number;
    fontFamily?: string;
    highlightColor: string;
    fontSize: number;
    captionYPosition: number;
    maxWordsPerPage: number;
    backgroundOpacity: number;
    strokeWidth: number;
}

/**
 * CaptionedVideo — The main Remotion composition.
 *
 * Takes the original video + Whisper word-level captions and renders
 * animated TikTok-style captions with word-by-word highlighting.
 */
export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({
    videoSrc,
    captions,
    highlightColor = "#FFD700",
    fontSize = 90,
    captionYPosition = 72,
    maxWordsPerPage = 3,
    backgroundOpacity = 0.6,
    strokeWidth = 4,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeMs = (frame / fps) * 1000;

    // Use Remotion's createTikTokStyleCaptions to group words into short pages
    const { pages } = createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: 800,
    });

    // Filter pages to enforce max words per page
    const shortPages = pages.flatMap((page) => {
        if (page.tokens.length <= maxWordsPerPage) {
            return [page];
        }
        // Split long pages into chunks of maxWordsPerPage
        const chunks = [];
        for (let i = 0; i < page.tokens.length; i += maxWordsPerPage) {
            const tokenSlice = page.tokens.slice(i, i + maxWordsPerPage);
            chunks.push({
                text: tokenSlice.map((t) => t.text).join(" "),
                startMs: tokenSlice[0].fromMs,
                durationMs:
                    tokenSlice[tokenSlice.length - 1].toMs - tokenSlice[0].fromMs,
                tokens: tokenSlice,
            });
        }
        return chunks;
    });

    // Find the currently active page
    const activePage = shortPages.find(
        (page) =>
            currentTimeMs >= page.startMs &&
            currentTimeMs < page.startMs + page.durationMs
    );

    // Resolve video source
    const resolvedVideoSrc = videoSrc.startsWith("http")
        ? videoSrc
        : staticFile(videoSrc);

    return (
        <AbsoluteFill>
            {/* Background video — plays the full duration */}
            <OffthreadVideo
                src={resolvedVideoSrc}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Animated captions overlay */}
            {activePage && (
                <AnimatedCaption
                    page={activePage}
                    currentTimeMs={currentTimeMs}
                    fontFamily={fontFamily}
                    highlightColor={highlightColor}
                    fontSize={fontSize}
                    yPosition={captionYPosition}
                    backgroundOpacity={backgroundOpacity}
                    strokeWidth={strokeWidth}
                />
            )}
        </AbsoluteFill>
    );
};
