const trimSlash = (url) => url.replace(/\/+$/, "");

export const API_ROOT = trimSlash(
  import.meta.env.VITE_API_ROOT || "https://api.kingcreativestudio.my.id/zakat-app"
);

export const API_BASE_URL = `${API_ROOT}/api`;

export const UPLOAD_BASE_URL = API_ROOT;

export const resolveUploadUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${UPLOAD_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
