
'use server';

/**
 * @fileOverview A pit stop suggestion AI agent.
 *
 * - suggestPitStops - A function that handles the pit stop suggestion process.
 * - SuggestPitStopsInput - The input type for the suggestPitStops function.
 * - SuggestPitStopsOutput - The return type for the suggestPitStops function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPitStopsInputSchema = z.object({
  driverName: z.string().describe('The name of the driver to analyze.'),
  currentLap: z.number().describe('The current lap number of the race.'),
  tireCondition: z.string().describe('The current condition of the tires (e.g., new, worn, damaged).'),
  fuelLevel: z.number().describe('The current fuel level of the car (in percentage).'),
  racePosition: z.number().describe('The current race position of the driver.'),
  weatherConditions: z.string().describe('The current weather conditions (e.g., dry, wet, rain).'),
  competitorStrategies: z.string().describe('A summary of the strategies of the main competitors.'),
});
export type SuggestPitStopsInput = z.infer<typeof SuggestPitStopsInputSchema>;

const SuggestPitStopsOutputSchema = z.object({
  suggestedPitStopLap: z.number().describe('The suggested optimal lap for the next pit stop.'),
  reasoning: z.string().describe('The reasoning behind the suggested pit stop lap.'),
  alternativeStrategies: z.string().describe('Possible alternative strategies and their potential outcomes.'),
});
export type SuggestPitStopsOutput = z.infer<typeof SuggestPitStopsOutputSchema>;

export async function suggestPitStops(input: SuggestPitStopsInput): Promise<SuggestPitStopsOutput> {
  return suggestPitStopsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPitStopsPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly define the model here
  input: {schema: SuggestPitStopsInputSchema},
  output: {schema: SuggestPitStopsOutputSchema},
  prompt: `You are a seasoned Formula 1 race strategist. Analyze the current race conditions and driver data to suggest the optimal pit stop strategy.

Driver Name: {{{driverName}}}
Current Lap: {{{currentLap}}}
Tire Condition: {{{tireCondition}}}
Fuel Level: {{{fuelLevel}}}%
Race Position: {{{racePosition}}}
Weather Conditions: {{{weatherConditions}}}
Competitor Strategies: {{{competitorStrategies}}}

Based on this information, provide a suggested pit stop lap, the reasoning behind it, and potential alternative strategies.

Consider factors like tire degradation, fuel consumption, track position, and competitor activity to formulate your recommendation.`,
});

const suggestPitStopsFlow = ai.defineFlow(
  {
    name: 'suggestPitStopsFlow',
    inputSchema: SuggestPitStopsInputSchema,
    outputSchema: SuggestPitStopsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
