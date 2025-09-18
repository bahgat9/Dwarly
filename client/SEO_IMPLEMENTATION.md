# SEO Implementation Guide

This document outlines the SEO implementation for the Dwarly application, including sitemap and robots.txt configuration.

## Files Created

### 1. Sitemap Files
- `public/sitemap.xml` - Static sitemap (fallback)
- `pages/api/sitemap.xml.js` - Dynamic sitemap generator
- `pages/api/sitemap-index.xml.js` - Sitemap index for multiple sitemaps

### 2. Robots.txt Files
- `public/robots.txt` - Static robots.txt (fallback)
- `pages/api/robots.txt.js` - Dynamic robots.txt generator

### 3. Configuration
- `vercel.json` - Updated with proper headers and rewrites

## URLs Included in Sitemap

The following public URLs are included in the sitemap:

1. `/` - Homepage (Priority: 1.0, Daily updates)
2. `/academies` - Academies listing (Priority: 0.9, Weekly updates)
3. `/job-opportunities` - Job opportunities (Priority: 0.8, Weekly updates)
4. `/login` - Login page (Priority: 0.6, Monthly updates)
5. `/signup` - Signup page (Priority: 0.6, Monthly updates)
6. `/academy-request` - Academy access request (Priority: 0.7, Monthly updates)

## Robots.txt Configuration

The robots.txt file:
- Allows all search engines to crawl public pages
- Disallows access to private areas (`/admin/`, `/academy/`, `/user/`, `/api/`)
- Points to the sitemap location
- Includes a crawl delay to prevent overloading

## Vercel Configuration

The `vercel.json` file includes:
- Proper rewrites to serve dynamic sitemap and robots.txt
- Correct content-type headers for XML and text files
- Appropriate caching headers (1 hour cache)

## Testing the Implementation

After deployment, test the following URLs:

1. `https://your-domain.vercel.app/sitemap.xml`
2. `https://your-domain.vercel.app/robots.txt`
3. `https://your-domain.vercel.app/sitemap-index.xml`

## Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (your domain)
3. Verify ownership using one of the provided methods
4. Submit your sitemap at: `https://your-domain.vercel.app/sitemap.xml`
5. Monitor the sitemap status in the "Sitemaps" section

## Important Notes

- Update the domain in the sitemap files when you have your final domain
- The dynamic sitemap will automatically update the lastmod date
- Private routes (admin, academy, user) are excluded from the sitemap
- The implementation follows Google's sitemap protocol standards

## Maintenance

- Review and update the sitemap when adding new public pages
- Monitor Google Search Console for any sitemap errors
- Update the lastmod dates when content changes significantly
