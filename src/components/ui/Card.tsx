import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const variants: Record<string, string> = {
    default: 'bg-white dark:bg-surface-dark-card border border-slate-100 dark:border-slate-800 shadow-sm',
    elevated: 'bg-white dark:bg-surface-dark-elevated shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-50 dark:border-slate-800',
  };

  return (
    <div className={`rounded-2xl overflow-hidden ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-5 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
);
