
import type { RaceData, Driver, Settings, WeatherCondition, TireType } from './types';
import { Sun, Cloudy, CloudRain, CloudLightning } from 'lucide-react'; // Ensure these are imported if used directly in WEATHER_ICONS

export const DRIVER_COLORS = [ // Fallback colors
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#A52A2A', '#008000', '#FFC0CB', '#D2691E',
  '#F0E68C', '#ADD8E6', '#E0FFFF', '#FAFAD2', '#90EE90', '#D3D3D3',
  '#FFB6C1', '#87CEEB'
];

// MOCK_RACE_DATA is now primarily for fallback initial structure if API fails early.
export const FALLBACK_RACE_DATA: Omit<RaceData, 'drivers' | 'sessionKey' | 'meetingKey'> = {
  totalLaps: 57, // Typical race length, will be updated from API if possible
  currentLap: 0,
  trackName: 'Fetching Track Info...',
  weather: 'Sunny',
  safetyCar: 'None',
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

export const TIRE_WEAR_RATES: Record<TireType, number> = {
  Soft: 3.0, // Estimated % wear per lap
  Medium: 2.0,
  Hard: 1.2,
  Intermediate: 2.8, // Higher wear for inters usually
  Wet: 3.8,         // Higher wear for wets
};

export const FUEL_CONSUMPTION_PER_LAP = 2.5; // Estimated % fuel per lap, can be adjusted

// OpenF1 API base URL
export const OPENF1_API_BASE_URL = 'https://api.openf1.org/v1';

// Default total laps if not found from API (e.g. for some historical sessions)
export const DEFAULT_TOTAL_LAPS = 57;
