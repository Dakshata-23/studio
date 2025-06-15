
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LiveTelemetry } from '@/components/dashboard/LiveTelemetry';
import { InteractiveTrackMap } from '@/components/dashboard/InteractiveTrackMap';
import { PitStopAdvisor } from '@/components/ai/PitStopAdvisor';
import { CompetitorAnalyzer } from '@/components/ai/CompetitorAnalyzer';
import { DEFAULT_SETTINGS, DRIVER_COLORS, FALLBACK_RACE_DATA, OPENF1_API_BASE_URL, TIRE_WEAR_RATES, FUEL_CONSUMPTION_PER_LAP, DEFAULT_TOTAL_LAPS } from '@/lib/constants';
import type { RaceData, Settings, Driver, OpenF1Driver, TireType, SuggestPitStopsInput, SuggestPitStopsOutput, LapHistoryEntry, OpenF1Session, OpenF1Meeting, OpenF1Lap, OpenF1Position, OpenF1Stint, OpenF1Weather, OpenF1RaceControl, WeatherCondition } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Users, MapPinIcon, ListChecks, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestPitStops } from '@/ai/flows/suggest-pit-stops';
import { useToast } from "@/hooks/use-toast";

const INITIAL_RACE_DATA: RaceData = {
  drivers: [],
  totalLaps: FALLBACK_RACE_DATA.totalLaps,
  currentLap: FALLBACK_RACE_DATA.currentLap,
  trackName: FALLBACK_RACE_DATA.trackName,
  weather: FALLBACK_RACE_DATA.weather,
  safetyCar: FALLBACK_RACE_DATA.safetyCar,
  sessionKey: null,
  meetingKey: null,
};

const MAX_LAP_HISTORY = 20;
const AI_CALL_TIMEOUT_MS = 10000; // 10 seconds
const API_POLL_INTERVAL_MS = 7000; // Poll API every 7 seconds

