import React from 'react';
import { Info } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-100 p-4 rounded-md flex gap-3 items-start my-4">
      <Info className="shrink-0 mt-0.5 text-blue-400" size={18} />
      <p className="text-sm">
        <strong className="font-semibold text-blue-300">Important:</strong> Game performance reflects digital activity and engagement. It is not a medical diagnosis or clinical cognitive assessment.
      </p>
    </div>
  );
}
