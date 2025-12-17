/**
 * Label Normalizer
 * Converts labels to standard 100×150mm format
 */

import { detectProfile, getProfile } from './profiles/base';

/**
 * Normalize a label to 100×150mm
 * Returns path to the normalized label file
 */
export async function normalizeLabel(inputPath: string): Promise<{
  outputPath: string;
  profileId: string;
  width: number;
  height: number;
}> {
  console.log('[Normalizer] Normalizing label:', inputPath);

  // Detect which profile to use
  const profileId = await detectProfile(inputPath);
  const profile = getProfile(profileId);

  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  // Process the label using the profile
  const result = await profile.process(inputPath);

  console.log(
    `[Normalizer] Normalized with ${profileId}: ${result.width}×${result.height}mm`
  );

  return {
    outputPath: result.outputPath,
    profileId,
    width: result.width,
    height: result.height,
  };
}
