import { useRef, useEffect } from "react";

export const useSpeechToText = (onSilence) => {
  const recognitionRef = useRef(null);
  const silenceTimeRef = useRef(null);
  const onSilenceRef = useRef(onSilence);
  const transcriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const manualStopRef = useRef(false); // NEW: tells onend whether to restart

  useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    stopListening();
    transcriptRef.current = "";
    interimTranscriptRef.current = "";
    manualStopRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalText += `${text} `;
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        transcriptRef.current = `${transcriptRef.current} ${finalText}`.trim();
      }
      interimTranscriptRef.current = interimText;
      if (finalText || interimText) {
        resetSilenceTimer();
      }
    };

    recognition.onerror = (error) => {
      console.error("Speech recognition error:", error.error);
      // 'no-speech' / 'aborted' will be followed by onend, which restarts us.
      // 'not-allowed' / 'audio-capture' are real failures — don't loop forever.
      if (error.error === "not-allowed" || error.error === "audio-capture") {
        manualStopRef.current = true;
      }
    };

    recognition.onend = () => {
      if (manualStopRef.current) return; // we stopped it on purpose, don't restart
      if (recognitionRef.current !== recognition) return; // superseded already
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to restart recognition:", e);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    resetSilenceTimer(); // arm it now, don't wait for the first result
  };

  const resetSilenceTimer = () => {
    clearTimeout(silenceTimeRef.current);
    silenceTimeRef.current = setTimeout(() => {
      const finalText = `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
      transcriptRef.current = "";
      interimTranscriptRef.current = "";
      silenceTimeRef.current = null;
      if (finalText) {
        onSilenceRef.current(finalText);
      }
    }, 3000);
  };

  const stopListening = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    clearTimeout(silenceTimeRef.current);
    silenceTimeRef.current = null;
    interimTranscriptRef.current = "";
  };

  return { stopListening, startListening, resetSilenceTimer };
};