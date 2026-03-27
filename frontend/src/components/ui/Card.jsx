import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`px-5 py-4 flex justify-between items-start border-b border-border/60 ${className}`}>
      <div>
        <h3 className="text-base font-bold text-foreground tracking-tight leading-none mb-1.5">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent = ({ children, className = '' }) => {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
};
