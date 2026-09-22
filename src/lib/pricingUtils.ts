/**
 * Utility functions for calculating dynamic prices based on dimensions, area, 
 * printing factors, and multi-dimensional Pricing Matrix (SinaLite model).
 */

export interface DimensionParseResult {
  width: number;
  height: number;
  area: number;
  unit: 'in' | 'cm' | 'mm' | 'px';
}

export interface PricingMatrixRow {
  id?: string;
  specs: Record<string, string>; // e.g. { "Size": "4x6", "Qty": "100", "Sides": "Front", "Turnaround": "3 Business Day" }
  price: number;                 // e.g. 10.00
}

export interface ExclusionRule {
  id?: string;
  ifGroup: string;         // e.g. "Qty"
  ifValue: string;         // e.g. "300"
  thenExcludeGroup: string;// e.g. "Turnaround Time"
  thenExcludeValue: string;// e.g. "2 Business Days"
}

/**
 * Parses exclusion rules safely from a product object.
 */
export function parseExclusionRules(rawRules: any): ExclusionRule[] {
  if (!rawRules) return [];
  if (Array.isArray(rawRules)) return rawRules;
  if (typeof rawRules === 'string') {
    try {
      const parsed = JSON.parse(rawRules);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Checks whether a specific option (group + value) is currently excluded/disabled
 * based on active selected specs and the product's exclusion rules.
 */
export function isOptionExcluded(
  group: string,
  value: string,
  selectedSpecs: Record<string, string>,
  exclusionRules: ExclusionRule[]
): boolean {
  if (!exclusionRules || exclusionRules.length === 0) return false;

  return exclusionRules.some((rule) => {
    // Check target match (case-insensitive)
    if (normalizeVal(rule.thenExcludeGroup) !== normalizeVal(group)) return false;
    if (normalizeVal(rule.thenExcludeValue) !== normalizeVal(value)) return false;

    // Check condition match
    // Find matching selected key for rule.ifGroup
    const selectedKey = Object.keys(selectedSpecs).find(
      (k) => normalizeVal(k) === normalizeVal(rule.ifGroup)
    );
    if (!selectedKey) return false;

    return normalizeVal(selectedSpecs[selectedKey]) === normalizeVal(rule.ifValue);
  });
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
 * Normalizes a string for matrix key comparison (case-insensitive, trims extra spaces and quotes).
 */
function normalizeVal(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Look up in a product's pricingMatrix for a matching row.
 * Returns the matched price, or null if no match found.
 */
export function lookupPricingMatrix(
  pricingMatrix: any,
  selectedSpecs: Record<string, string>
): number | null {
  if (!pricingMatrix) return null;

  let rows: PricingMatrixRow[] = [];
  if (Array.isArray(pricingMatrix)) {
    rows = pricingMatrix;
  } else if (typeof pricingMatrix === 'string') {
    try {
      const parsed = JSON.parse(pricingMatrix);
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
      return null;
    }
  } else if (typeof pricingMatrix === 'object' && Array.isArray(pricingMatrix.rows)) {
    rows = pricingMatrix.rows;
  }

  if (rows.length === 0) return null;

  // Find exact or best matching row
  // A row matches if every key specified in row.specs matches the selectedSpecs
  const match = rows.find((row) => {
    if (!row.specs || typeof row.specs !== 'object') return false;
    const requiredSpecs = Object.entries(row.specs);
    if (requiredSpecs.length === 0) return false;

    return requiredSpecs.every(([reqGroup, reqVal]) => {
      // Find matching group in selectedSpecs (case-insensitive)
      const selectedKey = Object.keys(selectedSpecs).find(
        (k) => normalizeVal(k) === normalizeVal(reqGroup)
      );
      if (!selectedKey) return false;
      const actualVal = selectedSpecs[selectedKey];
      return normalizeVal(actualVal) === normalizeVal(reqVal);
    });
  });

  if (match && typeof match.price === 'number') {
    return match.price;
  }

  return null;
}

/**
 * Calculates dynamic price based on:
 * 1. Multi-dimensional Pricing Matrix (SinaLite Combinatorial Grid) if configured.
 * 2. Proportional Area Formula (Fallback if multi-size without matrix).
 * 3. Base Price + ProductSpecs Markups.
 */
export function calculateDynamicPrice(
  product: any,
  selectedSpecs: Record<string, string>,
  quantity: number = 1
): { unitPrice: number; baseCalculatedPrice: number; sizeMarkup: number; isMatrixMatch: boolean } {
  if (!product) return { unitPrice: 0, baseCalculatedPrice: 0, sizeMarkup: 0, isMatrixMatch: false };

  // PRIORITY 1: Multi-Dimensional Pricing Matrix
  if (product.pricingMatrix) {
    const matrixPrice = lookupPricingMatrix(product.pricingMatrix, selectedSpecs);
    if (matrixPrice !== null && matrixPrice >= 0) {
      return {
        unitPrice: matrixPrice,
        baseCalculatedPrice: matrixPrice,
        sizeMarkup: 0,
        isMatrixMatch: true,
      };
    }
  }

  // PRIORITY 2: Dynamic Proportional / Option-based calculation
  let basePrice = Number(product.basePrice) || 0;

  // Detect Size specs
  const sizeGroupKey = Object.keys(selectedSpecs).find(
    (k) =>
      k.toLowerCase() === 'size' ||
      k.toLowerCase() === 'tamaño' ||
      k.toLowerCase() === 'tamano' ||
      k.toLowerCase() === 'dimensions'
  );
  const activeSizeVal = sizeGroupKey ? selectedSpecs[sizeGroupKey] : null;

  // Helper to find spec that matches group + value, prioritizing matching parentValue (activeSizeVal)
  const findMatchingSpec = (group: string, value: string) => {
    const normGroup = normalizeVal(group);
    const normValue = normalizeVal(value);

    const candidateSpecs = (product.specs || []).filter(
      (s: any) => normalizeVal(s.group) === normGroup && normalizeVal(s.value) === normValue
    );
    if (candidateSpecs.length === 0) return null;
    if (activeSizeVal) {
      const normActiveSize = normalizeVal(activeSizeVal);
      const parentMatch = candidateSpecs.find((s: any) => normalizeVal(s.parentValue) === normActiveSize);
      if (parentMatch) return parentMatch;
    }
    const globalMatch = candidateSpecs.find((s: any) => !s.parentValue);
    return globalMatch || candidateSpecs[0];
  };

  // Check if any selected attribute defines isBasePrice
  Object.entries(selectedSpecs).forEach(([group, value]) => {
    const match = findMatchingSpec(group, value);
    if (match && match.isBasePrice) {
      basePrice = Number(match.priceMarkup);
    }
  });

  let sizeMarkup = 0;
  let sizeFoundAndParsed = false;

  if (sizeGroupKey && activeSizeVal) {
    const selectedSizeVal = activeSizeVal;
    const sizeSpecsList = product.specs?.filter((s: any) => s.group === sizeGroupKey) || [];
    const currentSpec = sizeSpecsList.find((s: any) => s.value === selectedSizeVal);

    const hasManualMarkup = currentSpec && Number(currentSpec.priceMarkup) > 0;

    if (!hasManualMarkup && sizeSpecsList.length > 1) {
      const parsedSizes = sizeSpecsList
        .map((spec: any) => ({
          spec,
          dims: parseDimensions(spec.value, spec.horizontal, spec.vertical, spec.metric),
        }))
        .filter((item: any) => item.dims !== null);

      if (parsedSizes.length > 1) {
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
            const scaleFactor = 1 + (areaRatio - 1) * 0.75;
            sizeMarkup = basePrice * (scaleFactor - 1);
            sizeFoundAndParsed = true;
          }
        }
      }
    }
  }

  // Detect quantity
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

  // First pass: sum all non-percentage specifications markups (flat / multiplier)
  let nonPercentageMarkups = 0;
  const percentageSpecs: Array<{ match: any; markup: number }> = [];

  Object.entries(selectedSpecs).forEach(([group, value]) => {
    const match = findMatchingSpec(group, value);
    if (match) {
      if (match.isBasePrice) return;
      if (sizeFoundAndParsed && (group.toLowerCase() === 'size' || group.toLowerCase() === 'tamaño')) return;

      const markup = Number(match.priceMarkup) || 0;
      const mType = String(match.markupType || '').toUpperCase().trim();
      const isPercent = mType === 'PERCENTAGE' || mType === 'PERCENT' || mType === '%';
      const isMultiplyQty = mType === 'MULTIPLY_BY_QTY' || mType === 'MULTIPLY' || mType === 'QTY';

      if (isPercent) {
        percentageSpecs.push({ match, markup });
      } else if (isMultiplyQty) {
        nonPercentageMarkups += markup * activeQty;
      } else {
        nonPercentageMarkups += markup;
      }
    }
  });

  // Subtotal before applying percentage markups (e.g. Size $20 + Qty $10 = $30)
  const subtotalBeforePercent = basePrice + sizeMarkup + nonPercentageMarkups;

  // Second pass: apply percentage markups to the subtotal (e.g. 10% of $30 = $3 => $33)
  let percentageMarkups = 0;
  percentageSpecs.forEach(({ markup }) => {
    percentageMarkups += (subtotalBeforePercent * markup) / 100;
  });

  const finalUnitPrice = subtotalBeforePercent + percentageMarkups;

  return {
    unitPrice: Math.max(0, finalUnitPrice),
    baseCalculatedPrice: basePrice,
    sizeMarkup,
    isMatrixMatch: false,
  };
}
