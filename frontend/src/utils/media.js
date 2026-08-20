export const resolveMediaUrl = (value) => {
  if (!value) return '';
  const str = String(value);

  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:') || str.startsWith('blob:')) {
    return str;
  }

  if (str.startsWith('/')) return str;

  return `/uploads/${str}`;
};

export const getPrimaryWatchImage = (watch) => {
  if (!watch) return '';
  const images = Array.isArray(watch.images) ? watch.images : [];
  return images[0] || watch.image || '';
};

