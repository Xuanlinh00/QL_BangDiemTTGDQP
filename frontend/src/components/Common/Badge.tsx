import React from 'react'

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  children: React.ReactNode
  icon?: React.ReactNode
}

export default function Badge({ variant = 'primary', size = 'md', children, icon }: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    secondary: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
    danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {icon}
      {children}
    </span>
  )
}
