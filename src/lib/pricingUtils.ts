/**
 * Utility functions for calculating dynamic prices based on dimensions, area, and printing factors.
 */

export interface DimensionParseResult {
  width: number;
  height: number;
  area: number;
  unit: 'in' | 'cm' | 'mm' | 'px';
}

/**
 * Extracts numeric dimensions and area from a spec value (e.g. "4x6", "4\" x 6\"", "5 x 7 in", "4*11")
 * or from explicit horizontal/vertical fields.
 */
export function parseDimensions(valueStr: string, horizontal?: number, vertical?: number, metric?: string): DimensionParseResult | null {
  // 1. If horizontal and vertical are explicitly given and valid
  if (horizontal && vertical && horizontal > 0 && vertical > 0) {
    const unit = (metric || 'in').toLowerCase().trim() as 'in' | 'cm' | 'mm' | 'px';
    let areaInches = horizontal * vertical;
    if (unit === 'cm') {
      areaInches = (horizontal / 2.54) * (vertical / 2.54);
    } else if (unit === 'mm') {
      areaInches = (horizontal / 25.4) * (vertical / 25.4);
    }
    return {
      width: horizontal,
      height: vertical,
      area: areaInches,
      unit: unit === 'cm' || unit === 'mm' || unit === 'px' ? unit : 'in',
    };
  }

  // 2. Parse from text string (e.g., "4x6", "5\"x7\"", "4.25 x 11 in", "8.5*5.5")
  if (!valueStr) return null;
  const clean = valueStr.toLowerCase().replace(/["']/g, ' ').trim();
  const match = clean.match(/([0-9.]+)\s*(?:x|by|\*|\/)\s*([0-9.]+)/);
  if (!match) return null;

  const w = parseFloat(match[1]);
  const h = parseFloat(match[2]);
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;

  let unit: 'in' | 'cm' | 'mm' | 'px' = 'in';
  if (clean.includes('cm')) unit = 'cm';
  else if (clean.includes('mm')) unit = 'mm';
  else if (clean.includes('px')) unit = 'px';

  let areaInches = w * h;
  if (unit === 'cm') {
    areaInches = (w / 2.54) * (h / 2.54);
  } else if (unit === 'mm') {
    areaInches = (w / 25.4) * (h / 25.4);
  }

  return {
    width: w,
    height: h,
    area: areaInches,
    unit,
  };
}

/**
 * Calculates dynamic price based on product base price, base size, and selected specs.
 * Uses the proportional area formula calibrated for commercial printing:
 * Factor = 1 + (SelectedArea / BaseArea - 1) * MaterialWeightFactor (default 0.75)
 */
export function calculateDynamicPrice(
  product: any,
  selectedSpecs: Record<string, string>,
  quantity: number = 1
): { unitPrice: number; baseCalculatedPrice: number; sizeMarkup: number } {
  if (!product) return { unitPrice: 0, baseCalculatedPrice: 0, sizeMarkup: 0 };

  // 1. Initial base price
  let basePrice = Number(product.basePrice) || 0;

  // Check if any selected attribute defines isBasePrice
  Object.entries(selectedSpecs).forEach(([group, value]) => {
    const match = product.specs?.find((s: any) => s.group === group && s.value === value);
    if (match && match.isBasePrice) {
      basePrice = Number(match.priceMarkup);
    }
  });

  // 2. Detect Size specs
  const sizeGroupKey = Object.keys(selectedSpecs).find(
    k => k.toLowerCase() === 'size' || k.toLowerCase() === 'tamaño' || k.toLowerCase() === 'tamano' || k.toLowerCase() === 'dimensions'
  );

  let sizeMarkup = 0;
  let sizeFoundAndParsed = false;

  if (sizeGroupKey) {
    const selectedSizeVal = selectedSpecs[sizeGroupKey];
    const sizeSpecsList = product.specs?.filter((s: any) => s.group === sizeGroupKey) || [];
    const currentSpec = sizeSpecsList.find((s: any) => s.value === selectedSizeVal);

    // If current spec has explicit markup configured (and it's not 0 or is percentage/flat override)
    // and user intentionally configured markup in admin, we honor manual markup if specified.
    // However, if manual markup is 0 or user relies on automatic sizing:
    const hasManualMarkup = currentSpec && Number(currentSpec.priceMarkup) > 0;

    if (!hasManualMarkup && sizeSpecsList.length > 1) {
      // Find the base (smallest or reference) size spec
      const parsedSizes = sizeSpecsList
        .map((spec: any) => ({
          spec,
          dims: parseDimensions(spec.value, spec.horizontal, spec.vertical, spec.metric),
        }))
        .filter((item: any) => item.dims !== null);

      if (parsedSizes.length > 1) {
        // Find smallest area as the reference base
        parsedSizes.sort((a: any, b: any) => a.dims.area - b.dims.area);
        const baseSizeItem = parsedSizes[0];
        const currentDims = parseDimensions(
          selectedSizeVal,
          currentSpec?.horizontal,
          currentSpec?.vertical,
          currentSpec?.metric
        );

        if (currentDims && baseSizeItem.dims.area > 0) {
          const areaRatio = currentDims.area / baseSizeItem.dims.area;
          if (areaRatio > 1.0) {
            // Standard industrial scale factor (0.75 accounts for shared machine make-ready / cutting overhead)
            const scaleFactor = 1 + (areaRatio - 1) * 0.75;
            sizeMarkup = basePrice * (scaleFactor - 1);
            sizeFoundAndParsed = true;
          }
        }
      }
    }
  }

  // 3. Current quantity from specs (e.g. Qty: 500) or argument
  let specQty = 1;
  let hasQtySpec = false;
  Object.entries(selectedSpecs).forEach(([k, v]) => {
    if (k.toLowerCase().includes('quantity') || k.toLowerCase().includes('cantidad') || k.toLowerCase() === 'qty') {
      const parsed = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        specQty = parsed;
        hasQtySpec = true;
      }
    }
  });
  const activeQty = hasQtySpec ? specQty : quantity;

  // 4. Sum other specifications markups
  let otherMarkups = 0;
  const baseForMarkup = basePrice + sizeMarkup;

  Object.entries(selectedSpecs).forEach(([group, value]) => {
    const match = product.specs?.find((s: any) => s.group === group && s.value === value);
    if (match) {
      if (match.isBasePrice) return;
      // If this was the size group and was calculated via area ratio, skip double adding
      if (sizeFoundAndParsed && (group.toLowerCase() === 'size' || group.toLowerCase() === 'tamaño')) return;

      const markup = Number(match.priceMarkup) || 0;
      if (match.markupType === 'PERCENTAGE') {
        otherMarkups += (baseForMarkup * markup) / 100;
      } else if (match.markupType === 'MULTIPLY_BY_QTY') {
        otherMarkups += markup * activeQty;
      } else {
        otherMarkups += markup;
      }
    }
  });

  const finalUnitPrice = basePrice + sizeMarkup + otherMarkups;

  return {
    unitPrice: Math.max(0, finalUnitPrice),
    baseCalculatedPrice: basePrice,
    sizeMarkup,
  };
}
