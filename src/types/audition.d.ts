// types/audition.ts
export type AuditionType = 'artist' | 'producer' | 'lyricist' | 'writer' | 'general';

export interface AuditionBaseProps {
  jobTitle: string;
  clientName: string;
  budget: string;
  deadline: string;
  requirements: string[];
  type: AuditionType;
}

export interface AuditionSpecificFields {
  artist?: {
    vocalRange?: string;  // Changed from string[] to string
    performanceType?: string[];
    influences?: string[];
  };
  producer?: {
    genres: string[];
    equipment?: string;
  };
  lyricist?: {
    languages: string[];
    specialties?: string[];
  };
}