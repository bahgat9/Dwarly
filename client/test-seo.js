// Simple test script to verify SEO implementation
// Run this after deployment to test the sitemap and robots.txt

const testUrls = [
  'https://dwarly.vercel.app/sitemap.xml',
  'https://dwarly.vercel.app/robots.txt',
  'https://dwarly.vercel.app/sitemap-index.xml'
];

console.log('Testing SEO implementation...\n');

testUrls.forEach(async (url) => {
  try {
    const response = await fetch(url);
    const content = await response.text();
    
    console.log(`✅ ${url}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content Length: ${content.length} characters`);
    
    if (url.includes('sitemap.xml')) {
      const hasUrls = content.includes('<url>');
      const hasUrlset = content.includes('<urlset');
      console.log(`   Valid XML: ${hasUrlset && hasUrls ? '✅' : '❌'}`);
    }
    
    if (url.includes('robots.txt')) {
      const hasSitemap = content.includes('Sitemap:');
      const hasUserAgent = content.includes('User-agent:');
      console.log(`   Valid robots.txt: ${hasSitemap && hasUserAgent ? '✅' : '❌'}`);
    }
    
    console.log('');
  } catch (error) {
    console.log(`❌ ${url} - Error: ${error.message}\n`);
  }
});

console.log('Test completed. Check the results above.');
