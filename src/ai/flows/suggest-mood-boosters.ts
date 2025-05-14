'use server';

/**
 * @fileOverview Generates mood-boosting suggestions based on a user's stress score and preferences.
 *
 * - suggestMoodBoosters - A function that generates mood-boosting content based on stress score and user preferences.
 * - SuggestMoodBoostersInput - The input type for the suggestMoodBoosters function.
 * - SuggestMoodBoostersOutput - The return type for the suggestMoodBoosters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMoodBoostersInputSchema = z.object({
  stressScore: z
    .number()
    .describe("The user's stress score, a number between 0 and 100."),
  preferences: z
    .array(z.enum(['joke', 'affirmation', 'music']))
    .optional()
    .describe('Optional list of preferred suggestion types.'),
});
export type SuggestMoodBoostersInput = z.infer<typeof SuggestMoodBoostersInputSchema>;

const SuggestMoodBoostersOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      type: z.enum(['joke', 'affirmation', 'music']).describe('The type of suggestion.'),
      content: z.string().describe('The mood-boosting content.'),
    })
  ).describe('An array of mood-boosting suggestions.'),
});
export type SuggestMoodBoostersOutput = z.infer<typeof SuggestMoodBoostersOutputSchema>;

export async function suggestMoodBoosters(input: SuggestMoodBoostersInput): Promise<SuggestMoodBoostersOutput> {
  return suggestMoodBoostersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMoodBoostersPrompt',
  input: {schema: SuggestMoodBoostersInputSchema},
  output: {schema: SuggestMoodBoostersOutputSchema},
  prompt: `You are a mood-boosting assistant. Given a user's stress score and preferences, you will provide a list of suggestions to improve their mood, including jokes, positive affirmations, and calming music recommendations.

Stress Score: {{{stressScore}}}
Preferences: {{#if preferences}}{{{preferences}}}{{else}}No specific preferences{{/if}}

Based on the stress score and preferences, provide a diverse list of mood-boosting suggestions. The suggestions should be tailored to the stress level, with more intense suggestions for higher stress scores.  Ensure suggestions are appropriate and helpful. If preferences are specified, prioritize those types of suggestions.

Output a JSON array of suggestions, where each object has a type (joke, affirmation, or music) and content field.
`,
});

const suggestMoodBoostersFlow = ai.defineFlow(
  {
    name: 'suggestMoodBoostersFlow',
    inputSchema: SuggestMoodBoostersInputSchema,
    outputSchema: SuggestMoodBoostersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
