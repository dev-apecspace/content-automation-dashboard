
export interface WatermarkSettings {
  xPercent: number; // 0-100
  yPercent: number; // 0-100
  widthPercent: number; // 0-100 (Relative to image width)
  opacity: number; // 0-100
}

/**
 * Generates a Cloudinary URL with a watermark overlay.
 * Handles both existing Cloudinary URLs (via transformation injection)
 * and external URLs (via fetch format).
 */
export function generateWatermarkedUrl(
  originalUrl: string,
  logoUrl: string,
  settings: WatermarkSettings
): string {
  if (!originalUrl || !logoUrl) return originalUrl;

  const { xPercent, yPercent, widthPercent, opacity } = settings;

  // 2. Construct Transformation String
  const widthDecimal = Math.max(0.01, widthPercent / 100).toFixed(2);
  const xDecimal = (xPercent / 100).toFixed(2);
  const yDecimal = (yPercent / 100).toFixed(2);
  
  let layerPart = "";

  // Attempt to use native Cloudinary layering if possible (Same Cloud)
  // Check if logoUrl matches standard Cloudinary pattern
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const isCloudinaryLogo = logoUrl.includes("res.cloudinary.com") && logoUrl.includes("/upload/");
  
  // Extract Cloud Name from Logo URL to verify it matches current environment (or original image's cloud)
  // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/...
  const logoCloudMatch = logoUrl.match(/res\.cloudinary\.com\/([^/]+)\//);
  const logoCloudName = logoCloudMatch ? logoCloudMatch[1] : null;

  // We can use native layering `l_{public_id}` if the logo is in the SAME cloud account as the transformation context.
  // The context is determined by the `originalUrl` or `CLOUD_NAME` if using fetch.
  // Assumption: If originalUrl is cloudinary, it's likely from the same cloud as our env.
  // If originalUrl is external (fetch), we use our env CLOUD_NAME.
  
  const currentCloudName = CLOUD_NAME || logoCloudName; // Best effort to guess current context
  
  if (isCloudinaryLogo && logoCloudName === currentCloudName) {
      // Extract Public ID
      // Structure: .../upload/{version?}/{folder/}/{public_id}.{format}
      // Or .../upload/{public_id}
      // Regex strategy: find /upload/, skip optional v123/, capture everything until dot (or end).
      const matches = logoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[a-zA-Z0-9]+)?$/);
      if (matches && matches[1]) {
          // Replace slashes with colons for layer syntax
          const publicId = matches[1].replace(/\//g, ":");
          layerPart = `l_${publicId}`;
      }
  }

  // Fallback to l_fetch if extraction failed or different cloud
  if (!layerPart) {
      const base64Logo = btoa(logoUrl).replace(/\//g, "_").replace(/\+/g, "-");
      layerPart = `l_fetch:${base64Logo}`;
  }
  
  const transformation = `${layerPart}/c_scale,fl_relative,w_${widthDecimal}/fl_layer_apply,g_north_west,x_${xDecimal},y_${yDecimal},fl_relative,o_${opacity}`;

  // 3. Inject into URL
  if (originalUrl.includes("/upload/")) {
    const parts = originalUrl.split("/upload/");
    // Check if it's a "fetch" url already? 
    // If originalUrl is `.../upload/v123/my-image.jpg` -> `.../upload/{transformation}/v123/my-image.jpg`
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  } else {
    // External URL: Use Cloudinary Fetch
    // Format: https://res.cloudinary.com/{cloud_name}/image/fetch/{transformation}/{external_url}
    
    // Try to find cloud name from environment or fallback to extraction from logoUrl
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/fetch/${transformation}/${originalUrl}`;
    }
    
    // Fallback: Try to extract from logoUrl if valid cloudinary url
    if (logoUrl.includes("res.cloudinary.com")) {
      const baseMatch = logoUrl.match(/(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/)/);
      if (baseMatch) {
         return `${baseMatch[1]}fetch/${transformation}/${originalUrl}`;
      }
    }
    
    // If we truly cannot find a cloud name, we cannot apply the watermark via Cloudinary.
    // Return original URL (or potentially throw error if critical).
    console.warn("Cannot apply watermark: Missing Cloudinary Cloud Name for external image fetch.");
    return originalUrl;
  }
}
