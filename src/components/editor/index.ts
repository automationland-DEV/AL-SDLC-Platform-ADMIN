import { lazy } from 'react';

export const RichTextEditor = lazy(() => import('./RichTextEditor'));
export { default as Ruler, DEFAULT_MARGIN } from './Ruler';
export { default as DocMenuBar } from './DocMenuBar';
export { default as PageCanvas } from './PageCanvas';
export { default as TemplatesGallery } from './TemplatesGallery';
export { ADMIN_DOCUMENT_TEMPLATES, type DocumentTemplate } from './templatesData';
export { PageBreak } from './pageBreak';
