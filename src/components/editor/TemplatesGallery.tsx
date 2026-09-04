"use client";

import { useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import { ADMIN_DOCUMENT_TEMPLATES, type DocumentTemplate } from "./templatesData";

interface TemplatesGalleryProps {
  onSelectTemplate: (template: DocumentTemplate) => void;
}

export default function TemplatesGallery({ onSelectTemplate }: TemplatesGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { language } = useTranslation();

  return (
    <div className="w-full bg-[#F1F3F4] dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 py-4 px-4 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'vi' ? 'Kho mẫu tài liệu chuẩn' : 'Document Templates Gallery'}</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              {language === 'vi' ? '(Chọn mẫu để tạo nhanh nội dung có sẵn)' : '(Select template to quickly create content)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium"
          >
            {isExpanded ? (language === 'vi' ? 'Thu gọn mẫu' : 'Collapse') : (language === 'vi' ? 'Mở rộng mẫu' : 'Expand')}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
            {ADMIN_DOCUMENT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onSelectTemplate(tmpl)}
                className="group flex flex-col text-left bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700/80 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-3 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
              >
                {/* Thumbnail Preview Area */}
                <div
                  className={`w-full aspect-[4/3] rounded-lg bg-gradient-to-br ${tmpl.bgGradient} border flex flex-col items-center justify-center p-3 mb-2.5 transition-transform group-hover:scale-[1.02]`}
                >
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-black/30 backdrop-blur-xs shadow-xs mb-1">
                    {tmpl.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {tmpl.category}
                  </span>
                </div>

                {/* Title & Description */}
                <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {tmpl.title}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                  {tmpl.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
