
'use server';

import { getSnackCommentary, type SnackCommentaryInput } from '@/ai/flows/snack-commentary';
import { getSnackDimensions, type SnackDimensionsInput, type SnackDimensionsOutput } from '@/ai/flows/snack-dimensions';
import { z } from 'zod';

const SnackImageSchema = z.object({
  imageData: z.string(),
});

// The result now won't contain leaderboard data, but just the analysis of the one snack.
export type SnackAnalysisResult = (SnackDimensionsOutput & { area: number | null; commentary: string | null });

export async function analyzeSnack(data: SnackDimensionsInput): Promise<SnackAnalysisResult> {
  const parsedData = SnackImageSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      snackType: 'unknown',
      diameter: null,
      length: null,
      width: null,
      area: null,
      commentary: null,
      error: 'Invalid input provided.',
    };
  }

  try {
    const dimensionsResult = await getSnackDimensions(parsedData.data);

    if (dimensionsResult.error || !dimensionsResult.snackType || dimensionsResult.snackType === 'unknown') {
      return {
        ...dimensionsResult,
        area: null,
        commentary: null,
        error: dimensionsResult.error || 'Could not identify the snack.',
      };
    }
    
    let area: number | null = null;
    if (dimensionsResult.snackType === 'parippuvada' && dimensionsResult.diameter && dimensionsResult.diameter > 0) {
        area = Math.PI * (dimensionsResult.diameter / 2) ** 2;
    } else if (dimensionsResult.snackType === 'vazhaikkapam' && dimensionsResult.length && dimensionsResult.length > 0 && dimensionsResult.width && dimensionsResult.width > 0) {
        area = Math.PI * (dimensionsResult.length / 2) * (dimensionsResult.width / 2);
    }
    
    if (area === null || area <= 0) {
        return {
            ...dimensionsResult,
            area: null,
            commentary: null,
            error: "Could not calculate area due to missing or invalid dimensions."
        }
    }

    // Since we removed Firebase, we can't compare to a largest snack.
    // We'll pass 0 for the largest snack area to get a "first entry" comment.
    const commentaryInput: SnackCommentaryInput = {
      snackType: dimensionsResult.snackType,
      newSnackArea: area,
      largestSnackArea: 0,
    };

    const commentaryResult = await getSnackCommentary(commentaryInput);

    return {
      ...dimensionsResult,
      area,
      commentary: commentaryResult.comment,
    };

  } catch (error) {
    console.error('Error in GenAI flow for image analysis:', error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        if (error.message.includes("429")) {
            errorMessage = "Nammade quota theernnu! We've hit our daily analysis limit. Please try again tomorrow. Full error: " + error.message;
        } else {
            errorMessage = error.message;
        }
    }
    
    return {
      snackType: 'unknown',
      diameter: null,
      length: null,
      width: null,
      area: null,
      commentary: null,
      error: `Could not analyze snack image at this time: ${errorMessage}`,
    };
  }
}
