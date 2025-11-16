'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface AnimatedEyeProps {
  isOpen: boolean
  isWatching?: boolean
}

export default function AnimatedEye({ isOpen, isWatching }: AnimatedEyeProps) {
  const [isBlinking, setIsBlinking] = useState(false)
  
  // Random blinking effect
  useEffect(() => {
    if (!isOpen) return
    
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, Math.random() * 4000 + 2000) // Blink every 2-6 seconds
    
    return () => clearInterval(blinkInterval)
  }, [isOpen])
  
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
    >
      {/* Eye shape */}
      <motion.path
        d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isOpen ? 1 : 0,
          scaleY: isBlinking ? 0.1 : 1
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Iris */}
      <motion.circle
        cx="12"
        cy="12.5"
        r="3"
        fill="currentColor"
        initial={{ scale: 0 }}
        animate={{ 
          scale: isOpen && !isBlinking ? 1 : 0,
          x: isWatching ? 2 : 0
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Pupil */}
      <motion.circle
        cx="12"
        cy="12.5"
        r="1"
        fill="black"
        initial={{ scale: 0 }}
        animate={{ 
          scale: isOpen && !isBlinking ? 1 : 0,
          x: isWatching ? 2 : 0
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Closed eye line */}
      {!isOpen && (
        <motion.path
          d="M3 12.5H21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Eye lashes when blinking */}
      {isBlinking && (
        <>
          <motion.path
            d="M8 10L7 8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
          <motion.path
            d="M12 10L12 8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
          <motion.path
            d="M16 10L17 8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
        </>
      )}
    </svg>
  )
}
