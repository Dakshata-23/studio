
import { config } from 'dotenv';
config();

// Updated to reflect the new flow name if it was changed from 'suggest-pit-stops'
// Assuming suggest-pit-stops.ts now contains suggestLeMansStrategy
import '@/ai/flows/suggest-pit-stops.ts'; 
import '@/ai/flows/analyze-competitor-strategy.ts';
