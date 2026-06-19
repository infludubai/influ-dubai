<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            ['key' => 'site_name', 'value' => 'Amir Nazir', 'type' => 'string', 'group' => 'general', 'label' => 'Site Name'],
            ['key' => 'site_tagline', 'value' => 'Premium Digital Services – Web Design, Development & SEO', 'type' => 'string', 'group' => 'general', 'label' => 'Tagline'],
            ['key' => 'admin_email', 'value' => 'info@a-mir.com', 'type' => 'string', 'group' => 'general', 'label' => 'Admin Email'],
            ['key' => 'phone', 'value' => '', 'type' => 'string', 'group' => 'general', 'label' => 'Phone/WhatsApp'],
            ['key' => 'address', 'value' => '', 'type' => 'string', 'group' => 'general', 'label' => 'Business Address'],
            ['key' => 'logo_url', 'value' => '', 'type' => 'image', 'group' => 'general', 'label' => 'Logo'],
            ['key' => 'favicon_url', 'value' => '', 'type' => 'image', 'group' => 'general', 'label' => 'Favicon'],
            // SEO
            ['key' => 'meta_title', 'value' => 'Amir Nazir – Web Design, Development & Digital Services', 'type' => 'string', 'group' => 'seo', 'label' => 'Default Meta Title'],
            ['key' => 'meta_description', 'value' => 'Amir Nazir offers premium web design, development, SEO, and digital marketing services. Get a professional website that converts.', 'type' => 'string', 'group' => 'seo', 'label' => 'Default Meta Description'],
            ['key' => 'og_image', 'value' => '', 'type' => 'image', 'group' => 'seo', 'label' => 'OG Image'],
            ['key' => 'google_analytics_id', 'value' => '', 'type' => 'string', 'group' => 'seo', 'label' => 'Google Analytics ID'],
            // Social
            ['key' => 'facebook_url', 'value' => '', 'type' => 'string', 'group' => 'social', 'label' => 'Facebook URL'],
            ['key' => 'instagram_url', 'value' => '', 'type' => 'string', 'group' => 'social', 'label' => 'Instagram URL'],
            ['key' => 'twitter_url', 'value' => '', 'type' => 'string', 'group' => 'social', 'label' => 'Twitter/X URL'],
            ['key' => 'linkedin_url', 'value' => '', 'type' => 'string', 'group' => 'social', 'label' => 'LinkedIn URL'],
            ['key' => 'youtube_url', 'value' => '', 'type' => 'string', 'group' => 'social', 'label' => 'YouTube URL'],
            ['key' => 'whatsapp_number', 'value' => '', 'type' => 'string', 'group' => 'social', 'label' => 'WhatsApp Number'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], $setting);
        }

        $pages = [
            ['slug' => 'home', 'title' => 'Home'],
            ['slug' => 'services', 'title' => 'Services'],
            ['slug' => 'portfolio', 'title' => 'Portfolio'],
            ['slug' => 'pricing', 'title' => 'Pricing'],
            ['slug' => 'about', 'title' => 'About'],
            ['slug' => 'blog', 'title' => 'Blog'],
            ['slug' => 'contact', 'title' => 'Contact'],
        ];

        foreach ($pages as $page) {
            Page::firstOrCreate(['slug' => $page['slug']], array_merge($page, [
                'meta_title' => $page['title'] . ' – Amir Nazir',
                'is_active' => true,
            ]));
        }
    }
}
