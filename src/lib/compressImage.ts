/**
 * Client-side image compression for upload forms.
 *
 * Phone-camera photos are often 3–10 MB each. Three of them in one multipart
 * submit easily blow past the server-action body limit, which surfaces to the
 * user as a (misleading) "no internet / weak signal" screen because the failed
 * POST looks like a network error. Compressing on the client keeps each upload
 * to a few hundred KB so the submit always fits and goes through quickly even
 * on slow mobile uplinks.
 *
 * Resizes the longest edge down to `maxEdge` and re-encodes as JPEG. Returns a
 * new File. On any failure (unsupported format, decode error, canvas blocked)
 * it resolves to the ORIGINAL file so a submit is never blocked by compression.
 */
export async function compressImage(
  file: File,
  { maxEdge = 1600, quality = 0.82 }: { maxEdge?: number; quality?: number } = {},
): Promise<File> {
  // Only attempt on real raster images; leave anything else untouched.
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;
    // If compression somehow produced a bigger file (tiny already-optimized
    // image), keep the original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap is fastest + handles EXIF orientation on modern browsers.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    } catch {
      /* fall through to <img> decode */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
