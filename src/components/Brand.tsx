import { BarChart3 } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" role="img" aria-label="SmartBI">
      <span className="brand__mark"><BarChart3 size={22} aria-hidden="true" /></span>
      {!compact && <span>Smart<span>BI</span></span>}
    </div>
  );
}
