'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { analyzeCompetitorStrategy, AnalyzeCompetitorStrategyInput, AnalyzeCompetitorStrategyOutput } from '@/ai/flows/analyze-competitor-strategy';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Users, Loader2 } from 'lucide-react';
import type { Driver } from '@/lib/types';


const AnalyzeCompetitorStrategyClientSchema = z.object({
  competitorName: z.string().min(1, "Competitor name is required."),
  historicalData: z.string().min(1, "Historical data summary is required."),
  currentRaceData: z.string().min(1, "Current race data summary is required."),
});

interface CompetitorAnalyzerProps {
  drivers: Driver[]; // To pre-fill competitor name
}

export function CompetitorAnalyzer({ drivers }: CompetitorAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeCompetitorStrategyOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<AnalyzeCompetitorStrategyInput>({
    resolver: zodResolver(AnalyzeCompetitorStrategyClientSchema),
    defaultValues: {
      competitorName: drivers.length > 1 ? drivers[1].name : (drivers.length > 0 ? drivers[0].name : ""), // Default to second driver if available
      historicalData: 'Historically aggressive on tire usage, tends to pit early.',
      currentRaceData: 'Currently on Medium tires, 10 laps old, running P3.',
    },
  });

  const onSubmit: SubmitHandler<AnalyzeCompetitorStrategyInput> = async (data) => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeCompetitorStrategy(data);
      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing competitor strategy:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: (error as Error).message || "Failed to analyze competitor strategy.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg_">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <Users className="w-6 h-6" /> Competitor Strategy Analyzer
        </CardTitle>
        <CardDescription>Predict likely competitor strategies using AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="competitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competitor Name</FormLabel>
                  <FormControl>
                     <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="">Select Competitor</option>
                      {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                     </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="historicalData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical Data Summary</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Prefers one-stop, good tire management." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentRaceData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Race Data Summary</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Started on Softs, pitted lap 15 for Hards, currently P2." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Strategy
            </Button>
          </form>
        </Form>

        {analysis && (
          <Alert className="mt-6 bg-accent/10 border-accent/50 text-accent-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-lg text-accent">AI Analysis</AlertTitle>
            <AlertDescription className="mt-2">
              <p><strong>Strategy Summary:</strong> {analysis.strategySummary}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
