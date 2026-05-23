
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(148,163,184,0.08)] hover:shadow-[0_12px_32px_-8px_rgba(99,102,241,0.15)] transition-all duration-300 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          {title && <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

export default Card;
