import React from "react";

interface CaptionBackgroundProps {
    opacity: number;
    children: React.ReactNode;
}

/**
 * CaptionBackground — Semi-transparent rounded pill behind caption text.
 *
 * Provides contrast so captions are readable on any video background.
 * Uses a generous border-radius for a modern pill/bubble appearance.
 */
export const CaptionBackground: React.FC<CaptionBackgroundProps> = ({
    opacity,
    children,
}) => {
    return (
        <div
            style={{
                backgroundColor: `rgba(0, 0, 0, ${opacity})`,
                borderRadius: 20,
                padding: "18px 36px",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
            }}
        >
            {children}
        </div>
    );
};
