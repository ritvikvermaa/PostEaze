import { ImagePlus, Trash2, X as XIcon } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { PLATFORM_CONFIG } from "./configuration";
import { PlatformId, UploadedImage } from "./types";
import { getSafeLimits, normalizeHashtags, validatePost } from "./utils/validation";
import { saveDraftToLocalStorage } from "./utils/storage";

const PLATFORM_OPTIONS = Object.keys(PLATFORM_CONFIG) as PlatformId[];

export function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["x"]);
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done">("idle");

  const hashtags = useMemo(() => normalizeHashtags(hashtagInput), [hashtagInput]);
  const safeLimits = useMemo(() => getSafeLimits(selectedPlatforms), [selectedPlatforms]);
  const validations = useMemo(
    () => validatePost(caption, images, selectedPlatforms),
    [caption, images, selectedPlatforms],
  );
  const hasInstagram = selectedPlatforms.includes("instagram");
  const isValid = selectedPlatforms.length > 0 && validations.every((validation) => validation.isValid);
  const errorMessages = useMemo(() => {
    const messages = validations.flatMap((validation) => validation.messages);

    if (selectedPlatforms.length === 0) {
      messages.unshift("Select at least one platform.");
    }

    return Array.from(new Set(messages));
  }, [selectedPlatforms.length, validations]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  function togglePlatform(platformId: PlatformId) {
    setSelectedPlatforms((currentPlatforms) => {
      if (currentPlatforms.includes(platformId)) {
        return currentPlatforms.filter((id) => id !== platformId);
      }

      return [...currentPlatforms, platformId];
    });
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
      saveDraftToLocalStorage({
        selectedPlatforms,
        caption,
        hashtags,
        images: images.map(({ name, size, type }) => ({ name, size, type })),
        savedAt: new Date().toISOString(),
      });
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

  if (isBooting) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <h2>PostEaze</h2>
          <p>Welcome User</p>
          <div className="loading-progress" aria-label="Loading composer">
            <div className="loading-progress-fill" />
          </div>
          <span>Preparing Post Composer</span>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="composer-card" aria-label="Post composer">
        <header className="composer-header">
          <p>PostEaze</p>
        </header>

        <div className="platform-select">
          {PLATFORM_OPTIONS.map((platformId) => {
            const platform = PLATFORM_CONFIG[platformId];
            const isSelected = selectedPlatforms.includes(platformId);

            return (
              <button
                className={`platform-button ${platformId} ${isSelected ? "selected" : ""}`}
                key={platformId}
                type="button"
                onClick={() => togglePlatform(platformId)}
                aria-pressed={isSelected}
              >
                {platformId === "instagram" ? <span className="instagram-logo" aria-hidden="true" /> : <XIcon aria-hidden="true" />}
                <span>{platform.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-card">
          <textarea
            id="caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write your post..."
          />

          <div className="caption-meta">
            <span>
              {caption.length}
              {safeLimits ? ` / ${safeLimits.maxCharacters}` : ""} characters
            </span>
          </div>

          {hasInstagram && (
            <input
              id="hashtags"
              value={hashtagInput}
              onChange={(event) => setHashtagInput(event.target.value)}
              placeholder="Instagram hashtags"
            />
          )}

          {errorMessages.length > 0 && (
            <div className="error-list" role="alert">
              {errorMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}
        </div>

        <div className="upload-card">
          <label className="upload-button" htmlFor="imageUpload">
            <ImagePlus aria-hidden="true" />
            Upload images
          </label>
          <input id="imageUpload" type="file" accept="image/*" multiple onChange={handleImageUpload} />
          <span>
            {images.length} selected
            {safeLimits ? ` • max ${safeLimits.maxImages}, ${safeLimits.maxImageSizeMB} MB each` : ""}
          </span>

          {images.length > 0 && (
            <div className="image-grid">
              {images.map((image) => (
                <article className="image-tile" key={image.id}>
                  <img alt={image.name} src={image.previewUrl} />
                  <div>
                    <strong>{image.name}</strong>
                    <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button type="button" onClick={() => removeImage(image.id)} aria-label={`Remove ${image.name}`}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <button className="submit-button" type="button" onClick={submitPost} disabled={!isValid || saveStatus === "saving"}>
          Submit
        </button>
      </section>

      {saveStatus !== "idle" && (
        <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="saveTitle">
          <div className="save-modal">
            {saveStatus === "done" && (
              <svg className="success-check" viewBox="0 0 64 64" aria-hidden="true">
                <circle className="success-check-circle" cx="32" cy="32" r="27" />
                <path className="success-check-mark" d="M20 33.5 28.2 42 45 24" />
              </svg>
            )}
            <h2 id="saveTitle">{saveStatus === "done" ? "Submitted" : "Saving uploads"}</h2>
            <p>{saveStatus === "done" ? "Your post is stored locally for phase one." : "Saving image details and preparing the local draft..."}</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${saveProgress}%` }} />
            </div>
            <strong>{saveProgress}%</strong>
          </div>
        </div>
      )}
    </main>
  );
}
