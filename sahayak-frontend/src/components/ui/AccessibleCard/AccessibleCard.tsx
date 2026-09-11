import React from 'react';

interface AccessibleCardProps {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
  highlight?: boolean;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  children,
  title,
  onClick,
  className = '',
  highlight = false,
}) => {
  const Component = onClick ? 'button' : 'div';
  
  const baseStyles = "w-full text-left bg-[#131b2e] rounded-2xl border p-6 relative overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group";
  const borderStyle = highlight ? "border-indigo-500 bg-indigo-900/20" : "border-slate-800";
  // The hover effect should apply if clickable or if we want the standard hover state
  const hoverStyles = "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50";

  return (
    <Component 
      className={`${baseStyles} ${borderStyle} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {title && <h2 className="text-xl font-bold text-white mb-2">{title}</h2>}
      <div className="text-slate-300">
        {children}
      </div>
    </Component>
  );
};
