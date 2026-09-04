"use client";

import React from "react";
import { PAGE_WIDTH, PAGE_HEIGHT, PAGE_GAP } from "./pageConfig";
import { useEditorStore } from "../../stores/useEditorStore";

interface PageCanvasProps {
  children: React.ReactNode;
  leftMargin?: number;
  rightMargin?: number;
}

export default function PageCanvas({ children }: PageCanvasProps) {
  const pageCount = useEditorStore((state) => state.pageCount) || 1;

  return (
    <div className="page-canvas-bg w-full min-h-full py-8 flex justify-center overflow-x-auto print:p-0 print:bg-white print:overflow-visible relative">
      {/* Underlying discrete Google Docs sheets */}
      <div
        className="page-sheets-layer absolute top-8 pointer-events-none flex flex-col items-center print:hidden select-none"
        style={{ width: PAGE_WIDTH, gap: PAGE_GAP }}
        aria-hidden="true"
      >
        {Array.from({ length: pageCount }).map((_, index) => (
          <div
            key={index}
            className="page-sheet bg-white dark:bg-[#1E1E1E] transition-shadow duration-150"
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              boxShadow:
                "0 1px 3px 0 rgba(60,64,67,0.15), 0 4px 8px 3px rgba(60,64,67,0.1)",
              borderRadius: "1px",
            }}
          />
        ))}
      </div>

      {/* Transparent TipTap content layer positioned directly on top */}
      <div
        className="page-canvas-sheet relative z-10 print:w-full print:m-0"
        style={{ width: PAGE_WIDTH }}
      >
        {children}
      </div>
    </div>
  );
}
