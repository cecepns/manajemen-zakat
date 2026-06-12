import { api } from "./api";

export const get = async (url, params = {}) => {
  const { data } = await api.get(url, { params });
  return data;
};

export const post = async (url, body = {}) => {
  const { data } = await api.post(url, body);
  return data;
};

export const put = async (url, body = {}) => {
  const { data } = await api.put(url, body);
  return data;
};

export const del = async (url) => {
  const { data } = await api.delete(url);
  return data;
};

export const downloadFile = async (url, params = {}, filename = "download") => {
  const response = await api.get(url, { params, responseType: "blob" });
  const blob = new Blob([response.data]);
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(link.href);
};
