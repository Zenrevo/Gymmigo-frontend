import type { ReactNode, ElementType } from 'react';

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-white/10">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-2">
        <Icon size={32} />
      </div>
      <h4 className="text-xl font-bold">{title}</h4>
      <p className="text-white/40 text-sm max-w-sm">{description}</p>
      {action && <div className="pt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
