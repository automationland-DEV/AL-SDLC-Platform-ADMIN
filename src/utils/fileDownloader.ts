/**
 * Utility to reliably download files in the browser with guaranteed filename and extension.
 * Solves Chromium's issue where Blob URLs default to a random UUID without extension.
 */

export function sanitizeFilename(rawName: string, defaultExt = ''): string {
  let name = (rawName || 'document').trim();
  // Strip illegal Windows and Linux filename characters: / \ : * ? " < > | and control characters
  name = name.replace(/[/\\?%*:|"<>]/g, '_');
  name = Array.from(name)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  if (!name) name = 'document';

  // If defaultExt is supplied, ensure the filename ends with .<ext>
  if (defaultExt) {
    const extWithDot = defaultExt.startsWith('.') ? defaultExt : `.${defaultExt}`;
    if (!name.toLowerCase().endsWith(extWithDot.toLowerCase())) {
      name = `${name}${extWithDot}`;
    }
  }

  return name.slice(0, 150);
}

export function downloadContent(
  content: string | Blob,
  filename: string,
  mimeType = 'application/octet-stream'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const cleanFilename = sanitizeFilename(filename);

      if (typeof content === 'string') {
        const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = cleanFilename;
        a.setAttribute('download', cleanFilename);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      } else if (content instanceof Blob) {
        // Use FileReader to produce Data URL so Chromium preserves the exact filename & extension
        // instead of falling back to the Blob UUID.
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const dataUrl = reader.result as string;
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = cleanFilename;
            a.setAttribute('download', cleanFilename);
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => {
          // Fallback to object URL if FileReader fails
          try {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = cleanFilename;
            a.setAttribute('download', cleanFilename);
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              if (document.body.contains(a)) document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 5000);
            resolve();
          } catch (fallbackErr) {
            reject(fallbackErr);
          }
        };
        reader.readAsDataURL(content);
      } else {
        reject(new Error('Unsupported content type for download'));
      }
    } catch (err) {
      reject(err);
    }
  });
}
