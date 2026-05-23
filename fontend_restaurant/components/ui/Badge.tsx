
import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'pink' | 'purple';
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({ children, color = 'gray', size = 'md' }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
    pink: 'bg-pink-100 text-pink-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  
  const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm'
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
};

export default Badge;
