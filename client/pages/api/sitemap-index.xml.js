export default function handler(req, res) {
  // Set the content type to XML
  res.setHeader('Content-Type', 'application/xml');
  
  // Get the base URL from environment or use a default
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://dwarly.vercel.app'; // Replace with your actual domain
  
  // Generate the sitemap index XML
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

  // Send the sitemap index
  res.status(200).send(sitemapIndex);
}
