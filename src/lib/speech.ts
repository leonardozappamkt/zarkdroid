/** Text-to-speech with the voices already installed on the device (Web Speech API): free, no server, no key. */

const AUTO_KEY = 'zarkdroid_autospeak';

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Best installed voice for a language: exact match (en-US) first, then any voice of that language (en-*). */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();
  const exact = voices.filter((v) => norm(v) === lang.toLowerCase());
  const sameLanguage = voices.filter((v) => norm(v).startsWith(lang.slice(0, 2).toLowerCase()));
  const pool = exact.length ? exact : sameLanguage;
  return pool.find((v) => v.localService) ?? pool[0];
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** Reads `text` aloud, replacing anything already being spoken. */
export function speak(text: string, lang = 'en-US') {
  const clean = text.trim();
  if (!canSpeak() || !clean) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang;
  utterance.rate = 0.9;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function getAutoSpeak(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAutoSpeak(on: boolean) {
  try {
    localStorage.setItem(AUTO_KEY, on ? '1' : '0');
  } catch {
    /* storage blocked: the choice just won't be remembered */
  }
}
