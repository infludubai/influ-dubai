const { query } = require("../db/postgres")

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function toBool(value) {
  return value === true || value === 1 || value === "1"
}

function packageRow(row) {
  return {
    ...row,
    features: parseJson(row.features, null),
    is_featured: toBool(row.is_featured),
    is_active: toBool(row.is_active),
  }
}

function addonRow(row) {
  return {
    ...row,
    is_active: toBool(row.is_active),
  }
}

async function activeAddons(config) {
  const rows = await query(
    config,
    `
      SELECT id, name, description, price, delivery_days_extra, billing_type, is_active, sort_order, created_at, updated_at
      FROM addons
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `
  )

  return rows.map(addonRow)
}

async function addonsForPackages(config, packageIds) {
  if (!packageIds.length) return new Map()

  const placeholders = packageIds.map((_, index) => `:id${index}`).join(", ")
  const params = Object.fromEntries(packageIds.map((id, index) => [`id${index}`, id]))
  const rows = await query(
    config,
    `
      SELECT
        pa.package_id,
        a.id,
        a.name,
        a.description,
        a.price,
        a.billing_type,
        a.delivery_days_extra,
        a.is_active,
        a.sort_order,
        a.created_at,
        a.updated_at
      FROM package_addons pa
      INNER JOIN addons a ON a.id = pa.addon_id
      WHERE pa.package_id IN (${placeholders})
        AND a.is_active = 1
      ORDER BY a.sort_order ASC, a.id ASC
    `,
    params
  )

  return rows.reduce((map, row) => {
    const packageId = row.package_id
    const addon = addonRow({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      billing_type: row.billing_type,
      delivery_days_extra: row.delivery_days_extra,
      is_active: row.is_active,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      pivot: {
        package_id: packageId,
        addon_id: row.id,
      },
    })

    if (!map.has(packageId)) map.set(packageId, [])
    map.get(packageId).push(addon)
    return map
  }, new Map())
}

async function activePackages(config) {
  const rows = await query(
    config,
    `
      SELECT id, name, slug, description, short_description, price, currency, delivery_days,
             revisions, features, is_featured, is_active, sort_order, created_at, updated_at
      FROM packages
      WHERE is_active = 1
      ORDER BY sort_order ASC, price ASC
    `
  )

  const packages = rows.map(packageRow)
  const addonMap = await addonsForPackages(config, packages.map((item) => item.id))

  return packages.map((item) => ({
    ...item,
    addons: addonMap.get(item.id) || [],
  }))
}

async function activePackageBySlug(config, slug) {
  const rows = await query(
    config,
    `
      SELECT id, name, slug, description, short_description, price, currency, delivery_days,
             revisions, features, is_featured, is_active, sort_order, created_at, updated_at
      FROM packages
      WHERE slug = :slug
        AND is_active = 1
      LIMIT 1
    `,
    { slug }
  )

  if (!rows.length) return null

  const item = packageRow(rows[0])
  const addonMap = await addonsForPackages(config, [item.id])

  return {
    ...item,
    addons: addonMap.get(item.id) || [],
  }
}

module.exports = { activeAddons, activePackages, activePackageBySlug }
