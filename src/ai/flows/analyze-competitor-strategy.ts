'use server';

/**
 * @fileOverview Analyzes competitor strategies based on historical data and current race conditions.
 *
 * - analyzeCompetitorStrategy - A function that analyzes competitor strategies.
 * - AnalyzeCompetitorStrategyInput - The input type for the analyzeCompetitorStrategy function.
 * - AnalyzeCompetitorStrategyOutput - The return type for the analyzeCompetitorStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCompetitorStrategyInputSchema = z.object({
  competitorName: z.string().describe('The name of the competitor.'),
  historicalData: z.string().describe('Historical race data for the competitor.'),
  currentRaceData: z.string().describe('Current race data, including lap times, tire status, and pit stop information.'),
});
export type AnalyzeCompetitorStrategyInput = z.infer<typeof AnalyzeCompetitorStrategyInputSchema>;

const AnalyzeCompetitorStrategyOutputSchema = z.object({
  strategySummary: z.string().describe('A brief summary of the likely competitor strategy.'),
  tireCompound: z.enum(['Soft', 'Medium', 'Hard', 'Intermediate', 'Wet']).describe('The type of tire compound.'),
  tireAgeLaps: z.number().describe('The age of the tires in laps.'),
  tirePosition: z.enum(['Front Left', 'Front Right', 'Rear Left', 'Rear Right']).describe('The position of the tire.'),
  driverInFront: z.object({
    name: z.string().describe('Name of the driver in front.'),
    gap: z.string().optional().describe('Gap to the driver in front (e.g., "+1.2s").'),
    action: z.string().optional().describe('Suggested action against the driver in front (e.g., "Lap", "Defend").'),
  }).optional().describe('Information about the driver immediately in front.'),
  driverInBack: z.object({
    name: z.string().describe('Name of the driver behind.'),
    gap: z.string().optional().describe('Gap to the driver behind (e.g., "-0.8s").'),
    action: z.string().optional().describe('Suggested action against the driver behind (e.g., "Defend", "Attack").'),
  }).optional().describe('Information about the driver immediately behind.'),
});
export type AnalyzeCompetitorStrategyOutput = z.infer<typeof AnalyzeCompetitorStrategyOutputSchema>;

export async function analyzeCompetitorStrategy(
  input: AnalyzeCompetitorStrategyInput
): Promise<AnalyzeCompetitorStrategyOutput> {
  return analyzeCompetitorStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCompetitorStrategyPrompt',
  input: {schema: AnalyzeCompetitorStrategyInputSchema},
  output: {schema: AnalyzeCompetitorStrategyOutputSchema},
  prompt: `You are an expert Race Strategist. Analyze the competitor's strategy based on the following data:

Competitor Name: {{{competitorName}}}
Historical Data: {{{historicalData}}}
Current Race Data: {{{currentRaceData}}}

Based on the provided 'Current Race Data', extract the competitor's tire compound, tire age in laps, and tire position. Also, identify the drivers immediately in front and behind the competitor, including their names, gaps, and any suggested actions (e.g., "Lap", "Defend").

Provide a brief summary of their likely strategy.

Output should be a JSON object with the following structure. Ensure all fields are populated if the information is available in the 'Current Race Data'. If a driver in front or back is not present, omit that field.

{
  "strategySummary": "string",
  "tireCompound": "Soft" | "Medium" | "Hard" | "Intermediate" | "Wet",
  "tireAgeLaps": number,
  "tirePosition": "Front Left" | "Front Right" | "Rear Left" | "Rear Right",
  "driverInFront": {
    "name": "string",
    "gap": "string",
    "action": "string"
  },
  "driverInBack": {
    "name": "string",
    "gap": "string",
    "action": "string"
  }
}
`,
});

const analyzeCompetitorStrategyFlow = ai.defineFlow(
  {
    name: 'analyzeCompetitorStrategyFlow',
    inputSchema: AnalyzeCompetitorStrategyInputSchema,
    outputSchema: AnalyzeCompetitorStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
