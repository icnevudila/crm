'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogoCarouselProps {
  logos: Array<{
    name: string
    image?: string
    alt?: string
  }>
  autoPlay?: boolean
  interval?: number
}

export default function LogoCarousel({ logos, autoPlay = true, interval = 3000 }: LogoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!autoPlay || isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % logos.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, isPaused, logos.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + logos.length) % logos.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % logos.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{
            x: `-${currentIndex * 100}%`,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          {logos.map((logo, index) => (
            <div
              key={index}
              className="min-w-full flex items-center justify-center px-4"
            >
              <div className="bg-gray-800 rounded-lg p-8 w-full max-w-xs h-32 flex items-center justify-center">
                {logo.image ? (
                  <Image
                    src={logo.image}
                    alt={logo.alt || logo.name}
                    width={80}
                    height={80}
                    className="max-h-20 max-w-full object-contain filter brightness-0 invert"
                    unoptimized={logo.image.startsWith('blob:') || logo.image.startsWith('data:')}
                  />
                ) : (
                  <span className="text-white text-xl font-bold">{logo.name}</span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {logos.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-indigo-600'
                : 'w-2 bg-gray-400 hover:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}


