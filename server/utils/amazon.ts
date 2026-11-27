import * as cheerio from 'cheerio';

/**
 * Extract ASIN (Amazon Standard Identification Number) from Amazon URL
 * @param url - Amazon product URL
 * @returns ASIN or null if not found
 */
export function extractAsin(url: string): string | null {
  // Common ASIN patterns in Amazon URLs:
  // https://www.amazon.com/dp/B08N5WRWNW
  // https://www.amazon.com/product-name/dp/B08N5WRWNW
  // https://www.amazon.com/gp/product/B08N5WRWNW
  const asinPattern = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i;
  const match = url.match(asinPattern);
  return match ? match[1] : null;
}

/**
 * Fetch product information from Amazon URL
 * @param url - Amazon product URL
 * @returns Product info with title, imageUrl, and price
 */
export async function fetchProductInfo(url: string): Promise<{
  title: string | null;
  imageUrl: string | null;
  price: string | null;
}> {
  const result = {
    title: null as string | null,
    imageUrl: null as string | null,
    price: null as string | null,
  };

  try {
    // Fetch the Amazon page. The timeout stops a slow answer from holding the request open.
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Amazon page: ${response.status} ${response.statusText}`);
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title - try multiple selectors
    result.title =
      $('#productTitle').text().trim() ||
      $('h1.product-title').text().trim() ||
      $('span#productTitle').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      null;

    // Extract image - try multiple selectors
    const imgSrc =
      $('#landingImage').attr('src') ||
      $('#imgBlkFront').attr('src') ||
      $('.imgTagWrapper img').attr('src') ||
      $('img[data-old-hires]').attr('data-old-hires') ||
      $('meta[property="og:image"]').attr('content') ||
      null;

    if (imgSrc) {
      // Clean up image URL (remove size modifiers for higher quality)
      result.imageUrl = imgSrc.replace(/\._.*?_\./, '.');
    }

    // Extract price - try multiple selectors
    const priceWhole =
      $('.a-price .a-price-whole').first().text().trim() ||
      $('#priceblock_ourprice').text().trim() ||
      $('#priceblock_dealprice').text().trim() ||
      $('.a-price-whole').first().text().trim() ||
      null;

    const priceFraction = $('.a-price .a-price-fraction').first().text().trim() || null;

    if (priceWhole) {
      result.price = priceFraction ? `${priceWhole}${priceFraction}` : priceWhole;
      // Clean up price (remove extra whitespace)
      result.price = result.price.replace(/\s+/g, '');
    }

    // If no price found with those selectors, try text extraction
    if (!result.price) {
      const priceText = $('.a-price').first().text().trim();
      if (priceText) {
        const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
        if (priceMatch) {
          result.price = priceMatch[0];
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching Amazon product info:', error);
    return result;
  }
}
