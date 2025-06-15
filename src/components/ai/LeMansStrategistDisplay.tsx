
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Brain, Loader2, Info, Users } from 'lucide-react';
import type { Driver, SuggestLeMansStrategyInput, SuggestLeMansStrategyOutput, RaceData } from '@/lib/types';
// import { formatSecondsToHMS } from '@/app/page'; // Assuming formatSecondsToHMS is exported or moved to utils

interface LeMansStrategistDisplayProps {
  teamDrivers: Driver[];
  raceData: RaceData;
  strategySuggestion: SuggestLeMansStrategyOutput | null;
  isStrategistLoading: boolean;
  lastStrategyCallParams: SuggestLeMansStrategyInput | null;
}

export function LeMansStrategistDisplay({ 
  teamDrivers,
  raceData,
  strategySuggestion, 
  isStrategistLoading,
  lastStrategyCallParams 
}: LeMansStrategistDisplayProps) {

  if (!teamDrivers || teamDrivers.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Brain className="w-6 h-6" /> AI Le Mans Strategist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No team driver data available. Waiting for simulation to start.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Helper to format seconds to HMS, move to utils if used elsewhere
  const localFormatSecondsToHMS = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <Brain className="w-6 h-6" /> AI LeMans Strategist Details
        </CardTitle>
        <CardDescription>View the latest AI strategy suggestions for Your Team Endurance and the data used for analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isStrategistLoading && (
          <div className="flex items-center text-muted-foreground p-4 rounded-md bg-muted">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>AI is currently analyzing data for Le Mans strategy...</span>
          </div>
        )}

        {lastStrategyCallParams && !isStrategistLoading && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                <Info className="w-5 h-5" /> Inputs for Current Suggestion (Lap {lastStrategyCallParams.raceCurrentLap})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Race Time:</strong> {localFormatSecondsToHMS(lastStrategyCallParams.raceTimeElapsedSeconds)} / {localFormatSecondsToHMS(lastStrategyCallParams.totalRaceDurationSeconds)}</p>
              <p><strong>Weather:</strong> {lastStrategyCallParams.weatherConditions}</p>
              <p><strong>Safety Car:</strong> {lastStrategyCallParams.safetyCarStatus}</p>
              <div className="mt-2">
                <h4 className="font-medium text-foreground/90 mb-1">Driver Statuses Sent to AI:</h4>
                {lastStrategyCallParams.teamDriverStatuses.map(driver => (
                  <div key={driver.name} className="p-2 border-b border-border/50 last:border-b-0">
                    <p><strong>{driver.name}</strong> {driver.isCurrentlyDriving ? '(Driving)' : ''}</p>
                    <p>Tires: {driver.currentTireType} ({driver.currentTireAgeLaps} Laps, {driver.currentTireWear}% wear)</p>
                    <p>Fuel: {driver.fuelLevel}% | Drive Time: {localFormatSecondsToHMS(driver.totalDriveTimeSeconds)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {strategySuggestion && !isStrategistLoading && (
          <Alert className="bg-accent/10 border-accent/50 text-accent-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-lg text-accent">Current AI Strategy Suggestion</AlertTitle>
            <AlertDescription className="space-y-2 mt-2 whitespace-pre-line">
              <p><strong>Suggested Actions:</strong> {strategySuggestion.suggestedActions}</p>
              <p><strong>Strategic Reasoning:</strong> {strategySuggestion.strategicReasoning}</p>
              {strategySuggestion.nextOptimalPitLap && <p><strong>Next Optimal Pit Lap:</strong> {strategySuggestion.nextOptimalPitLap}</p>}
              {strategySuggestion.recommendedNextDriverName && <p><strong>Recommended Next Driver:</strong> {strategySuggestion.recommendedNextDriverName}</p>}
            </AlertDescription>
          </Alert>
        )}

        {!isStrategistLoading && !strategySuggestion && (
          <p className="text-muted-foreground text-center py-4">
            No strategy suggestion available. AI will generate one as the simulated race progresses.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
