// Component representing document page canvas in the editor, 
// where users edit document content.
"use client";

import React from "react";

interface PageCanvasProps {
  children: React.ReactNode;
}

export default function PageCanvas({ children }: PageCanvasProps) {
  return (
    <div className="w-full bg-[#F8F9FA] dark:bg-[#202020] min-h-full py-4 px-2 sm:px-6 flex justify-center">
      <div className="w-full max-w-[816px] min-h-[400px] bg-white text-gray-900 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] border border-gray-200/50 p-6 sm:p-12 dark:border-white/[0.12] dark:bg-[#1A1A1A] dark:text-[#E8E8E7]">
        {children}
      </div>
    </div>
  );
}
