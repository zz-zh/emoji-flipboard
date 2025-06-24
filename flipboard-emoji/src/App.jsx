import { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import waveImg from './assets/wave.png';
import zzImg from './assets/zz.png';

const NUM_ROWS = 10;
const NUM_COLS = 10;
const NUM_CELLS = NUM_ROWS * NUM_COLS;

// Preload images to prevent loading delays during animation
const preloadImages = () => {
  const waveImage = new Image();
  const zzImage = new Image();
  waveImage.src = waveImg;
  zzImage.src = zzImg;
};

// Throttle function for mobile performance
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastScrollY = useRef(0);

  // Optimized scroll handler with requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = Math.min(2.5, Math.max(0, scrollY / maxScroll * 2.5));
      setScrollProgress(progress);
      lastScrollY.current = scrollY;
    });
  }, []);

  // Throttled scroll handler for mobile
  const throttledScrollHandler = useCallback(
    throttle(handleScroll, 16), // ~60fps
    [handleScroll]
  );

  useEffect(() => {
    // Preload images when component mounts
    preloadImages();
    
    // Use throttled handler for better mobile performance
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [throttledScrollHandler]);

  // Memoized rotation calculation to avoid recalculating on every render
  const getRotationAndImage = useCallback((col, progress) => {
    let rotation, imgSrc;
    
    if (progress <= 2) {
      if (col % 2 === 1) {
        // Odd columns: wave.png rotates 3 full spins over 0-2 scroll
        rotation = Math.min(1, progress / 2) * 1080;
        imgSrc = waveImg;
      } else {
        // Even columns: wave.png rotates 0-630deg, then zz.png continues 630-1080deg
        const transitionPoint = 630 / 1080 * 2; // ~1.166
        if (progress < transitionPoint) {
          const localProgress = progress / transitionPoint;
          rotation = localProgress * 630;
          imgSrc = waveImg;
        } else {
          const localProgress = (progress - transitionPoint) / (2 - transitionPoint);
          rotation = 630 + Math.min(1, Math.max(0, localProgress)) * 450;
          imgSrc = zzImg;
        }
      }
    } else {
      // Final phase: all cells rotate one more full spin (1080deg to 1440deg)
      const localProgress = Math.min(1, Math.max(0, (progress - 2) / 0.5));
      rotation = 1080 + localProgress * 360;
      // Use the last image for each cell
      if (col % 2 === 1) {
        imgSrc = waveImg;
      } else {
        imgSrc = zzImg;
      }
    }
    
    return { rotation, imgSrc };
  }, []);

  return (
    <div ref={scrollContainerRef}>
      <div className="flipboard-grid-container">
        <div className="flipboard-grid">
          {Array.from({ length: NUM_CELLS }).map((_, i) => {
            const col = (i % NUM_COLS) + 1; // 1-based column index
            const { rotation, imgSrc } = getRotationAndImage(col, scrollProgress);
            
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
