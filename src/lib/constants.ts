
import type { RaceData, Settings, WeatherCondition, TireType } from './types';
import { Sun, Cloudy, CloudRain, CloudLightning } from 'lucide-react';

export const DRIVER_COLORS = [ // Colors for the 3 team drivers
  '#FF6347', // Tomato
  '#4682B4', // SteelBlue
  '#32CD32', // LimeGreen
  // Fallback colors if more drivers are ever shown (e.g. competitors)
  '#FFD700', '#6A5ACD', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#A52A2A', '#008000', '#FFC0CB', '#D2691E',
  '#F0E68C', '#ADD8E6', '#E0FFFF', '#FAFAD2', '#90EE90', '#D3D3D3',
  '#FFB6C1', '#87CEEB'
];

export const NUM_DRIVERS_PER_TEAM = 3;
export const MAX_DRIVER_DRIVE_TIME_SECONDS = 14 * 60 * 60; // 14 hours
export const RACE_DURATION_SECONDS = 24 * 60 * 60; // 24 hours
export const DEFAULT_TOTAL_LAPS = 360; // Approximate for Le Mans, highly variable

export const FALLBACK_RACE_DATA: Omit<RaceData, 'drivers'> = {
  totalLaps: DEFAULT_TOTAL_LAPS,
  currentLap: 0,
  trackName: 'Circuit de la Sarthe (Simulated)',
  weather: 'Sunny',
  safetyCar: 'None',
  raceTimeElapsedSeconds: 0,
  totalRaceDurationSeconds: RACE_DURATION_SECONDS,
};

export const DEFAULT_SETTINGS: Settings = {
  showLapTimes: true,
  showFuelLevel: true,
  showTireWear: true,
  aiAssistanceLevel: 'advanced',
};

export const TIRE_COMPOUND_CLASSES: Record<TireType, { bg: string, text?: string, border?: string }> = {
  Soft: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  Medium: { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-500' },
  Hard: { bg: 'bg-slate-100', text: 'text-black', border: 'border-slate-300' },
  Intermediate: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  Wet: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
};

export const WEATHER_ICONS: Record<WeatherCondition, React.ElementType> = {
  Sunny: Sun,
  Cloudy: Cloudy,
  Rainy: CloudRain,
  'Heavy Rain': CloudLightning,
};

// These might need adjustment for Le Mans cars / simulation fidelity
export const TIRE_WEAR_RATES: Record<TireType, number> = { // % wear per simulated "lap"
  Soft: 1.2, // Le Mans stints are longer, so per-lap wear might be lower than F1 but over more laps
  Medium: 0.8,
  Hard: 0.5,
  Intermediate: 1.5,
  Wet: 2.0,
};

export const FUEL_CONSUMPTION_PER_LAP = 3.0; // Estimated % fuel per lap for simulation
export const BASE_LAP_TIME_SECONDS = 3 * 60 + 20; // 3:20.000 as a base for Le Mans
export const LAP_TIME_VARIATION_SECONDS = 5; // Random variation for lap times
export const PIT_STOP_BASE_DURATION_SECONDS = 25; // Base time for a pit stop (excluding tire change, refueling time)
export const TIRE_CHANGE_DURATION_SECONDS = 10; // Additional time for tire change
export const REFUEL_RATE_PERCENT_PER_SECOND = 2; // Fuel percentage added per second of refueling


// OpenF1 API base URL - Not used in Le Mans sim but keep for potential future use or other contexts
export const OPENF1_API_BASE_URL = 'https://api.openf1.org/v1';
