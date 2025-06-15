
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Brain, Loader2, Info } from 'lucide-react';
import type { Driver, SuggestPitStopsInput, SuggestPitStopsOutput } from '@/lib/types';

interface PitStopAdvisorProps {
  selectedDriver: Driver | null;
  currentLap?: number;
  pitStopSuggestion: SuggestPitStopsOutput | null;
  isPitStopLoading: boolean;
  lastPitStopCallParams: SuggestPitStopsInput | null;
}

export function PitStopAdvisor({ 
  selectedDriver, 
  currentLap, 
  pitStopSuggestion, 
  isPitStopLoading,
  lastPitStopCallParams 
}: PitStopAdvisorProps) {

  if (!selectedDriver) {
    return (
      <Card className="shadow-lg_">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Brain className="w-6 h-6" /> AI Pit Advisor Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No driver selected. Please wait for driver data to load.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg_">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <Brain className="w-6 h-6" /> AI Pit Advisor Details for {selectedDriver.name}
        </CardTitle>
        <CardDescription>View the latest automated AI pit stop suggestion and the data used to generate it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPitStopLoading && (
          <div className="flex items-center text-muted-foreground p-4 rounded-md bg-muted">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>AI is currently analyzing data for {selectedDriver.name}...</span>
          </div>
        )}

        {lastPitStopCallParams && !isPitStopLoading && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                <Info className="w-5 h-5" /> Inputs Used for Current Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Driver:</strong> {lastPitStopCallParams.driverName}</p>
              <p><strong>Current Lap:</strong> {lastPitStopCallParams.currentLap}</p>
              <p><strong>Tire Condition:</strong> {lastPitStopCallParams.tireCondition}</p>
              <p><strong>Fuel Level:</strong> {lastPitStopCallParams.fuelLevel}%</p>
              <p><strong>Race Position:</strong> P{lastPitStopCallParams.racePosition}</p>
              <p><strong>Weather:</strong> {lastPitStopCallParams.weatherConditions}</p>
              <p><strong>Competitor Notes:</strong> {lastPitStopCallParams.competitorStrategies || 'N/A'}</p>
            </CardContent>
          </Card>
        )}

        {pitStopSuggestion && !isPitStopLoading && (
          <Alert className="bg-accent/10 border-accent/50 text-accent-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-lg text-accent">Current AI Suggestion</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p><strong>Suggested Pit Stop Lap:</strong> {pitStopSuggestion.suggestedPitStopLap}</p>
              <p><strong>Reasoning:</strong> {pitStopSuggestion.reasoning}</p>
              <p><strong>Alternative Strategies:</strong> {pitStopSuggestion.alternativeStrategies}</p>
            </AlertDescription>
          </Alert>
        )}

        {!isPitStopLoading && !pitStopSuggestion && (
          <p className="text-muted-foreground text-center py-4">
            No pit stop suggestion available. AI will generate one as race data updates.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
