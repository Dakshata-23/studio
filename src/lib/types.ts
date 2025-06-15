
export type TireType = 'Soft' | 'Medium' | 'Hard' | 'Intermediate' | 'Wet';
export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Heavy Rain';

export interface TireStatus {
  type: TireType;
  wear: number; // Percentage 0-100
  ageLaps?: number; // Optional: Laps on current set
}

export interface Driver {
  id: string;
  name: string;
  team: string;
  shortName: string; // 3-letter abbreviation
  position: number;
  currentTires: TireStatus;
  lastLapTime: string | null; // e.g., "1:30.567" or null if not set
  bestLapTime: string | null;
  fuel: number; // Percentage 0-100
  pitStops: number;
  color: string; // Hex color for UI representation
}

export interface RaceData {
  drivers: Driver[];
  totalLaps: number;
  currentLap: number;
  trackName: string;
  weather: WeatherCondition;
  safetyCar: 'None' | 'Deployed' | 'Virtual';
}

export interface Settings {
  showLapTimes: boolean;
  showFuelLevel: boolean;
  showTireWear: boolean;
  aiAssistanceLevel: 'basic' | 'advanced';
}
