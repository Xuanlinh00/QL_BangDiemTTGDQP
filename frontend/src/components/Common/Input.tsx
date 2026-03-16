import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-4 py-2 ${icon ? 'pl-10' : ''} border rounded-lg outline-none transition-all duration-200
              bg-white dark:bg-slate-800
              border-gray-200 dark:border-slate-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-slate-500
              focus:ring-2 focus:ring-primary-400 focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed
              ${error ? 'border-danger-500 focus:ring-danger-400' : ''}
              ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-danger-500 mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
