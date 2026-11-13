/**
 * Client-side image compression and upload helper.
 * Resizes large smartphone/camera photos before upload, reducing 5-10MB files to ~100-250KB WebP/JPEG.
 */
export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<{ blob: Blob; previewUrl: string }> {
  // If SVG or small file (< 150KB), return as is
  if (file.type === "image/svg+xml" || file.size < 150 * 1024) {
    return {
      blob: file,
      previewUrl: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ blob: file, previewUrl: URL.createObjectURL(file) });
          return;
        }

        // High quality bicubic interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer modern WebP format
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const previewUrl = URL.createObjectURL(blob);
              resolve({ blob, previewUrl });
            } else {
              resolve({ blob: file, previewUrl: URL.createObjectURL(file) });
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Gagal membaca file gambar."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca berkas."));
    reader.readAsDataURL(file);
  });
}

export async function uploadProductImage(file: File): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    // 1. Client-side compression
    const { blob } = await compressImage(file, 1200, 0.85);

    // 2. Prepare multipart upload
    const formData = new FormData();
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    formData.append("file", blob, cleanFileName);

    // 3. Post to upload API
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Gagal mengunggah gambar ke server." };
    }

    return { ok: true, url: data.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah gambar.";
    return { ok: false, error: message };
  }
}
