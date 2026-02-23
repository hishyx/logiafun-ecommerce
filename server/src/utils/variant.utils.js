export function variantKey(values) {
  if (!values || typeof values !== "object") {
    return "";
  }

  return Reflect.ownKeys(values)
    .sort()
    .map((k) => `${k}:${String(values[k]).toLowerCase().trim()}`)
    .join("|");
}

export function hasDuplicateVariants(variants) {
  const seen = new Set();

  for (const variant of variants) {
    const key = variantKey(variant.values);

    if (seen.has(key)) {
      return true;
    }

    seen.add(key);
  }

  return false;
}
