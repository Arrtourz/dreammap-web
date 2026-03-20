export type DreamTimeBucket =
  | 'after-midnight'
  | 'early-morning'
  | 'morning'
  | 'afternoon-nap'
  | 'evening';

export interface RoughLocation {
  label: string;
  lat: number;
  lng: number;
}

export interface DreamEntry {
  id: string;
  userId: string;
  dreamText: string;
  dreamDate: string;
  dreamTimeBucket: DreamTimeBucket;
  locationLabel: string;
  locationLatRough: number;
  locationLngRough: number;
  isPublic: boolean;
  shareToken: string;
  createdAt: string;
}

export interface CreateDreamInput {
  dreamText: string;
  dreamDate: string;
  dreamTimeBucket: DreamTimeBucket;
  locationLabel: string;
  locationLatRough: number;
  locationLngRough: number;
}
