export default function handler(req, res) {
  // Set the content type to text/plain
  res.setHeader('Content-Type', 'text/plain');
  
  // Get the base URL from environment or use a default
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://dwarly.vercel.app'; // Replace with your actual domain
  
  // Generate the robots.txt content
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Disallow private/admin areas
Disallow: /admin/
Disallow: /academy/
Disallow: /user/
Disallow: /api/

# Allow important public pages
Allow: /
Allow: /academies
Allow: /job-opportunities
Allow: /login
Allow: /signup
Allow: /academy-request

# Crawl delay (optional - helps prevent overloading)
Crawl-delay: 1`;

  // Send the robots.txt
  res.status(200).send(robotsTxt);
}
