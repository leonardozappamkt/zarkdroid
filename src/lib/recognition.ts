/** Speech-to-text through the browser (Web Speech API). Available in Chrome/Edge/Safari; not in most Android WebViews. */

type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }>>;
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function ctor(): (new () => RecognitionLike) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function canRecognize(): boolean {
  return !!ctor();
}

let active: RecognitionLike | null = null;

export function stopListening() {
  active?.abort();
  active = null;
}

/** Listens once and resolves with the alternative transcripts, best first. */
export function listenOnce(lang = 'en-US'): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const Recognition = ctor();
    if (!Recognition) return reject(new Error('unsupported'));
    stopListening();

    const rec = new Recognition();
    active = rec;
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 5;

    let heard: string[] = [];
    rec.onresult = (e) => {
      heard = Array.from(e.results[0] ?? []).map((alt) => alt.transcript);
    };
    rec.onerror = (e) => {
      active = null;
      reject(new Error(e.error));
    };
    rec.onend = () => {
      active = null;
      heard.length ? resolve(heard) : reject(new Error('no-speech'));
    };
    rec.start();
  });
}
