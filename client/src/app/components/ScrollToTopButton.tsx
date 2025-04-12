'use client';

import { useEffect, useState } from "react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    setIsClicked(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    
    // Reset click state after animation completes
    setTimeout(() => setIsClicked(false), 500);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'block'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={scrollToTop}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, var(--secondary-color, #8b5cf6) 100%)',
          color: 'white',
          border: 'none',
          boxShadow: isHovered 
            ? '0 8px 20px rgba(59, 130, 246, 0.4), 0 0 15px rgba(139, 92, 246, 0.4)' 
            : '0 4px 10px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isHovered 
            ? 'scale(1.1)' 
            : isClicked 
              ? 'scale(0.95)' 
              : 'scale(1)',
          opacity: 1,
          overflow: 'hidden'
        }}
        aria-label="Scroll to top"
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isHovered ? 'translateY(-2px)' : isClicked ? 'translateY(-10px) scale(0.8) opacity(0)' : 'translateY(0)',
            opacity: isClicked ? 0 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </div>
        
        {/* Hover ring effect */}
        <div 
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            border: `2px solid ${isHovered ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        ></div>
        
        {/* Ripple effect on click */}
        {isClicked && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              animation: 'ripple 0.6s ease-out forwards'
            }}
          ></div>
        )}
      </button>
      
      <style jsx>{`
        @keyframes ripple {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ScrollToTopButton; 