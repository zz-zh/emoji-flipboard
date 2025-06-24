import { useEffect, useRef, useState } from 'react';
import './App.css';
import waveImg from './assets/wave.png';
import zzImg from './assets/zz.png';

const NUM_ROWS = 10;
const NUM_COLS = 10;
const NUM_CELLS = NUM_ROWS * NUM_COLS;

// Ease in/out function (cubic)
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      // Allow scrollProgress to go up to 2.5 (2.5x page height)
      const progress = Math.min(2.5, Math.max(0, scrollY / maxScroll * 2.5));
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={scrollContainerRef}>
      <div className="flipboard-grid-container small30">
        <div className="flipboard-grid spaced">
          {Array.from({ length: NUM_CELLS }).map((_, i) => {
            const col = (i % NUM_COLS) + 1; // 1-based column index
            let rotation, imgSrc;
            if (scrollProgress <= 2) {
              if (col % 2 === 1) {
                // Odd columns: wave.png rotates 3 full spins over 0-2 scroll
                rotation = Math.min(1, scrollProgress / 2) * 1080;
                imgSrc = waveImg;
              } else {
                // Even columns: wave.png rotates 0-630deg, then zz.png continues 630-1080deg
                const transitionPoint = 630 / 1080 * 2; // ~1.166
                if (scrollProgress < transitionPoint) {
                  const localProgress = scrollProgress / transitionPoint;
                  rotation = localProgress * 630;
                  imgSrc = waveImg;
                } else {
                  const localProgress = (scrollProgress - transitionPoint) / (2 - transitionPoint);
                  rotation = 630 + Math.min(1, Math.max(0, localProgress)) * 450;
                  imgSrc = zzImg;
                }
              }
            } else {
              // Final phase: all cells rotate one more full spin (1080deg to 1440deg)
              const localProgress = (scrollProgress - 2) / 0.5;
              rotation = 1080 + Math.min(1, Math.max(0, localProgress)) * 360;
              // Use the last image for each cell
              if (col % 2 === 1) {
                imgSrc = waveImg;
              } else {
                imgSrc = zzImg;
              }
            }
            return (
              <div className="flip-cell" key={i}>
                <div
                  className="flip-inner"
                  style={{ transform: `rotateY(${rotation}deg)` }}
                >
                  <img
                    src={imgSrc}
                    alt="emoji"
                    className="emoji-img"
                    draggable="false"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Increase scrollable area to 750vh for 2.5x scroll */}
      <div style={{ height: '750vh' }} />
    </div>
  );
}

export default App;

// ---
// This version uses SVG images for the emoji, so the mirrored effect at 180° is always visible.
// The back face uses scaleX(-1) to mirror the SVG.
