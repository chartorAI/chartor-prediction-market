"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils/cn"

interface CountdownTimerProps {
  targetDate: Date | number
  onComplete?: () => void
  className?: string
  showLabels?: boolean
  compact?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

const calculateTimeRemaining = (targetDate: Date | number): TimeRemaining => {
  const target =
    typeof targetDate === "number" ? targetDate : targetDate.getTime()
  const now = Date.now()
  const total = target - now

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds, total }
}

export const CountdownTimer = ({
  targetDate,
  onComplete,
  className,
  showLabels = true,
  compact = false,
}: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate)
      setTimeRemaining(remaining)

      if (remaining.total <= 0) {
        clearInterval(interval)
        onComplete?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onComplete])

  if (timeRemaining.total <= 0) {
    return (
      <div className={cn("text-text-secondary font-medium", className)}>
        Ended
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn("text-text-primary font-mono", className)}>
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {String(timeRemaining.hours).padStart(2, "0")}:
        {String(timeRemaining.minutes).padStart(2, "0")}:
        {String(timeRemaining.seconds).padStart(2, "0")}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {timeRemaining.days > 0 && (
        <TimeUnit
          value={timeRemaining.days}
          label="days"
          showLabel={showLabels}
        />
      )}
      <TimeUnit
        value={timeRemaining.hours}
        label="hours"
        showLabel={showLabels}
      />
      <TimeSeparator />
      <TimeUnit
        value={timeRemaining.minutes}
        label="mins"
        showLabel={showLabels}
      />
      <TimeSeparator />
      <TimeUnit
        value={timeRemaining.seconds}
        label="secs"
        showLabel={showLabels}
      />
    </div>
  )
}

interface TimeUnitProps {
  value: number
  label: string
  showLabel: boolean
}

const TimeUnit = ({ value, label, showLabel }: TimeUnitProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="glass-medium px-3 py-2 rounded-lg min-w-[3rem] text-center">
        <span className="text-2xl font-bold text-text-primary font-mono">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      {showLabel && (
        <span className="text-xs text-text-secondary mt-1">{label}</span>
      )}
    </div>
  )
}

const TimeSeparator = () => {
  return (
    <span className="text-2xl font-bold text-text-secondary animate-pulse">
      :
    </span>
  )
}

// Utility hook for countdown
export const useCountdown = (targetDate: Date | number) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate)
  )
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate)
      setTimeRemaining(remaining)

      if (remaining.total <= 0) {
        clearInterval(interval)
        setIsComplete(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return { timeRemaining, isComplete }
}
