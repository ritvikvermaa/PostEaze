import {
  AlertTriangle,
  Briefcase,
  FileText,
  Moon,
  Paperclip,
  PlusCircle,
  Radio,
  Save,
  Send,
  Sun,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { PLATFORM_CONFIG, THEME_STORAGE_KEY, WARNING_THRESHOLD } from "./configuration";
import { DraftPayload, DraftRecord, PlatformId, UploadedImage } from "./types";
import { addOrUpdateDraftToLocalStorage, deleteDraftFromLocalStorage, getSavedDrafts } from "./utils/storage";
import { getSafeLimits, normalizeHashtags, validatePost } from "./utils/validation";

const PLATFORM_OPTIONS = Object.keys(PLATFORM_CONFIG) as PlatformId[];
const METER_SEGMENTS = 28;

type Theme = "light" | "dark";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function App() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [isBooting, setIsBooting] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["x"]);
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done">("idle");
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftTitle, setDraftTitle] = useState("New draft");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftActionStatus, setDraftActionStatus] = useState<"idle" | "saving" | "loading" | "deleted">("idle");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  const hashtags = useMemo(() => normalizeHashtags(hashtagInput), [hashtagInput]);
  const safeLimits = useMemo(() => getSafeLimits(selectedPlatforms), [selectedPlatforms]);
  const validations = useMemo(
    () => validatePost(caption, images, selectedPlatforms),
    [caption, images, selectedPlatforms],
  );
  const hasHashtagSupport = selectedPlatforms.some((platformId) => PLATFORM_CONFIG[platformId].supportsHashtags);
  const isValid = selectedPlatforms.length > 0 && validations.every((validation) => validation.isValid);
  const errorMessages = useMemo(() => {
    const messages = validations.flatMap((validation) => validation.messages);

    if (selectedPlatforms.length === 0) {
      messages.unshift("Select at least one channel.");
    }

    return Array.from(new Set(messages));
  }, [selectedPlatforms.length, validations]);

  const usageRatio = safeLimits && safeLimits.maxCharacters > 0 ? caption.length / safeLimits.maxCharacters : 0;
  const meterState: "safe" | "warning" | "over" =
    usageRatio > 1 ? "over" : usageRatio >= WARNING_THRESHOLD ? "warning" : "safe";
  const litSegments = safeLimits ? Math.min(METER_SEGMENTS, Math.round(usageRatio * METER_SEGMENTS)) : 0;
  const meterLitClass = meterState === "safe" ? "lit-teal" : meterState === "warning" ? "lit-amber" : "lit-red";

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadDrafts = async () => {
      setDraftsLoading(true);
      setDraftActionStatus("loading");
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      setDrafts(getSavedDrafts());
      setDraftsLoading(false);
      setDraftActionStatus("idle");
      setDraftMessage((currentMessage) => currentMessage ?? "Drafts synced locally.");
    };

    void loadDrafts();
  }, []);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  function togglePlatform(platformId: PlatformId) {
    setSelectedPlatforms((currentPlatforms) => {
      if (currentPlatforms.includes(platformId)) {
        return currentPlatforms.filter((id) => id !== platformId);
      }

      return [...currentPlatforms, platformId];
    });
  }

  function resetComposer() {
    setSelectedPlatforms(["x"]);
    setCaption("");
    setHashtagInput("");
    setImages([]);
    setDraftTitle("New draft");
    setActiveDraftId(null);
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const nextImages = files.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((currentImages) => [...currentImages, ...nextImages]);
    event.target.value = "";
  }

  function removeImage(imageId: string) {
    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  }

  async function saveCurrentDraft() {
    if (!caption.trim() && images.length === 0) {
      setDraftMessage("Add a caption or an image before saving a draft.");
      return;
    }

    setDraftActionStatus("saving");
    setDraftMessage("Saving draft...");

    await new Promise((resolve) => window.setTimeout(resolve, 420));

    const payload: DraftPayload = {
      title: draftTitle.trim() || "Untitled draft",
      selectedPlatforms,
      caption,
      hashtags,
      images: images.map(({ name, size, type }) => ({ name, size, type })),
      savedAt: new Date().toISOString(),
    };

    const nextDrafts = addOrUpdateDraftToLocalStorage(payload, activeDraftId ?? undefined);
    const savedDraft = nextDrafts.find((draft) => draft.id === activeDraftId) ?? nextDrafts[0];

    setDrafts(nextDrafts);
    setActiveDraftId(savedDraft?.id ?? null);
    setDraftActionStatus("idle");
    setDraftMessage(activeDraftId ? "Draft updated locally." : "Draft saved locally.");
  }

  function loadDraft(draft: DraftRecord) {
    setActiveDraftId(draft.id);
    setDraftTitle(draft.title);
    setCaption(draft.caption);
    setHashtagInput(draft.hashtags.join(" "));
    setSelectedPlatforms(draft.selectedPlatforms);
    setImages([]);
    setDraftMessage(`Loaded "${draft.title}".`);
  }

  async function removeDraft(id: string) {
    setDraftActionStatus("deleted");
    setDraftMessage("Deleting draft...");

    await new Promise((resolve) => window.setTimeout(resolve, 220));

    const nextDrafts = deleteDraftFromLocalStorage(id);
    setDrafts(nextDrafts);

    if (activeDraftId === id) {
      resetComposer();
    }

    setDraftActionStatus("idle");
    setDraftMessage("Draft deleted.");
  }

  function submitPost() {
    if (!isValid || saveStatus === "saving") {
      return;
    }

    setSaveStatus("saving");
    setSaveProgress(0);

    const firstStage = window.setTimeout(() => setSaveProgress(42), 140);
    const secondStage = window.setTimeout(() => setSaveProgress(78), 420);
    const thirdStage = window.setTimeout(() => setSaveProgress(91), 1050);
    const finalStage = window.setTimeout(() => {
      const payload: DraftPayload = {
        title: draftTitle.trim() || "Sent post",
        selectedPlatforms,
        caption,
        hashtags,
        images: images.map(({ name, size, type }) => ({ name, size, type })),
        savedAt: new Date().toISOString(),
      };

      const nextDrafts = addOrUpdateDraftToLocalStorage(payload, activeDraftId ?? undefined);
      setDrafts(nextDrafts);
      setActiveDraftId(activeDraftId ?? nextDrafts[0]?.id ?? null);
      setSaveProgress(100);
      setSaveStatus("done");
    }, 1600);

    window.setTimeout(() => {
      setSaveStatus("idle");
      setSaveProgress(0);
      window.clearTimeout(firstStage);
      window.clearTimeout(secondStage);
      window.clearTimeout(thirdStage);
      window.clearTimeout(finalStage);
    }, 2550);
  }

  return (
    <div className="viewport" data-theme={theme}>
      {isBooting ? (
        <main className="loading-screen">
          <div className="loading-card">
            <div className="tuning-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <h2>PostEaze</h2>
            <p className="loading-sub">Powering the dispatch desk…</p>
          </div>
        </main>
      ) : (
        <>
          <header className="topbar">
            <div className="brand">
              <span className="brand-icon">
                <Radio aria-hidden="true" />
              </span>
              <span className="brand-name">PostEaze</span>
              <span className="brand-tag">Dispatch desk</span>
            </div>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              aria-pressed={theme === "dark"}
            >
              {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
            </button>
          </header>

          <div className="desk">
            <section className="panel composer-panel" aria-label="Compose post">
              <div>
                <p className="panel-title">Compose</p>
                <p></p>
                <p className="panel-sub">Write once, tune it for every channel you send to.</p>
              </div>

              <div className="channel-grid">
                {PLATFORM_OPTIONS.map((platformId) => {
                  const platform = PLATFORM_CONFIG[platformId];
                  const isSelected = selectedPlatforms.includes(platformId);
                  const validation = validations.find((item) => item.platformId === platformId);

                  return (
                    <button
                      className={`channel-strip ${isSelected ? "selected" : ""}`}
                      key={platformId}
                      type="button"
                      onClick={() => togglePlatform(platformId)}
                      aria-pressed={isSelected}
                    >
                      <span className="channel-row">
                        <span className="channel-led" aria-hidden="true" />
                        {platformId === "instagram" ? (
                          <span className="instagram-mark" aria-hidden="true" />
                        ) : platformId === "facebook" ? (
                          <Radio aria-hidden="true" />
                        ) : platformId === "linkedin" ? (
                          <Briefcase aria-hidden="true" />
                        ) : (
                          <XIcon aria-hidden="true" />
                        )}
                        <span className="channel-name">{platform.label}</span>
                      </span>
                      {isSelected && validation && (
                        <span className={`channel-readout ${validation.remainingCharacters < 0 ? "negative" : ""}`}>
                          {validation.remainingCharacters < 0
                            ? `${Math.abs(validation.remainingCharacters)} over limit`
                            : `${validation.remainingCharacters} chars left`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="caption">
                  Message
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Type the message you want to send…"
                />

                <div className="meter-row">
                  <div className="meter" aria-hidden="true">
                    {Array.from({ length: METER_SEGMENTS }).map((_, index) => (
                      <span key={index} className={index < litSegments ? meterLitClass : ""} />
                    ))}
                  </div>
                  <span className={`meter-count ${meterState === "warning" ? "warning" : ""} ${meterState === "over" ? "over" : ""}`}>
                    {caption.length}
                    {safeLimits ? ` / ${safeLimits.maxCharacters}` : ""}
                  </span>
                </div>

                {hasHashtagSupport && (
                  <input
                    id="hashtags"
                    value={hashtagInput}
                    onChange={(event) => setHashtagInput(event.target.value)}
                    placeholder="Add hashtags"
                    aria-label="Hashtags"
                  />
                )}

                {errorMessages.length > 0 && (
                  <div className="flag-list" role="alert">
                    {errorMessages.map((message) => (
                      <div className="flag" key={message}>
                        <AlertTriangle aria-hidden="true" />
                        <p>{message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="attachment-tray">
                <label className="attachment-trigger" htmlFor="imageUpload">
                  <Paperclip aria-hidden="true" />
                  Attach images
                </label>
                <input id="imageUpload" type="file" accept="image/*" multiple onChange={handleImageUpload} />
                <span className="attachment-meta">
                  {images.length} attached
                  {safeLimits ? ` • max ${safeLimits.maxImages}, ${safeLimits.maxImageSizeMB} MB each` : ""}
                </span>

                {images.length > 0 && (
                  <div className="attachment-grid">
                    {images.map((image) => (
                      <article className="attachment-slip" key={image.id}>
                        <img alt={image.name} src={image.previewUrl} />
                        <div>
                          <strong>{image.name}</strong>
                          <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button
                          type="button"
                          className="attachment-remove"
                          onClick={() => removeImage(image.id)}
                          aria-label={`Remove ${image.name}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="transmit-btn"
                type="button"
                onClick={submitPost}
                disabled={!isValid || saveStatus === "saving"}
              >
                <Send aria-hidden="true" />
                Send to channels
              </button>
            </section>

            <aside className="panel manifest-panel" aria-label="Drafts log">
              <div>
                <p className="panel-title">Drafts log</p>
                <p></p>
                <p className="panel-sub">Every saved draft lives here, newest first.</p>
              </div>

              <div className="log-toolbar">
                <input
                  className="log-title-input"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="Draft title"
                  aria-label="Draft title"
                />
                <div className="log-actions">
                  <button
                    className="btn primary"
                    type="button"
                    onClick={saveCurrentDraft}
                    disabled={draftActionStatus === "saving"}
                  >
                    <Save aria-hidden="true" />
                    {activeDraftId ? "Update draft" : "Save draft"}
                  </button>
                  <button className="btn" type="button" onClick={resetComposer}>
                    <PlusCircle aria-hidden="true" />
                    New draft
                  </button>
                </div>
              </div>

              <div className="log-status" aria-live="polite">
                {draftsLoading ? "Loading drafts..." : `${drafts.length} draft${drafts.length === 1 ? "" : "s"} saved`}
                {draftMessage ? ` • ${draftMessage}` : ""}
              </div>

              <div className="log-list">
                {drafts.length === 0 ? (
                  <div className="empty-log">
                    <FileText aria-hidden="true" />
                    <p>No drafts logged yet. Save one from the composer to see it here.</p>
                  </div>
                ) : (
                  drafts.map((draft) => (
                    <article className={`log-entry ${activeDraftId === draft.id ? "active" : ""}`} key={draft.id}>
                      <div className="log-entry-top">
                        <div>
                          <h3>{draft.title}</h3>
                          <p>
                            {draft.caption.slice(0, 80) || "No caption yet"}
                            {draft.caption.length > 80 ? "…" : ""}
                          </p>
                        </div>
                        <span className="log-timestamp">{new Date(draft.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="log-entry-actions">
                        <button className="btn" type="button" onClick={() => loadDraft(draft)}>
                          Edit
                        </button>
                        <button className="btn danger" type="button" onClick={() => removeDraft(draft.id)}>
                          <Trash2 aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </div>

          {saveStatus !== "idle" && (
            <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="saveTitle">
              <div className="transmit-modal">
                {saveStatus === "done" && (
                  <svg className="success-check" viewBox="0 0 64 64" aria-hidden="true">
                    <circle className="success-check-circle" cx="32" cy="32" r="27" />
                    <path className="success-check-mark" d="M20 33.5 28.2 42 45 24" />
                  </svg>
                )}
                <h2 id="saveTitle">{saveStatus === "done" ? "Sent" : "Sending…"}</h2>
                <p>
                  {saveStatus === "done"
                    ? "Your post is logged locally and linked to your drafts."
                    : "Packaging attachments and lining up each channel…"}
                </p>
                <div className="dial-track">
                  <div className="dial-fill" style={{ width: `${saveProgress}%` }} />
                </div>
                <span className="dial-value">{saveProgress}%</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
