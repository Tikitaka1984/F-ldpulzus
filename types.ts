
export interface Earthquake {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  detail: string;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number;
  dmin: number;
  rms: number;
  gap: number;
  magType: string;
  type: string;
  title: string;
  coordinates: [number, number, number]; // [longitude, latitude, depth]
}

export interface Plate {
  name: string;
  rawName: string;
  feature: any;
}

export interface Volcano {
  name: string;
  country: string;
  coordinates: [number, number];
  type: string;
  elevation: number;
  status: 'active' | 'dormant';
  lastEruption?: string;
  notableEruptions?: string[];
}

export enum TimeRange {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year'
}

export interface MapState {
  center: [number, number];
  zoom: number;
  showPlates: boolean;
  showVolcanoes: boolean;
  minMagnitude: number;
  timeRange: TimeRange;
}

export interface AIExplanation {
  summaryHu: string;
  scientificNotesHu: string[];
  uncertainty: 'low' | 'medium' | 'high';
  classroomQuestion: string;
}
