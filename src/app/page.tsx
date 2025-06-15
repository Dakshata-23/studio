
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LiveTelemetry } from '@/components/dashboard/LiveTelemetry';
import { InteractiveTrackMap } from '@/components/dashboard/InteractiveTrackMap';
import { LeMansStrategistDisplay } from '@/components/ai/LeMansStrategistDisplay';
import { CompetitorAnalyzer } from '@/components/ai/CompetitorAnalyzer';
import { 
  DEFAULT_SETTINGS, 
  DRIVER_COLORS, 
  FALLBACK_RACE_DATA, 
  TIRE_WEAR_RATES, 
  FUEL_CONSUMPTION_PER_LAP, 
  DEFAULT_TOTAL_LAPS,
  NUM_DRIVERS_PER_TEAM,
  MAX_DRIVER_DRIVE_TIME_SECONDS,
  BASE_LAP_TIME_SECONDS,
  LAP_TIME_VARIATION_SECONDS,
  PIT_STOP_BASE_DURATION_SECONDS,
  TIRE_CHANGE_DURATION_SECONDS,
  RACE_DURATION_SECONDS
} from '@/lib/constants';
import type { RaceData, Settings, Driver, LapHistoryEntry, SuggestLeMansStrategyInput, SuggestLeMansStrategyOutput, TireType, WeatherCondition } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Users, MapPinIcon, ListChecks, Loader2, AlertTriangle, Flag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestLeMansStrategy } from '@/ai/flows/suggest-le-mans-strategy'; // Updated flow import
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';


const MAX_LAP_HISTORY = 30; // Show more laps for longer race
const AI_CALL_TIMEOUT_MS = 20000; // Longer timeout for more complex strategy
const SIMULATION_INTERVAL_MS = 3000; // Update every 3 seconds for faster sim
const AI_CALL_INTERVAL_LAPS = 5; // Call AI every 5 simulated laps

