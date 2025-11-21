"use client"

import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

interface LoadingAnimationProps {
  isVisible: boolean
  isComplete: boolean
  onComplete: () => void
}

const steps = [
  "Getting to know your brand…",
  "Finding the perfect message…",
  "Drafting your hero section…",
  "Building the page structure…",
  "Styling your layout…",
  "Final touches…",
  "Ready to showcase!"
]

export default function LoadingAnimation({ isVisible, isComplete, onComplete }: LoadingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0)
      setIsAnimating(true)

      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (!isComplete) {
            // Cycle through the first 6 steps while not complete
            return (prev + 1) % (steps.length - 1)
          } else {
            // When complete, show the final step
            if (prev !== steps.length - 1) {
              return steps.length - 1
            } else {
              // Final step shown, complete the animation
              clearInterval(interval)
              setTimeout(() => {
                setIsAnimating(false)
                onComplete()
              }, 1000) // Show "Ready to showcase!" for 1 second
              return prev
            }
          }
        })
      }, 1500) // 1.5 seconds per step

      return () => clearInterval(interval)
    }
  }, [isVisible, isComplete, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Simple Y-Axis Logo Rotation */}
          <div className="mb-6 flex justify-center">
            {currentStep === steps.length - 1 ? (
              <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />
            ) : (
              <div className="relative flex items-center justify-center">
                {/* Smooth Y-axis rotating logo */}
                <div className="animate-rotate-y-smooth">
                  <img
                    src="/haldarai.jpg"
                    alt="Haldarai Logo"
                    className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step Text */}
          <div className="mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              {steps[currentStep]}
            </h3>
            <p className="text-muted-foreground">
              {currentStep === steps.length - 1 ? "Your landing page is ready!" : "Creating something amazing..."}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: isComplete ? '100%' : `${((currentStep + 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isComplete
                    ? index === steps.length - 1
                      ? 'bg-green-500 animate-pulse scale-125'
                      : 'bg-green-500 scale-125'
                    : index < currentStep
                    ? 'bg-green-500 scale-125'
                    : index === currentStep
                    ? 'bg-blue-500 animate-pulse scale-125'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Loading Dots */}
          <div className="mt-6 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
