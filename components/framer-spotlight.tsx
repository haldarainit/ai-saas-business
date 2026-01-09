"use client"

import { useRef, useState, useEffect, useMemo, memo } from "react"
import { motion, useMotionValue, useSpring, animate } from "framer-motion"
import { useTheme } from "next-themes"

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

function FramerSpotlightComponent() {
  const [isMounted, setIsMounted] = useState(false)
  const [isMouseInHero, setIsMouseInHero] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const defaultPositionRef = useRef({ x: 0, y: 0 })
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  // Motion values for the spotlight position with spring physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Optimized spring config - less stiff for smoother, less CPU-intensive animation
  const springConfig = useMemo(() => ({ damping: 25, stiffness: 200, mass: 1 }), [])
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  // Memoize spotlight colors
  const spotlightColors = useMemo(() => [
    { color: "rgba(36, 101, 237, 0.15)", darkColor: "rgba(36, 101, 237, 0.2)" },
    { color: "rgba(236, 72, 153, 0.1)", darkColor: "rgba(236, 72, 153, 0.15)" },
    { color: "rgba(16, 185, 129, 0.1)", darkColor: "rgba(16, 185, 129, 0.15)" },
  ], [])

  // Update default position without causing re-renders
  const updateDefaultPosition = () => {
    if (heroRef.current) {
      const heroRect = heroRef.current.getBoundingClientRect()
      const centerX = heroRect.left + heroRect.width / 2
      const centerY = heroRect.top + heroRect.height / 3

      defaultPositionRef.current = { x: centerX, y: centerY }
      mouseX.set(centerX)
      mouseY.set(centerY)
    }
  }

  // Handle mouse enter/leave for hero section
  const handleMouseEnter = () => setIsMouseInHero(true)

  const handleMouseLeave = () => {
    setIsMouseInHero(false)
    animate(mouseX, defaultPositionRef.current.x, { duration: 1, ease: "easeOut" })
    animate(mouseY, defaultPositionRef.current.y, { duration: 1, ease: "easeOut" })
  }

  // Throttled mouse movement handler for better performance
  const handleMouseMove = (e: MouseEvent) => {
    if (isMouseInHero) {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
  }

  // Setup effect
  useEffect(() => {
    setIsMounted(true)
    heroRef.current = document.getElementById("hero")
    updateDefaultPosition()

    window.addEventListener("resize", updateDefaultPosition, { passive: true })
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    if (heroRef.current) {
      heroRef.current.addEventListener("mouseenter", handleMouseEnter, { passive: true })
      heroRef.current.addEventListener("mouseleave", handleMouseLeave, { passive: true })
    }

    return () => {
      window.removeEventListener("resize", updateDefaultPosition)
      window.removeEventListener("mousemove", handleMouseMove)
      if (heroRef.current) {
        heroRef.current.removeEventListener("mouseenter", handleMouseEnter)
        heroRef.current.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [isMouseInHero])

  if (!isMounted || prefersReducedMotion) {
    // Render static gradient for reduced motion or SSR
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, ${isDark ? 'rgba(36, 101, 237, 0.15)' : 'rgba(36, 101, 237, 0.1)'
              } 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'auto' }}>
      {/* Primary spotlight - follows mouse */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${isDark ? spotlightColors[0].darkColor : spotlightColors[0].color
            } 0%, transparent 70%)`,
          width: "900px",
          height: "900px",
          borderRadius: "50%",
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          willChange: "transform",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Secondary spotlights - CSS-driven with slower intervals */}
      <motion.div
        className="absolute pointer-events-none"
        initial={{ opacity: 0.2 }}
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "linear",
        }}
        style={{
          background: `radial-gradient(circle, ${isDark ? spotlightColors[1].darkColor : spotlightColors[1].color
            } 0%, transparent 70%)`,
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          left: "20%",
          top: "30%",
          willChange: "opacity",
        }}
      />

      <motion.div
        className="absolute pointer-events-none"
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "linear",
        }}
        style={{
          background: `radial-gradient(circle, ${isDark ? spotlightColors[2].darkColor : spotlightColors[2].color
            } 0%, transparent 70%)`,
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          right: "20%",
          bottom: "30%",
          willChange: "opacity",
        }}
      />
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FramerSpotlightComponent)
