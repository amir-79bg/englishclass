// Canonical category definitions shared by validation and the bundle writer.
// Runtime metadata is derived from data/categories.json so labels, icons,
// colours and allowed word categories cannot drift apart again.
const definitions = require('../data/categories.json');

const CATS = Object.keys(definitions);

function validateCategoryDefinitions() {
  const errors = [];
  const labels = new Set();
  for (const [key, meta] of Object.entries(definitions)) {
    if (!/^[a-z][a-z0-9_-]*$/.test(key)) errors.push(`invalid category key "${key}"`);
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
      errors.push(`category "${key}" must be an object`);
      continue;
    }
    if (!String(meta.label || '').trim()) errors.push(`category "${key}" has no label`);
    else if (labels.has(meta.label)) errors.push(`duplicate category label "${meta.label}"`);
    else labels.add(meta.label);
    if (!/^[A-Z][A-Za-z0-9]*$/.test(String(meta.icon || ''))) errors.push(`category "${key}" has invalid icon`);
    if (!/^#[0-9a-f]{6}$/i.test(String(meta.color || ''))) errors.push(`category "${key}" has invalid color`);
    if (!['topic', 'grammar', 'fallback'].includes(meta.type)) errors.push(`category "${key}" has invalid type "${meta.type}"`);
  }
  if (!definitions.general) errors.push('required fallback category "general" is missing');
  return errors;
}

function categoryAsset() {
  return Object.fromEntries(Object.entries(definitions).map(([key, meta]) => [
    key, [meta.icon, meta.color, meta.label]
  ]));
}

module.exports = { definitions, CATS, validateCategoryDefinitions, categoryAsset };
