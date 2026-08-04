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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  async function handleToggle() {
    if (expanded) {
      setExpanded(false);
      setSelected(new Set());
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

  function toggleVerse(verseNum: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
    setCopied(false);
  }

  function handleCopy() {
    if (!content || selected.size === 0) return;
    const picked = content.verses.filter(v => selected.has(v.verse));
    const nums = picked.map(v => v.verse).sort((a, b) => a - b);
    const first = nums[0];
    const last = nums[nums.length - 1];
    const range = first === last ? `${first}절` : `${first}~${last}절`;
    const header = `[${passage.label}:${range}]`;
    const body = picked.map(v => `${v.verse} ${v.text}`).join('\n');
    navigator.clipboard.writeText(`${header}\n${body}`).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setSelected(new Set()); }, 2000);
    });
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
          {content && selected.size === 0 && (
            <p className="text-xs text-gray-400 text-center mb-2">절을 탭해서 선택하세요</p>
          )}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {content && (
            <>
              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {content.verses.map((v) => {
                  const isSelected = selected.has(v.verse);
                  const heading = content.headings[v.verse];
                  return (
                    <div key={v.verse}>
                    {heading && (
                      <p className="text-xs font-bold text-gray-500 mt-3 mb-1 px-2 first:mt-0">
                        {heading}
                      </p>
                    )}
                    <p
                      onClick={() => toggleVerse(v.verse)}
                      className={`text-sm leading-relaxed rounded-lg px-2 py-1 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-100 text-gray-800'
                          : 'text-gray-700 active:bg-gray-50'
                      }`}
                    >
                      <span className={`text-xs font-bold mr-1.5 ${isSelected ? 'text-amber-600' : 'text-amber-400'}`}>
                        {v.verse}
                      </span>
                      {v.wj ? (
                        <>
                          {v.text.slice(0, v.wj[0])}
                          <span className="text-orange-600 font-medium">
                            {v.text.slice(v.wj[0], v.wj[1])}
                          </span>
                          {v.text.slice(v.wj[1])}
                        </>
                      ) : (
                        v.text
                      )}
                    </p>
                    </div>
                  );
                })}
              </div>

              {selected.size > 0 && (
                <button
                  onClick={handleCopy}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold active:bg-amber-100 transition-colors"
                >
                  {copied ? '✓ 복사됨' : `📋 ${selected.size}절 복사`}
                </button>
              )}
            </>
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
