
'use server';

import { getSnackCommentary, type SnackCommentaryInput } from '@/ai/flows/snack-commentary';
import { getSnackDimensions, type SnackDimensionsInput, type SnackDimensionsOutput } from '@/ai/flows/snack-dimensions';
import { getLargestSnack, saveSnack, type Snack, getTopSnacks } from '@/services/snack-service';
import { z } from 'zod';

const SnackImageSchema = z.object({
  imageData: z.string(),
});

export type SnackAnalysisResult = (SnackDimensionsOutput & { area: number | null; commentary: string | null });

export async function analyzeAndStoreSnack(data: SnackDimensionsInput): Promise<SnackAnalysisResult> {
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

    const largestSnack = await getLargestSnack(dimensionsResult.snackType);
    const commentaryInput: SnackCommentaryInput = {
      snackType: dimensionsResult.snackType,
      newSnackArea: area,
      largestSnackArea: largestSnack?.area || 0,
    };

    const commentaryResult = await getSnackCommentary(commentaryInput);

    const newSnack: Omit<Snack, 'id'> = {
        type: dimensionsResult.snackType,
        name: `Your ${dimensionsResult.snackType}`,
        area: area,
        createdAt: new Date(),
    };
    
    await saveSnack(newSnack);
    
    return {
      ...dimensionsResult,
      area,
      commentary: commentaryResult.comment,
    };

  } catch (error) {
    console.error('Error in GenAI flow for image analysis:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
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

export async function getLeaderboardData() {
    try {
        const parippuvadas = await getTopSnacks('parippuvada', 5);
        const vazhaikkapams = await getTopSnacks('vazhaikkapam', 5);
        const leaderboard = [...parippuvadas, ...vazhaikkapams].sort((a,b) => b.area - a.area).slice(0,5);
        return { leaderboard };
    } catch(error) {
        console.error("Error fetching leaderboard data:", error);
        return { leaderboard: [] };
    }
}
