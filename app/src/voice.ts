// Mark & Bit đọc to bằng giọng tiếng Việt có sẵn trên điện thoại (expo-speech).
// Hai nhân vật dùng cùng một giọng máy, phân biệt bằng cao độ và tốc độ.
import * as Speech from 'expo-speech';
import type { Line } from './api';

const VOICES = {
  Mark: { pitch: 0.9, rate: 0.85 },
  Bit: { pitch: 1.35, rate: 0.95 },
} as const;

let session = 0;

export function speakLines(lines: Line[], onLineStart?: (index: number) => void) {
  Speech.stop();
  const mySession = ++session;
  const next = (i: number) => {
    if (i >= lines.length || mySession !== session) {
      onLineStart?.(-1);
      return;
    }
    onLineStart?.(i);
    Speech.speak(lines[i].text, {
      language: 'vi-VN',
      ...VOICES[lines[i].speaker],
      onDone: () => next(i + 1),
      onError: () => next(i + 1),
    });
  };
  next(0);
}

export function stopSpeaking() {
  session++;
  Speech.stop();
}
