
'use server';

/**
 * @fileOverview Provides general, non-medical visual observations based on webcam input.
 * THIS IS NOT A MEDICAL DIAGNOSIS TOOL.
 *
 * - observeWellness - A function that takes a photo data URI and returns general observations.
 * - ObserveWellnessInput - The input type for the observeWellness function.
 * - ObserveWellnessOutput - The return type for the observeWellness function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ObserveWellnessInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. The photo should clearly show the person's face."
    ),
});
export type ObserveWellnessInput = z.infer<typeof ObserveWellnessInputSchema>;

const ObserveWellnessOutputSchema = z.object({
  isFaceDetected: z
    .boolean()
    .describe('A boolean value indicating whether a face was clearly detected in the image.'),
  observations: z
    .string()
    .describe('General, non-medical visual observations about the person. This will explain why no observation could be made if isFaceDetected is false or if the image is unsuitable. If certain visual cues are present, it may suggest seeking medical attention.'),
  disclaimer: z
    .string()
    .describe('A mandatory disclaimer about the non-medical nature of this feature.'),
});
export type ObserveWellnessOutput = z.infer<typeof ObserveWellnessOutputSchema>;

export async function observeWellness(input: ObserveWellnessInput): Promise<ObserveWellnessOutput> {
  return observeWellnessFlow(input);
}

const FIXED_DISCLAIMER = "This is a demonstration of visual observation AI and is NOT a medical diagnosis. Always consult a healthcare professional for any health concerns.";

const prompt = ai.definePrompt({
  name: 'observeWellnessPrompt',
  input: {schema: ObserveWellnessInputSchema},
  output: {schema: ObserveWellnessOutputSchema},
  prompt: `You are an AI assistant demonstrating visual observation capabilities for general wellness.
Analyze the provided image of a face. Your primary goal is to provide GENERAL, NON-MEDICAL visual observations.
DO NOT attempt to diagnose any specific illness or medical condition.

If a face is clearly visible and suitable for observation:
1. Set isFaceDetected to true.
2. Look for the following visual cues: paler skin, paler lips, a more swollen face, droopier corners of the mouth, more hanging eyelids, redder eyes, less glossy or patchy skin, or a generally tired appearance.
3. In the 'observations' field:
    a. If several of these cues are noticeably present: Describe the observed cues (e.g., "Observed paler skin, redder eyes, and a tired appearance."). Then, add the sentence: "If you are feeling unwell or have concerns about these observations, it is advisable to seek medical attention."
    b. If these specific cues are not prominent or absent: Describe general appearance cues (e.g., "Appears alert," "Skin tone appears even," "Eyes seem clear," "General facial appearance observed as typical."). Do not suggest medical attention in this case unless the specific cues mentioned above are present.
   
   DO NOT mention or speculate about any specific illnesses or medical conditions (e.g., fever, flu, cold, specific skin diseases). Only describe the visual cues if present and make the general suggestion for medical attention if those cues are observed.

If no face is detected, the image is unclear, or not suitable for observation (e.g., too blurry, object instead of a face):
1. Set isFaceDetected to false.
2. In the 'observations' field, provide a brief explanation (e.g., "No clear face detected for observation.", "Image unclear for observation.").

Always include the following exact disclaimer in the 'disclaimer' field:
"${FIXED_DISCLAIMER}"

Image: {{media url=photoDataUri}}`,
});

const observeWellnessFlow = ai.defineFlow(
  {
    name: 'observeWellnessFlow',
    inputSchema: ObserveWellnessInputSchema,
    outputSchema: ObserveWellnessOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the disclaimer is always the fixed one, regardless of what the model might return
    return {
        ...output!,
        disclaimer: FIXED_DISCLAIMER,
    };
  }
);

