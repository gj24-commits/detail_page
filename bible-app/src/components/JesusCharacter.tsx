'use client';
import { useState, useEffect } from 'react';

const C = {
  skin:     '#F5C5A3',
  darkSkin: '#E8A880',
  hair:     '#5D3118',
  beard:    '#6B3A1A',
  robe:     '#FFF5E4',
  sash:     '#8B1A1A',
  cheek:    '#F08080',
  eye:      '#2C1510',
  sandal:   '#7A5030',
};

type Pose = 'wave' | 'pray' | 'cheer';

function JesusSVG({ pose }: { pose: Pose }) {
  return (
    <svg
      viewBox="0 0 64 96"
      style={{ overflow: 'visible' }}
      className="w-full h-full"
    >
      {/* side hair (behind face) */}
      <rect x="7"  y="18" width="8" height="34" rx="5" fill={C.hair} />
      <rect x="49" y="18" width="8" height="34" rx="5" fill={C.hair} />

      {/* top hair */}
      <ellipse cx="32" cy="13" rx="22" ry="16" fill={C.hair} />

      {/* face */}
      <circle cx="32" cy="20" r="16" fill={C.skin} />

      {/* eyes */}
      {pose === 'pray' ? (
        <>
          <rect x="22" y="17.5" width="6.5" height="2.5" rx="1.2" fill={C.eye} />
          <rect x="35.5" y="17.5" width="6.5" height="2.5" rx="1.2" fill={C.eye} />
        </>
      ) : pose === 'cheer' ? (
        <>
          <path d="M21 16.5 Q24.5 22 28 16.5"  stroke={C.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M36 16.5 Q39.5 22 43 16.5"  stroke={C.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="24" cy="18" r="3.5" fill={C.eye} />
          <circle cx="40" cy="18" r="3.5" fill={C.eye} />
          <circle cx="25.2" cy="16.8" r="1.2" fill="white" />
          <circle cx="41.2" cy="16.8" r="1.2" fill="white" />
        </>
      )}

      {/* cheeks */}
      <circle cx="18" cy="24" r="5" fill={C.cheek} opacity="0.4" />
      <circle cx="46" cy="24" r="5" fill={C.cheek} opacity="0.4" />

      {/* nose */}
      <circle cx="32" cy="24" r="2.2" fill={C.darkSkin} />

      {/* beard (drawn before mouth so mouth is on top) */}
      <ellipse cx="32" cy="37" rx="14" ry="9" fill={C.beard} />

      {/* mouth */}
      {pose === 'cheer' ? (
        <path d="M25 28 Q32 36 39 28" stroke={C.eye} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M26 27 Q32 31 38 27" stroke={C.eye} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}

      {/* robe body */}
      <rect x="10" y="42" width="44" height="52" rx="7" fill={C.robe} />

      {/* sash */}
      <polygon points="16,42 24,42 48,93 40,93" fill={C.sash} opacity="0.9" />

      {/* arms */}
      {pose === 'pray' ? (
        <>
          <polygon points="10,44 20,44 26,62 14,62" fill={C.robe} />
          <polygon points="44,44 54,44 50,62 38,62" fill={C.robe} />
        </>
      ) : pose === 'cheer' ? (
        <>
          <polygon points="7,44 16,44 8,20 1,22"    fill={C.robe} />
          <polygon points="48,44 57,44 63,22 56,20"  fill={C.robe} />
        </>
      ) : (
        /* wave: left arm down, right arm raised */
        <>
          <rect x="2" y="44" width="10" height="24" rx="5" fill={C.robe} />
          <polygon points="48,44 57,44 63,22 56,20" fill={C.robe} />
        </>
      )}

      {/* hands */}
      {pose === 'pray' ? (
        <ellipse cx="32" cy="64" rx="13" ry="6" fill={C.skin} />
      ) : pose === 'cheer' ? (
        <>
          <circle cx="4"  cy="19" r="5" fill={C.skin} />
          <circle cx="60" cy="19" r="5" fill={C.skin} />
        </>
      ) : (
        <>
          <circle cx="7"  cy="70" r="5" fill={C.skin} />
          <circle cx="60" cy="19" r="5" fill={C.skin} />
        </>
      )}

      {/* sandals */}
      <ellipse cx="22" cy="93" rx="10" ry="4" fill={C.sandal} />
      <ellipse cx="42" cy="93" rx="10" ry="4" fill={C.sandal} />

      {/* effects */}
      {pose === 'cheer' && (
        <>
          <text x="-4" y="14" fontSize="12" fontFamily="serif">✨</text>
          <text x="48" y="14" fontSize="12" fontFamily="serif">✨</text>
          <text x="50" y="52" fontSize="10" fontFamily="serif">⭐</text>
        </>
      )}
      {pose === 'wave' && (
        <>
          <line x1="61" y1="9"  x2="66" y2="5"  stroke="#F59E0B" strokeWidth="2"   strokeLinecap="round" />
          <line x1="64" y1="17" x2="68" y2="14" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

const SCENES: { pose: Pose; text: string }[] = [
  { pose: 'wave',  text: '안녕하세요! 오늘도 말씀으로 시작해요 ☀️' },
  { pose: 'pray',  text: '주님의 말씀이 오늘 하루를 인도하실 거예요 🙏' },
  { pose: 'cheer', text: '오늘 말씀 읽기 화이팅! 할 수 있어요 ✨' },
];

export default function JesusCharacter() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % SCENES.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const { pose, text } = SCENES[idx];

  const animClass =
    pose === 'cheer' ? 'jesus-bounce' :
    pose === 'pray'  ? 'jesus-sway'   :
    'jesus-float';

  return (
    <div className="flex flex-col items-center gap-2 py-5 select-none">
      {/* character */}
      <div
        className={`w-24 h-32 ${animClass}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        <JesusSVG pose={pose} />
      </div>

      {/* speech bubble */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.35s ease 0.1s, transform 0.35s ease 0.1s',
          position: 'relative',
        }}
        className="bg-white border border-amber-200 rounded-2xl px-4 py-2.5 shadow-sm max-w-[230px] text-center"
      >
        {/* tail pointing up toward the character */}
        <div style={{
          position: 'absolute', top: -9, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '9px solid #FDE68A',
        }} />
        <div style={{
          position: 'absolute', top: -7, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '7px solid white',
        }} />
        <p className="text-xs text-amber-800 font-medium leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
