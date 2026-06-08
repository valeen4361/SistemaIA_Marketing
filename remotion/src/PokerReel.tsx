import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  Sequence,
  CalculateMetadataFunction,
  useVideoConfig,
  staticFile,
  Audio,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { PhotoScene } from "./PhotoScene";
import { TitleScene } from "./TitleScene";
import { ContactScene } from "./ContactScene";
import { COLORS, FONT_STACK } from "./theme";

export const pokerReelSchema = z.object({
  images: z.array(z.string()),
  tournamentName: z.string(),
  date: z.string(),
  prize: z.string(),
  location: z.string(),
  contact: z.object({
    agent: z.string(),
    phone: z.string(),
    instagram: z.string(),
  }),
  music: z.string().nullable(),
  durationPerPhoto: z.number().default(4),
  totalDuration: z.number().default(28),
});

export type PokerReelProps = z.infer<typeof pokerReelSchema>;

const TITLE_SECONDS = 4;
const CONTACT_SECONDS = 5;
const PHOTO_TRANSITION_FRAMES = 18;
const MIN_TOTAL_SECONDS = 20;
const MAX_TOTAL_SECONDS = 30;

export const calculateMetadata: CalculateMetadataFunction<PokerReelProps> = ({
  props,
}) => {
  const fps = 30;
  const totalSeconds = Math.max(
    MIN_TOTAL_SECONDS,
    Math.min(MAX_TOTAL_SECONDS, props.totalDuration ?? 25)
  );
  const titleFrames = TITLE_SECONDS * fps;
  const contactFrames = CONTACT_SECONDS * fps;
  const transitionCount = Math.max(0, props.images.length - 1);
  const transitionFrames = transitionCount * PHOTO_TRANSITION_FRAMES;
  const availablePhotoFrames = Math.max(
    0,
    totalSeconds * fps - titleFrames - contactFrames - transitionFrames
  );
  const perPhoto = Math.max(
    2 * fps,
    Math.min(4 * fps, Math.floor(availablePhotoFrames / Math.max(1, props.images.length)))
  );
  const durationInFrames =
    titleFrames + contactFrames + perPhoto * Math.max(1, props.images.length) + transitionFrames;
  return { fps, durationInFrames };
};

export const PokerReel: React.FC<PokerReelProps> = (props) => {
  const { images, tournamentName, date, prize, location, contact, music, totalDuration } = props;
  const { fps } = useVideoConfig();

  const totalSeconds = Math.max(
    MIN_TOTAL_SECONDS,
    Math.min(MAX_TOTAL_SECONDS, totalDuration ?? 25)
  );
  const titleFrames = TITLE_SECONDS * fps;
  const contactFrames = CONTACT_SECONDS * fps;
  const imageList = images.length > 0 ? images : [PLACEHOLDER_IMAGES[0]];
  const totalPhotos = imageList.length;
  const transitionCount = Math.max(0, totalPhotos - 1);
  const transitionFrames = transitionCount * PHOTO_TRANSITION_FRAMES;
  const availablePhotoFrames = Math.max(
    0,
    totalSeconds * fps - titleFrames - contactFrames - transitionFrames
  );
  const perPhoto = Math.max(
    2 * fps,
    Math.min(4 * fps, Math.floor(availablePhotoFrames / Math.max(1, totalPhotos)))
  );

  const musicSrc =
    typeof music === "string" && music.length > 0
      ? music.startsWith("http")
        ? music
        : staticFile(music.replace(/^\/+/, ""))
      : null;

  const overlayText = `${tournamentName} · ${date}`;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark, fontFamily: FONT_STACK }}>
      {musicSrc && <Audio src={musicSrc} volume={0.55} loop />}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={titleFrames}>
          <TitleScene
            tournamentName={tournamentName}
            date={date}
            prize={prize}
            location={location}
            durationInFrames={titleFrames}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: PHOTO_TRANSITION_FRAMES })}
        />

        {imageList.map((src, i) => {
          const reverse = i % 2 === 1;
          const captionLines = buildCaptions(props, i, totalPhotos);
          return (
            <React.Fragment key={`photo-${i}`}>
              <TransitionSeries.Sequence durationInFrames={perPhoto}>
                <PhotoScene
                  src={src.startsWith("http") ? src : staticFile(src.replace(/^\/+/, ""))}
                  caption={captionLines.caption}
                  subcaption={captionLines.subcaption}
                  overlayText={overlayText}
                  durationInFrames={perPhoto}
                  reverse={reverse}
                />
              </TransitionSeries.Sequence>
              {i < imageList.length - 1 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: PHOTO_TRANSITION_FRAMES })}
                />
              )}
            </React.Fragment>
          );
        })}

        {imageList.length > 0 && (
          <TransitionSeries.Transition
            presentation={fade()}
            timing={linearTiming({ durationInFrames: PHOTO_TRANSITION_FRAMES })}
          />
        )}

        <TransitionSeries.Sequence durationInFrames={contactFrames}>
          <ContactScene
            agent={contact.agent}
            phone={contact.phone}
            instagram={contact.instagram}
            durationInFrames={contactFrames}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=1080&h=1920&fit=crop",
];

function buildCaptions(
  props: PokerReelProps,
  index: number,
  total: number
): { caption: string; subcaption?: string } {
  if (total === 1) {
    return { caption: props.tournamentName, subcaption: `${props.date} - ${props.location}` };
  }
  const tag = index === 0 ? "Cartel Oficial" : index === total - 1 ? "Inscripciones Abiertas" : "Sala Principal";
  return {
    caption: tag,
    subcaption: index % 2 === 0 ? props.date : props.location,
  };
}
