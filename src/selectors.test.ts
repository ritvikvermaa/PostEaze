import { describe, expect, it } from "vitest";
import { selectDraftsForView, selectComposerMetrics } from "./selectors";

describe("memoized selectors", () => {
  it("returns drafts from the normalized posts state", () => {
    const state = {
      posts: {
        entities: {
          draft1: { id: "draft1", title: "First", selectedPlatforms: ["x"], caption: "Hello", hashtags: [], images: [], savedAt: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
          draft2: { id: "draft2", title: "Second", selectedPlatforms: ["instagram"], caption: "Hi", hashtags: ["tag"], images: [], savedAt: "2024-01-02", createdAt: "2024-01-02", updatedAt: "2024-01-02" },
        },
        ids: ["draft2", "draft1"],
        activeDraftId: null,
        status: "idle" as const,
        error: null,
      },
      platforms: {
        entities: {},
        ids: ["x", "instagram"] as Array<"x" | "instagram">,
        selectedPlatformIds: ["x"],
        status: "idle" as const,
      },
    };

    const drafts = selectDraftsForView(state as never);

    expect(drafts.map((draft) => draft.id)).toEqual(["draft2", "draft1"]);
    expect(drafts[0].title).toBe("Second");
  });

  it("derives validation metrics for the composer", () => {
    const state = {
      posts: { entities: {}, ids: [], activeDraftId: null, status: "idle" as const, error: null },
      platforms: {
        entities: {
          x: { id: "x", label: "X/Twitter", maxCharacters: 280, maxImages: 1, maxImageSizeMB: 1, supportsHashtags: false },
          instagram: { id: "instagram", label: "Instagram", maxCharacters: 2200, maxImages: 20, maxImageSizeMB: 2, supportsHashtags: true },
        },
        ids: ["x", "instagram"] as Array<"x" | "instagram">,
        selectedPlatformIds: ["x"],
        status: "idle" as const,
      },
    };

    const metrics = selectComposerMetrics(state as never, "Hello", [], ["x"]);

    expect(metrics.safeLimits?.maxCharacters).toBe(280);
    expect(metrics.hasHashtagSupport).toBe(false);
    expect(metrics.isValid).toBe(true);
    expect(metrics.errorMessages).toEqual([]);
  });
});
