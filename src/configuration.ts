export const PLATFORM_CONFIG = {
  x: {
    id: "x",
    label: "X/Twitter",
    maxCharacters: 280,
    maxImages: 1,
    maxImageSizeMB: 1,
    supportsHashtags: false,
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    maxCharacters: 2200,
    maxImages: 20,
    maxImageSizeMB: 2,
    supportsHashtags: true,
  },
} as const;

export const LOCAL_STORAGE_DRAFT_KEY = "multiPlatformPostDraft";

export const WARNING_THRESHOLD = 0.8;
