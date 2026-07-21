import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DraftPayload, DraftRecord } from "../../types";
import { addOrUpdateDraftToLocalStorage, deleteDraftFromLocalStorage, getSavedDrafts } from "../../utils/storage";

export type PostsState = {
  entities: Record<string, DraftRecord>;
  ids: string[];
  activeDraftId: string | null;
  status: "idle" | "loading" | "saving" | "deleted";
  error: string | null;
};

const initialState: PostsState = {
  entities: {},
  ids: [],
  activeDraftId: null,
  status: "idle",
  error: null,
};

export function createDraftRecord(payload: DraftPayload, existingId?: string): DraftRecord {
  const timestamp = new Date().toISOString();

  return {
    id: existingId ?? crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...payload,
  };
}

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    hydrateDrafts(state, action: PayloadAction<DraftRecord[]>) {
      state.entities = action.payload.reduce<Record<string, DraftRecord>>((accumulator, draft) => {
        accumulator[draft.id] = draft;
        return accumulator;
      }, {});
      state.ids = action.payload.map((draft) => draft.id);
      state.status = "idle";
      state.error = null;
    },
    startLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setActiveDraft(state, action: PayloadAction<string | null>) {
      state.activeDraftId = action.payload;
    },
    upsertDraft(state, action: PayloadAction<DraftRecord>) {
      const draft = action.payload;
      const existingIndex = state.ids.indexOf(draft.id);

      if (existingIndex === -1) {
        state.ids = [draft.id, ...state.ids];
      } else {
        state.ids = [draft.id, ...state.ids.filter((id) => id !== draft.id)];
      }

      state.entities[draft.id] = draft;
      state.activeDraftId = draft.id;
      state.status = "saving";
    },
    removeDraft(state, action: PayloadAction<string>) {
      const id = action.payload;
      delete state.entities[id];
      state.ids = state.ids.filter((draftId) => draftId !== id);
      state.activeDraftId = state.activeDraftId === id ? null : state.activeDraftId;
      state.status = "deleted";
    },
    finishDraftOperation(state) {
      state.status = "idle";
      state.error = null;
    },
    failDraftOperation(state, action: PayloadAction<string>) {
      state.status = "idle";
      state.error = action.payload;
    },
  },
});

export const { hydrateDrafts, startLoading, setActiveDraft, upsertDraft, removeDraft, finishDraftOperation, failDraftOperation } = postsSlice.actions;

export function loadDraftsFromStorage() {
  return (dispatch: (arg: unknown) => void) => {
    dispatch(startLoading());
    try {
      const drafts = getSavedDrafts();
      dispatch(hydrateDrafts(drafts));
      dispatch(finishDraftOperation());
    } catch (error) {
      dispatch(failDraftOperation(error instanceof Error ? error.message : "Unable to load drafts"));
    }
  };
}

export function saveDraftToStorage(payload: DraftPayload, existingId?: string) {
  return (dispatch: (arg: unknown) => void) => {
    try {
      const nextDrafts = addOrUpdateDraftToLocalStorage(payload, existingId);
      const savedDraft = nextDrafts.find((draft) => draft.id === existingId) ?? nextDrafts[0];
      if (!savedDraft) {
        throw new Error("Unable to save draft");
      }
      dispatch(upsertDraft(savedDraft));
      dispatch(finishDraftOperation());
    } catch (error) {
      dispatch(failDraftOperation(error instanceof Error ? error.message : "Unable to save draft"));
    }
  };
}

export function deleteDraftFromStorage(id: string) {
  return (dispatch: (arg: unknown) => void) => {
    try {
      const nextDrafts = deleteDraftFromLocalStorage(id);
      dispatch(hydrateDrafts(nextDrafts));
      dispatch(setActiveDraft(null));
      dispatch(finishDraftOperation());
    } catch (error) {
      dispatch(failDraftOperation(error instanceof Error ? error.message : "Unable to delete draft"));
    }
  };
}

export default postsSlice.reducer;
