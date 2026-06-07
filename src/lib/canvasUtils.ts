export function getCanvasDimensions(product: any, selectedSpecs: Record<string, string>, bleed = 0.25, dpi = 300) {
  if (!product) return { width: 1050, height: 600 };

  let baseWidth = product.widthPx || 1050;
  let baseHeight = product.heightPx || 600;

  // Case-insensitive key lookup for Size
  const sizeKey = Object.keys(selectedSpecs).find(k => k.toLowerCase() === 'size' || k.toLowerCase() === 'tamaño') || 'Size';
  const sizeVal = selectedSpecs[sizeKey] || '';

  if (sizeVal) {
    // Case-insensitive comparison for group and value
    const selectedSpec = product.specs?.find(
      (s: any) => 
        (s.group.toLowerCase() === 'size' || s.group.toLowerCase() === 'tamaño') && 
        s.value.toLowerCase().trim() === sizeVal.toLowerCase().trim()
    );
    if (selectedSpec && selectedSpec.horizontal > 0 && selectedSpec.vertical > 0) {
      const metric = (selectedSpec.metric || '').toLowerCase().trim();
      let calculatedW = selectedSpec.horizontal;
      let calculatedH = selectedSpec.vertical;

      if (metric === 'in') {
        calculatedW = (selectedSpec.horizontal + bleed) * dpi;
        calculatedH = (selectedSpec.vertical + bleed) * dpi;
      } else if (metric === 'cm') {
        const bleedCm = bleed * 2.54;
        const dpiCm = dpi / 2.54;
        calculatedW = (selectedSpec.horizontal + bleedCm) * dpiCm;
        calculatedH = (selectedSpec.vertical + bleedCm) * dpiCm;
      } else if (metric === 'px') {
        calculatedW = selectedSpec.horizontal + (bleed * dpi);
        calculatedH = selectedSpec.vertical + (bleed * dpi);
      } else {
        // Smart fallback: if values are small, assume inches
        if (selectedSpec.horizontal <= 30) {
          calculatedW = (selectedSpec.horizontal + bleed) * dpi;
          calculatedH = (selectedSpec.vertical + bleed) * dpi;
        } else {
          calculatedW = selectedSpec.horizontal + (bleed * dpi);
          calculatedH = selectedSpec.vertical + (bleed * dpi);
        }
      }

      baseWidth = Math.round(calculatedW);
      baseHeight = Math.round(calculatedH);
    } else {
      // Fallback to legacy regex string parsing if no structured dimensions exist
      const cleanStr = sizeVal.toLowerCase().trim();
      const match = cleanStr.match(/([0-9.]+)\s*(?:x|by|\*)\s*([0-9.]+)/);
      if (match) {
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);
        if (!isNaN(num1) && !isNaN(num2)) {
          const maxParsed = Math.max(num1, num2);
          const maxProductBase = Math.max(product.widthPx || 1050, product.heightPx || 600);
          const factor = maxProductBase / maxParsed;
          
          let calculatedW = Math.round(num1 * factor);
          let calculatedH = Math.round(num2 * factor);
          
          const isHorizontalDefault = (product.widthPx || 1050) >= (product.heightPx || 600);
          if (isHorizontalDefault) {
            baseWidth = Math.max(calculatedW, calculatedH);
            baseHeight = Math.min(calculatedW, calculatedH);
          } else {
            baseWidth = Math.min(calculatedW, calculatedH);
            baseHeight = Math.max(calculatedW, calculatedH);
          }
        }
      }
    }
  }

  // Adjust for Orientation changes (case-insensitive key lookup)
  const orientationKey = Object.keys(selectedSpecs).find(k => 
    k.toLowerCase() === 'orientation' || 
    k.toLowerCase() === 'orientación' || 
    k.toLowerCase() === 'orientacion'
  ) || 'Orientation';
  const orientationVal = selectedSpecs[orientationKey] || '';

  if (orientationVal.toLowerCase().includes('vertical') || orientationVal.toLowerCase() === 'vertical') {
    const w = baseWidth;
    const h = baseHeight;
    baseWidth = Math.min(w, h);
    baseHeight = Math.max(w, h);
  } else if (orientationVal.toLowerCase().includes('horizontal') || orientationVal.toLowerCase() === 'horizontal') {
    const w = baseWidth;
    const h = baseHeight;
    baseWidth = Math.max(w, h);
    baseHeight = Math.min(w, h);
  }

  return { width: baseWidth, height: baseHeight };
}
