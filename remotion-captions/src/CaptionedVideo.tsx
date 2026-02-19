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
    /** Path to the source video file */
    videoSrc: string;
    /** Whisper captions JSON - array of {text, startMs, endMs, confidence} */
    captions: Caption[];
    /** Font family override (default: Montserrat) */
    fontFamily?: string;
    /** Color for the currently active/highlighted word */
    highlightColor: string;
    /** Font size in pixels */
    fontSize: number;
    /** Vertical position of captions (0-100, percentage from top) */
    captionYPosition: number;
    /** Max words to show per caption page (2-3 for short punchy style) */
    maxWordsPerPage: number;
    /** Background pill opacity (0-1) */
    backgroundOpacity: number;
    /** Text stroke width in px */
    strokeWidth: number;
}

/**
 * CaptionedVideo — The main Remotion composition.
 *
 * Takes the original video + Whisper word-level captions and renders
 * animated TikTok-style captions with word-by-word highlighting.
 *
 * Caption style: 2-3 words per page, Montserrat Bold, active word
 * pops with color + scale animation.
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
    // combineTokensWithinMilliseconds controls how aggressively words are grouped
    const { pages } = createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: 800,
    });

    // Filter pages to enforce max 2-3 words per page
    // createTikTokStyleCaptions groups by timing; we further split long pages
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

    return (
        <AbsoluteFill>
            {/* Background video */}
            <OffthreadVideo
                src={videoSrc.startsWith("http") ? videoSrc : staticFile(videoSrc)}
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
