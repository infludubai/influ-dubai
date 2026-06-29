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

function pageRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    is_active: toBool(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function publicPageBySlug(config, slug) {
  const rows = await query(
    config,
    `
      SELECT id, slug, title, meta_title, meta_description, is_active, created_at, updated_at
      FROM pages
      WHERE slug = :slug
        AND is_active = 1
      LIMIT 1
    `,
    { slug }
  )

  if (!rows.length) return null

  const page = pageRow(rows[0])
  const publishedRows = await query(
    config,
    `
      SELECT layout
      FROM builder_pages
      WHERE page_id = :pageId
        AND status = 'published'
      ORDER BY version DESC
      LIMIT 1
    `,
    { pageId: page.id }
  )

  const layout = parseJson(publishedRows[0]?.layout, null)

  return {
    page,
    layout,
    published_json: layout,
  }
}

module.exports = { publicPageBySlug }
