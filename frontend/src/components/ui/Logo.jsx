import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "" }) => {
  return (
    <Link to="/" className={`flex items-center space-x-2 transition-opacity hover:opacity-80 ${className}`}>
      {/* Simple Geometric Logo */}
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
        <div className="w-4 h-4 bg-background rounded-sm" />
      </div>

      {/* Professional Wordmark */}
      <div className="relative font-sans tracking-tight">
        <div className="text-xl font-bold text-foreground flex items-baseline">
          <span>Lendra</span>
          <span className="text-primary">AI</span>
        </div>
      </div>
    </Link>
  );
};

export default Logo;
