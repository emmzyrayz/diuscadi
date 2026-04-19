"use client";
// modal/TicketScannerModal.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuCamera,
  LuCameraOff,
  LuKeyboard,
  LuShieldCheck,
  LuCircleCheck,
  LuTriangleAlert,
  LuLoader,
  LuInfo,
  LuUpload,
  LuSwitchCamera,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useTickets } from "@/context/TicketContext";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

type VerifyResult = "idle" | "valid" | "already_used" | "invalid" | "error";
type ScanMode = "manual" | "camera" | "upload";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RESULT_CONFIG = {
  valid: { bg: "bg-emerald-500", Icon: LuCircleCheck, label: "Access Granted" },
  already_used: { bg: "bg-amber-500", Icon: LuInfo, label: "Already Used" },
  invalid: {
    bg: "bg-foreground",
    Icon: LuTriangleAlert,
    label: "Invalid Code",
  },
  error: { bg: "bg-rose-600", Icon: LuTriangleAlert, label: "Error" },
} as const;

export const TicketScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { checkIn, checkInLoading } = useTickets();

  const [mode, setMode] = useState<ScanMode>("manual");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult>("idle");
  const [resultMsg, setResultMsg] = useState("");
  const [attendeeName, setAttendeeName] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  // ── Verify helper ─────────────────────────────────────────────────────────
  const verify = useCallback(
    async (inviteCode: string) => {
      if (!inviteCode.trim()) return;
      const res = await checkIn(inviteCode.trim().toUpperCase());
      if (res.success) {
        setResult("valid");
        setAttendeeName(res.attendee?.name ?? null);
        setResultMsg(
          res.checkedInAt
            ? `Checked in at ${new Date(res.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Entry confirmed",
        );
        onSuccess?.();
      } else {
        setAttendeeName(null);
        const msg = res.error ?? "";
        if (
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("checked")
        ) {
          setResult("already_used");
        } else if (
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("invalid")
        ) {
          setResult("invalid");
        } else {
          setResult("error");
        }
        setResultMsg(msg || "Verification failed");
      }
    },
    [checkIn, onSuccess],
  );

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraActive(false);

     // Guard: mediaDevices is undefined on HTTP (non-localhost)
  if (!navigator?.mediaDevices?.getUserMedia) {
    setCameraError(
      "Camera requires a secure connection (HTTPS). Try uploading a QR image instead.",
    );
    return;
  }

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader();
      }

      // ✅ Force permission prompt FIRST — without this, listVideoInputDevices()
      // returns empty on first visit even if a camera exists.
      // We immediately stop this stream; it's only needed to trigger the prompt.
      const permissionStream = await navigator.mediaDevices
        .getUserMedia({ video: true })
        .catch((err: Error) => {
          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            throw new Error("permission_denied");
          }
          throw err;
        });
      permissionStream.getTracks().forEach((t) => t.stop());

      // Now enumerate — labels will be populated after permission is granted
      const devices = await BrowserQRCodeReader.listVideoInputDevices();

      if (!devices.length) {
        setCameraError("No camera found on this device.");
        return;
      }

      const device =
        devices.find((d) =>
          ["back", "rear", "environment"].some((k) =>
            d.label.toLowerCase().includes(k),
          ),
        ) ?? devices[0];

      if (!videoRef.current) return;

      setCameraActive(true);

      const controls = await readerRef.current.decodeFromVideoDevice(
        device.deviceId,
        videoRef.current,
        (scanResult) => {
          if (scanResult) {
            const text = scanResult.getText();
            stopCamera();
            setCode(text);
            setMode("manual");
            verify(text);
          }
        },
      );
      controlsRef.current = controls;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (
        msg === "permission_denied" ||
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("notallowed")
      ) {
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings and try again.",
        );
      } else if (msg.toLowerCase().includes("no camera")) {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError(
          "Could not start camera. Try uploading a QR image instead.",
        );
      }
      setCameraActive(false);
    }
  }, [stopCamera, verify]);

  // Start/stop camera when mode changes
  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen, stopCamera]);

  // ── Image upload QR decode ────────────────────────────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      setUploadPreview(objectUrl);
      setDecoding(true);
      setResult("idle");
      setResultMsg("");

      try {
        const reader = new BrowserQRCodeReader();
        const imgEl = new Image();
        imgEl.src = objectUrl;
        await new Promise<void>((res, rej) => {
          imgEl.onload = () => res();
          imgEl.onerror = () => rej(new Error("Image failed to load"));
        });
        const scanResult = await reader.decodeFromImageElement(imgEl);
        const text = scanResult.getText();
        setCode(text);
        await verify(text);
      } catch {
        setResult("invalid");
        setResultMsg("No QR code found in this image. Try a clearer photo.");
      } finally {
        setDecoding(false);
        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [verify],
  );

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleClose = () => {
    stopCamera();
    setCode("");
    setResult("idle");
    setResultMsg("");
    setAttendeeName(null);
    setUploadPreview(null);
    setCameraError(null);
    setMode("manual");
    onClose();
  };

  const handleReset = () => {
    setCode("");
    setResult("idle");
    setResultMsg("");
    setAttendeeName(null);
    setUploadPreview(null);
    setCameraError(null);
  };

  if (!isOpen) return null;

  const resultCfg = result !== "idle" ? RESULT_CONFIG[result] : null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-foreground/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-background rounded-[3rem] shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground z-20 cursor-pointer"
        >
          <LuX className="w-6 h-6" />
        </button>

        <div className="p-10 flex flex-col items-center text-center">
          <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-4">
            Validate Entry
          </h3>

          {/* ── Mode tabs ─────────────────────────────────────────────────── */}
          <div className="flex gap-2 mb-6 bg-muted rounded-2xl p-1 w-full">
            {(["camera", "upload", "manual"] as ScanMode[]).map((m) => {
              const labels: Record<ScanMode, string> = {
                camera: "Camera",
                upload: "Upload QR",
                manual: "Manual",
              };
              const Icons: Record<ScanMode, React.ElementType> = {
                camera: LuCamera,
                upload: LuUpload,
                manual: LuKeyboard,
              };
              const Icon = Icons[m];
              return (
                <button
                  key={m}
                  onClick={() => {
                    handleReset();
                    setMode(m);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                    mode === m
                      ? "bg-background text-foreground shadow"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {labels[m]}
                </button>
              );
            })}
          </div>

          {/* ── Result banner ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {resultCfg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "w-full p-4 rounded-2xl mb-4 text-background flex items-center gap-3",
                  resultCfg.bg,
                )}
              >
                <resultCfg.Icon className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-widest">
                    {resultCfg.label}
                    {result === "valid" && attendeeName
                      ? ` — ${attendeeName}`
                      : ""}
                  </p>
                  <p className="text-[10px] font-bold opacity-80">
                    {resultMsg}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Camera mode ───────────────────────────────────────────────── */}
          {mode === "camera" && (
            <div className="w-full mb-4">
              <div className="w-full aspect-square bg-foreground rounded-[2.5rem] relative flex items-center justify-center overflow-hidden border-4 border-border">
                <video
                  ref={videoRef}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    cameraActive ? "opacity-100" : "opacity-0",
                  )}
                  muted
                  playsInline
                />
                {/* Scan frame overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-primary rounded-2xl relative">
                      <span className="absolute -top-px -left-px w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                      <span className="absolute -top-px -right-px w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                      <span className="absolute -bottom-px -left-px w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                      <span className="absolute -bottom-px -right-px w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
                      {/* Scanning line */}
                      <motion.div
                        className="absolute left-1 right-1 h-0.5 bg-primary/70 rounded"
                        animate={{ top: ["10%", "85%", "10%"] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </div>
                )}
                {!cameraActive && !cameraError && (
                  <LuLoader className="w-10 h-10 text-slate-600 animate-spin" />
                )}
                {cameraError && (
                  <div className="flex flex-col items-center gap-3 px-6">
                    <LuCameraOff className="w-10 h-10 text-rose-400" />
                    <p className="text-[11px] font-bold text-slate-400 text-center">
                      {cameraError}
                    </p>
                  </div>
                )}
              </div>
              {cameraActive && (
                <button
                  onClick={() => {
                    stopCamera();
                    startCamera();
                  }}
                  className="mt-3 flex items-center gap-1.5 mx-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <LuSwitchCamera className="w-3.5 h-3.5" /> Switch Camera
                </button>
              )}
              {cameraError && (
                <button
                  onClick={startCamera}
                  className="mt-3 mx-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <LuCamera className="w-3.5 h-3.5" /> Retry
                </button>
              )}
            </div>
          )}

          {/* ── Upload mode ───────────────────────────────────────────────── */}
          {mode === "upload" && (
            <div className="w-full mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={decoding}
                className="w-full aspect-square bg-muted border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {uploadPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadPreview}
                    alt="QR preview"
                    className="absolute inset-0 w-full h-full object-contain opacity-30"
                  />
                )}
                {decoding ? (
                  <>
                    <LuLoader className="w-10 h-10 text-primary animate-spin relative z-10" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground relative z-10">
                      Reading QR…
                    </p>
                  </>
                ) : (
                  <>
                    <LuUpload className="w-10 h-10 text-muted-foreground relative z-10" />
                    <div className="relative z-10">
                      <p className="text-[12px] font-black uppercase tracking-widest text-foreground">
                        {uploadPreview ? "Upload Another" : "Upload QR Image"}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-1">
                        Tap to choose a photo from your device
                      </p>
                    </div>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Manual mode ───────────────────────────────────────────────── */}
          {mode === "manual" && (
            <div className="w-full space-y-4 mb-4">
              <div className="relative group">
                <LuKeyboard className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter Invite or Ticket Code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setResult("idle");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && code) verify(code);
                  }}
                  className="w-full bg-muted border border-border rounded-2xl py-5 pl-14 pr-6 text-sm font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
                />
              </div>
              <button
                onClick={() => verify(code)}
                disabled={checkInLoading || !code.trim()}
                className="w-full py-5 bg-foreground text-background rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {checkInLoading ? (
                  <>
                    <LuLoader className="w-5 h-5 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    <LuShieldCheck className="w-5 h-5" /> Verify Credentials
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Scan another ─────────────────────────────────────────────── */}
          {result !== "idle" && (
            <button
              onClick={() => {
                handleReset();
                if (mode === "camera") startCamera();
              }}
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Scan Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
