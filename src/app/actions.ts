
'use server';

import { getSnackCommentary, type SnackCommentaryInput } from '@/ai/flows/snack-commentary';
import { getSnackDimensions, type SnackDimensionsInput, type SnackDimensionsOutput } from '@/ai/flows/snack-dimensions';
import { z } from 'zod';

const SnackImageSchema = z.object({
  imageData: z.string(),
});

// This will act as our in-memory database for the session.
// NOTE: This data will be lost when the server restarts.
const sessionSnacks: Snack[] = [];

export interface Snack {
  id: string;
  type: 'parippuvada' | 'vazhaikkapam';
  area: number;
  imageData: string;
}

export type SnackAnalysisResult = (SnackDimensionsOutput & { area: number | null; commentary: string | null; isNewRecord: boolean; latestSnack: Snack | null; error: string | null });

function getLargestSnack(type: 'parippuvada' | 'vazhaikkapam'): Snack | null {
    const snacksOfType = sessionSnacks.filter(s => s.type === type);
    if (snacksOfType.length === 0) {
        return null;
    }
    return snacksOfType.reduce((prev, current) => (prev.area > current.area) ? prev : current);
}

export async function analyzeAndCompareSnack(data: SnackDimensionsInput): Promise<SnackAnalysisResult> {
  const parsedData = SnackImageSchema.safeParse(data);

  const errorResult = {
      snackType: 'unknown' as const,
      diameter: null,
      length: null,
      width: null,
      area: null,
      commentary: null,
      isNewRecord: false,
      latestSnack: null,
      error: 'Invalid input provided.',
  };

  if (!parsedData.success) {
    return errorResult;
  }
  
  try {
    const dimensionsResult = await getSnackDimensions(parsedData.data);

    if (dimensionsResult.error || !dimensionsResult.snackType || dimensionsResult.snackType === 'unknown') {
      return {
        ...errorResult,
        error: dimensionsResult.error || 'Aalae patttikunno? he?',
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
            ...errorResult,
            ...dimensionsResult,
            error: "Could not calculate area due to missing or invalid dimensions."
        }
    }

    const largestSnack = getLargestSnack(dimensionsResult.snackType);
    const isNewRecord = !largestSnack || area > largestSnack.area;

    const commentaryInput: SnackCommentaryInput = {
      snackType: dimensionsResult.snackType,
      newSnackArea: area,
      largestSnackArea: largestSnack?.area ?? 0,
    };

    const commentaryResult = await getSnackCommentary(commentaryInput);
    
    const newSnack: Snack = {
        id: new Date().toISOString(),
        type: dimensionsResult.snackType,
        area,
        imageData: parsedData.data.imageData,
    }
    sessionSnacks.push(newSnack);

    return {
      ...dimensionsResult,
      area,
      commentary: commentaryResult.comment,
      isNewRecord,
      latestSnack: newSnack,
      error: null,
    };

  } catch (error) {
    console.error('Error in GenAI flow for image analysis:', error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        if (error.message.includes("429")) {
            errorMessage = "Nammade quota theernnu! We've hit our daily analysis limit. Please try again tomorrow.";
        } else {
            errorMessage = error.message;
        }
    }
    
    return {
      ...errorResult,
      error: `Could not analyze snack image at this time: ${errorMessage}`,
    };
  }
}
