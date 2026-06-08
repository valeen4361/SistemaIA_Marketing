import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { COLORS, FONT_STACK, TEXT_STACK } from "./theme";

export interface TitleSceneProps {
  tournamentName: string;
  date: string;
  prize: string;
  location: string;
  durationInFrames: number;
}

export const TitleScene: React.FC<TitleSceneProps> = ({
  tournamentName,
  date,
  prize,
  location,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = interpolate(frame, [0.2 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const titleY = interpolate(frame, [0.2 * fps, 1.0 * fps], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const lineWidth = interpolate(frame, [1.0 * fps, 1.8 * fps], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const metaIn = interpolate(frame, [1.4 * fps, 2.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const prizeIn = interpolate(frame, [2.0 * fps, 3.0 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 0.5 * fps, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        opacity: fadeOut,
        fontFamily: FONT_STACK,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(245,197,24,0.18) 0%, rgba(0,0,0,0) 55%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "12%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleIn,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 36,
            color: COLORS.gold,
            letterSpacing: 12,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Poker Club Presents
        </div>
        <div
          style={{
            fontSize: 96,
            color: COLORS.paper,
            lineHeight: 1.0,
            letterSpacing: 2,
            textTransform: "uppercase",
            textShadow: `0 6px 30px ${COLORS.shadow}`,
            padding: "0 40px",
          }}
        >
          {tournamentName}
        </div>
        <div
          style={{
            width: lineWidth,
            height: 5,
            backgroundColor: COLORS.gold,
            margin: "32px auto 0",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: "55%",
          opacity: metaIn,
          fontFamily: TEXT_STACK,
        }}
      >
        <MetaRow label="Fecha" value={date} />
        <MetaRow label="Lugar" value={location} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "14%",
          textAlign: "center",
          opacity: prizeIn,
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 32,
            color: COLORS.gold,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Premio Mayor
        </div>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 78,
            color: COLORS.paper,
            letterSpacing: 2,
            textShadow: `0 4px 20px ${COLORS.shadow}`,
          }}
        >
          {prize}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 24,
      padding: "20px 0",
      borderBottom: `2px solid rgba(245,197,24,0.25)`,
    }}
  >
    <span
      style={{
        fontFamily: FONT_STACK,
        fontSize: 28,
        color: COLORS.gold,
        letterSpacing: 4,
        textTransform: "uppercase",
        minWidth: 160,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontFamily: FONT_STACK,
        fontSize: 42,
        color: COLORS.paper,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {value}
    </span>
  </div>
);
