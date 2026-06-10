import { LogoPresetMark } from './logoPresets.jsx';

/**
 * Serialize a chosen logo preset to an SVG string, then rasterize to a PNG blob
 * suitable for upload to Supabase Storage and use as `logo_url`.
 */
export async function presetToSvgString({ preset, color, shape, background }) {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const markup = renderToStaticMarkup(
    <LogoPresetMark preset={preset} color={color} shape={shape} background={background} className="" />
  );
  // Ensure explicit width/height for rasterization.
  return markup.replace('<svg ', '<svg width="512" height="512" ');
}

export async function presetToPngBlob({ preset, color, shape, background, size = 512 }) {
  const svg = await presetToSvgString({ preset, color, shape, background });
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * Downscale + compress an uploaded image file before sending to storage.
 * Returns a Blob (JPEG/WebP/PNG depending on input transparency needs).
 */
export async function compressImage(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    let { width, height } = image;
    if (width <= maxWidth && height <= maxHeight) {
      return file;
    }
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);

    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob((result) => resolve(result), type, quality));
    return blob || file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
