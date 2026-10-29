import { API_BASE_URL } from '../services/apiRoutes';

/**
 * Resolve an avatar URL coming from the API.
 *
 * The API can return a full URL (Cloudinary, Google) or a path served by the
 * backend (e.g. `/uploads/avatars/...`). A relative path has to be prefixed
 * with the API origin, otherwise the browser requests it from the admin host
 * and the image silently fails to load.
 */
export function resolveAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${baseUrl}${path}`;
}
