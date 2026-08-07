import React from 'react'
import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'line' | 'card' | 'circle'
  width?: string | number
  height?: string | number
}

export default function Skeleton({ className, variant = 'line', width, height }: SkeletonProps) {
  const baseClasses = 'skeleton animate-pulse'

  const variantClasses = {
    line: 'h-4 rounded',
    card: 'h-24 rounded-lg',
    circle: 'rounded-full',
  }

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    />
  )
}
