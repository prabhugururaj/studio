
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-stress.ts';
import '@/ai/flows/generate-mood-boosters.ts';
import '@/ai/flows/suggest-mood-boosters.ts';
import '@/ai/flows/detect-object-and-spell.ts';
import '@/ai/flows/analyze-posture.ts';
// import '@/ai/flows/observe-wellness.ts'; // Removed wellness observer flow
import '@/ai/flows/interpret-sign-language.ts';
