// getbible.net v2 API for Korean Bible text
import jesusWordsData from '@/data/jesusWords.json';
import headingsData from '@/data/headings.json';

const API_BASE = 'https://api.getbible.net/v2';

// "Mar:16" -> [[startVerse, 소제목], ...]. Pericope boundaries come from the
// public-domain Berean Standard Bible; the Korean titles are written for this app.
const headings = headingsData as unknown as Record<string, [number, string][]>;

// "Mat:5" -> verse numbers that contain words spoken by Jesus.
// Derived from the World English Bible's \wj (words of Jesus) markers.
const jesusWords = jesusWordsData as Record<string, number[]>;

// 개역한글 opens quoted speech with one of these verbs; what follows is the
// speaker's own words. Longest first so "대답하시되" wins over "하시되".
const SPEECH_INTRO = [
  '가르쳐 가라사대', '대답하시되', '말씀하시되', '이르시기를',
  '가라사대', '가로사대', '이르시되', '하시되', '이르사',
];

// Narration that closes a quotation, e.g. "...복음을 전파하라 하시니라".
const SPEECH_TAIL = [
  '하시었더라', '하시는지라', '하셨더라', '하시더라', '하시니라',
  '하신대', '하시매', '하시며', '하시고', '하시니',
];

/**
 * Locate Jesus' spoken words inside a Korean verse, as a [start, end) slice.
 * A verse that opens with a speech verb starts the quotation after it; a verse
 * that has none is a continuation, so the whole verse is spoken. Either way a
 * trailing narration clause is excluded.
 */
function jesusRange(text: string): [number, number] | null {
  let start = 0;
  let bestIdx = -1;
  for (const marker of SPEECH_INTRO) {
    const i = text.indexOf(marker);
    if (i === -1) continue;
    if (bestIdx === -1 || i < bestIdx) {
      bestIdx = i;
      start = i + marker.length;
    }
  }

  let end = text.length;
  for (const tail of SPEECH_TAIL) {
    if (text.endsWith(tail)) {
      end = text.length - tail.length;
      break;
    }
  }

  while (start < end && text[start] === ' ') start++;
  while (end > start && text[end - 1] === ' ') end--;

  return end > start ? [start, end] : null;
}

// Maps our book codes to getbible.net book numbers
const BOOK_NUMBER: Record<string, number> = {
  Gen: 1, Exo: 2, Lev: 3, Num: 4, Deu: 5, Jos: 6, Jdg: 7, Rut: 8,
  '1Sa': 9, '2Sa': 10, '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14,
  Ezr: 15, Neh: 16, Est: 17, Job: 18, Psa: 19, Pro: 20, Ecc: 21,
  Sol: 22, Isa: 23, Jer: 24, Lam: 25, Eze: 26, Dan: 27, Hos: 28,
  Joe: 29, Amo: 30, Oba: 31, Jon: 32, Mic: 33, Nah: 34, Hab: 35,
  Zep: 36, Hag: 37, Zec: 38, Mal: 39, Mat: 40, Mar: 41, Luk: 42,
  Joh: 43, Act: 44, Rom: 45, '1Co': 46, '2Co': 47, Gal: 48, Eph: 49,
  Php: 50, Col: 51, '1Th': 52, '2Th': 53, '1Ti': 54, '2Ti': 55,
  Tit: 56, Phm: 57, Heb: 58, Jas: 59, '1Pe': 60, '2Pe': 61,
  '1Jo': 62, '2Jo': 63, '3Jo': 64, Jud: 65, Rev: 66,
};

export interface Verse {
  verse: number;
  text: string;
  /** [start, end) slice of `text` spoken by Jesus, if any. */
  wj?: [number, number];
}

export interface ChapterContent {
  book: string;
  chapter: number;
  verses: Verse[];
  /** Verse number -> 소제목 shown above that verse. */
  headings: Record<number, string>;
}

export async function fetchChapter(book: string, chapter: number): Promise<ChapterContent | null> {
  try {
    const bookNum = BOOK_NUMBER[book];
    if (!bookNum) return null;

    // getbible.net v2 API: /version/book/chapter.json
    const url = `${API_BASE}/korean/${bookNum}/${chapter}.json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    const spoken = new Set(jesusWords[`${book}:${chapter}`] || []);
    const verses: Verse[] = (data.verses || []).map((v: { verse: number; text: string }) => {
      const text = (v.text || '').trim();
      const wj = spoken.has(v.verse) ? jesusRange(text) : null;
      return wj ? { verse: v.verse, text, wj } : { verse: v.verse, text };
    });

    const chapterHeadings: Record<number, string> = {};
    for (const [verse, title] of headings[`${book}:${chapter}`] || []) {
      chapterHeadings[verse] = title;
    }

    return { book, chapter, verses, headings: chapterHeadings };
  } catch {
    return null;
  }
}
