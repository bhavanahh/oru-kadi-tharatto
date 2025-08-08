
'use server';

import { getSnackExpertBadge, type SnackExpertBadgeInput, type SnackExpertBadgeOutput } from '@/ai/flows/snack-expert-badge';
import { z } from 'zod';

const SnackAreaSchema = z.object({
  snackArea: z.number(),
});

export async function checkSnackExpert(data: SnackExpertBadgeInput): Promise<SnackExpertBadgeOutput> {
  const parsedData = SnackAreaSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      isExpert: false,
      reason: 'Invalid input provided.',
    };
  }
  
  try {
    const result = await getSnackExpertBadge(parsedData.data);
    return result;
  } catch (error) {
    console.error('Error in GenAI flow:', error);
    return {
      isExpert: false,
      reason: 'Could not determine snack expertise at this time. Please try again later.',
    };
  }
}
