// ==========================================================================
// Intersection Observer for fade-in animations on scroll
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // GSAP Hero Animations
  if (typeof gsap !== 'undefined') {
    const tl = gsap.timeline();
    
    tl.fromTo('.hero-title', 
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    )
    .fromTo('.hero-subtitle',
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      "-=0.6"
    )
    .fromTo(['.hero-description', '.hero-cta-group'],
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0 },
      "-=0.6"
    );

    // Accent line animation starts slightly after title
    gsap.to('.hero-accent-line', {
      width: '100%',
      duration: 1.2,
      ease: 'power2.out',
      delay: 0.2
    });
  }
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Optional: Stop observing once visible if we don't want it to hide on scroll up
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const fadeElements = document.querySelectorAll('.fade-in-up');
  fadeElements.forEach(el => observer.observe(el));
});

// ==========================================================================
// Canvas Image Sequence Animation Logic
// ==========================================================================
const canvas = document.getElementById('hero-canvas');
const context = canvas.getContext('2d');
const sequenceWrapper = document.querySelector('.hero-sequence-wrapper');
const heroContent = document.querySelector('.hero-content');
const scrollIndicator = document.querySelector('.scroll-indicator');
const endOverlay = document.querySelector('.hero-end-overlay');

// Configuration
const frameCount = 182;
const images = [];
let imagesLoaded = 0;

// Helper to format frame numbers (e.g., 1 -> 001)
const getFramePath = (index) => `sequence/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

// Preload Images
const preloadImages = () => {
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    
    img.onload = () => {
      imagesLoaded++;
      // Once first image loads, draw it
      if (imagesLoaded === 1) {
        requestAnimationFrame(() => drawImageOnCanvas(img));
      }
    };
    
    images.push(img);
  }
};

// Draw Image to Canvas (Cover mode)
const drawImageOnCanvas = (img) => {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  let renderWidth, renderHeight, x, y;

  // Emulate 'object-fit: cover'
  if (canvasRatio > imgRatio) {
    renderWidth = canvas.width;
    renderHeight = canvas.width / imgRatio;
    x = 0;
    y = (canvas.height - renderHeight) / 2;
  } else {
    renderWidth = canvas.height * imgRatio;
    renderHeight = canvas.height;
    x = (canvas.width - renderWidth) / 2;
    y = 0;
  }
  
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, x, y, renderWidth, renderHeight);
};

// Update Canvas Size
const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Redraw current frame on resize
  const currentFrameIndex = Math.floor(getScrollProgress() * (frameCount - 1));
  if (images[currentFrameIndex]) {
    drawImageOnCanvas(images[currentFrameIndex]);
  }
};

window.addEventListener('resize', resizeCanvas);

// Scroll Progress Calculation
const getScrollProgress = () => {
  // Get bounds of the wrapper
  const rect = sequenceWrapper.getBoundingClientRect();
  const wrapperTop = rect.top;
  const wrapperHeight = rect.height;
  const windowHeight = window.innerHeight;
  
  // Calculate scroll amount within the wrapper
  // 0 when wrapper top hits screen top
  // 1 when wrapper bottom hits screen bottom
  const scrollPixels = -wrapperTop;
  const scrollableDistance = wrapperHeight - windowHeight;
  
  if (scrollPixels < 0) return 0;
  if (scrollPixels > scrollableDistance) return 1;
  
  return scrollPixels / scrollableDistance;
};

// Main Animation Loop linked to Scroll
const updateAnimation = () => {
  const progress = getScrollProgress();
  
  // Calculate which frame to show
  const frameIndex = Math.min(
    frameCount - 1,
    Math.floor(progress * frameCount)
  );
  
  // Request drawing the frame if loaded
  if (images[frameIndex]) {
    requestAnimationFrame(() => drawImageOnCanvas(images[frameIndex]));
  }

  // Parallax Effect for Hero Content
  // Text moves slightly slower than background (moves down slightly by max 15px over scroll)
  const parallaxShift = progress * 15;
  heroContent.style.transform = `translateY(${parallaxShift}px)`;

  // Trigger Hero Post Images GSAP 
  // Expandable to 6 items with organic scattered appearance & bidirectional exit
  if (typeof gsap !== 'undefined') {
    const targets = document.querySelectorAll('.post-img-gsap-target');

    if (progress > 0.85 && !imagesRevealed) {
      imagesRevealed = true;
      
      // Ensure floating animation is active
      const outers = document.querySelectorAll('.post-img-outer');
      outers.forEach(outer => outer.style.animationPlayState = 'running');
      
      targets.forEach((el, index) => {
        gsap.killTweensOf(el);
        // Organic slide angles corresponding to visual spread
        const startX = index % 2 === 0 ? 60 : -40;
        const startY = index % 3 === 0 ? 50 : -40;
        
        gsap.fromTo(el, 
           { autoAlpha: 0, scale: 0.9, x: startX, y: startY },
           { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.8, ease: 'power2.out', delay: index * 0.1 }
        );
      });
    } else if (progress <= 0.85 && imagesRevealed) {
      // Reversible: smoothly BUT IMMEDIATELY fade out when scrolling up
      imagesRevealed = false;
      
      // Stop floating immediately
      const outers = document.querySelectorAll('.post-img-outer');
      outers.forEach(outer => outer.style.animationPlayState = 'paused');
      
      targets.forEach((el, index) => {
        gsap.killTweensOf(el);
        
        // Immediate, very fast exit to the right. No stagger delay for exit!
        const endX = 30; // slight move right
        
        gsap.to(el, { 
           autoAlpha: 0, scale: 0.95, x: endX, y: 0, 
           duration: 0.15, ease: 'power1.out', delay: 0 
        });
      });
    }
  }

  // Video Parallax (Slight) inside 'Why Visit Us' Section
  const whyVideo = document.querySelector('.why-us-video');
  if (whyVideo) {
    const videoRect = whyVideo.getBoundingClientRect();
    const windowH = window.innerHeight;
    if (videoRect.top < windowH && videoRect.bottom > 0) {
      const centerOffset = (videoRect.top + videoRect.height/2) - (windowH/2);
      const videoParallax = centerOffset * 0.08; // 8% speed
      whyVideo.style.transform = `translateY(${videoParallax}px)`;
    }
  }

  // End State Transition
  // Fade out animation and show clean dark background w/ grain
  if (endOverlay) {
    let overlayOpacity = 0;
    if (progress > 0.85) {
      overlayOpacity = Math.min(1, (progress - 0.85) / 0.15);
    }
    endOverlay.style.opacity = overlayOpacity.toString();
    canvas.style.opacity = (1 - overlayOpacity).toString();
  }
  
  // Hide scroll indicator once user starts scrolling substantially
  if (progress > 0.05) {
    scrollIndicator.classList.add('hidden');
  } else {
    scrollIndicator.classList.remove('hidden');
  }
};

// Optimize scroll listener with requestAnimationFrame
let imagesRevealed = false;
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateAnimation();
      ticking = false;
    });
    ticking = true;
  }
});

// Initialization
resizeCanvas();
preloadImages();
updateAnimation(); // Initial state
