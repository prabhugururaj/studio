'use server';

/**
 * @fileOverview Generates mood-boosting suggestions based on a user's stress score.
 *
 * - generateMoodBoosters - A function that generates mood-boosting content.
 * - GenerateMoodBoostersInput - The input type for the generateMoodBoosters function.
 * - GenerateMoodBoostersOutput - The return type for the generateMoodBoosters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMoodBoostersInputSchema = z.object({
  stressScore: z
    .number()
    .describe("The user's stress score, a number between 0 and 100."),
});
export type GenerateMoodBoostersInput = z.infer<typeof GenerateMoodBoostersInputSchema>;

const GenerateMoodBoostersOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      type: z.enum(['joke', 'affirmation', 'music']).describe('The type of suggestion.'),
      content: z.string().describe('The mood-boosting content.'),
    })
  ).describe('An array of mood-boosting suggestions.'),
});
export type GenerateMoodBoostersOutput = z.infer<typeof GenerateMoodBoostersOutputSchema>;

export async function generateMoodBoosters(input: GenerateMoodBoostersInput): Promise<GenerateMoodBoostersOutput> {
  return generateMoodBoostersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMoodBoostersPrompt',
  input: {schema: GenerateMoodBoostersInputSchema},
  output: {schema: GenerateMoodBoostersOutputSchema},
  prompt: `You are a mood-boosting assistant. Given a user's stress score, you will provide a list of suggestions to improve their mood, including jokes, positive affirmations, and calming music recommendations.

Stress Score: {{{stressScore}}}

Based on the stress score, provide a diverse list of mood-boosting suggestions. The suggestions should be tailored to the stress level, with more intense suggestions for higher stress scores.  Ensure suggestions are appropriate and helpful.

Output a JSON array of suggestions, where each object has a type (joke, affirmation, or music) and content field.
`,
});

const generateMoodBoostersFlow = ai.defineFlow(
  {
    name: 'generateMoodBoostersFlow',
    inputSchema: GenerateMoodBoostersInputSchema,
    outputSchema: GenerateMoodBoostersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
