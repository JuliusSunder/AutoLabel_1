/**
 * Base Label Profile Interface
 * Defines how different label formats should be detected and processed
 */

export interface LabelProfile {
  /**
   * Profile identifier (e.g., "generic", "dhl", "hermes")
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Detect if this profile applies to the given file
   * @param filePath - Path to the label file
   * @returns true if this profile should be used
   */
  detect(filePath: string): Promise<boolean>;

  /**
   * Process the label file
   * @param filePath - Path to the input label file
   * @returns Path to the processed label file (temp location)
   */
  process(filePath: string): Promise<{
    outputPath: string;
    width: number;
    height: number;
  }>;
}

/**
 * Registry of available profiles
 */
const profiles: Map<string, LabelProfile> = new Map();

/**
 * Register a label profile
 */
export function registerProfile(profile: LabelProfile): void {
  profiles.set(profile.id, profile);
  console.log(`[Profiles] Registered profile: ${profile.id}`);
}

/**
 * Get a profile by ID
 */
export function getProfile(id: string): LabelProfile | undefined {
  return profiles.get(id);
}

/**
 * Detect which profile to use for a label
 * Returns the first matching profile, or "generic" as fallback
 */
export async function detectProfile(filePath: string): Promise<string> {
  // Try each profile in order
  for (const [id, profile] of profiles) {
    try {
      if (await profile.detect(filePath)) {
        console.log(`[Profiles] Detected profile: ${id} for ${filePath}`);
        return id;
      }
    } catch (error) {
      console.error(`[Profiles] Error detecting with ${id}:`, error);
    }
  }

  // Default to generic
  console.log(`[Profiles] Using generic profile for ${filePath}`);
  return 'generic';
}

/**
 * Get all registered profile IDs
 */
export function getAllProfileIds(): string[] {
  return Array.from(profiles.keys());
}
