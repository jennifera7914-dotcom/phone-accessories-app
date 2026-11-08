import { BACKEND_URL } from "../api/config";

export const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return `${BACKEND_URL}/${image.replace(/^\/+/, "")}`;
};
