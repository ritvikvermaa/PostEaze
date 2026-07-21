import { describe, expect, it } from "vitest";
import type { DraftPayload } from "../../types";
import postsReducer, { createDraftRecord, removeDraft, upsertDraft } from "./postsSlice";

function makeDraft(title: string, savedAt: string): DraftPayload {
  return {
    title,
    selectedPlatforms: ["x"],
    caption: `${title} caption`,
    hashtags: ["alpha"],
    images: [],
    savedAt,
  };
}

describe("posts slice", () => {
  it("stores drafts in a normalized list and keeps newest entries first", () => {
    const first = createDraftRecord(makeDraft("First", "2024-01-01T00:00:00.000Z"));
    const second = createDraftRecord(makeDraft("Second", "2024-01-02T00:00:00.000Z"));

    const state = postsReducer({ entities: {}, ids: [], activeDraftId: null, status: "idle", error: null }, upsertDraft(first));
    const nextState = postsReducer(state, upsertDraft(second));

    expect(nextState.ids).toEqual([second.id, first.id]);
    expect(nextState.entities[second.id].title).toBe("Second");
  });

  it("removes a draft and clears the active draft when it is deleted", () => {
    const draft = createDraftRecord(makeDraft("Delete me", "2024-01-03T00:00:00.000Z"));
    const state = postsReducer(
      { entities: {}, ids: [], activeDraftId: null, status: "idle", error: null },
      upsertDraft(draft),
    );
    const activeState = postsReducer(state, { type: "posts/setActiveDraft", payload: draft.id });
    const nextState = postsReducer(activeState, removeDraft(draft.id));

    expect(nextState.ids).toEqual([]);
    expect(nextState.activeDraftId).toBeNull();
  });
});
