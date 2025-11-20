import { forwardRef } from 'react';
import { clsx } from 'clsx';

/**
 * Componente Input reutilizable
 */
const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      containerClassName = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    // Clases base del input
    const baseClasses =
      'block px-4 py-2.5 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed';

    // Clases según estado
    const stateClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    // Clases finales del input
    const inputClasses = clsx(
      baseClasses,
      stateClasses,
      Icon && iconPosition === 'left' && 'pl-10',
      Icon && iconPosition === 'right' && 'pr-10',
      fullWidth && 'w-full',
      className
    );

    return (
      <div className={clsx('space-y-1', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icono izquierdo */}
          {Icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="w-5 h-5 text-gray-400" />
            </div>
          )}

          {/* Input */}
          <input ref={ref} type={type} className={inputClasses} {...props} />

          {/* Icono derecho */}
          {Icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icon className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Helper text */}
        {!error && helperText && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;