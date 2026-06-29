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

function postRow(row) {
  const post = {
    id: row.id,
    category_id: row.category_id,
    author_id: row.author_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    featured_image: row.featured_image,
    tags: parseJson(row.tags, null),
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    status: row.status,
    published_at: row.published_at,
    views: row.views,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  if ("category_name" in row) {
    post.category = row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null
  }

  if ("author_name" in row) {
    post.author = row.author_id
      ? {
          id: row.author_id,
          name: row.author_name,
          avatar: row.author_avatar,
        }
      : null
  }

  return post
}

function pagination(page, perPage, total, path = "") {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const pageUrl = (targetPage) => `${path}?page=${targetPage}`

  return {
    current_page: page,
    first_page_url: pageUrl(1),
    last_page: lastPage,
    last_page_url: pageUrl(lastPage),
    links: [
      { url: page > 1 ? pageUrl(page - 1) : null, label: "&laquo; Previous", page: page > 1 ? page - 1 : null, active: false },
      ...Array.from({ length: lastPage }).map((_, index) => {
        const targetPage = index + 1
        return { url: pageUrl(targetPage), label: String(targetPage), page: targetPage, active: targetPage === page }
      }),
      { url: page < lastPage ? pageUrl(page + 1) : null, label: "Next &raquo;", page: page < lastPage ? page + 1 : null, active: false },
    ],
    next_page_url: page < lastPage ? pageUrl(page + 1) : null,
    path,
    per_page: perPage,
    prev_page_url: page > 1 ? pageUrl(page - 1) : null,
    from: total === 0 ? null : (page - 1) * perPage + 1,
    to: total === 0 ? null : Math.min(page * perPage, total),
    total,
  }
}

async function publishedBlogPosts(config, params = {}) {
  const page = Math.max(1, Number(params.page || 1))
  const perPage = Math.min(24, Math.max(1, Number(params.per_page || 12)))
  const offset = (page - 1) * perPage
  const sqlParams = {}
  const filters = ["p.status = 'published'", "p.published_at IS NOT NULL"]

  if (params.category) {
    filters.push("c.slug = :category")
    sqlParams.category = params.category
  }

  if (params.tag) {
    filters.push("p.tags::jsonb ? :tag")
    sqlParams.tag = params.tag
  }

  const where = filters.join(" AND ")
  const countRows = await query(
    config,
    `
      SELECT COUNT(*) AS total
      FROM blog_posts p
      LEFT JOIN blog_categories c ON c.id = p.category_id
      WHERE ${where}
    `,
    sqlParams
  )
  const total = Number(countRows[0]?.total || 0)

  const rows = await query(
    config,
    `
      SELECT
        p.id, p.category_id, p.user_id AS author_id, p.title, p.slug, p.excerpt,
        p.featured_image, p.tags, p.published_at, p.views,
        c.name AS category_name, c.slug AS category_slug,
        u.name AS author_name, u.avatar AS author_avatar
      FROM blog_posts p
      LEFT JOIN blog_categories c ON c.id = p.category_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE ${where}
      ORDER BY p.published_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `,
    sqlParams
  )

  const meta = pagination(page, perPage, total, params.path || "")

  return {
    ...meta,
    data: rows.map(postRow),
  }
}

async function publishedBlogPostBySlug(config, slug) {
  const rows = await query(
    config,
    `
      SELECT
        p.id, p.category_id, p.user_id AS author_id, p.title, p.slug, p.excerpt,
        p.content AS body,
        p.featured_image, p.tags, p.meta_title, p.meta_description, p.status,
        p.published_at, p.views, p.created_at, p.updated_at,
        c.name AS category_name, c.slug AS category_slug,
        u.name AS author_name, u.avatar AS author_avatar
      FROM blog_posts p
      LEFT JOIN blog_categories c ON c.id = p.category_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.slug = :slug
        AND p.status = 'published'
      LIMIT 1
    `,
    { slug }
  )

  if (!rows.length) return null
  return postRow(rows[0])
}

async function blogCategories(config) {
  const rows = await query(
    config,
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.created_at,
        c.updated_at,
        COUNT(p.id) AS posts_count
      FROM blog_categories c
      LEFT JOIN blog_posts p ON p.category_id = c.id
        AND p.status = 'published'
      GROUP BY c.id, c.name, c.slug, c.description, c.created_at, c.updated_at
      ORDER BY c.name ASC
    `
  )

  return rows.map((row) => ({
    ...row,
    posts_count: Number(row.posts_count || 0),
  }))
}

module.exports = { blogCategories, publishedBlogPostBySlug, publishedBlogPosts }
