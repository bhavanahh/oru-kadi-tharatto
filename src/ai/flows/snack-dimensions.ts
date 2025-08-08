
'use server';
/**
 * @fileOverview Determines snack dimensions from an image.
 *
 * - `getSnackDimensions` - A function that handles the snack dimension analysis.
 * - `SnackDimensionsInput` - The input type for the getSnackDimensions function.
 * - `SnackDimensionsOutput` - The return type for the getSnackDimensions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SnackDimensionsInputSchema = z.object({
  imageData: z
    .string()
    .describe(
      "An image of a snack, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  snackType: z.enum(['parippuvada', 'vazhaikkapam']).describe('The type of snack in the image.'),
});

export type SnackDimensionsInput = z.infer<typeof SnackDimensionsInputSchema>;

const SnackDimensionsOutputSchema = z.object({
  diameter: z.number().nullable().describe('The diameter of the parippuvada in cm. Null if not a parippuvada.'),
  length: z.number().nullable().describe('The length of the vazhaikkapam in cm. Null if not a vazhaikkapam.'),
  width: z.number().nullable().describe('The width of the vazhaikkapam in cm. Null if not a vazhaikkapam.'),
  error: z.string().nullable().describe('Any error message if processing failed.'),
});

export type SnackDimensionsOutput = z.infer<typeof SnackDimensionsOutputSchema>;


export async function getSnackDimensions(input: SnackDimensionsInput): Promise<SnackDimensionsOutput> {
  return snackDimensionsFlow(input);
}


const snackDimensionsFlow = ai.defineFlow(
  {
    name: 'snackDimensionsFlow',
    inputSchema: SnackDimensionsInputSchema,
    outputSchema: SnackDimensionsOutputSchema,
  },
  async (input) => {
    // This is where you would integrate a real computer vision model.
    // For now, we'll return mock data based on the snack type.
    if (input.snackType === 'parippuvada') {
      return {
        diameter: Math.random() * 5 + 8, // Random diameter between 8 and 13
        length: null,
        width: null,
        error: null,
      };
    } else { // vazhaikkapam
      return {
        diameter: null,
        length: Math.random() * 6 + 10, // Random length between 10 and 16
        width: Math.random() * 4 + 5,   // Random width between 5 and 9
        error: null,
      };
    }
  }
);
