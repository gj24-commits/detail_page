'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

type Pose = 'wave' | 'pray' | 'cheer';

interface Scene {
  pose: Pose;
  frames: string[];   // image paths cycling within the pose
  text: string;
  anim: string;       // CSS animation class
}

const SCENES: Scene[] = [
  {
    pose: 'wave',
    frames: ['/jesus-wave.png', '/jesus-wave2.png', '/jesus-wave3.png', '/jesus-wave2.png'],
    text: '안녕하세요! 오늘도 말씀으로 시작해요 ☀️',
    anim: 'jesus-float',
  },
  {
    pose: 'pray',
    frames: ['/jesus-pray.png', '/jesus-pray2.png', '/jesus-pray3.png', '/jesus-pray2.png'],
    text: '주님의 말씀이 오늘 하루를 인도하실 거예요 🙏',
    anim: 'jesus-sway',
  },
  {
    pose: 'cheer',
    frames: ['/jesus-cheer.png', '/jesus-cheer2.png', '/jesus-cheer3.png', '/jesus-cheer2.png'],
    text: '오늘 말씀 읽기 화이팅! 할 수 있어요 ✨',
    anim: 'jesus-bounce',
  },
];

const FRAME_MS = 200; // ms per sprite frame
const SCENE_MS = 4000;

export default function JesusCharacter() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Sprite frame ticker
  useEffect(() => {
    const tid = setInterval(() => {
      setFrameIdx(f => (f + 1) % SCENES[sceneIdx].frames.length);
    }, FRAME_MS);
    return () => clearInterval(tid);
  }, [sceneIdx]);

  // Scene switcher
  useEffect(() => {
    const sid = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSceneIdx(i => (i + 1) % SCENES.length);
        setFrameIdx(0);
        setVisible(true);
      }, 350);
    }, SCENE_MS);
    return () => clearInterval(sid);
  }, []);

  const scene = SCENES[sceneIdx];

  return (
    <div className="flex flex-col items-center gap-2 py-5 select-none">
      {/* Character sprite */}
      <div
        className={scene.anim}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          width: 128,
          height: 128,
          position: 'relative',
        }}
      >
        <Image
          key={scene.frames[frameIdx]}
          src={scene.frames[frameIdx]}
          alt="예수님 캐릭터"
          fill
          style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
          priority
        />
      </div>

      {/* Speech bubble */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.35s ease 0.1s, transform 0.35s ease 0.1s',
          position: 'relative',
        }}
        className="bg-white border border-amber-200 rounded-2xl px-4 py-2.5 shadow-sm max-w-[230px] text-center"
      >
        {/* Bubble tail pointing up toward character */}
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
        <p className="text-xs text-amber-800 font-medium leading-relaxed">{scene.text}</p>
      </div>
    </div>
  );
}
