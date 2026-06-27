// getbible.net v2 API for Korean Bible text
const API_BASE = 'https://api.getbible.net/v2';

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
}

export interface ChapterContent {
  book: string;
  chapter: number;
  verses: Verse[];
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
    const verses: Verse[] = Object.entries(data.verses || {}).map(([num, v]) => ({
      verse: parseInt(num),
      text: (v as { verse: string }).verse || '',
    }));

    return { book, chapter, verses };
  } catch {
    return null;
  }
}
