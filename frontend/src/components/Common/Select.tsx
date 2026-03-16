import React from 'react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  helperText?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-2 border rounded-lg outline-none transition-all duration-200
            bg-white dark:bg-slate-800
            border-gray-200 dark:border-slate-700
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary-400 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed
            ${error ? 'border-danger-500 focus:ring-danger-400' : ''}
            ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select'

export default Select
