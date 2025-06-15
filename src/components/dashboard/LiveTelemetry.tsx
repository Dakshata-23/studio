
'use client';

import type { Driver, Settings, SuggestLeMansStrategyOutput, RaceData, LapHistoryEntry } from '@/lib/types';
import { DriverCard } from './DriverCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Loader2, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceCharts } from './PerformanceCharts'; // PerformanceCharts might need to be per driver or aggregated

interface LiveTelemetryProps {
  teamDrivers: Driver[];
  raceData: RaceData;
  settings: Settings;
  strategySuggestion: SuggestLeMansStrategyOutput | null;
  isStrategistLoading: boolean;
}

export function LiveTelemetry({ teamDrivers, raceData, settings, strategySuggestion, isStrategistLoading }: LiveTelemetryProps) {
  if (!teamDrivers || teamDrivers.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No team driver data available.</p>;
  }

  const currentDrivingDriver = teamDrivers.find(d => d.isDriving);

  return (
    <div className="space-y-6 py-6">
      <div className="px-4 md:px-0">
        <h2 className="text-3xl font-bold mb-2 text-primary font-headline flex items-center gap-2">
            <Users className="w-8 h-8" /> Team Telemetry & AI Strategist
        </h2>
        <p className="mb-6 text-lg text-accent">
            Managing "Your Team Endurance" - Currently driving: {currentDrivingDriver?.name || 'N/A'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
        {teamDrivers.map(driver => (
          <DriverCard key={driver.id} driver={driver} settings={settings} />
        ))}
      </div>
        
      <Card className="bg-card text-card-foreground shadow-lg col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
            <Brain className="w-5 h-5" /> AI Le Mans Strategist
          </CardTitle>
          <CardDescription>Live strategic advice for the 24-hour race.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[10rem] flex flex-col justify-between">
          <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
            {isStrategistLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>AI is analyzing data for Le Mans strategy...</span>
              </div>
            )}
            {!isStrategistLoading && !strategySuggestion && (
              <p className="text-muted-foreground">No strategy suggestion available yet. Waiting for data...</p>
            )}
            {strategySuggestion && !isStrategistLoading && (
              <Alert className="bg-accent/10 border-accent/50 text-accent-foreground">
                <Sparkles className="h-5 w-5 text-accent" />
                <AlertTitle className="font-headline text-lg text-accent">Current AI Strategy</AlertTitle>
                <AlertDescription className="space-y-2 mt-2 whitespace-pre-line">
                  <p><strong>Suggested Actions:</strong> {strategySuggestion.suggestedActions}</p>
                  <p><strong>Strategic Reasoning:</strong> {strategySuggestion.strategicReasoning}</p>
                  {strategySuggestion.nextOptimalPitLap && <p><strong>Next Optimal Pit Lap:</strong> {strategySuggestion.nextOptimalPitLap}</p>}
                  {strategySuggestion.recommendedNextDriverName && <p><strong>Recommended Next Driver:</strong> {strategySuggestion.recommendedNextDriverName}</p>}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-2 shrink-0">
            Advice updates periodically based on simulated race conditions and driver status.
          </p>
        </CardContent>
      </Card>
      
      {currentDrivingDriver && (
        <PerformanceCharts
            lapHistory={currentDrivingDriver.lapHistory || []}
            tireWear={currentDrivingDriver.currentTires.wear}
            fuel={currentDrivingDriver.fuel}
        />
      )}
      {!currentDrivingDriver && teamDrivers.length > 0 && (
         <PerformanceCharts
            lapHistory={teamDrivers[0].lapHistory || []} // Fallback to first driver if no one is marked as driving
            tireWear={teamDrivers[0].currentTires.wear}
            fuel={teamDrivers[0].fuel}
        />
      )}


    </div>
  );
}
