
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { analyzeCompetitorStrategy, AnalyzeCompetitorStrategyOutput } from '@/ai/flows/analyze-competitor-strategy';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Users, Loader2 } from 'lucide-react';
import type { Driver } from '@/lib/types';


interface CompetitorAnalyzerProps {
  allDrivers: Driver[];
  mainDriver: Driver | null;
}

export function CompetitorAnalyzer({ allDrivers, mainDriver }: CompetitorAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalyzeCompetitorStrategyOutput[]>([]); // Changed to array
  const { toast } = useToast();

  // Function to analyze a single driver
  const analyzeDriver = async (competitorDriver: Driver, isDriverInFront: boolean) => {
    const sortedDrivers = [...allDrivers].sort((a, b) => a.position - b.position);
    const competitorIndex = sortedDrivers.findIndex(d => d.id === competitorDriver.id);

    let driverInFrontInfo = '';
    if (competitorIndex > 0) {
      const driverInFront = sortedDrivers[competitorIndex - 1];
      driverInFrontInfo = `Driver in front: ${driverInFront.name} (P${driverInFront.position}).`;
    }

    let driverInBackInfo = '';
    if (competitorIndex < sortedDrivers.length - 1) {
      const driverInBack = sortedDrivers[competitorIndex + 1];
      driverInBackInfo = `Driver behind: ${driverInBack.name} (P${driverInBack.position}).`;
    }

    const currentRaceDataEnhanced = `
      Competitor: ${competitorDriver.name} (P${competitorDriver.position})
      Tire Type: ${competitorDriver.currentTires.type}
      Tire Wear: ${competitorDriver.currentTires.wear}%
      Tire Age: ${competitorDriver.currentTires.ageLaps || 'N/A'} laps
      ${driverInFrontInfo}
      ${driverInBackInfo}
      Additional Race Data: The competitor's current race data is automatically inferred from the track data.
    `;

    try {
      const result = await analyzeCompetitorStrategy({
        competitorName: competitorDriver.name,
        historicalData: 'Historically aggressive on tire usage, tends to pit early.', // Hardcoded historical data
        currentRaceData: currentRaceDataEnhanced,
      });
      return result;
    } catch (error) {
      console.error(`Error analyzing ${competitorDriver.name}'s strategy:`, error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: (error as Error).message || `Failed to analyze ${competitorDriver.name}'s strategy.`,
      });
      return null;
    }
  };

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!mainDriver || allDrivers.length === 0) {
        setAnalyses([]);
        return;
      }

      setIsLoading(true);
      const sortedDrivers = [...allDrivers].sort((a, b) => a.position - b.position);
      const mainDriverIndex = sortedDrivers.findIndex(d => d.id === mainDriver.id);

      const driversToAnalyze: Driver[] = [];
      let driverInFront: Driver | undefined;
      let driverInBack: Driver | undefined;

      if (mainDriverIndex > 0) {
        driverInFront = sortedDrivers[mainDriverIndex - 1];
        driversToAnalyze.push(driverInFront);
      }
      if (mainDriverIndex < sortedDrivers.length - 1) {
        driverInBack = sortedDrivers[mainDriverIndex + 1];
        driversToAnalyze.push(driverInBack);
      }

      const results = await Promise.all(
        driversToAnalyze.map(driver => analyzeDriver(driver, driver === driverInFront))
      );

      setAnalyses(results.filter(Boolean) as AnalyzeCompetitorStrategyOutput[]);
      setIsLoading(false);
    };

    fetchAnalyses();
  }, [allDrivers, mainDriver]);


  if (!mainDriver || allDrivers.length === 0) {
    return (
      <Card className="shadow-lg_">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Users className="w-6 h-6" /> Competitor Strategy Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No main driver or race data available to analyze competitors.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg_">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Users className="w-6 h-6" /> Competitor Strategy Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Analyzing competitor strategies...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="shadow-lg_">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Users className="w-6 h-6" /> Competitor Strategy Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No immediate competitors to analyze (e.g., only one driver or at the start/end of the grid).</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg_">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <Users className="w-6 h-6" /> Competitor Strategy Analyzer
        </CardTitle>
        <CardDescription>AI analysis of immediate competitors.</CardDescription>
      </CardHeader>
      <CardContent>
        {analyses.map((analysis, index) => (
          <Alert key={index} className="mt-6 bg-accent/10 border-accent/50 text-accent-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-lg text-accent">AI Analysis for {analysis.driverInFront?.name || analysis.driverInBack?.name || 'Competitor'}</AlertTitle>
            <AlertDescription className="mt-2">
              <p><strong>Strategy Summary:</strong> {analysis.strategySummary}</p>
              {analysis.tireCompound && <p><strong>Tire Compound:</strong> {analysis.tireCompound}</p>}
              {analysis.tireAgeLaps && <p><strong>Tire Age:</strong> {analysis.tireAgeLaps} laps</p>}
              {analysis.tirePosition && <p><strong>Tire Position:</strong> {analysis.tirePosition}</p>}
              {analysis.driverInFront && (
                <p>
                  <strong>Driver In Front:</strong> {analysis.driverInFront.name}
                  {analysis.driverInFront.gap && ` (Gap: ${analysis.driverInFront.gap})`}
                  {analysis.driverInFront.action && ` (Action: ${analysis.driverInFront.action})`}
                </p>
              )}
              {analysis.driverInBack && (
                <p>
                  <strong>Driver In Back:</strong> {analysis.driverInBack.name}
                  {analysis.driverInBack.gap && ` (Gap: ${analysis.driverInBack.gap})`}
                  {analysis.driverInBack.action && ` (Action: ${analysis.driverInBack.action})`}
                </p>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
