import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HighlightedWord } from "./HighlightedWord";
import { CaptionBackground } from "./CaptionBackground";

interface Token {
    text: string;
    fromMs: number;
    toMs: number;
}

interface Page {
    text: string;
    startMs: number;
    durationMs: number;
    tokens: Token[];
}

interface AnimatedCaptionProps {
    page: Page;
    currentTimeMs: number;
    fontFamily: string;
    highlightColor: string;
    fontSize: number;
    yPosition: number; // 0-100 percentage
    backgroundOpacity: number;
    strokeWidth: number;
}

/**
 * AnimatedCaption — Renders a single caption "page" (2-3 words)
 * with a fade-in/scale entrance and word-by-word highlighting.
 *
 * Layout:
 *   - Semi-transparent rounded pill background
 *   - Words laid out horizontally with gaps
 *   - Active word: highlighted color + 1.15x scale pop
 *   - Inactive words: white with black stroke
 */
export const AnimatedCaption: React.FC<AnimatedCaptionProps> = ({
    page,
    currentTimeMs,
    fontFamily,
    highlightColor,
    fontSize,
    yPosition,
    backgroundOpacity,
    strokeWidth,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Page entrance animation — spring-based pop in
    const pageStartFrame = (page.startMs / 1000) * fps;
    const pageProgress = spring({
        frame: frame - pageStartFrame,
        fps,
        config: {
            damping: 12,
            stiffness: 200,
            mass: 0.5,
        },
    });

    // Fade + scale entrance
    const opacity = interpolate(pageProgress, [0, 1], [0, 1]);
    const scale = interpolate(pageProgress, [0, 1], [0.8, 1]);

    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${yPosition}%`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transform: `scale(${scale})`,
                opacity,
            }}
        >
            <CaptionBackground opacity={backgroundOpacity}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: fontSize * 0.25,
                        justifyContent: "center",
                        alignItems: "center",
                        flexWrap: "wrap",
                        maxWidth: "90%",
                    }}
                >
                    {page.tokens.map((token, i) => {
                        const isActive =
                            currentTimeMs >= token.fromMs &&
                            currentTimeMs < token.toMs;

                        return (
                            <HighlightedWord
                                key={`${token.text}-${i}`}
                                text={token.text}
                                isActive={isActive}
                                fontFamily={fontFamily}
                                highlightColor={highlightColor}
                                fontSize={fontSize}
                                strokeWidth={strokeWidth}
                                startFrame={(token.fromMs / 1000) * fps}
                            />
                        );
                    })}
                </div>
            </CaptionBackground>
        </div>
    );
};
