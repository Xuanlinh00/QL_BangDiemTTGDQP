import React from 'react'

interface AlertProps {
  variant?: 'success' | 'warning' | 'danger' | 'info'
  title?: string
  children: React.ReactNode
  onClose?: () => void
  icon?: React.ReactNode
}

export default function Alert({ variant = 'info', title, children, onClose, icon }: AlertProps) {
  const variantClasses = {
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-200 dark:border-success-800',
      text: 'text-success-800 dark:text-success-200',
      icon: 'text-success-600 dark:text-success-400',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-200 dark:border-warning-800',
      text: 'text-warning-800 dark:text-warning-200',
      icon: 'text-warning-600 dark:text-warning-400',
    },
    danger: {
      bg: 'bg-danger-50 dark:bg-danger-900/20',
      border: 'border-danger-200 dark:border-danger-800',
      text: 'text-danger-800 dark:text-danger-200',
      icon: 'text-danger-600 dark:text-danger-400',
    },
    info: {
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      border: 'border-primary-200 dark:border-primary-800',
      text: 'text-primary-800 dark:text-primary-200',
      icon: 'text-primary-600 dark:text-primary-400',
    },
  }

  const classes = variantClasses[variant]

  const defaultIcons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47a9 9 0 1 1 9.84 0" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v2m0 4v2M7.08 6.47a9 9 0 1 1 9.84 0" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div className={`${classes.bg} border ${classes.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${classes.icon} mt-0.5`}>
          {icon || defaultIcons[variant]}
        </div>
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold ${classes.text}`}>{title}</h3>
          )}
          <div className={`text-sm ${classes.text} ${title ? 'mt-1' : ''}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${classes.icon} hover:opacity-75 transition-opacity`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
