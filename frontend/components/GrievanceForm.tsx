"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { MapPin, Image as ImageIcon, Send, X, Mic, MicOff, AlertCircle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";

const MapPickerModal = dynamic(() => import("./MapPickerModal"), { ssr: false });

interface GrievanceFormProps {
  onSubmitted?: (grievance: any) => void;
}

interface DuplicateMatch {
  is_duplicate: boolean;
  duplicate_id?: number;
  category?: string;
  status?: string;
  priority?: string;
  distance_meters?: number;
  created_at?: string;
  description_snippet?: string;
}

export default function GrievanceForm({ onSubmitted }: GrievanceFormProps) {
  const { t, language } = useLanguage();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [showMapModal, setShowMapModal] = useState(false);
  const [attachedLocation, setAttachedLocation] = useState<{ lat: number, lng: number, region: string, state: string, city: string } | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicate Prevention State
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateMatch | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Whisper AI Voice Typing State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [transcribingVoice, setTranscribingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Browser speech recognition fallback ref
  const recognitionRef = useRef<any>(null);

  // Check for duplicates when location is set
  const checkDuplicateGrievance = async (lat: number, lng: number, cat: string, desc: string) => {
    setCheckingDuplicate(true);
    try {
      const res = await api.post("/grievance/check-duplicate", {
        latitude: lat,
        longitude: lng,
        category: cat || null,
        description: desc || ""
      });
      if (res.data?.is_duplicate) {
        setDuplicateInfo(res.data);
      } else {
        setDuplicateInfo(null);
      }
    } catch {
      setDuplicateInfo(null);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  useEffect(() => {
    if (attachedLocation) {
      const timer = setTimeout(() => {
        checkDuplicateGrievance(attachedLocation.lat, attachedLocation.lng, category, description);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDuplicateInfo(null);
    }
  }, [attachedLocation, category]);

  // High-accuracy Whisper voice recording
  const toggleVoiceRecording = async () => {
    if (isRecordingVoice) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingVoice(false);
      return;
    }

    // Try modern MediaRecorder for server-side Whisper transcription
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (audioBlob.size < 500) return;

          setTranscribingVoice(true);
          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "voice_input.webm");
            const res = await api.post("/ai/transcribe-audio", formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data?.transcription) {
              setDescription((prev) =>
                prev ? `${prev.trim()} ${res.data.transcription.trim()}` : res.data.transcription.trim()
              );
            }
          } catch (err) {
            console.error("Whisper transcription error:", err);
          } finally {
            setTranscribingVoice(false);
          }
        };

        mediaRecorder.start();
        setIsRecordingVoice(true);
        return;
      } catch (err) {
        console.warn("Microphone access failed, falling back to browser speech recognition", err);
      }
    }

    // Fallback: Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Microphone recording is not available in your browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : 'mr-IN';

    recognition.onstart = () => setIsRecordingVoice(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setDescription((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => setIsRecordingVoice(false);
    recognition.onend = () => setIsRecordingVoice(false);
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMsg("");

    try {
      const payload: any = { description };

      if (category) {
        payload.category = category;
      }

      if (attachedLocation) {
        payload.latitude = attachedLocation.lat;
        payload.longitude = attachedLocation.lng;
        payload.region = attachedLocation.region;
        payload.state = attachedLocation.state;
        payload.city = attachedLocation.city;
      }

      if (attachedImage) {
        payload.image_url = attachedImage;
      }

      const res = await api.post("/grievance/submit", payload);
      setMessage("Grievance submitted successfully!");
      if (onSubmitted) onSubmitted(res.data);

      setDescription("");
      setAttachedLocation(null);
      setAttachedImage(null);
      setDuplicateInfo(null);
    } catch (err) {
      const error = err as AxiosError;
      console.error(error);
      setErrorMsg("Error submitting grievance. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
      <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("Report a Grievance")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("Please provide details about the issue you are facing.")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2">
        <div id="step-description">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("Description")} <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={transcribingVoice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isRecordingVoice
                  ? 'bg-red-500 border-red-600 text-white animate-pulse shadow-md'
                  : transcribingVoice
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300'
              }`}
            >
              {transcribingVoice ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Transcribing with Whisper...
                </>
              ) : isRecordingVoice ? (
                <>
                  <MicOff size={13} /> {t("Stop Listening")}
                </>
              ) : (
                <>
                  <Mic size={13} /> AI Voice Typing
                </>
              )}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Water supply broken in Nagpur since yesterday..."
            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-xl min-h-[120px] outline-none resize-none text-gray-800 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("Category")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
          >
            <option value="">{t("Auto-detect using AI")}</option>
            <option value="Infrastructure">{t("Infrastructure")}</option>
            <option value="Utilities">{t("Utilities")}</option>
            <option value="Sanitation">{t("Sanitation")}</option>
            <option value="Medical">{t("Medical")}</option>
            <option value="Other">{t("Other")}</option>
          </select>
        </div>

        <div id="step-location-evidence" className="flex flex-col gap-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{t("Location & Evidence")} <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-4">

            {/* Map Button */}
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <MapPin className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("Select Location")} <span className="text-red-500">*</span></span>
            </button>

            {/* Image Button */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setUploadingImage(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await api.post("/grievance/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                  });
                  setAttachedImage(res.data.image_url);
                } catch (err) {
                  console.error("Upload failed", err);
                } finally {
                  setUploadingImage(false);
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <ImageIcon className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadingImage ? t("Uploading...") : t("Add Image")}</span>
            </button>
          </div>

          {/* Attachments Preview */}
          {(attachedLocation || attachedImage) && (
            <div className="flex flex-col gap-2 mt-2">
              {attachedLocation && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm flex items-center gap-2"><MapPin size={16} /> {attachedLocation.region}</span>
                  <button type="button" onClick={() => setAttachedLocation(null)} className="text-blue-500 hover:text-red-500"><X size={16} /></button>
                </div>
              )}
              {attachedImage && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm flex items-center gap-2"><ImageIcon size={16} /> Image Attached</span>
                  <button type="button" onClick={() => setAttachedImage(null)} className="text-blue-500 hover:text-red-500"><X size={16} /></button>
                </div>
              )}
            </div>
          )}

          {/* Duplicate Prevention Card */}
          {duplicateInfo && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 text-sm flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  Existing Report Found Nearby (#{duplicateInfo.duplicate_id})
                </span>
                <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-1 leading-relaxed">
                  A complaint about <strong>{duplicateInfo.category}</strong> was reported approximately{" "}
                  <strong>{duplicateInfo.distance_meters} meters away</strong> and is currently{" "}
                  <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 font-semibold">{duplicateInfo.status}</span>.
                </p>
                {duplicateInfo.description_snippet && (
                  <p className="text-xs italic text-amber-600 dark:text-amber-400/80 mt-1">
                    "{duplicateInfo.description_snippet}"
                  </p>
                )}
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                  You can still submit this report if you are adding new details or evidence.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg"
            disabled={loading || !description.trim() || !attachedLocation}
          >
            <Send size={20} />
            {loading ? t("Submitting...") : !attachedLocation ? t("Please Select Location") : t("Submit Grievance")}
          </button>

          {message && <p className="mt-4 text-center text-sm font-medium text-green-600 bg-green-50 p-2 rounded-lg border border-green-200">{message}</p>}
          {errorMsg && <p className="mt-4 text-center text-sm font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{errorMsg}</p>}
        </div>
      </form>

      {showMapModal && (
        <MapPickerModal
          onClose={() => setShowMapModal(false)}
          onSelect={(loc) => {
            setAttachedLocation(loc);
            setShowMapModal(false);
            checkDuplicateGrievance(loc.lat, loc.lng, category, description);
          }}
        />
      )}
    </div>
  );
}
