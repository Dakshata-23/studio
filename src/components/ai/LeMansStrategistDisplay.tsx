
'use client';

import type { Driver, RaceData, SuggestLeMansStrategyOutput, SuggestLeMansStrategyInput } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Loader2, Sparkles, Info, UserCheck, Clock3, Fuel, Settings, AlertTriangle } from 'lucide-react';

interface LeMansStrategistDisplayProps {
  teamDrivers: Driver[];
  raceData: RaceData;
  strategySuggestion: SuggestLeMansStrategyOutput | null;
  isProcessing: boolean;
  lastStrategyCallParams: SuggestLeMansStrategyInput | null;
}

export function LeMansStrategistDisplay({
  teamDrivers,
  raceData,
  strategySuggestion,
  isProcessing,
  lastStrategyCallParams,
}: LeMansStrategistDisplayProps) {

  const currentDrivingDriver = teamDrivers.find(d => d.isDriving);

  return (
    <Card className="shadow-lg_ w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <Brain className="w-6 h-6" /> AI Le Mans Strategist
        </CardTitle>
        <CardDescription>
          Automated team strategy insights. (Currently in Mock Data Mode - AI Calls Disabled)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="default" className="bg-background">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <AlertTitle className="font-semibold">Mock Data Mode</AlertTitle>
          <AlertDescription>
            AI strategy generation is currently disabled. The simulation is running on mock data and predefined logic for driver swaps.
          </AlertDescription>
        </Alert>

        {isProcessing && (
          <div className="flex items-center text-muted-foreground p-4 rounded-md bg-muted">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>AI is analyzing team strategy... (Simulated)</span>
          </div>
        )}

        {strategySuggestion && !isProcessing && (
          <Alert className="bg-accent/10 border-accent/50 text-accent-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-lg text-accent">Current AI Suggestion (Mock)</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p><strong>Suggested Action:</strong> {strategySuggestion.suggestedActions || 'Monitor conditions.'}</p>
              <p><strong>Reasoning:</strong> {strategySuggestion.strategicReasoning || 'Based on current mock data trends.'}</p>
              {strategySuggestion.nextOptimalPitLap && <p><strong>Optimal Pit Lap:</strong> {strategySuggestion.nextOptimalPitLap}</p>}
              {strategySuggestion.recommendedTireType && <p><strong>Recommended Tire:</strong> {strategySuggestion.recommendedTireType}</p>}
            </AlertDescription>
          </Alert>
        )}

        {!isProcessing && !strategySuggestion && (
           <Alert className="bg-muted/50">
            <Info className="h-5 w-5" />
            <AlertTitle>No Active AI Suggestion</AlertTitle>
            <AlertDescription>
              AI strategy suggestions would appear here in a live mode.
            </AlertDescription>
          </Alert>
        )}

        {lastStrategyCallParams && !isProcessing && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                <Info className="w-5 h-5" /> Last Data Sent to AI (Simulated)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Race Lap:</strong> {lastStrategyCallParams.raceCurrentLap} / {lastStrategyCallParams.raceTotalLaps}</p>
              <p><strong>Race Time:</strong> {new Date(lastStrategyCallParams.raceTimeElapsedSeconds * 1000).toISOString().substr(11, 8)}</p>
              <p><strong>Driver Statuses:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                {lastStrategyCallParams.teamDriverStatuses.map(driver => (
                  <li key={driver.name}>
                    {driver.name} ({driver.isCurrentlyDriving ? "Driving" : "Standby"}) - Lap: {driver.currentLap}, Tires: {driver.currentTireType} ({driver.currentTireWear}% wear, {driver.currentTireAgeLaps} laps), Fuel: {driver.fuelLevel}%, Drive Time: {(driver.totalDriveTimeSeconds / 3600).toFixed(2)}hrs
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5"/> Current Team Focus
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                 {currentDrivingDriver ? (
                    <div>
                        <p><UserCheck className="inline w-4 h-4 mr-1"/> <strong>Driving:</strong> {currentDrivingDriver.name}</p>
                        <p><Clock3 className="inline w-4 h-4 mr-1"/> <strong>Driver Time:</strong> {(currentDrivingDriver.totalDriveTimeSeconds / 3600).toFixed(2)} / {(MAX_DRIVER_DRIVE_TIME_SECONDS / 3600).toFixed(0)} hrs</p>
                        <p><Fuel className="inline w-4 h-4 mr-1"/> <strong>Fuel:</strong> {currentDrivingDriver.fuel.toFixed(1)}%</p>
                        <p><strong>Tires:</strong> {currentDrivingDriver.currentTires.type} ({currentDrivingDriver.currentTires.wear.toFixed(1)}% wear, {currentDrivingDriver.currentTires.ageLaps} laps)</p>
                    </div>
                 ) : <p>No driver currently active in simulation.</p>}
                <p className="text-xs text-muted-foreground">Team data updates with each simulated lap.</p>
            </CardContent>
        </Card>

      </CardContent>
    </Card>
  );
}

// Constants that might be used if not passed or for defaults - ensure they are defined in your constants.ts
const MAX_DRIVER_DRIVE_TIME_SECONDS = 14 * 60 * 60; // Example, should come from constants

    