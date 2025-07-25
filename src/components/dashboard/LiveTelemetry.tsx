
'use client';

import type { Driver, Settings, SuggestPitStopsOutput, LapHistoryEntry } from '@/lib/types';
import { DriverCard } from './DriverCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceCharts } from './PerformanceCharts';

interface LiveTelemetryProps {
  driver: Driver | null;
  settings: Settings;
  pitStopSuggestion: SuggestPitStopsOutput | null;
  isPitStopLoading: boolean;
  lapHistory: LapHistoryEntry[];
}

export function LiveTelemetry({ driver, settings, pitStopSuggestion, isPitStopLoading, lapHistory }: LiveTelemetryProps) {
  if (!driver) {
    return <p className="text-center text-muted-foreground p-8">No driver data available to display.</p>;
  }

  return (
    <div className="space-y-6 py-6">
      <div className="px-4 md:px-0">
        <h2 className="text-3xl font-bold mb-2 text-primary font-headline">Live Telemetry & AI Pit Advisor</h2>
        <p className="mb-6 text-lg text-accent">Showing data for: {driver.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
        <div>
          <DriverCard driver={driver} settings={settings} />
        </div>
        
        <Card className="bg-card text-card-foreground shadow-lg_">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
              <Brain className="w-5 h-5" /> AI Pit Stop Advisor
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[14rem] flex flex-col justify-between">
            <div className="space-y-3 overflow-y-auto pr-2 flex-grow"> {/* flex-grow allows this div to take available space */}
              {isPitStopLoading && (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Updating AI pit stop advice...</span>
                </div>
              )}
              {!isPitStopLoading && !pitStopSuggestion && (
                <p className="text-muted-foreground">No pit stop suggestion available yet. Waiting for data...</p>
              )}
              {pitStopSuggestion && !isPitStopLoading && (
                <Alert className="bg-accent/10 border-accent/50 text-accent-foreground">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <AlertTitle className="font-headline text-lg text-accent">Live AI Suggestion</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p><strong>Suggested Pit Stop Lap:</strong> {pitStopSuggestion.suggestedPitStopLap}</p>
                    <p><strong>Reasoning:</strong> {pitStopSuggestion.reasoning}</p>
                    {pitStopSuggestion.alternativeStrategies && <p><strong>Alternatives:</strong> {pitStopSuggestion.alternativeStrategies}</p>}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-2 shrink-0"> {/* mt-2 ensures some space, shrink-0 prevents it from growing */}
              Advice updates automatically based on race conditions.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <PerformanceCharts
        lapHistory={lapHistory}
        tireWear={driver.currentTires.wear}
        fuel={driver.fuel}
      />

    </div>
  );
}
