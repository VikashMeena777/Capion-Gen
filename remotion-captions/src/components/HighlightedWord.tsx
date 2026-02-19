import React from "react";
import {
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

interface HighlightedWordProps {
    text: string;
    isActive: boolean;
    fontFamily: string;
    highlightColor: string;
    fontSize: number;
    strokeWidth: number;
    startFrame: number;
}

/**
 * HighlightedWord — Renders a single word with active highlight.
 *
 * When active:
 *   - Color changes to highlightColor (e.g. yellow #FFD700)
 *   - Spring-based scale pop to 1.15x
 *   - Slight Y lift for dynamism
 *
 * When inactive:
 *   - White text with thick black stroke for readability
 *   - Normal scale (1.0)
 */
export const HighlightedWord: React.FC<HighlightedWordProps> = ({
    text,
    isActive,
    fontFamily,
    highlightColor,
    fontSize,
    strokeWidth,
    startFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Spring animation when word becomes active
    const pop = isActive
        ? spring({
            frame: frame - startFrame,
            fps,
            config: {
                damping: 10,
                stiffness: 300,
                mass: 0.4,
            },
        })
        : 0;

    const wordScale = interpolate(pop, [0, 1], [1, 1.15]);
    const yShift = interpolate(pop, [0, 1], [0, -8]);

    const color = isActive ? highlightColor : "#FFFFFF";

    return (
        <span
            style={{
                display: "inline-block",
                fontFamily,
                fontSize,
                fontWeight: 800,
                color,
                textTransform: "uppercase",
                transform: `scale(${wordScale}) translateY(${yShift}px)`,
                textShadow: `
                    0 0 ${strokeWidth * 3}px rgba(0,0,0,0.9),
                    0 0 ${strokeWidth * 6}px rgba(0,0,0,0.5)
                `,
                WebkitTextStroke: `${strokeWidth}px rgba(0,0,0,0.85)`,
                paintOrder: "stroke fill",
                letterSpacing: "2px",
                transition: "color 0.05s ease",
                lineHeight: 1.2,
            }}
        >
            {text}
        </span>
    );
};
