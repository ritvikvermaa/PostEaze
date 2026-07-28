import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./app/store";
import { getSafeLimits, normalizeHashtags, validatePost } from "./utils/validation";
import type { DraftRecord, PlatformId, UploadedImage } from "./types";
import { PLATFORM_CONFIG, WARNING_THRESHOLD } from "./configuration";

const selectPostsState = (state: RootState) => state.posts;
const selectPlatformsState = (state: RootState) => state.platforms;

export const selectDraftsForView = createSelector(
  [selectPostsState],
  (postsState) =>
    postsState.ids
      .map((id) => postsState.entities[id])
      .filter((draft): draft is DraftRecord => Boolean(draft))
      .slice(),
);

export const selectSelectedPlatforms = createSelector([selectPlatformsState], (platformsState) => platformsState.selectedPlatformIds);

export const selectPlatformEntities = createSelector([selectPlatformsState], (platformsState) => platformsState.entities);

export const selectComposerMetrics = createSelector(
  [selectSelectedPlatforms, selectPlatformEntities, (_state: RootState, caption: string) => caption, (_state: RootState, _caption: string, images: UploadedImage[]) => images, (_state: RootState, _caption: string, _images: UploadedImage[], selectedPlatforms: PlatformId[]) => selectedPlatforms],
  (selectedPlatforms, platformEntities, caption, images, requestedPlatforms) => {
    const effectivePlatforms = requestedPlatforms.length > 0 ? requestedPlatforms : selectedPlatforms;
    const hashtags = normalizeHashtags(caption);
    const safeLimits = getSafeLimits(effectivePlatforms);
    const validations = validatePost(caption, images, effectivePlatforms);
    const hasHashtagSupport = effectivePlatforms.some((platformId) => platformEntities[platformId]?.supportsHashtags ?? false);
    const isValid = effectivePlatforms.length > 0 && validations.every((validation) => validation.isValid);
    const errorMessages = (() => {
      const messages = validations.flatMap((validation) => validation.messages);

      if (effectivePlatforms.length === 0) {
        messages.unshift("Select at least one channel.");
      }

      return Array.from(new Set(messages));
    })();
    const usageRatio = safeLimits && safeLimits.maxCharacters > 0 ? caption.length / safeLimits.maxCharacters : 0;
    const meterState: "safe" | "warning" | "over" = usageRatio > 1 ? "over" : usageRatio >= WARNING_THRESHOLD ? "warning" : "safe";
    const litSegments = safeLimits ? Math.min(28, Math.round(usageRatio * 28)) : 0;

    return {
      hashtags,
      safeLimits,
      validations,
      hasHashtagSupport,
      isValid,
      errorMessages,
      usageRatio,
      meterState,
      litSegments,
    };
  },
);
