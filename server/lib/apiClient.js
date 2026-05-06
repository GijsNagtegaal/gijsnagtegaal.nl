const defaultImageKeys = new Set(['image', 'icon', 'thumbnail', 'avatar', 'cover']);

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function withAbsoluteAssetUrls(value, { apiBaseUrl, imageKeys = defaultImageKeys }) {
  if (!value) return value;

  if (Array.isArray(value)) {
    return value.map((item) => withAbsoluteAssetUrls(item, { apiBaseUrl, imageKeys }));
  }

  if (isPlainObject(value)) {
    const result = { ...value };

    for (const [key, nestedValue] of Object.entries(result)) {
      const isImageField = imageKeys.has(key) && typeof nestedValue === 'string' && nestedValue.length > 0;

      if (isImageField) {
        result[key] = nestedValue.startsWith('http') ? nestedValue : `${apiBaseUrl}/assets/${nestedValue}`;
        continue;
      }

      if (nestedValue && typeof nestedValue === 'object') {
        result[key] = withAbsoluteAssetUrls(nestedValue, { apiBaseUrl, imageKeys });
      }
    }

    return result;
  }

  return value;
}

export function createApiClient({ apiBaseUrl }) {
  const normalizedBaseUrl = normalizeBaseUrl(apiBaseUrl);

  async function fetchItems(collection) {
    const response = await fetch(`${normalizedBaseUrl}/items/${collection}`);
    if (!response.ok) {
      throw new Error(`API error on ${collection}: ${response.status}`);
    }

    const json = await response.json();
    return withAbsoluteAssetUrls(json.data, { apiBaseUrl: normalizedBaseUrl });
  }

  return { fetchItems };
}

