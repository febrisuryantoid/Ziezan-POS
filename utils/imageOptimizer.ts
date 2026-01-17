/**
 * Ziezan Smart Image Optimizer
 * Mengubah gambar besar menjadi format ultra-ringan (AVIF/WebP) dengan resolusi optimal.
 */

interface OptimizationConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0.0 to 1.0
}

const DEFAULT_CONFIG: OptimizationConfig = {
  maxWidth: 500, // Cukup untuk Profile Picture / Thumbnail
  maxHeight: 500,
  quality: 0.60, // AVIF/WebP pada 60% kualitasnya setara JPEG 85% tapi size jauh lebih kecil
};

export const optimizeImage = (source: File | string, config: Partial<OptimizationConfig> = {}): Promise<string> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Handle CORS untuk URL eksternal agar tidak "Tainted Canvas"
    if (typeof source === 'string' && source.startsWith('http')) {
      img.crossOrigin = "Anonymous"; 
    }

    img.src = typeof source === 'string' 
      ? source 
      : URL.createObjectURL(source);

    img.onload = () => {
      // 1. Calculate Aspect Ratio (Smart Resize)
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > finalConfig.maxWidth) {
          height = Math.round((height * finalConfig.maxWidth) / width);
          width = finalConfig.maxWidth;
        }
      } else {
        if (height > finalConfig.maxHeight) {
          width = Math.round((width * finalConfig.maxHeight) / height);
          height = finalConfig.maxHeight;
        }
      }

      // 2. Draw to Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Gagal menginisialisasi canvas."));
        return;
      }

      // Image Smoothing (Agar tetap jelas meski di-resize)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // 3. Export: CASCADING COMPRESSION STRATEGY
      // Priority: AVIF (Smallest) -> WebP (Standard Modern) -> JPEG (Legacy Fallback)
      
      try {
        // TIER 1: Attempt AVIF
        // AVIF sangat efisien, kualitas 0.5-0.6 seringkali terlihat sempurna
        let dataUrl = canvas.toDataURL('image/avif', finalConfig.quality);
        
        // Cek apakah browser mendukung encode AVIF
        // Jika tidak support, canvas akan mengembalikan 'image/png' (default fallback) atau string pendek
        if (dataUrl.startsWith('data:image/avif')) {
            console.log(`[ImageOptimizer] Success: AVIF Format (${width}x${height})`);
            finalize(dataUrl);
            return;
        }

        // TIER 2: Fallback to WebP
        // WebP didukung 97%+ browser modern
        dataUrl = canvas.toDataURL('image/webp', finalConfig.quality);
        if (dataUrl.startsWith('data:image/webp')) {
            console.log(`[ImageOptimizer] Fallback: WebP Format (${width}x${height})`);
            finalize(dataUrl);
            return;
        }

        // TIER 3: Absolute Last Resort (JPEG)
        // Hanya jika browser sangat tua dan tidak support WebP
        console.warn(`[ImageOptimizer] Fallback: JPEG (Browser does not support Modern Formats)`);
        dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        finalize(dataUrl);

      } catch (e) {
        console.error("[ImageOptimizer] Compression Error:", e);
        // Jika semua gagal, kembalikan JPEG rendah
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      }

      function finalize(url: string) {
        // Cleanup memory
        if (typeof source !== 'string') {
           URL.revokeObjectURL(img.src);
        }
        resolve(url);
      }
    };

    img.onerror = (err) => {
      // Error handling khusus untuk CORS (Gambar dari web yang diproteksi)
      if (typeof source === 'string') {
         console.warn("[ImageOptimizer] CORS Error or Invalid URL. Using original URL instead.");
         // Jika gagal dikompres karena CORS, kembalikan URL aslinya saja agar tetap tampil
         resolve(source); 
      } else {
         reject(new Error("Gagal memuat gambar. Pastikan file tidak rusak."));
      }
    };
  });
};