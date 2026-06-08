import { Composition } from "remotion";
import { PokerReel, pokerReelSchema } from "./PokerReel";

export const FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PokerReel"
        component={PokerReel}
        durationInFrames={30 * 30}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={pokerReelSchema}
        defaultProps={{
          images: [],
          tournamentName: "Torneo de Poker",
          date: "15 de Junio 2026",
          prize: "Premio Mayor: $5,000",
          location: "Casino Central",
          contact: {
            agent: "Agente de Marketing",
            phone: "+52 55 0000 0000",
            instagram: "@pokerclub",
          },
          music: null,
          durationPerPhoto: 3,
          totalDuration: 25,
        }}
      />
    </>
  );
};
