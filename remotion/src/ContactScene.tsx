import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { COLORS, FONT_STACK, TEXT_STACK } from "./theme";

export interface ContactSceneProps {
  agent: string;
  phone: string;
  instagram: string;
  durationInFrames: number;
}

export const ContactScene: React.FC<ContactSceneProps> = ({
  agent,
  phone,
  instagram,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const labelIn = interpolate(frame, [0.4 * fps, 1.1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const labelY = interpolate(frame, [0.4 * fps, 1.1 * fps], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const agentIn = interpolate(frame, [0.9 * fps, 1.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const row1 = interpolate(frame, [1.4 * fps, 2.0 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const row2 = interpolate(frame, [1.8 * fps, 2.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const ctaPulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2);
  const ctaScale = interpolate(ctaPulse, [0, 1], [1, 1.04]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        opacity: fadeIn,
        fontFamily: FONT_STACK,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(200,16,46,0.22) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "14%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: labelIn,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 34,
            color: COLORS.gold,
            letterSpacing: 10,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Inscribete ya
        </div>
        <div
          style={{
            fontSize: 88,
            color: COLORS.paper,
            letterSpacing: 2,
            textTransform: "uppercase",
            textShadow: `0 6px 24px ${COLORS.shadow}`,
          }}
        >
          Tu lugar te espera
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "44%",
          textAlign: "center",
          opacity: agentIn,
        }}
      >
        <div
          style={{
            fontFamily: TEXT_STACK,
            fontSize: 28,
            color: COLORS.gold,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Contacto
        </div>
        <div
          style={{
            fontSize: 64,
            color: COLORS.paper,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {agent}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: "20%",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <ContactRow label="Telefono" value={phone} opacity={row1} />
        <ContactRow label="Instagram" value={instagram} opacity={row2} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "7%",
          textAlign: "center",
          transform: `scale(${ctaScale})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "22px 64px",
            backgroundColor: COLORS.gold,
            color: COLORS.dark,
            fontSize: 36,
            letterSpacing: 6,
            textTransform: "uppercase",
            borderRadius: 4,
          }}
        >
          #PokerLife
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ContactRow: React.FC<{ label: string; value: string; opacity: number }> = ({
  label,
  value,
  opacity,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: "18px 24px",
      borderLeft: `5px solid ${COLORS.gold}`,
      backgroundColor: "rgba(255,255,255,0.05)",
      opacity,
    }}
  >
    <span
      style={{
        fontFamily: FONT_STACK,
        fontSize: 26,
        color: COLORS.gold,
        letterSpacing: 3,
        textTransform: "uppercase",
        minWidth: 150,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontFamily: FONT_STACK,
        fontSize: 36,
        color: COLORS.paper,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {value}
    </span>
  </div>
);
