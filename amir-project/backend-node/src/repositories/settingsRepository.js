const { query } = require("../db/postgres")

const PUBLIC_KEYS = [
  "builder_header",
  "builder_footer",
  "google_adsense_client",
  "google_site_verification",
  "google_site_verification_script",
  "google_tag_manager_id",
  "custom_head_scripts",
  "custom_body_scripts",
  "google_client_id",
  "github_client_id",
  "favicon_url",
]

async function getAdsTxtContent(config) {
  const rows = await query(config, `SELECT "value" FROM settings WHERE "key" = 'google_adsense_ads_txt' LIMIT 1`)
  return rows[0]?.value || ""
}

async function getPublicSettings(config) {
  const rows = await query(
    config,
    `
      SELECT "key", "value"
      FROM settings
      WHERE "group" IN ('general', 'social', 'seo')
         OR "key" IN (${PUBLIC_KEYS.map((_, index) => `:key${index}`).join(", ")})
         OR "key" LIKE 'page\\_%'
         OR "key" LIKE 'about\\_%'
         OR "key" IN ('logo_url', 'logo_url_light', 'logo_admin_url',
                      'logo_auth_width', 'logo_auth_height',
                      'logo_admin_width', 'logo_admin_height',
                      'favicon_url', 'site_name', 'site_tagline',
                      'contact_email', 'phone_number', 'address',
                      'facebook_url', 'twitter_url', 'linkedin_url',
                      'instagram_url', 'github_url')
    `,
    Object.fromEntries(PUBLIC_KEYS.map((key, index) => [`key${index}`, key]))
  )

  return rows.reduce((settings, row) => {
    settings[row.key] = row.value
    return settings
  }, {})
}

module.exports = { getPublicSettings, getAdsTxtContent }
