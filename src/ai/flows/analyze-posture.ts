
'use server';

/**
 * @fileOverview Analyzes posture from webcam input to provide a score and feedback.
 *
 * - analyzePosture - A function that takes a photo data URI and returns posture analysis.
 * - AnalyzePostureInput - The input type for the analyzePosture function.
 * - AnalyzePostureOutput - The return type for the analyzePosture function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePostureInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. The photo should ideally show the upper body or full body for posture analysis."
    ),
});
export type AnalyzePostureInput = z.infer<typeof AnalyzePostureInputSchema>;

const AnalyzePostureOutputSchema = z.object({
  postureScore: z
    .number()
    .min(0).max(100)
    .describe('A numerical score representing the estimated posture quality (0-100). 0 is very poor, 100 is excellent.'),
  analysis: z
    .string()
    .describe('A detailed analysis of the posture, including feedback and suggestions for improvement. If not relevant, this field explains why.'),
  isRelevant: z
    .boolean()
    .describe('A boolean value indicating whether a person suitable for posture analysis was detected in the image.'),
});
export type AnalyzePostureOutput = z.infer<typeof AnalyzePostureOutputSchema>;

export async function analyzePosture(input: AnalyzePostureInput): Promise<AnalyzePostureOutput> {
  return analyzePostureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePosturePrompt',
  input: {schema: AnalyzePostureInputSchema},
  output: {schema: AnalyzePostureOutputSchema},
  prompt: `You are an AI expert in posture analysis.
Analyze the provided image to assess the person's posture.
If a person is clearly visible and suitable for posture analysis:
1. Set isRelevant to true.
2. Provide a postureScore between 0 (very poor) and 100 (excellent).
3. Provide a detailed analysis of their posture, highlighting good points and areas for improvement. Offer specific, actionable suggestions.

If no person is detected, the image is unclear, or not suitable for posture analysis (e.g., too zoomed in on a face, object instead of a person):
1. Set isRelevant to false.
2. Set postureScore to 0.
3. In the analysis field, provide a brief explanation of why posture analysis could not be performed (e.g., "No person detected", "Image unclear for posture assessment").

Image: {{media url=photoDataUri}}`,
});

const analyzePostureFlow = ai.defineFlow(
  {
    name: 'analyzePostureFlow',
    inputSchema: AnalyzePostureInputSchema,
    outputSchema: AnalyzePostureOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
