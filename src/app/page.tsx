'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LiveTelemetry } from '@/components/dashboard/LiveTelemetry';
import { InteractiveTrackMap } from '@/components/dashboard/InteractiveTrackMap';
import { FocusSelector } from '@/components/controls/FocusSelector';
import { PitStopAdvisor } from '@/components/ai/PitStopAdvisor';
import { CompetitorAnalyzer } from '@/components/ai/CompetitorAnalyzer';
import { MOCK_RACE_DATA, DEFAULT_SETTINGS } from '@/lib/constants';
import type { RaceData, Settings, Driver } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Users, MapPinIcon, ListChecks } from 'lucide-react';


export default function DashboardPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [raceData, setRaceData] = useState<RaceData>(MOCK_RACE_DATA);
  const [focusedDriverId, setFocusedDriverId] = useState<string | null>(null);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRaceData(prevData => {
        const updatedDrivers = prevData.drivers.map(driver => ({
          ...driver,
          lastLapTime: driver.lastLapTime ? (parseFloat(driver.lastLapTime.split(':')[1]) + (Math.random() * 0.2 - 0.1)).toFixed(3) : null,
          currentTires: {
            ...driver.currentTires,
            wear: Math.min(100, driver.currentTires.wear + Math.floor(Math.random() * 2) + 1),
          },
          fuel: Math.max(0, driver.fuel - (Math.random() * 0.5 + 0.2)),
        }));
        // Simulate position changes for top 3
        if (Math.random() < 0.1 && updatedDrivers.length >=2) { // 10% chance to swap P1 and P2
            const tempPos = updatedDrivers[0].position;
            updatedDrivers[0].position = updatedDrivers[1].position;
            updatedDrivers[1].position = tempPos;
            // Swap the actual drivers in array to reflect position sort
            [updatedDrivers[0], updatedDrivers[1]] = [updatedDrivers[1], updatedDrivers[0]];
        }
        return { 
          ...prevData, 
          drivers: updatedDrivers,
          currentLap: Math.min(prevData.totalLaps, prevData.currentLap + (Math.random() < 0.3 ? 1:0)), // Occasionally increment lap
         };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // Optionally, save to localStorage
    // localStorage.setItem('f1StrategistSettings', JSON.stringify({ ...settings, ...newSettings }));
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    // const savedSettings = localStorage.getItem('f1StrategistSettings');
    // if (savedSettings) {
    //   setSettings(JSON.parse(savedSettings));
    // }
    // This effect is for client-side only logic like localStorage.
    // For this template, we are keeping it simple and not using localStorage to avoid hydration issues.
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onToggleSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 container mx-auto px-4 py-2 md:px-8 md:py-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-sm md:text-base"><ListChecks className="w-4 h-4 mr-2 hidden md:inline" />Telemetry</TabsTrigger>
            <TabsTrigger value="map" className="text-sm md:text-base"><MapPinIcon className="w-4 h-4 mr-2 hidden md:inline" />Track Map</TabsTrigger>
            <TabsTrigger value="pitstop" className="text-sm md:text-base"><Brain className="w-4 h-4 mr-2 hidden md:inline" />Pit Advisor</TabsTrigger>
            <TabsTrigger value="competitor" className="text-sm md:text-base"><Users className="w-4 h-4 mr-2 hidden md:inline" />Competitor AI</TabsTrigger>
          </TabsList>
          
          <FocusSelector 
            drivers={raceData.drivers} 
            selectedDriverId={focusedDriverId} 
            onDriverSelect={setFocusedDriverId} 
          />

          <TabsContent value="overview">
            <LiveTelemetry drivers={raceData.drivers} settings={settings} focusedDriverId={focusedDriverId} />
          </TabsContent>
          <TabsContent value="map">
            <InteractiveTrackMap 
              drivers={raceData.drivers} 
              trackName={raceData.trackName} 
              focusedDriverId={focusedDriverId}
              onDriverSelect={setFocusedDriverId}
            />
          </TabsContent>
          <TabsContent value="pitstop">
            <PitStopAdvisor drivers={raceData.drivers} currentLap={raceData.currentLap} />
          </TabsContent>
          <TabsContent value="competitor">
            <CompetitorAnalyzer drivers={raceData.drivers} />
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
        F1 Strategist - Built with Next.js, Tailwind CSS, and Genkit AI.
      </footer>
    </div>
  );
}
