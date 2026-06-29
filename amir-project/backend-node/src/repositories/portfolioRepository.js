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

function portfolioRow(row) {
  return {
    ...row,
    images: parseJson(row.images, null),
    tech_stack: parseJson(row.tech_stack, null),
    results: parseJson(row.results, null),
    is_featured: toBool(row.is_featured),
    is_active: toBool(row.is_active),
  }
}

async function activePortfolioItems(config, category = "") {
  const params = {}
  const categoryWhere = category ? "AND category = :category" : ""
  if (category) params.category = category

  const rows = await query(
    config,
    `
      SELECT id, title, slug, category, short_description, thumbnail, tech_stack,
             is_featured, completed_at, live_url
      FROM portfolio_items
      WHERE is_active = 1
        ${categoryWhere}
      ORDER BY sort_order ASC, completed_at DESC
    `,
    params
  )

  const categoryRows = await query(
    config,
    `
      SELECT DISTINCT category
      FROM portfolio_items
      WHERE is_active = 1
        AND category IS NOT NULL
      ORDER BY category ASC
    `
  )

  return {
    items: rows.map(portfolioRow),
    categories: categoryRows.map((row) => row.category),
  }
}

async function activePortfolioItemBySlug(config, slug) {
  const rows = await query(
    config,
    `
      SELECT id, title, slug, category, description, short_description, thumbnail,
             images, tech_stack, results, live_url, is_featured, is_active,
             sort_order, completed_at, meta_title, meta_description, created_at, updated_at
      FROM portfolio_items
      WHERE slug = :slug
        AND is_active = 1
      LIMIT 1
    `,
    { slug }
  )

  if (!rows.length) return null
  return portfolioRow(rows[0])
}

module.exports = { activePortfolioItems, activePortfolioItemBySlug }
