/**
 * Label Normalizer
 * Converts labels to standard 100×150mm format
 */

import { detectProfile, getProfile, ProfileContext } from './profiles/base';

/**
 * Normalize a label to 100×150mm
 * Returns path to the normalized label file
 */
export async function normalizeLabel(
  inputPath: string,
  context?: ProfileContext
): Promise<{
  outputPath: string;
  profileId: string;
  width: number;
  height: number;
  detectedShippingCompany?: string;
}> {
  console.log('[Normalizer] Normalizing label:', inputPath);
  if (context?.shippingCompany) {
    console.log('[Normalizer] Shipping company:', context.shippingCompany);
  }

  // Detect which profile to use
  const profileId = await detectProfile(inputPath, context);
  const profile = getProfile(profileId);

  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  // Process the label using the profile
  const result = await profile.process(inputPath, context);

  console.log(
    `[Normalizer] Normalized with ${profileId}: ${result.width}×${result.height}mm`
  );

  return {
    outputPath: result.outputPath,
    profileId,
    width: result.width,
    height: result.height,
    detectedShippingCompany: result.detectedShippingCompany,
  };
}
