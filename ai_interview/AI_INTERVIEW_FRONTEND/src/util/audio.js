export const playAudio = (text, onEnd) => {
  if (!window || !window.speechSynthesis) {
    console.error("Speech synthesis not supported in this browser.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.language = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onend = () => {
    onEnd?.();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

export default playAudio;