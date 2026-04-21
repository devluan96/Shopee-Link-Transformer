import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-288px)] p-6 z-40 lg:block hidden">
       <div className="max-w-4xl mx-auto flex items-center justify-between opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">&copy; 2026 hotsnew.click Infrastructure</span>
          <div className="flex gap-6">
              <Globe size={16} />
              <ShieldCheck size={16} />
          </div>
       </div>
    </footer>
  );
};
