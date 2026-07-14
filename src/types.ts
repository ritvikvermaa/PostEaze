import { PLATFORM_CONFIG } from "./configuration";

export type PlatformId = keyof typeof PLATFORM_CONFIG;

export type UploadedImage = {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
};

export type PlatformValidation = {
  platformId: PlatformId;
  label: string;
  isValid: boolean;
  messages: string[];
  warnings: string[];
  remainingCharacters: number;
};

export type SafeLimits = {
  maxCharacters: number;
  maxImages: number;
  maxImageSizeMB: number;
};

export type DraftPayload = {
  selectedPlatforms: PlatformId[];
  caption: string;
  hashtags: string[];
  images: Array<Pick<UploadedImage, "name" | "size" | "type">>;
  savedAt: string;
};
