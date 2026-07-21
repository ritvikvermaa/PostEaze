import { LOCAL_STORAGE_DRAFT_KEY } from "../configuration";
import { DraftPayload, DraftRecord } from "../types";

function readDrafts(): DraftRecord[] {
  const rawDrafts = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);

  if (!rawDrafts) {
    return [];
  }

  try {
    const parsedDrafts = JSON.parse(rawDrafts) as DraftRecord[];
    return Array.isArray(parsedDrafts) ? parsedDrafts : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts: DraftRecord[]): void {
  localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(drafts));
}

export function addOrUpdateDraftToLocalStorage(draft: DraftPayload, existingId?: string): DraftRecord[] {
  const currentDrafts = readDrafts();
  const timestamp = new Date().toISOString();

  if (existingId) {
    const updatedDrafts = currentDrafts.map((item) =>
      item.id === existingId
        ? {
            ...item,
            ...draft,
            id: item.id,
            updatedAt: timestamp,
          }
        : item,
    );

    writeDrafts(updatedDrafts);
    return updatedDrafts;
  }

  const nextDraft: DraftRecord = {
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...draft,
  };

  const nextDrafts = [nextDraft, ...currentDrafts];
  writeDrafts(nextDrafts);
  return nextDrafts;
}

export function getSavedDrafts(): DraftRecord[] {
  return readDrafts();
}

export function deleteDraftFromLocalStorage(id: string): DraftRecord[] {
  const nextDrafts = readDrafts().filter((draft) => draft.id !== id);
  writeDrafts(nextDrafts);
  return nextDrafts;
}
