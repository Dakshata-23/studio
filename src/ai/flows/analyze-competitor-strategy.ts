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
  prompt: `You are an expert F1 strategist. Analyze the competitor's strategy based on the following data:

Competitor Name: {{{competitorName}}}
Historical Data: {{{historicalData}}}
Current Race Data: {{{currentRaceData}}}

Provide a brief summary of their likely strategy.`,
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
