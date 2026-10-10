'use client';

import React from 'react';

export default function WorldPage() {
  return (
    <div className="w-full h-full min-h-[90vh] bg-[#ecece3] overflow-hidden -m-6">
      <iframe 
        src="/world-engine/index.html" 
        className="w-full h-full border-0 min-h-[90vh]"
        title="Lyra World Engine"
      />
    </div>
  );
}
