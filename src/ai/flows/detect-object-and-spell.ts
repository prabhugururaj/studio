
'use server';

/**
 * @fileOverview Detects an object in an image and provides its name and spelling.
 *
 * - detectObjectAndSpell - A function that handles object detection and spelling.
 * - DetectObjectAndSpellInput - The input type for the detectObjectAndSpell function.
 * - DetectObjectAndSpellOutput - The return type for the detectObjectAndSpell function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectObjectAndSpellInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an object, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectObjectAndSpellInput = z.infer<typeof DetectObjectAndSpellInputSchema>;

const DetectObjectAndSpellOutputSchema = z.object({
  objectName: z.string().describe('The name of the detected object (e.g., "Apple"). Empty if not detected or not relevant.'),
  spelling: z.string().describe('The spelling of the object, with letters separated by spaces (e.g., "A P P L E"). Empty if not detected or not relevant.'),
  isObjectDetected: z.boolean().describe('True if a suitable, child-friendly object was detected, false otherwise.'),
  reasonIfNotDetected: z.string().optional().describe('A brief reason if no suitable object was detected.'),
});
export type DetectObjectAndSpellOutput = z.infer<typeof DetectObjectAndSpellOutputSchema>;

export async function detectObjectAndSpell(input: DetectObjectAndSpellInput): Promise<DetectObjectAndSpellOutput> {
  return detectObjectAndSpellFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectObjectAndSpellPrompt',
  input: {schema: DetectObjectAndSpellInputSchema},
  output: {schema: DetectObjectAndSpellOutputSchema},
  prompt: `You are an AI assistant helping children learn to spell.
Analyze the provided image to identify the main, common, child-friendly object.
If a clear object is found:
1. Set isObjectDetected to true.
2. Provide the objectName (e.g., "Apple", "Ball", "Cat").
3. Provide the spelling of the objectName with each letter separated by a space (e.g., "A P P L E", "B A L L", "C A T").
If no clear, common, child-friendly object is detected, or if the image is unsuitable (e.g., blurry, abstract, a person's face instead of an object):
1. Set isObjectDetected to false.
2. Provide a brief reasonIfNotDetected.
3. Set objectName and spelling to empty strings.

Image: {{media url=photoDataUri}}`,
});

const detectObjectAndSpellFlow = ai.defineFlow(
  {
    name: 'detectObjectAndSpellFlow',
    inputSchema: DetectObjectAndSpellInputSchema,
    outputSchema: DetectObjectAndSpellOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
