export interface RenderRequestBody {
  images: string[];
  tournamentName: string;
  date: string;
  prize: string;
  location: string;
  contact: {
    agent: string;
    phone: string;
    instagram: string;
  };
  music?: string | null;
  durationPerPhoto?: number;
  totalDuration?: number;
}

export interface PublishRequestBody {
  imagePath: string;
  title: string;
  user?: string;
  platforms?: string[];
}

export interface RenderResult {
  videoPath: string;
  videoUrl: string;
  durationSeconds: number;
  sizeBytes: number;
}
