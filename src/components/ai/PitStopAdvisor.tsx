
'use client';

import { useState, useEffect } from 'react';
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
import { suggestPitStops, SuggestPitStopsInput, SuggestPitStopsOutput } from '@/ai/flows/suggest-pit-stops';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Brain, Loader2 } from 'lucide-react';
import type { Driver } from '@/lib/types';

const SuggestPitStopsClientSchema = z.object({
  driverName: z.string().min(1, "Driver name is required."),
  currentLap: z.coerce.number().int().positive("Current lap must be a positive number."),
  tireCondition: z.string().min(1, "Tire condition is required (e.g., new, worn, 20% left)."),
  fuelLevel: z.coerce.number().min(0).max(100, "Fuel level must be between 0 and 100."),
  racePosition: z.coerce.number().int().positive("Race position must be a positive number."),
  weatherConditions: z.string().min(1, "Weather conditions are required (e.g., dry, wet, light rain)."),
  competitorStrategies: z.string().optional().describe("Brief summary of key competitors' pit status or likely strategy."),
});

interface PitStopAdvisorProps {
  selectedDriver: Driver | null; // Changed from drivers: Driver[]
  currentLap?: number;
}

export function PitStopAdvisor({ selectedDriver, currentLap: raceCurrentLap }: PitStopAdvisorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestPitStopsOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<SuggestPitStopsInput>({
    resolver: zodResolver(SuggestPitStopsClientSchema),
    defaultValues: {
      driverName: '',
      currentLap: 1,
      tireCondition: 'Medium - 20% wear',
      fuelLevel: 70,
      racePosition: 1,
      weatherConditions: 'Dry',
      competitorStrategies: 'Main rival on old Hards.',
    },
  });

  useEffect(() => {
    if (selectedDriver) {
      form.reset({
        driverName: selectedDriver.name,
        currentLap: raceCurrentLap || selectedDriver.currentTires.ageLaps || 1, // Example logic
        tireCondition: `${selectedDriver.currentTires.type} - ${selectedDriver.currentTires.wear}% wear`,
        fuelLevel: Math.round(selectedDriver.fuel),
        racePosition: selectedDriver.position,
        weatherConditions: form.getValues().weatherConditions || 'Dry', // Keep user input if any
        competitorStrategies: form.getValues().competitorStrategies || '', // Keep user input
      });
    }
  }, [selectedDriver, raceCurrentLap, form]);


  const onSubmit: SubmitHandler<SuggestPitStopsInput> = async (data) => {
    if (!selectedDriver) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No driver selected for pit stop advice.",
      });
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      // Ensure driverName is from the selectedDriver, overriding any form state if it was editable
      const submissionData = { ...data, driverName: selectedDriver.name };
      const result = await suggestPitStops(submissionData);
      setSuggestion(result);
    } catch (error) {
      console.error("Error suggesting pit stops:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: (error as Error).message || "Failed to get pit stop suggestion.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!selectedDriver) {
    return (
      <Card className="shadow-lg_">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Brain className="w-6 h-6" /> Pit Stop Advisor
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
          <Brain className="w-6 h-6" /> Pit Stop Advisor for {selectedDriver.name}
        </CardTitle>
        <CardDescription>Get AI-powered pit stop strategy suggestions for the main driver.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Driver Name is now pre-filled and not selectable */}
            <FormField
              control={form.control}
              name="driverName"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Driver Name</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentLap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Lap</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tireCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tire Condition</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Worn, 30% left" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuelLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Level (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="racePosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race Position</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 3" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weatherConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather Conditions</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dry, Light Rain" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="competitorStrategies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitor Strategies (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Main rival pitted 2 laps ago for Hards." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading || !selectedDriver} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Get Suggestion
            </Button>
          </form>
        </Form>

        {suggestion && (
          <Alert className="mt-6 bg-accent/10 border-accent/50 text-accent-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-lg text-accent">AI Suggestion</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p><strong>Suggested Pit Stop Lap:</strong> {suggestion.suggestedPitStopLap}</p>
              <p><strong>Reasoning:</strong> {suggestion.reasoning}</p>
              <p><strong>Alternative Strategies:</strong> {suggestion.alternativeStrategies}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