const formatSecondsToLapTime = (totalSeconds: number | null): string | null => {
  if (totalSeconds === null || totalSeconds <= 0 || isNaN(totalSeconds)) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const mapApiTireToTireType = (apiTire?: string): TireType => {
  const lowerApiTire = apiTire?.toLowerCase();
  if (lowerApiTire?.includes('soft')) return 'Soft';
  if (lowerApiTire?.includes('medium')) return 'Medium';
  if (lowerApiTire?.includes('hard')) return 'Hard';
  if (lowerApiTire?.includes('intermediate')) return 'Intermediate';
  if (lowerApiTire?.includes('wet')) return 'Wet';
  return 'Medium'; // Default fallback
};


export default function DashboardPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [raceData, setRaceData] = useState<RaceData>(INITIAL_RACE_DATA);
  const [mainDriver, setMainDriver] = useState<Driver | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  const [pitStopSuggestion, setPitStopSuggestion] = useState<SuggestPitStopsOutput | null>(null);
  const [isPitStopLoading, setIsPitStopLoading] = useState(false);
  const [lastPitStopCallParams, setLastPitStopCallParams] = useState<SuggestPitStopsInput | null>(null);
  const { toast } = useToast();

  const [lastSuccessfulAiCallData, setLastSuccessfulAiCallData] = useState<{
    lap: number;
    tireWear: number;
    fuel: number;
  } | null>(null);
  const [aiCallCoolDown, setAiCallCoolDown] = useState(false);

  // Fetch initial data (session, meeting, drivers)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      setDataLoadError(null);
      try {
        // 1. Fetch latest session to get session_key and meeting_key
        const sessionResponse = await fetch(`${OPENF1_API_BASE_URL}/sessions?session_key=latest`);
        if (!sessionResponse.ok) throw new Error(`Failed to fetch latest session: ${sessionResponse.statusText}`);
        const sessions: OpenF1Session[] = await sessionResponse.json();
        if (!sessions || sessions.length === 0) throw new Error('No latest session found.');
        const latestSession = sessions.find(s => s.session_type === 'Race') || sessions[0]; // Prefer Race session
        
        if (!latestSession?.session_key || !latestSession?.meeting_key) {
            throw new Error('Essential session_key or meeting_key missing from latest session data.');
        }

        const currentSessionKey = latestSession.session_key;
        const currentMeetingKey = latestSession.meeting_key;
        
        // 2. Fetch meeting details for track name (total laps might not be here)
        // Total laps is often contextual or fixed per track/event type. OpenF1 might not provide it easily.
        // We'll use a default or try to infer it if some API gives it.
        // For now, track name from session or meeting.
        const trackName = latestSession.circuit_short_name || latestSession.location || FALLBACK_RACE_DATA.trackName;
        const sessionName = latestSession.session_name;
        const countryName = latestSession.country_name;

        // 3. Fetch drivers for the session
        const driversResponse = await fetch(`${OPENF1_API_BASE_URL}/drivers?session_key=${currentSessionKey}`);
        if (!driversResponse.ok) throw new Error(`Failed to fetch drivers: ${driversResponse.statusText}`);
        const apiDrivers: OpenF1Driver[] = await driversResponse.json();
        if (!apiDrivers || apiDrivers.length === 0) throw new Error('No drivers found for the session.');

        const transformedDrivers: Driver[] = apiDrivers.map((apiDriver, index) => ({
          id: apiDriver.driver_number.toString(),
          name: apiDriver.full_name || `${apiDriver.first_name || ''} ${apiDriver.last_name || ''}`.trim() || `Driver ${apiDriver.driver_number}`,
          shortName: apiDriver.name_acronym,
          team: apiDriver.team_name,
          color: apiDriver.team_colour ? `#${apiDriver.team_colour}` : DRIVER_COLORS[index % DRIVER_COLORS.length],
          driver_number: apiDriver.driver_number,
          position: 0, // Will be updated by polling
          currentTires: { type: 'Medium', wear: 0, ageLaps: 0 }, // Placeholder, updated by stints
          lastLapTime: null,
          bestLapTime: null,
          fuel: 100, // Initial fuel
          pitStops: 0,
          lapHistory: [],
          allLapsData: [],
        }));

        setRaceData(prev => ({
          ...prev,
          drivers: transformedDrivers,
          sessionKey: currentSessionKey,
          meetingKey: currentMeetingKey,
          trackName,
          sessionName,
          countryName,
          totalLaps: DEFAULT_TOTAL_LAPS, // Using default, API for this is tricky
        }));

        if (transformedDrivers.length > 0) {
          // Set main driver to P1 or first driver initially
          const p1Driver = transformedDrivers.find(d => d.position === 1) || transformedDrivers[0];
          setMainDriver(p1Driver);
        }

      } catch (error) {
        console.error("Error fetching initial data:", error);
        setDataLoadError((error as Error).message || 'An unknown error occurred during initial data load.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchInitialData();
  }, []);

  // Polling for live race data
  useEffect(() => {
    if (isLoadingData || !raceData.sessionKey) return;

    const fetchDataInterval = setInterval(async () => {
      if (!raceData.sessionKey) return;
      
      try {
        const [lapsRes, positionsRes, stintsRes, weatherRes, raceControlRes] = await Promise.all([
          fetch(`${OPENF1_API_BASE_URL}/laps?session_key=${raceData.sessionKey}`),
          fetch(`${OPENF1_API_BASE_URL}/position?session_key=${raceData.sessionKey}&driver_number= Didier Pironi`), // Note: driver_number filter might need to be removed or be dynamic if this API does not support list for it for all drivers
          fetch(`${OPENF1_API_BASE_URL}/stints?session_key=${raceData.sessionKey}`),
          fetch(`${OPENF1_API_BASE_URL}/weather?session_key=${raceData.sessionKey}`),
          fetch(`${OPENF1_API_BASE_URL}/race_control?session_key=${raceData.sessionKey}`),
        ]);

        if (!lapsRes.ok || !positionsRes.ok || !stintsRes.ok || !weatherRes.ok || !raceControlRes.ok) {
          console.warn("One or more API calls failed during polling.");
          // Potentially set a less critical error state or retry logic
          return;
        }
        
        const lapsData: OpenF1Lap[] = await lapsRes.json();
        const positionsData: OpenF1Position[] = await positionsRes.json();
        const stintsData: OpenF1Stint[] = await stintsRes.json();
        const weatherData: OpenF1Weather[] = await weatherRes.json(); // Array, take latest
        const raceControlData: OpenF1RaceControl[] = await raceControlRes.json(); // Array, process relevant

        // Process data
        setRaceData(prevRaceData => {
          if (!prevRaceData.sessionKey) return prevRaceData;

          let newCurrentLap = prevRaceData.currentLap;
          if (lapsData.length > 0) {
            newCurrentLap = Math.max(...lapsData.map(l => l.lap_number || 0), prevRaceData.currentLap);
          }
          
          let newWeather: WeatherCondition = prevRaceData.weather;
          if (weatherData.length > 0) {
            const latestWeather = weatherData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if (latestWeather) {
                if (latestWeather.rainfall > 5) newWeather = 'Heavy Rain';
                else if (latestWeather.rainfall > 0.1) newWeather = 'Rainy';
                else if (latestWeather.air_temperature < 15 || latestWeather.track_temperature < 20) newWeather = 'Cloudy'; // Simplified
                else newWeather = 'Sunny';
            }
          }

          let newSafetyCar: RaceData['safetyCar'] = 'None';
          if (raceControlData.length > 0) {
            const relevantMessages = raceControlData
              .filter(rc => rc.flag === 'SC' || rc.flag === 'VSC' || (rc.category === 'SafetyCar' && !rc.message.toLowerCase().includes('ending')))
              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (relevantMessages.length > 0) {
                const latestRelevantMessage = relevantMessages[0];
                if (latestRelevantMessage.flag === 'SC') newSafetyCar = 'Deployed';
                else if (latestRelevantMessage.flag === 'VSC') newSafetyCar = 'Virtual';
                // Check for SC ending or resuming, OpenF1 specific messages might be needed
                if (latestRelevantMessage.message.toLowerCase().includes("safety car in this lap") || latestRelevantMessage.message.toLowerCase().includes("virtual safety car deployed")) {
                     // Stays deployed
                } else if (latestRelevantMessage.message.toLowerCase().includes("ending") || latestRelevantMessage.message.toLowerCase().includes("resumed")) {
                    newSafetyCar = 'None';
                }

            }
          }
          
          const updatedDrivers = prevRaceData.drivers.map(driver => {
            const driverLaps = lapsData.filter(l => l.driver_number === driver.driver_number).sort((a,b) => (b.lap_number || 0) - (a.lap_number || 0));
            const driverPosition = positionsData.find(p => p.driver_number === driver.driver_number); // Assuming positionsData is sorted or we take the first match. If it contains history, need latest.
            const driverStints = stintsData.filter(s => s.driver_number === driver.driver_number).sort((a,b) => (b.stint_number || 0) - (a.stint_number || 0));

            const newDriverData = { ...driver };

            if (driverPosition) {
              newDriverData.position = driverPosition.position;
            }

            let newFuel = newDriverData.fuel;
            if (newCurrentLap > prevRaceData.currentLap && driverLaps.some(l => l.lap_number === newCurrentLap)) { // If driver completed the new lap
                const lapsAdvanced = newCurrentLap - prevRaceData.currentLap;
                newFuel = Math.max(0, newDriverData.fuel - (FUEL_CONSUMPTION_PER_LAP * lapsAdvanced));
            }
            newDriverData.fuel = parseFloat(newFuel.toFixed(1));


            if (driverStints.length > 0) {
              const currentStint = driverStints[0];
              newDriverData.currentTires.type = mapApiTireToTireType(currentStint.compound);
              const lapsOnStint = (newCurrentLap >= currentStint.lap_start) ? (newCurrentLap - currentStint.lap_start + 1) : 0;
              newDriverData.currentTires.ageLaps = lapsOnStint;
              
              // More realistic wear: reset on new stint, else accumulate
              if(driverLaps.length > 0 && currentStint.lap_start === driverLaps[0].lap_number && driverLaps[0].is_pit_out_lap){ // approximation of new stint start
                 newDriverData.currentTires.wear = TIRE_WEAR_RATES[newDriverData.currentTires.type] || 2.0; // Small initial wear
              } else {
                 newDriverData.currentTires.wear = Math.min(100, (newDriverData.currentTires.wear || 0) + (TIRE_WEAR_RATES[newDriverData.currentTires.type] || 2.0) * (newCurrentLap > (driver.lapHistory[driver.lapHistory.length -1]?.lap || 0) ? 1:0) );
              }
              newDriverData.pitStops = driverStints.length -1; // Number of completed stints implies pit stops
            }
            
            const completedLaps = driverLaps.filter(l => l.lap_duration !== null);
            if (completedLaps.length > 0) {
              newDriverData.lastLapTime = formatSecondsToLapTime(completedLaps[0].lap_duration);
              const bestLap = completedLaps.reduce((best, current) => (current.lap_duration! < best.lap_duration! ? current : best), completedLaps[0]);
              newDriverData.bestLapTime = formatSecondsToLapTime(bestLap.lap_duration);

              // Update Lap History for main driver
              if (mainDriver && driver.id === mainDriver.id) {
                  const newLapHistory: LapHistoryEntry[] = completedLaps
                    .slice(0, MAX_LAP_HISTORY)
                    .map(l => ({
                        lap: l.lap_number,
                        time: l.lap_duration!,
                        tireWear: newDriverData.currentTires.wear, // This is wear at END of this polled interval for current tires
                        fuel: newDriverData.fuel, // Fuel at END of this polled interval
                        position: newDriverData.position
                    }))
                    .sort((a,b) => a.lap - b.lap); // Ensure ascending lap order for charts
                  newDriverData.lapHistory = newLapHistory;
              }
            }
            newDriverData.allLapsData = driverLaps; // Store all laps for potential future use

            return newDriverData;
          });
          
          // Re-sort drivers by position
          updatedDrivers.sort((a, b) => a.position - b.position);

          // Update mainDriver state with the latest data
          const currentMainDriverData = updatedDrivers.find(d => d.id === mainDriver?.id);
          if (currentMainDriverData) {
            setMainDriver(currentMainDriverData);
          } else if (updatedDrivers.length > 0) {
            // If main driver somehow lost, default to P1 or first
             setMainDriver(updatedDrivers.find(d => d.position === 1) || updatedDrivers[0]);
          }


          return {
            ...prevRaceData,
            drivers: updatedDrivers,
            currentLap: newCurrentLap,
            weather: newWeather,
            safetyCar: newSafetyCar,
          };
        });

      } catch (error) {
        console.error("Error polling live data:", error);
        // Potentially set a non-critical error state for UI feedback
      }
    }, API_POLL_INTERVAL_MS);

    return () => clearInterval(fetchDataInterval);
  }, [isLoadingData, raceData.sessionKey, mainDriver]); // mainDriver in dependency to update its lap history

  const fetchPitStopAdvice = useCallback(async (driverForAdvice: Driver, currentLapForAdvice: number) => {
    if (!driverForAdvice || currentLapForAdvice <= 0 || aiCallCoolDown || !driverForAdvice.currentTires.type) return;

    const currentTireWear = parseFloat(driverForAdvice.currentTires.wear.toFixed(1));
    const currentFuelLevel = parseFloat(driverForAdvice.fuel.toFixed(1));

    if (lastSuccessfulAiCallData && pitStopSuggestion) {
      const { lap: prevLap, tireWear: prevTireWear, fuel: prevFuel } = lastSuccessfulAiCallData;
      const sameLap = prevLap === currentLapForAdvice;
      const tireWearDiff = Math.abs(currentTireWear - prevTireWear);
      const fuelDiff = Math.abs(currentFuelLevel - prevFuel);
      
      // Only call if lap changed, or significant wear/fuel change on same lap
      if (sameLap && tireWearDiff < 10 && fuelDiff < 10) {
        return;
      }
    }
    
    setIsPitStopLoading(true);
    const params: SuggestPitStopsInput = {
      driverName: driverForAdvice.name,
      currentLap: currentLapForAdvice,
      tireCondition: `${driverForAdvice.currentTires.type} - ${driverForAdvice.currentTires.wear.toFixed(0)}% wear, ${driverForAdvice.currentTires.ageLaps} Laps old`,
      fuelLevel: currentFuelLevel,
      racePosition: driverForAdvice.position,
      weatherConditions: raceData.weather,
      competitorStrategies: 'Key rivals on varied strategies; some recently pitted based on observations.', 
    };
    setLastPitStopCallParams(params); 

    try {
      const timeoutPromise = new Promise<SuggestPitStopsOutput>((_, reject) => 
        setTimeout(() => reject(new Error('AI Pit Advisor timed out after 10 seconds.')), AI_CALL_TIMEOUT_MS)
      );

      const result = await Promise.race([
        suggestPitStops(params),
        timeoutPromise
      ]);
      
      setPitStopSuggestion(result);
      setLastSuccessfulAiCallData({ lap: currentLapForAdvice, tireWear: currentTireWear, fuel: currentFuelLevel });
    } catch (error) {
      console.error("Error fetching pit stop suggestion:", error);
      toast({
        variant: "destructive",
        title: "AI Pit Advisor Error",
        description: (error as Error).message || "Failed to get pit stop suggestion.",
      });
      setPitStopSuggestion(null); 
      
      setAiCallCoolDown(true);
      setTimeout(() => {
        setAiCallCoolDown(false);
      }, 15000); 
    } finally {
      setIsPitStopLoading(false);
    }
  }, [
    lastSuccessfulAiCallData, 
    pitStopSuggestion, 
    raceData.weather, // raceData.weather from state
    toast,
    aiCallCoolDown,
  ]);

  useEffect(() => {
    if (mainDriver && raceData.currentLap > 0 && !isLoadingData && !isPitStopLoading && !aiCallCoolDown) {
      fetchPitStopAdvice(mainDriver, raceData.currentLap);
    }
  }, [mainDriver, raceData.currentLap, isLoadingData, isPitStopLoading, fetchPitStopAdvice, aiCallCoolDown]);


  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (isLoadingData && raceData.drivers.length === 0) { // Show initial loading only if no drivers yet
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading F1 Session Data...</p>
      </div>
    );
  }
  
  const displayTrackName = raceData.sessionName ? `${raceData.trackName} (${raceData.sessionName})` : raceData.trackName;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onToggleSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 container mx-auto px-4 py-2 md:px-8 md:py-4">
        {dataLoadError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Race Data</AlertTitle>
            <AlertDescription>{dataLoadError} Using fallback or last known data if available.</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-sm md:text-base"><ListChecks className="w-4 h-4 mr-2 hidden md:inline" />Telemetry & AI</TabsTrigger>
            <TabsTrigger value="map" className="text-sm md:text-base"><MapPinIcon className="w-4 h-4 mr-2 hidden md:inline" />Track Map</TabsTrigger>
            <TabsTrigger value="pitstop" className="text-sm md:text-base"><Brain className="w-4 h-4 mr-2 hidden md:inline" />AI Pit Details</TabsTrigger>
            <TabsTrigger value="competitor" className="text-sm md:text-base"><Users className="w-4 h-4 mr-2 hidden md:inline" />Competitor AI</TabsTrigger>
          </TabsList>
          
          {mainDriver && (
             <div className="p-4 bg-card rounded-lg shadow_ mb-6">
              <h3 className="text-lg font-medium text-primary font-headline">
                Main Focus: P{mainDriver.position || 'N/A'} - {mainDriver.name} ({mainDriver.team})
              </h3>
              <div className="text-sm text-muted-foreground">
                Track: {displayTrackName} | Lap: {raceData.currentLap} / {raceData.totalLaps} | Weather: {raceData.weather} | Safety Car: {raceData.safetyCar}
              </div>
            </div>
          )}

          <TabsContent value="overview">
            {mainDriver ? (
              <LiveTelemetry 
                driver={mainDriver} 
                settings={settings} 
                pitStopSuggestion={pitStopSuggestion}
                isPitStopLoading={isPitStopLoading}
                lapHistory={mainDriver.lapHistory || []}
              />
            ) : (
              !dataLoadError && <p className="text-center text-muted-foreground p-8">No main driver data to display. Waiting for API data...</p>
            )}
          </TabsContent>
          <TabsContent value="map">
            {raceData.drivers.length > 0 ? (
              <InteractiveTrackMap 
                allDrivers={raceData.drivers} 
                mainDriver={mainDriver}
                trackName={displayTrackName} 
              />
            ) : (
               !dataLoadError && <p className="text-center text-muted-foreground p-8">Track map unavailable. Waiting for API data...</p>
            )}
          </TabsContent>
          <TabsContent value="pitstop">
            {mainDriver ? (
              <PitStopAdvisor 
                selectedDriver={mainDriver} 
                currentLap={raceData.currentLap}
                pitStopSuggestion={pitStopSuggestion}
                isPitStopLoading={isPitStopLoading}
                lastPitStopCallParams={lastPitStopCallParams}
               />
            ) : (
               !dataLoadError && <p className="text-center text-muted-foreground p-8">Pit advisor details unavailable. Waiting for API data...</p>
            )}
          </TabsContent>
          <TabsContent value="competitor">
            {raceData.drivers.length > 0 ? (
              <CompetitorAnalyzer allDrivers={raceData.drivers} mainDriver={mainDriver} />
            ) : (
              !dataLoadError && <p className="text-center text-muted-foreground p-8">Competitor analyzer unavailable. Waiting for API data...</p>
            )}
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
        F1 Strategist - Built with Next.js, Tailwind CSS, and Genkit AI. Data from OpenF1 API.
      </footer>
    </div>
  );
}
