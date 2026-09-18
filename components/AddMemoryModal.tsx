"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  RotateCcw,
  X,
  Loader2,
} from "lucide-react";

type AddMemoryModalProps = {
  onSuccess?: () => void;
};

type CameraMode = "camera" | "preview" | "note";

function getTodayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function AddMemoryModal({
  onSuccess,
}: AddMemoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [cameraMode, setCameraMode] =
    useState<CameraMode>("camera");

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [memoryDate, setMemoryDate] =
    useState(getTodayJakarta());

  const [isSaving, setIsSaving] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ==========================================
  // START CAMERA
  // ==========================================

  async function startCamera() {
    setCameraError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Your browser does not support camera access."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);

      setCameraError(
        "Camera access was denied or is unavailable."
      );
    }
  }

  // ==========================================
  // STOP CAMERA
  // ==========================================

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // ==========================================
  // OPEN MODAL
  // ==========================================

  async function openModal() {
    setIsOpen(true);
    setCameraMode("camera");
    setPhotoBlob(null);
    setPreviewUrl(null);
    setNote("");
    setMemoryDate(getTodayJakarta());

    await startCamera();
  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  function closeModal() {
    if (isSaving) return;

    stopCamera();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setIsOpen(false);
    setCameraMode("camera");
    setPhotoBlob(null);
    setPreviewUrl(null);
    setNote("");
    setMemoryDate(getTodayJakarta());
    setCameraError("");
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ==========================================
  // TAKE PHOTO
  // ==========================================

  function takePhoto() {
    const video = videoRef.current;

    if (!video) return;

    if (!video.videoWidth || !video.videoHeight) {
      alert("Camera is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      alert("Unable to capture photo.");
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert("Unable to capture photo.");
          return;
        }

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        const url = URL.createObjectURL(blob);

        setPhotoBlob(blob);
        setPreviewUrl(url);

        stopCamera();

        setCameraMode("preview");
      },
      "image/jpeg",
      0.9
    );
  }

  // ==========================================
  // RETAKE
  // ==========================================

  async function retakePhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPhotoBlob(null);
    setPreviewUrl(null);
    setCameraMode("camera");

    await startCamera();
  }

  // ==========================================
  // USE PHOTO
  // ==========================================

  function usePhoto() {
    if (!photoBlob) return;

    setCameraMode("note");
  }

  // ==========================================
  // SAVE MEMORY
  // ==========================================

  async function handleSave() {
    if (!photoBlob) {
      alert("Please take a photo first.");
      return;
    }

    if (!memoryDate) {
      alert("Please select a date.");
      return;
    }

    try {
      setIsSaving(true);

      const file = new File(
        [photoBlob],
        `memory-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        }
      );

      const formData = new FormData();

      formData.append("image", file);
      formData.append("note", note);
      formData.append("memory_date", memoryDate);

      const response = await fetch("/api/memories", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save memory."
        );
      }

      stopCamera();

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setIsOpen(false);
      setCameraMode("camera");
      setPhotoBlob(null);
      setPreviewUrl(null);
      setNote("");
      setMemoryDate(getTodayJakarta());

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save memory."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* ADD MEMORY BUTTON */}

      <button
        type="button"
        onClick={openModal}
        className="soft-button inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-indigo-500 transition hover:text-indigo-600"
      >
        <Camera className="h-4 w-4" />
        Add Memory
      </button>

      {/* MODAL */}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="soft-card w-full max-w-lg overflow-hidden rounded-3xl">
            {/* HEADER */}

            <div className="flex items-center justify-between px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-slate-700">
                  {cameraMode === "camera" &&
                    "Take a Memory"}

                  {cameraMode === "preview" &&
                    "Looks good?"}

                  {cameraMode === "note" &&
                    "Save this moment"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {cameraMode === "camera" &&
                    "Capture this little moment."}

                  {cameraMode === "preview" &&
                    "You can retake it or keep this photo."}

                  {cameraMode === "note" &&
                    "Add a little note to remember it."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="soft-button flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CAMERA */}

            {cameraMode === "camera" && (
              <div>
                <div className="relative mx-4 overflow-hidden rounded-2xl bg-slate-900 sm:mx-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-[3/4] w-full object-cover"
                  />

                  {/* CAMERA OVERLAY */}

                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-5 rounded-2xl border border-white/20" />

                    <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                  </div>

                  {/* CAMERA ERROR */}

                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 px-8 text-center">
                      <div>
                        <Camera className="mx-auto h-8 w-8 text-white/60" />

                        <p className="mt-3 text-sm font-medium text-white">
                          {cameraError}
                        </p>

                        <button
                          type="button"
                          onClick={startCamera}
                          className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SHUTTER */}

                <div className="flex justify-center px-6 py-6">
                  <button
                    type="button"
                    onClick={takePhoto}
                    disabled={Boolean(cameraError)}
                    aria-label="Take photo"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[5px_5px_12px_rgba(148,163,184,0.3),-5px_-5px_12px_rgba(255,255,255,0.9)] transition active:scale-95 disabled:opacity-50"
                  >
                    <span className="h-12 w-12 rounded-full bg-indigo-400 shadow-inner" />
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW */}

            {cameraMode === "preview" && previewUrl && (
              <div>
                <div className="mx-4 overflow-hidden rounded-2xl sm:mx-6">
                  <img
                    src={previewUrl}
                    alt="Memory preview"
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>

                <div className="flex gap-3 px-5 py-6 sm:px-6">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="soft-button flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-slate-500"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </button>

                  <button
                    type="button"
                    onClick={usePhoto}
                    className="soft-button flex-1 rounded-xl py-3 text-sm font-semibold text-indigo-500"
                  >
                    Use Photo
                  </button>
                </div>
              </div>
            )}

            {/* NOTE */}

            {cameraMode === "note" && previewUrl && (
              <div className="px-5 pb-6 sm:px-6">
                {/* SMALL PHOTO PREVIEW */}

                <div className="mb-5 overflow-hidden rounded-2xl">
                  <img
                    src={previewUrl}
                    alt="Memory"
                    className="aspect-[16/8] w-full object-cover"
                  />
                </div>

                {/* DATE */}

                <div>
                  <label className="text-xs font-bold tracking-wider text-slate-400">
                    DATE
                  </label>

                  <div className="soft-card-inset mt-2 rounded-xl px-4">
                    <input
                      type="date"
                      value={memoryDate}
                      onChange={(event) =>
                        setMemoryDate(event.target.value)
                      }
                      className="w-full bg-transparent py-3 text-sm font-semibold text-slate-600 outline-none"
                    />
                  </div>
                </div>

                {/* NOTE */}

                <div className="mt-5">
                  <label className="text-xs font-bold tracking-wider text-slate-400">
                    NOTE
                  </label>

                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                    rows={4}
                    placeholder="What happened in this moment?"
                    className="soft-card-inset mt-2 w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm leading-6 text-slate-600 outline-none placeholder:text-slate-300"
                  />
                </div>

                {/* ACTIONS */}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    disabled={isSaving}
                    className="soft-button rounded-xl px-4 py-3 text-sm font-semibold text-slate-500"
                  >
                    Retake
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="soft-button flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-indigo-500 disabled:opacity-50"
                  >
                    {isSaving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {isSaving
                      ? "Saving..."
                      : "Save Memory"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}