import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-muted text-muted-foreground border-border',
    success: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  const style = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}>
      {children}
    </span>
  );
};
