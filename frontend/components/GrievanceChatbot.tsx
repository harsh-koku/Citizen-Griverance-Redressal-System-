"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, MapPin, Image as ImageIcon, X, Mic, MicOff } from "lucide-react"; // Make sure to install lucide-react if not present
import NextImage from "next/image";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";

// Dynamically import MapPickerModal to avoid SSR issues with Leaflet
const MapPickerModal = dynamic(() => import("./MapPickerModal"), { ssr: false });

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
}

export default function GrievanceChatbot({
  onSubmitted,
}: {
  onSubmitted: (g: any) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { t, language } = useLanguage();
  
  const [chat, setChat] = useState<ChatMessage[]>([
    { sender: "bot", text: t("Hello! I am your AI Grievance Assistant.") },
    { sender: "bot", text: t("Please describe the issue you are facing (e.g., 'Water supply broken in Kanpur').") },
  ]);

  // Update initial messages when language changes
  useEffect(() => {
    if (chat.length <= 2) {
      setChat([
        { sender: "bot", text: t("Hello! I am your AI Grievance Assistant.") },
        { sender: "bot", text: t("Please describe the issue you are facing (e.g., 'Water supply broken in Kanpur').") },
      ]);
    }
  }, [language]);

  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"ask" | "confirm" | "done">("ask");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const [showMapModal, setShowMapModal] = useState(false);
  const [attachedLocation, setAttachedLocation] = useState<{lat: number, lng: number, region: string, state: string, city: string} | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [chat, loading]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(t("Speech recognition is not supported in your browser."));
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : 'mr-IN';

    let currentBaseDescription = description;
    if (currentBaseDescription && !currentBaseDescription.endsWith(' ')) {
      currentBaseDescription += ' ';
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentBaseDescription += event.results[i][0].transcript + ' ';
          setDescription(currentBaseDescription);
        } else {
          interimTranscript += event.results[i][0].transcript;
          setDescription(currentBaseDescription + interimTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        console.log("Speech recognition stopped:", event.error);
      } else {
        console.error("Speech recognition error", event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  const sendMessage = async () => {
    if (!description.trim()) return;

    // Add user's message
    setChat((prev) => [...prev, { sender: "user", text: description }]);
    const userText = description;
    setDescription("");

    // --- STEP 1: ANALYZE ---
    if (step === "ask") {
      setLoading(true);
      setTimeout(() => {
        setChat((prev) => [...prev, { sender: "bot", text: t("Analyzing your issue...") }]);
      }, 500);

      try {
        const res = await api.post("/ai/classify", { text: userText }); //
        const parsed = res.data;
        setAnalysis({ ...parsed, original: userText });

        setTimeout(() => {
            setChat((prev) => [
            ...prev,
            {
                sender: "bot",
                text: `${t("I've detected the following:")}\n\n📂 **${t("Category")}:** ${parsed.category ? t(parsed.category.toUpperCase()) : parsed.category}\n⚡ **${t("Priority")}:** ${parsed.priority ? t(parsed.priority) : parsed.priority}\n📍 **${t("Zone")}:** ${parsed.region}`,
            },
            {
                sender: "bot",
                text: t("Should I submit this grievance now? (Type **Yes** or **No**)"),
            },
            ]);
            setStep("confirm");
            setLoading(false);
        }, 1500);

      } catch (e) {
        console.error("Chatbot Error:", e);
        setChat((prev) => [
          ...prev,
          { sender: "bot", text: t("I couldn't analyze that. Could you try describing it differently?") },
        ]);
        setLoading(false);
      }
      return;
    }

    // --- STEP 2: CONFIRM ---
    if (step === "confirm") {
      const isYes = description.toLowerCase().startsWith("y") || description.toLowerCase().startsWith("h") || description.toLowerCase().startsWith("ह");
      if (isYes) {
        setChat((prev) => [...prev, { sender: "bot", text: t("Submitting your grievance...") }]);
        setLoading(true);

        try {
          const payload: any = {
            description: analysis.original,
          };
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

          onSubmitted(res.data);

          setAttachedLocation(null);
          setAttachedImage(null);

          setChat((prev) => [
            ...prev,
            { sender: "bot", text: t("✅ **Success!** Your grievance has been submitted.") },
            {
              sender: "bot",
              text: t("You can see it in the list on the right. Would you like to report another issue?"),
            },
          ]);
          setStep("ask");
        } catch (err) {
            console.error(err);
          setChat((prev) => [
            ...prev,
            { sender: "bot", text: t("❌ Something went wrong while submitting. Please try again.") },
          ]);
          setStep("ask");
        }
        setLoading(false);
      } else {
        setChat((prev) => [
          ...prev,
          { sender: "bot", text: t("Okay, submission cancelled. Please describe the issue again.") },
        ]);
        setStep("ask");
      }
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="bg-blue-600 p-4 flex items-center gap-3 shadow-md">
        <div className="bg-white/20 p-2 rounded-full">
            <Bot className="text-white w-6 h-6" />
        </div>
        <div>
            <h3 className="text-white font-semibold text-lg">{t("AI Assistant")}</h3>
            <p className="text-blue-100 text-xs">{t("Powered by IGRS Team")}</p>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scroll-smooth"
      >
        <AnimatePresence>
            {chat.map((msg, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
                {msg.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-cyan-500/40 shadow-sm bg-gray-900">
                        <NextImage src="/logo.png" alt="AI Bot" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                )}

                <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === "bot"
                    ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none"
                    : "bg-blue-600 text-white rounded-tr-none"
                }`}
                >
                <p dangerouslySetInnerHTML={{ 
                    __html: msg.text.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }} />
                </div>

                {msg.sender === "user" && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-white" />
                    </div>
                )}
            </motion.div>
            ))}
        </AnimatePresence>

        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex gap-3 items-center"
          >
             <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-cyan-500/40 shadow-sm bg-gray-900">
                <NextImage src="/logo.png" alt="AI Bot" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700 flex gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        
        {/* Attachments Preview */}
        {(attachedLocation || attachedImage) && (
            <div className="flex gap-2 mb-3">
                {attachedLocation && (
                    <div className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-200">
                        <MapPin size={12} /> {attachedLocation.region}
                        <button onClick={() => setAttachedLocation(null)} className="ml-1 text-blue-400 hover:text-red-500"><X size={12}/></button>
                    </div>
                )}
                {attachedImage && (
                    <div className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-200">
                        <ImageIcon size={12} /> {t("Image Attached")}
                        <button onClick={() => setAttachedImage(null)} className="ml-1 text-blue-400 hover:text-red-500"><X size={12}/></button>
                    </div>
                )}
            </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 items-center"
        >
          <button
            type="button"
            title={t("Voice Typing")}
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          
          <button
            type="button"
            title={t("Attach Location")}
            onClick={() => setShowMapModal(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <MapPin size={22} />
          </button>
          
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
            title={t("Attach Image")}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <ImageIcon size={22} />
          </button>

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400"
            placeholder={t("Type your message...")}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      {showMapModal && (
        <MapPickerModal 
          onClose={() => setShowMapModal(false)}
          onSelect={(loc) => {
             setAttachedLocation(loc);
             setShowMapModal(false);
          }}
        />
      )}
    </div>
  );
}