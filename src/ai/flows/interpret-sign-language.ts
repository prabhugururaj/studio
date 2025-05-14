
'use server';

/**
 * @fileOverview Interprets American Sign Language (ASL) gestures from an image to text.
 * This is a demo feature and may have limitations in accuracy for complex signs.
 *
 * - interpretSignLanguage - A function that handles sign language interpretation.
 * - InterpretSignLanguageInput - The input type for the interpretSignLanguage function.
 * - InterpretSignLanguageOutput - The return type for the interpretSignLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretSignLanguageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing a hand gesture, ideally a clear ASL sign, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type InterpretSignLanguageInput = z.infer<typeof InterpretSignLanguageInputSchema>;

const InterpretSignLanguageOutputSchema = z.object({
  interpretedText: z.string().describe('The text equivalent of the detected ASL sign. Empty if no sign is clearly interpretable.'),
  isSignDetected: z.boolean().describe('True if a recognizable ASL sign or sign-like gesture was detected, false otherwise.'),
  reasonIfNotDetected: z.string().optional().describe('A brief reason if no suitable sign was detected or if interpretation is ambiguous.'),
});
export type InterpretSignLanguageOutput = z.infer<typeof InterpretSignLanguageOutputSchema>;

export async function interpretSignLanguage(input: InterpretSignLanguageInput): Promise<InterpretSignLanguageOutput> {
  return interpretSignLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretSignLanguagePrompt',
  input: {schema: InterpretSignLanguageInputSchema},
  output: {schema: InterpretSignLanguageOutputSchema},
  prompt: `You are an AI assistant attempting to interpret American Sign Language (ASL) from a static image.
Focus on clear, common handshapes and single, isolated signs if possible. The image quality might vary.

Analyze the provided image:
If a recognizable ASL sign is present:
1. Set isSignDetected to true.
2. Provide the interpretedText for the sign (e.g., "Hello", "Thank you", "A", "B").
3. Leave reasonIfNotDetected empty or provide a positive confirmation like "Clear sign detected."

If no clear ASL sign is detected, the gesture is ambiguous, not ASL, or the image is unsuitable:
1. Set isSignDetected to false.
2. Set interpretedText to an empty string.
3. Provide a brief reasonIfNotDetected (e.g., "No clear ASL sign detected.", "Gesture is ambiguous.", "Image quality too low for interpretation.").

Image: {{media url=photoDataUri}}`,
});

const interpretSignLanguageFlow = ai.defineFlow(
  {
    name: 'interpretSignLanguageFlow',
    inputSchema: InterpretSignLanguageInputSchema,
    outputSchema: InterpretSignLanguageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
