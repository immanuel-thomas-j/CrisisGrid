import { useState, useEffect, useCallback, useRef } from 'react';

export default function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const listen = useCallback((onResultCallback) => {
    if (!supported || !recognitionRef.current) return;

    recognitionRef.current.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      if (onResultCallback) {
        onResultCallback(text);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.warn('Speech recognition start error:', error);
    }
  }, [supported]);

  return {
    supported,
    isListening,
    transcript,
    listen,
  };
}
