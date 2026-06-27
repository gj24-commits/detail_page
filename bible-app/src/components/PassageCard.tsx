'use client';

import { useState } from 'react';
import { Passage } from '@/lib/mccheyne';
import { ChapterContent, fetchChapter } from '@/lib/bibleApi';

interface PassageCardProps {
  passage: Passage;
  columnLabel: string;
  colorClass: string;
}

export default function PassageCard({ passage, columnLabel, colorClass }: PassageCardProps) {
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (!content) {
      setLoading(true);
      const data = await fetchChapter(passage.book, passage.chapter);
      setContent(data);
      setLoading(false);
    }
    setExpanded(true);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
              {columnLabel}
            </span>
            <span className="text-base font-semibold text-gray-800">{passage.label}</span>
          </div>
          <span className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1 ml-[4.5rem]">{passage.en_name} {passage.chapter}</p>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="h-px bg-gray-100 mb-3" />
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {content && (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {content.verses.map((v) => (
                <p key={v.verse} className="text-sm leading-relaxed text-gray-700">
                  <span className="text-xs text-amber-500 font-bold mr-1.5">{v.verse}</span>
                  {v.text}
                </p>
              ))}
            </div>
          )}
          {!loading && !content && (
            <p className="text-sm text-gray-400 text-center py-4">
              본문을 불러올 수 없습니다.<br />
              <span className="text-xs">인터넷 연결을 확인해 주세요.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