const formatSecondsToLapTime = (totalSeconds: number | null): string | null => {
  if (totalSeconds === null || totalSeconds <= 0 || isNaN(totalSeconds)) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const formatSecondsToHMS = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


// Initial setup for "Your Team"
const initializeTeamDrivers = (): Driver[] => {
  const teamDrivers: Driver[] = [];
  for (let i = 0; i < NUM_DRIVERS_PER_TEAM; i++) {
    teamDrivers.push({
      id: `driver-${i + 1}`,
      name: `Driver ${String.fromCharCode(65 + i)} (Your Team)`, // Driver A, Driver B, Driver C
      shortName: `DR${String.fromCharCode(65 + i)}`,
      team: 'Your Team Endurance',
      color: DRIVER_COLORS[i % DRIVER_COLORS.length],
      driver_number: i + 1,
      position: i + 1, // Initial simulated position
      currentTires: { type: 'Medium', wear: 0, ageLaps: 0, stintStartLap: 1 },
      lastLapTime: null,
      bestLapTime: null,
      fuel: 100,
      pitStops: 0,
      lapHistory: [],
      allLapsData: [],
      totalDriveTimeSeconds: 0,
      isDriving: i === 0, // First driver starts
    });
  }
  return teamDrivers;
};

const INITIAL_RACE_DATA: RaceData = {
  ...FALLBACK_RACE_DATA,
  drivers: initializeTeamDrivers(),
};


export default function DashboardPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [raceData, setRaceData] = useState<RaceData>(INITIAL_RACE_DATA);
  const [teamDrivers, setTeamDrivers] = useState<Driver[]>(raceData.drivers);
  
  const [isLoadingApp, setIsLoadingApp] = useState(true); // General app loading
  const [dataLoadError, setDataLoadError] = useState<string | null>(null); // For any critical errors

  const [strategySuggestion, setStrategySuggestion] = useState<SuggestLeMansStrategyOutput | null>(null);
  const [isStrategistLoading, setIsStrategistLoading] = useState(false);
  const [lastStrategyCallParams, setLastStrategyCallParams] = useState<SuggestLeMansStrategyInput | null>(null);
  const { toast } = useToast();
  
  const raceSimulationRef = useRef<NodeJS.Timeout | null>(null);
  const lastAiCallLapRef = useRef<number>(0);

  // Effect for initial setup
  useEffect(() => {
    setIsLoadingApp(false); // Sim is ready to start
    // Potentially load saved state here in a real app
  }, []);

  // Main Race Simulation Loop
  useEffect(() => {
    if (isLoadingApp) return;

    raceSimulationRef.current = setInterval(() => {
      setRaceData(prevRaceData => {
        const newRaceTimeElapsed = prevRaceData.raceTimeElapsedSeconds + (SIMULATION_INTERVAL_MS / 1000);
        if (newRaceTimeElapsed >= prevRaceData.totalRaceDurationSeconds) {
          if(raceSimulationRef.current) clearInterval(raceSimulationRef.current);
          toast({ title: "Race Finished!", description: "The 24-hour simulation is complete." });
          return prevRaceData; // End of race
        }

        let newCurrentLap = prevRaceData.currentLap;
        const activeDriverIndex = prevRaceData.drivers.findIndex(d => d.isDriving);
        if (activeDriverIndex === -1) {
            console.error("No active driver found in simulation!");
            return prevRaceData; // Should not happen
        }
        
        const updatedDrivers = prevRaceData.drivers.map((driver, index) => {
          if (index !== activeDriverIndex) return driver;

          // Active driver updates
          let newDriverData = { ...driver };
          const simulatedLapTime = BASE_LAP_TIME_SECONDS + (Math.random() * LAP_TIME_VARIATION_SECONDS * 2) - LAP_TIME_VARIATION_SECONDS;
          newDriverData.totalDriveTimeSeconds += simulatedLapTime;
          
          newCurrentLap = prevRaceData.currentLap + 1; // Assuming one lap per interval for simplicity

          newDriverData.fuel = Math.max(0, driver.fuel - FUEL_CONSUMPTION_PER_LAP);
          newDriverData.currentTires.wear = Math.min(100, driver.currentTires.wear + TIRE_WEAR_RATES[driver.currentTires.type]);
          newDriverData.currentTires.ageLaps += 1;
          
          newDriverData.lastLapTime = formatSecondsToLapTime(simulatedLapTime);
          const newLapEntry: LapHistoryEntry = { 
              lap: newCurrentLap, 
              time: simulatedLapTime, 
              tireWear: newDriverData.currentTires.wear, 
              fuel: newDriverData.fuel,
              position: newDriverData.position // position doesn't change much in this simple sim
          };
          newDriverData.lapHistory = [newLapEntry, ...driver.lapHistory.slice(0, MAX_LAP_HISTORY - 1)];
          
          const openF1LapEquivalent = {driver_number: driver.driver_number, lap_number: newCurrentLap, lap_duration: simulatedLapTime};
          newDriverData.allLapsData = [openF1LapEquivalent, ...driver.allLapsData];

          if (!driver.bestLapTime || simulatedLapTime < parseFloat(driver.bestLapTime.replace(':','.') /* crude parse */) ) { // Simplified best lap logic
            newDriverData.bestLapTime = newDriverData.lastLapTime;
          }
          
          // Check for AI-triggered pit stop or max drive time
          let shouldPitThisLap = false;
          if (strategySuggestion?.suggestedActions?.toLowerCase().includes(driver.name.toLowerCase()) && strategySuggestion?.suggestedActions?.toLowerCase().includes(`lap ${newCurrentLap}`)) {
            shouldPitThisLap = true;
          }
          if (newDriverData.totalDriveTimeSeconds >= MAX_DRIVER_DRIVE_TIME_SECONDS - (15 * 60)) { // Pit if within 15 mins of limit
             if (!shouldPitThisLap) toast({title: "Driver Nearing Limit", description: `${driver.name} is nearing max drive time. Consider pitting.`});
             // AI should ideally catch this, but as a fallback
          }


          if (shouldPitThisLap || newDriverData.fuel < 5 || newDriverData.currentTires.wear > 85 ) { // Simplified pit conditions
            newDriverData.pitStops += 1;
            const pitStopTime = PIT_STOP_BASE_DURATION_SECONDS + TIRE_CHANGE_DURATION_SECONDS; // Simplified pit stop time
            // raceTimeElapsedSeconds will be updated globally, effectively adding pit stop time.
            
            // Select next driver (simple rotation, not exceeding max time)
            let nextDriverIdx = (activeDriverIndex + 1) % NUM_DRIVERS_PER_TEAM;
            let attempts = 0;
            while(prevRaceData.drivers[nextDriverIdx].totalDriveTimeSeconds >= MAX_DRIVER_DRIVE_TIME_SECONDS && attempts < NUM_DRIVERS_PER_TEAM) {
                nextDriverIdx = (nextDriverIdx + 1) % NUM_DRIVERS_PER_TEAM;
                attempts++;
            }
            if(attempts === NUM_DRIVERS_PER_TEAM) { // All drivers maxed out - highly unlikely in 24h race if planned well
                toast({variant: "destructive", title: "CRITICAL: All drivers at limit!", description: "Strategy error."});
            }

            // Update all drivers for the swap
            return prevRaceData.drivers.map((d, i) => {
                if (i === activeDriverIndex) { // Outgoing driver
                    return {...newDriverData, isDriving: false, fuel: 100, currentTires: {type: 'Medium', wear: 0, ageLaps: 0, stintStartLap: newCurrentLap +1}};
                }
                if (i === nextDriverIdx) { // Incoming driver
                    return {...d, isDriving: true, fuel: 100, currentTires: {type: 'Medium', wear: 0, ageLaps: 0, stintStartLap: newCurrentLap +1}};
                }
                return d;
            });
          }
          return newDriverData;
        });

        // If a pit stop happened, updatedDrivers is a new array where one map call returned another map.
        // We need to handle this carefully. The logic above already returns the full new drivers array in case of a pit.
        let finalDriversArray = Array.isArray(updatedDrivers[activeDriverIndex]) ? (updatedDrivers[activeDriverIndex] as unknown as Driver[]) : updatedDrivers;


        return {
          ...prevRaceData,
          drivers: finalDriversArray,
          currentLap: newCurrentLap,
          raceTimeElapsedSeconds: newRaceTimeElapsed,
          // Simulate weather changes very infrequently for Le Mans
          weather: Math.random() < 0.005 ? (['Sunny', 'Cloudy', 'Rainy'] as WeatherCondition[])[Math.floor(Math.random() * 3)] : prevRaceData.weather,
          safetyCar: Math.random() < 0.002 ? (['Deployed', 'Virtual'] as RaceData['safetyCar'][]) [Math.floor(Math.random()*2)] : prevRaceData.safetyCar === 'None' ? 'None' : (Math.random() < 0.1 ? 'None' : prevRaceData.safetyCar)
        };
      });
    }, SIMULATION_INTERVAL_MS);

    return () => {
      if (raceSimulationRef.current) clearInterval(raceSimulationRef.current);
    };
  }, [isLoadingApp, toast, strategySuggestion]);

  // Effect to update teamDrivers state when raceData.drivers changes
  useEffect(() => {
    setTeamDrivers(raceData.drivers);
  }, [raceData.drivers]);


  const fetchLeMansStrategyCallback = useCallback(async () => {
    if (isStrategistLoading || raceData.drivers.length === 0 || raceData.currentLap === 0) return;

    setIsStrategistLoading(true);
    const currentTeamDriverStatuses = raceData.drivers.map(d => ({
      name: d.name,
      currentTireType: d.currentTires.type,
      currentTireAgeLaps: d.currentTires.ageLaps,
      currentTireWear: parseFloat(d.currentTires.wear.toFixed(1)),
      fuelLevel: parseFloat(d.fuel.toFixed(1)),
      totalDriveTimeSeconds: d.totalDriveTimeSeconds,
      isCurrentlyDriving: d.isDriving,
      currentLap: d.isDriving ? raceData.currentLap : (d.lapHistory[0]?.lap || 0) // Approx lap for non-driving
    }));

    const params: SuggestLeMansStrategyInput = {
      teamDriverStatuses: currentTeamDriverStatuses,
      raceCurrentLap: raceData.currentLap,
      raceTotalLaps: raceData.totalLaps,
      raceTimeElapsedSeconds: raceData.raceTimeElapsedSeconds,
      totalRaceDurationSeconds: raceData.totalRaceDurationSeconds,
      weatherConditions: raceData.weather,
      trackName: raceData.trackName,
      safetyCarStatus: raceData.safetyCar,
    };
    setLastStrategyCallParams(params);
    lastAiCallLapRef.current = raceData.currentLap;

    try {
      const timeoutPromise = new Promise<SuggestLeMansStrategyOutput>((_, reject) => 
        setTimeout(() => reject(new Error(`AI Strategist timed out after ${AI_CALL_TIMEOUT_MS / 1000} seconds.`)), AI_CALL_TIMEOUT_MS)
      );

      const result = await Promise.race([
        suggestLeMansStrategy(params), // Use the new flow
        timeoutPromise
      ]);
      
      setStrategySuggestion(result);
    } catch (error) {
      console.error("Error fetching Le Mans strategy:", error);
      toast({
        variant: "destructive",
        title: "AI Strategist Error",
        description: (error as Error).message || "Failed to get strategy suggestion.",
      });
      setStrategySuggestion(null); 
    } finally {
      setIsStrategistLoading(false);
    }
  }, [isStrategistLoading, raceData, toast]);

  // Call AI periodically
  useEffect(() => {
    if (!isLoadingApp && raceData.currentLap > 0 && raceData.currentLap % AI_CALL_INTERVAL_LAPS === 0 && raceData.currentLap !== lastAiCallLapRef.current) {
        fetchLeMansStrategyCallback();
    }
  }, [raceData.currentLap, isLoadingApp, fetchLeMansStrategyCallback]);


  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (isLoadingApp) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading Le Mans Strategist...</p>
      </div>
    );
  }
  
  const displayTrackName = raceData.trackName;
  const currentDrivingDriver = teamDrivers.find(d => d.isDriving);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onToggleSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 container mx-auto px-4 py-2 md:px-8 md:py-4">
        {dataLoadError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Error</AlertTitle>
            <AlertDescription>{dataLoadError}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-sm md:text-base"><ListChecks className="w-4 h-4 mr-2 hidden md:inline" />Team Telemetry</TabsTrigger>
            <TabsTrigger value="map" className="text-sm md:text-base"><MapPinIcon className="w-4 h-4 mr-2 hidden md:inline" />Track Map</TabsTrigger>
            <TabsTrigger value="strategist" className="text-sm md:text-base"><Brain className="w-4 h-4 mr-2 hidden md:inline" />AI Strategist</TabsTrigger>
            <TabsTrigger value="competitors" className="text-sm md:text-base"><Users className="w-4 h-4 mr-2 hidden md:inline" />Competitors</TabsTrigger>
          </TabsList>
          
          <div className="p-4 bg-card rounded-lg shadow-lg mb-6">
            <h3 className="text-xl font-medium text-primary font-headline">
              Your Team Endurance - Le Mans 24 Hours (Simulated)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                <p>Track: {displayTrackName}</p>
                <p>Race Time: {formatSecondsToHMS(raceData.raceTimeElapsedSeconds)} / {formatSecondsToHMS(RACE_DURATION_SECONDS)}</p>
                <p>Current Lap: {raceData.currentLap} / {raceData.totalLaps}</p>
                <p>Weather: {raceData.weather}</p>
                <p>Safety Car: {raceData.safetyCar}</p>
                {currentDrivingDriver && <p>Currently Driving: {currentDrivingDriver.name}</p>}
            </div>
          </div>

          <TabsContent value="overview">
            {teamDrivers.length > 0 ? (
              <LiveTelemetry 
                teamDrivers={teamDrivers} 
                raceData={raceData}
                settings={settings} 
                strategySuggestion={strategySuggestion} // Pass the new strategy type
                isStrategistLoading={isStrategistLoading}
              />
            ) : (
              <p className="text-center text-muted-foreground p-8">Initializing team data...</p>
            )}
          </TabsContent>
          <TabsContent value="map">
             <InteractiveTrackMap 
                allDrivers={teamDrivers} // Show only team drivers on map for now
                mainDriver={currentDrivingDriver || null} // Highlight current driver
                trackName={displayTrackName} 
              />
          </TabsContent>
          <TabsContent value="strategist">
            <LeMansStrategistDisplay
                teamDrivers={teamDrivers}
                raceData={raceData}
                strategySuggestion={strategySuggestion}
                isStrategistLoading={isStrategistLoading}
                lastStrategyCallParams={lastStrategyCallParams}
            />
          </TabsContent>
          <TabsContent value="competitors">
             <CompetitorAnalyzer allDrivers={[]} mainDriver={null} />
          </TabsContent>
        </Tabs>
      </main>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        Le Mans Strategist - Simulated Endurance Race.
      </footer>
    </div>
  );
}
