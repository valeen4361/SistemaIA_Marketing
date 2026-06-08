import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { COLORS, FONT_STACK } from "./theme";

export interface PhotoSceneProps {
  src: string;
  caption?: string;
  subcaption?: string;
  overlayText?: string;
  durationInFrames: number;
  reverse?: boolean;
}

export const PhotoScene: React.FC<PhotoSceneProps> = ({
  src,
  caption,
  subcaption,
  overlayText,
  durationInFrames,
  reverse = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eased = Easing.bezier(0.7, 0, 0.3, 1);
  const localFrame = reverse ? durationInFrames - 1 - frame : frame;
  const timeRemap = interpolate(
    spring({ frame: localFrame, fps, config: { damping: 16, mass: 1 } }),
    [0, 1],
    [0, 1],
    { easing: eased }
  );

  const scale = interpolate(timeRemap, [0, 1], [1.12, 1.0], { easing: eased });
  const translateX = interpolate(timeRemap, [0, 1], [reverse ? 7 : -7, reverse ? -7 : 7], {
    easing: eased,
  });
  const opacity = Math.min(
    interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [durationInFrames - 0.5 * fps, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const captionIn = interpolate(frame, [0.25 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const captionY = interpolate(frame, [0.25 * fps, 1.0 * fps], [48, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const textOverlayIn = interpolate(frame, [0.5 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const textOverlayY = interpolate(frame, [0.5 * fps, 1.4 * fps], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      <AbsoluteFill
        style={{
          opacity,
          transform: `translate(${translateX}%) scale(${scale})`,
        }}
      >
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 100%)",
          opacity: 0.98,
        }}
      />

      {overlayText && (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 110,
            opacity: textOverlayIn,
            transform: `translateY(${textOverlayY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 42,
              color: COLORS.paper,
              fontWeight: 700,
              letterSpacing: 2,
              textShadow: `0 12px 36px rgba(0,0,0,0.35)`,
            }}
          >
            {overlayText}
          </div>
        </div>
      )}

      {caption && (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            bottom: 260,
            opacity: captionIn,
            transform: `translateY(${captionY}px)`,
          }}
        >
          <div
            style={{
              width: 90,
              height: 4,
              backgroundColor: COLORS.gold,
              marginBottom: 18,
            }}
          />
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 68,
              color: COLORS.paper,
              lineHeight: 1.05,
              letterSpacing: 1,
              textTransform: "uppercase",
              textShadow: `0 4px 24px ${COLORS.shadow}`,
            }}
          >
            {caption}
          </div>
          {subcaption && (
            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 32,
                color: COLORS.gold,
                marginTop: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {subcaption}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 6,
          backgroundColor: COLORS.gold,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};
