import { PLATFORM_CONFIG, WARNING_THRESHOLD } from "../configuration";
import { PlatformId, PlatformValidation, SafeLimits, UploadedImage } from "../types";

export function getSafeLimits(selectedPlatforms: PlatformId[]): SafeLimits | null {
  if (selectedPlatforms.length === 0) {
    return null;
  }

  return selectedPlatforms.reduce<SafeLimits>(
    (limits, platformId) => {
      const config = PLATFORM_CONFIG[platformId];

      return {
        maxCharacters: Math.min(limits.maxCharacters, config.maxCharacters),
        maxImages: Math.min(limits.maxImages, config.maxImages),
        maxImageSizeMB: Math.min(limits.maxImageSizeMB, config.maxImageSizeMB),
      };
    },
    {
      maxCharacters: Number.POSITIVE_INFINITY,
      maxImages: Number.POSITIVE_INFINITY,
      maxImageSizeMB: Number.POSITIVE_INFINITY,
    },
  );
}

export function validatePost(
  caption: string,
  images: UploadedImage[],
  selectedPlatforms: PlatformId[],
): PlatformValidation[] {
  return selectedPlatforms.map((platformId) => {
    const config = PLATFORM_CONFIG[platformId];
    const messages: string[] = [];
    const warnings: string[] = [];
    const remainingCharacters = config.maxCharacters - caption.length;
    const maxImageSizeBytes = config.maxImageSizeMB * 1024 * 1024;

    if (caption.trim().length === 0) {
      messages.push("Caption is required.");
    }

    if (remainingCharacters < 0) {
      messages.push(`Caption exceeds ${config.label}'s ${config.maxCharacters} character limit.`);
    } else if (caption.length >= config.maxCharacters * WARNING_THRESHOLD) {
      warnings.push(`Caption is close to ${config.label}'s character limit.`);
    }

    if (images.length > config.maxImages) {
      messages.push(`${config.label} allows up to ${config.maxImages} image${config.maxImages === 1 ? "" : "s"}.`);
    }

    const oversizedImages = images.filter((image) => image.size > maxImageSizeBytes);
    if (oversizedImages.length > 0) {
      messages.push(`${config.label} requires each image to be under ${config.maxImageSizeMB} MB.`);
    }

    return {
      platformId,
      label: config.label,
      isValid: messages.length === 0,
      messages,
      warnings,
      remainingCharacters,
    };
  });
}

export function normalizeHashtags(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}
