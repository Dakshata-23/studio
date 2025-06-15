
'use server';

/**
 * @fileOverview A Le Mans 24h race strategy AI agent.
 * This flow has been renamed and repurposed from suggestPitStops to suggestLeMansStrategy.
 *
 * - suggestLeMansStrategy - A function that handles the Le Mans strategy suggestion process.
 * - SuggestLeMansStrategyInput - The input type for the suggestLeMansStrategy function.
 * - SuggestLeMansStrategyOutput - The return type for the suggestLeMansStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TireType, WeatherCondition, RaceData as AppRaceData } from '@/lib/types'; // For WeatherCondition & TireType

// Define a Zod schema for a single driver's status
const TeamDriverStatusSchema = z.object({
  name: z.string().describe('The name of the driver.'),
  currentTireType: z.custom<TireType>().describe('The current tire compound (Soft, Medium, Hard, Intermediate, Wet).'),
  currentTireAgeLaps: z.number().int().nonnegative().describe('Number of laps completed on the current set of tires.'),
  currentTireWear: z.number().min(0).max(100).describe('Current estimated tire wear percentage (0-100).'),
  fuelLevel: z.number().min(0).max(100).describe('Current fuel level percentage (0-100).'),
  totalDriveTimeSeconds: z.number().nonnegative().describe('Total cumulative time driven by this driver in the race so far, in seconds.'),
  isCurrentlyDriving: z.boolean().describe('Whether this driver is currently in the car.'),
  currentLap: z.number().int().nonnegative().describe('The lap number this driver is currently on or has last completed.') // Changed from .positive()
});

// Define the input schema for the Le Mans strategy flow
const SuggestLeMansStrategyInputSchema = z.object({
  teamDriverStatuses: z.array(TeamDriverStatusSchema).length(3).describe('An array containing the status of all 3 team drivers.'),
  raceCurrentLap: z.number().int().positive().describe('The current lap number of the race.'),
  raceTotalLaps: z.number().int().positive().describe('The total planned laps for the race (e.g., ~350-390 for Le Mans).'),
  raceTimeElapsedSeconds: z.number().nonnegative().describe('Total time elapsed in the race so far, in seconds.'),
  totalRaceDurationSeconds: z.number().nonnegative().describe('The total duration of the race (e.g., 24 hours = 86400 seconds).'),
  weatherConditions: z.custom<WeatherCondition>().describe('Current weather conditions (Sunny, Cloudy, Rainy, Heavy Rain).'),
  trackName: z.string().describe('The name of the race track (e.g., Circuit de la Sarthe).'),
  safetyCarStatus: z.custom<AppRaceData['safetyCar']>().describe('Current safety car status (None, Deployed, Virtual).')
});
export type SuggestLeMansStrategyInput = z.infer<typeof SuggestLeMansStrategyInputSchema>;

// Define the output schema for the Le Mans strategy flow
const SuggestLeMansStrategyOutputSchema = z.object({
  suggestedActions: z.string().describe('Detailed suggested actions: who should pit, target pit lap, tire compound, and which driver should take over. Example: "Driver A should pit on lap 85 for new Medium tires. Driver B to take over the stint."'),
  strategicReasoning: z.string().describe('Comprehensive reasoning behind the suggestion, considering driver time limits, tire wear, fuel, race progression, weather, and overall 24-hour strategy.'),
  nextOptimalPitLap: z.number().int().positive().optional().describe('An estimated optimal lap number for the next planned pit stop for the team.'),
  recommendedNextDriverName: z.string().optional().describe('The name of the driver recommended to drive the next stint if a swap is suggested now.')
});
export type SuggestLeMansStrategyOutput = z.infer<typeof SuggestLeMansStrategyOutputSchema>;


export async function suggestLeMansStrategy( // Renamed function
  input: SuggestLeMansStrategyInput
): Promise<SuggestLeMansStrategyOutput> {
  return suggestLeMansStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLeMansStrategyPrompt', // Renamed prompt
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: SuggestLeMansStrategyInputSchema},
  output: {schema: SuggestLeMansStrategyOutputSchema},
  prompt: `You are an expert Le Mans 24-Hour race strategist for a competitive endurance racing team.
Your goal is to devise the optimal strategy to win the race, considering all factors over the full 24-hour duration.
The team has 3 drivers, and each driver can drive for a maximum of 14 hours in total during the 24-hour race.
Continuously monitor each driver's total drive time. It is critical to manage this effectively to avoid penalties and ensure peak driver performance.

Current Race Context:
Track: {{{trackName}}}
Race Progress: Lap {{{raceCurrentLap}}} of {{{raceTotalLaps}}}.
Time Elapsed: {{{raceTimeElapsedSeconds}}} seconds (out of {{{totalRaceDurationSeconds}}} seconds).
Weather: {{{weatherConditions}}}
Safety Car: {{{safetyCarStatus}}}

Team Driver Status:
{{#each teamDriverStatuses}}
- Driver: {{name}}
  - Currently Driving: {{#if isCurrentlyDriving}}YES{{else}}NO{{/if}}
  - Current Lap: {{currentLap}}
  - Tires: {{currentTireType}}, Age: {{currentTireAgeLaps}} laps, Wear: {{currentTireWear}}%
  - Fuel: {{fuelLevel}}%
  - Total Drive Time This Race: {{totalDriveTimeSeconds}} seconds (Max allowed: 50400 seconds / 14 hours)
{{/each}}

Strategic Considerations:
1.  **Driver Rotation & Drive Time Limits (Max 14 hours per driver):** This is paramount. Plan driver stints to utilize all drivers effectively without exceeding their 14-hour limit. Consider which driver is freshest or best suited for current conditions.
2.  **Tire Strategy:** Recommend optimal tire compounds (Soft, Medium, Hard; or Intermediate/Wet for rain) based on wear, track temperature (implied by weather), and stint length. Balance performance against durability. Stints at Le Mans are typically multiple fuel loads.
3.  **Fuel Management:** While drivers usually pit when fuel is low, consider stint length in conjunction with tire life and driver time.
4.  **Weather Impact:** Adapt strategy for changing weather. Intermediate or Wet tires may be needed. Advise on timing for such changes.
5.  **Race Phase:** Early race strategy might differ from mid-race or end-race. Consider track position, but long-term race viability is key.
6.  **Safety Cars:** How does a safety car period affect pit stop timing? Can it be an opportunity?

Based on ALL the above information, provide your strategic advice:

- **Suggested Actions:** Clearly state what the team should do now or in the very near future.
    Example: "Driver A (currently driving) should target pitting on lap X (approx Y more laps). Change to Medium tires. Driver B should take over."
    If no immediate pit stop is needed, state that and suggest a monitoring plan or target for the next stop.
    Example: "Continue with Driver A. Monitor tire wear closely. Target pit window between lap X and Y. Driver C is next scheduled."
- **Strategic Reasoning:** Explain WHY this is the best course of action. Justify your recommendations regarding driver choice, tire compound, and timing. Explicitly mention how it aligns with managing the 14-hour drive time limits.
- **Next Optimal Pit Lap (Optional):** If applicable, provide an estimated lap for the team's next pit stop.
- **Recommended Next Driver Name (Optional):** If suggesting a driver swap, clearly state who should drive next.

Focus on a clear, actionable, and well-reasoned plan for the team. Prioritize compliance with driver hour regulations.
`,
});

const suggestLeMansStrategyFlow = ai.defineFlow( // Renamed flow
  {
    name: 'suggestLeMansStrategyFlow',
    inputSchema: SuggestLeMansStrategyInputSchema,
    outputSchema: SuggestLeMansStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

