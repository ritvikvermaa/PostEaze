import { LOCAL_STORAGE_DRAFT_KEY } from "../configuration";
import { DraftPayload } from "../types";

export function saveDraftToLocalStorage(draft: DraftPayload): void {
  localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
}

export function getSavedDraft(): DraftPayload | null {
  const rawDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);

  if (!rawDraft) {
    return null;
  }

  try {
    return JSON.parse(rawDraft) as DraftPayload;
  } catch {
    return null;
  }
}
