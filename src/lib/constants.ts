
import type { RaceData, Driver, Settings, WeatherCondition, TireType } from './types';
import { Sun, Cloudy, CloudRain, CloudLightning } from 'lucide-react'; // Ensure these are imported if used directly in WEATHER_ICONS

export const DRIVER_COLORS = [ // Fallback colors
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#A52A2A', '#008000', '#FFC0CB', '#D2691E',
  '#F0E68C', '#ADD8E6', '#E0FFFF', '#FAFAD2', '#90EE90', '#D3D3D3',
  '#FFB6C1', '#87CEEB'
];

// MOCK_DRIVERS is no longer the primary source for page.tsx, but can be kept for testing or other components if needed.
export const MOCK_DRIVERS: Driver[] = [
  { id: '1', driver_number: 1, name: 'Max Verstappen', shortName: 'VER', team: 'Red Bull Racing', position: 1, currentTires: { type: 'Medium', wear: 25, ageLaps: 10 }, lastLapTime: '1:28.345', bestLapTime: '1:27.990', fuel: 70, pitStops: 1, color: DRIVER_COLORS[0] },
  { id: '2', driver_number: 44, name: 'Lewis Hamilton', shortName: 'HAM', team: 'Mercedes', position: 2, currentTires: { type: 'Hard', wear: 15, ageLaps: 12 }, lastLapTime: '1:28.500', bestLapTime: '1:28.110', fuel: 75, pitStops: 1, color: DRIVER_COLORS[1] },
  // ... (other mock drivers can be kept or removed)
];

// MOCK_RACE_DATA is still used for overall race context if not fetched from API
export const MOCK_RACE_DATA: Omit<RaceData, 'drivers'> = {
  totalLaps: 57,
  currentLap: 1, // Initial lap, will be incremented by simulation
  trackName: 'Fetching Track...', // Will be updated if we fetch meeting details later
  weather: 'Sunny', // Default weather
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
