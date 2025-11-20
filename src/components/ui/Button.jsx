import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Componente Button reutilizable con variantes
 */
const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      icon: Icon,
      iconPosition = 'left',
      className = '',
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    // Clases base
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variantes de color
    const variantClasses = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
      success:
        'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
      warning:
        'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 active:bg-yellow-700',
      info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500 active:bg-cyan-800',
      outline:
        'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100',
      ghost:
        'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
      link: 'text-blue-600 hover:text-blue-700 hover:underline focus:ring-blue-500',
    };

    // Tamaños
    const sizeClasses = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
      xl: 'px-6 py-3.5 text-base',
    };

    // Clases finales
    const buttonClasses = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        onClick={onClick}
        {...props}
      >
        {/* Icono izquierdo o spinner de carga */}
        {loading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className="w-4 h-4 mr-2" />
        )}

        {/* Contenido del botón */}
        {children}

        {/* Icono derecho */}
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className="w-4 h-4 ml-2" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;