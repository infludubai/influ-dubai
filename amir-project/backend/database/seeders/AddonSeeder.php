<?php

namespace Database\Seeders;

use App\Models\Addon;
use Illuminate\Database\Seeder;

class AddonSeeder extends Seeder
{
    public function run(): void
    {
        $addons = [
            ['name' => 'Extra Website Page', 'description' => 'Add one additional page to your website.', 'price' => 49.00, 'billing_type' => 'one_time', 'sort_order' => 1],
            ['name' => 'Multi-Language Website', 'description' => 'Add a second language to your website with full translation setup.', 'price' => 199.00, 'billing_type' => 'one_time', 'sort_order' => 2],
            ['name' => 'E-Commerce Setup', 'description' => 'Full online store setup with product pages and checkout.', 'price' => 299.00, 'billing_type' => 'one_time', 'sort_order' => 3],
            ['name' => 'Product Upload (25 Products)', 'description' => 'Upload and configure up to 25 products in your store.', 'price' => 79.00, 'billing_type' => 'one_time', 'sort_order' => 4],
            ['name' => 'Booking/Appointment System', 'description' => 'Online booking system with calendar and email confirmations.', 'price' => 149.00, 'billing_type' => 'one_time', 'sort_order' => 5],
            ['name' => 'WhatsApp Chat Integration', 'description' => 'WhatsApp floating chat button linked to your number.', 'price' => 29.00, 'billing_type' => 'one_time', 'sort_order' => 6],
            ['name' => 'Live Chat Integration', 'description' => 'Professional live chat widget with admin dashboard.', 'price' => 49.00, 'billing_type' => 'one_time', 'sort_order' => 7],
            ['name' => 'AI Chatbot Integration', 'description' => 'Smart AI chatbot trained on your business to answer customer questions 24/7.', 'price' => 199.00, 'billing_type' => 'one_time', 'sort_order' => 8],
            ['name' => 'Blog Setup', 'description' => 'Full blog section with categories, tags, and SEO-optimized layout.', 'price' => 99.00, 'billing_type' => 'one_time', 'sort_order' => 9],
            ['name' => 'SEO Starter Setup', 'description' => 'Basic on-page SEO optimization and Google Search Console setup.', 'price' => 149.00, 'billing_type' => 'one_time', 'sort_order' => 10],
            ['name' => 'Monthly SEO Management', 'description' => 'Ongoing monthly SEO work to improve your rankings.', 'price' => 199.00, 'billing_type' => 'monthly', 'sort_order' => 11],
            ['name' => 'Google Business Profile Setup', 'description' => 'Complete Google Business Profile creation and optimization.', 'price' => 79.00, 'billing_type' => 'one_time', 'sort_order' => 12],
            ['name' => 'Google Analytics + Search Console', 'description' => 'Full setup and configuration of Google Analytics 4 and Search Console.', 'price' => 69.00, 'billing_type' => 'one_time', 'sort_order' => 13],
            ['name' => 'Meta Pixel / TikTok Pixel Setup', 'description' => 'Install and configure Facebook/Instagram and TikTok tracking pixels.', 'price' => 59.00, 'billing_type' => 'one_time', 'sort_order' => 14],
            ['name' => 'Speed Optimization', 'description' => 'Comprehensive website speed optimization to achieve fast load times.', 'price' => 129.00, 'billing_type' => 'one_time', 'sort_order' => 15],
            ['name' => 'Security Hardening', 'description' => 'Advanced security setup including firewall, malware scanning, and backups.', 'price' => 99.00, 'billing_type' => 'one_time', 'sort_order' => 16],
            ['name' => 'Monthly Website Maintenance', 'description' => 'Monthly updates, security checks, and minor content changes.', 'price' => 99.00, 'billing_type' => 'monthly', 'sort_order' => 17],
            ['name' => 'Website Content Writing (5 Pages)', 'description' => 'Professional SEO-optimized content written for up to 5 pages.', 'price' => 149.00, 'billing_type' => 'one_time', 'sort_order' => 18],
            ['name' => 'Professional Copywriting', 'description' => 'Persuasive sales copy that converts visitors into customers.', 'price' => 199.00, 'billing_type' => 'one_time', 'sort_order' => 19],
            ['name' => 'Logo Design', 'description' => 'Professional logo design with 2 concepts and revisions.', 'price' => 149.00, 'billing_type' => 'one_time', 'sort_order' => 20],
            ['name' => 'Brand Identity Kit', 'description' => 'Full brand guide including logo, colors, fonts, and brand assets.', 'price' => 299.00, 'billing_type' => 'one_time', 'sort_order' => 21],
            ['name' => 'Social Media Post Designs (10)', 'description' => '10 custom-designed social media post templates for your brand.', 'price' => 99.00, 'billing_type' => 'one_time', 'sort_order' => 22],
            ['name' => 'Email Template Design', 'description' => 'Professional HTML email template matching your brand.', 'price' => 79.00, 'billing_type' => 'one_time', 'sort_order' => 23],
            ['name' => 'Payment Gateway Integration', 'description' => 'Online payment gateway integration (Stripe, PayPal, or local gateway).', 'price' => 149.00, 'billing_type' => 'one_time', 'sort_order' => 24],
            ['name' => 'Custom Lead Form + CRM', 'description' => 'Advanced lead capture form with CRM integration and automation.', 'price' => 129.00, 'billing_type' => 'one_time', 'sort_order' => 25],
            ['name' => 'Admin Dashboard Customization', 'description' => 'Custom admin panel features tailored to your business needs.', 'price' => 199.00, 'billing_type' => 'one_time', 'sort_order' => 26],
            ['name' => 'Extra Revision Package', 'description' => 'Add 3 extra revision rounds to your project.', 'price' => 49.00, 'billing_type' => 'one_time', 'sort_order' => 27],
            ['name' => 'Priority Delivery', 'description' => 'Get your project delivered in half the standard time.', 'price' => 99.00, 'billing_type' => 'one_time', 'sort_order' => 28],
            ['name' => 'Hosting + Email + Domain Setup', 'description' => 'Complete setup of hosting, domain, professional email, and SSL certificate.', 'price' => 79.00, 'billing_type' => 'one_time', 'sort_order' => 29],
        ];

        foreach ($addons as $addon) {
            Addon::firstOrCreate(['name' => $addon['name']], array_merge($addon, ['is_active' => true]));
        }
    }
}
