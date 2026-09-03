import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import toast from 'react-hot-toast';
import api from '../../../../services/api';

type AttachmentLike = { url: string; name?: string; mimeType?: string; size?: number };

const isOfficeFile = (filename: string, mimeType?: string): boolean => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return true;
  if (mimeType) {
    const officeMimes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (officeMimes.includes(mimeType)) return true;
  }
  return false;
};

export function useAttachmentPreview(
  containerRef: RefObject<HTMLElement | null>,
  attachments?: AttachmentLike[],
  isDeleted?: boolean
) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Record<string, boolean>>({});

  const previewUrlsRef = useRef<Record<string, string>>({});
  const loadingPreviewsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    loadingPreviewsRef.current = loadingPreviews;
  }, [loadingPreviews]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const loadPreview = useCallback(async (url: string) => {
    if (previewUrlsRef.current[url] || loadingPreviewsRef.current[url]) return;
    setLoadingPreviews(prev => ({ ...prev, [url]: true }));
    try {
      const response = await api.get<Blob>('/attachments/download-by-url', {
        params: { url },
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(response.data);
      setPreviewUrls(prev => ({ ...prev, [url]: blobUrl }));
    } catch {
      try {
        const direct = await fetch(url);
        const blob = await direct.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrls(prev => ({ ...prev, [url]: blobUrl }));
      } catch (err) {
        console.error('Failed to load preview:', err);
      }
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [url]: false }));
    }
  }, []);

  useEffect(() => {
    if (isDeleted || !attachments || attachments.length === 0 || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) observer.disconnect();
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [attachments, isDeleted, containerRef]);

  useEffect(() => {
    if (isDeleted || !attachments) return;
    attachments.forEach(file => {
      const mime = file.mimeType || '';
      const canPreview = mime === 'application/pdf' || mime.startsWith('text/');
      if (canPreview && file.url && expandedPreviews[file.url]) {
        void loadPreview(file.url);
      }
    });
  }, [isDeleted, attachments, expandedPreviews, loadPreview]);

  const togglePreview = async (url: string) => {
    if (loadingPreviews[url]) return;
    if (expandedPreviews[url]) {
      setExpandedPreviews(prev => ({ ...prev, [url]: false }));
      return;
    }
    setExpandedPreviews(prev => ({ ...prev, [url]: true }));
    await loadPreview(url);
  };

  const handleDownloadFile = async (
    file: AttachmentLike,
    forceDownload = false
  ) => {
    const filename = file.name || 'file';

    if (!forceDownload && file.url && isOfficeFile(filename, file.mimeType)) {
      window.open(
        `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`,
        '_blank'
      );
      return;
    }

    if (isDownloading) return;
    setIsDownloading(file.url);
    try {
      let blobUrl: string;
      try {
        const response = await api.get<Blob>('/attachments/download-by-url', {
          params: { url: file.url },
          responseType: 'blob',
        });
        blobUrl = URL.createObjectURL(response.data);
      } catch {
        const direct = await fetch(file.url);
        const blob = await direct.blob();
        blobUrl = URL.createObjectURL(blob);
      }

      const mime = file.mimeType || '';
      const isPreviewable = mime === 'application/pdf' || mime.startsWith('image/') || mime.startsWith('text/');

      if (!forceDownload && isPreviewable) {
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
      } else {
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Failed to download file:', err);
      toast.error(forceDownload ? 'Failed to download file' : 'Failed to open file');
    } finally {
      setIsDownloading(null);
    }
  };

  return {
    isDownloading,
    expandedPreviews,
    previewUrls,
    loadingPreviews,
    togglePreview,
    handleDownloadFile,
  };
}
