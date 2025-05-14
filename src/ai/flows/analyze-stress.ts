'use server';

/**
 * @fileOverview Analyzes facial expressions from webcam input to determine stress level and provide a stress score.
 *
 * - analyzeStress - A function that takes a photo data URI as input and returns a stress score.
 * - AnalyzeStressInput - The input type for the analyzeStress function.
 * - AnalyzeStressOutput - The return type for the analyzeStress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStressInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeStressInput = z.infer<typeof AnalyzeStressInputSchema>;

const AnalyzeStressOutputSchema = z.object({
  stressScore: z
    .number()
    .describe('A numerical score representing the estimated stress level (0-100).'),
  analysis: z.string().describe('An analysis of the facial expressions.'),
  isRelevant: z.boolean().describe('A boolean value indicating whether the input is relevant.'),
});
export type AnalyzeStressOutput = z.infer<typeof AnalyzeStressOutputSchema>;


const isRelevantTool = ai.defineTool({
  name: 'isRelevant',
  description: 'Determine whether the input is relevant for stress analysis.',
  inputSchema: z.object({
    photoDataUri: z
      .string()
      .describe(
        "A photo of a face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  }),
  outputSchema: z.boolean(), // Simple boolean output
  async execute(input) {
    // Basic implementation - can be improved with more sophisticated logic
    return !!input.photoDataUri;
  },
});

export async function analyzeStress(input: AnalyzeStressInput): Promise<AnalyzeStressOutput> {
  return analyzeStressFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStressPrompt',
  input: {schema: AnalyzeStressInputSchema},
  output: {schema: AnalyzeStressOutputSchema},
  tools: [isRelevantTool],
  prompt: `You are an AI that analyzes facial expressions in a photo to determine the stress level of the person.

  Analyze the photo provided and determine a stress score between 0 and 100. 0 means no stress detected, and 100 means very high stress detected. Also include a short analysis on why you came up with the score.
  If the input is not a picture of a face, use the tool to return that it is not relevant.
  Photo: {{media url=photoDataUri}}
  `,
});

const analyzeStressFlow = ai.defineFlow(
  {
    name: 'analyzeStressFlow',
    inputSchema: AnalyzeStressInputSchema,
    outputSchema: AnalyzeStressOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
