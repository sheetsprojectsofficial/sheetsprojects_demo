import * as cheerio from 'cheerio';
import axios from 'axios';
import { URL } from 'url';

// Email regex pattern - improved to catch more email formats
const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

// Normalize URL
const normalizeUrl = (url, baseUrl) => {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return base.origin + url;
    }
    return new URL(url, baseUrl).href;
  } catch (error) {
    return null;
  }
};

// Generate potential URLs for a company
function generateCompanyUrls(companyName) {
  const cleanName = companyName.toLowerCase()
    .replace(/limited|ltd|inc|incorporated|corp|corporation|llc|pvt|private/gi, '')
    .trim()
    .replace(/\s+/g, '');

  const variations = [
    cleanName,
    cleanName.replace(/[^a-z0-9]/g, ''),
    companyName.toLowerCase().replace(/\s+/g, '-'),
    companyName.toLowerCase().replace(/\s+/g, '')
  ];

  const urls = [];
  const domains = ['.com', '.in', '.co.in', '.org', '.net', '.co', '.io', '.co.uk'];
  const prefixes = ['www.', ''];

  variations.forEach(variation => {
    domains.forEach(domain => {
      prefixes.forEach(prefix => {
        urls.push(`https://${prefix}${variation}${domain}`);
      });
    });
  });

  // Add specific pages
  const baseUrls = urls.slice(0, 5);
  const pages = ['/contact', '/about', '/contact-us', '/about-us', '/team', '/contactus', '/aboutus'];

  baseUrls.forEach(baseUrl => {
    pages.forEach(page => {
      urls.push(baseUrl + page);
    });
  });


  return [...new Set(urls)]; // Remove duplicates
}

// Search using Google-like query
async function searchCompany(companyName) {
  const urls = generateCompanyUrls(companyName);

  // Try to search using DuckDuckGo HTML version
  try {
    const searchQuery = `${companyName} email contact site:`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const extractedUrls = [];

    // Extract URLs from search results
    $('.result__url').each((i, element) => {
      const text = $(element).text();
      if (text && extractedUrls.length < 10) {
        const cleanUrl = text.replace(/\s+/g, '');
        if (cleanUrl.startsWith('http')) {
          extractedUrls.push(cleanUrl);
        } else {
          extractedUrls.push('https://' + cleanUrl);
        }
      }
    });

    // Also check links
    $('a.result__a').each((i, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('http') && !href.includes('duckduckgo') && extractedUrls.length < 15) {
        extractedUrls.push(href);
      }
    });

    // Combine with generated URLs
    return [...new Set([...extractedUrls, ...urls.slice(0, 20)])];

  } catch (error) {
    console.log('Search failed, using generated URLs:', error.message);
    return urls.slice(0, 30);
  }
}

// Extract emails from text content
function extractEmailsFromText(text) {
  const emails = new Set();
  const matches = text.match(emailRegex) || [];

  matches.forEach(email => {
    // Clean and validate email
    email = email.toLowerCase().trim();

    // Basic validation
    if (email.includes('@') &&
        email.includes('.') &&
        email.length > 5 &&
        email.length < 100 &&
        !email.includes('example') &&
        !email.includes('domain') &&
        !email.includes('email@') &&
        !email.includes('@email') &&
        !email.includes('your-email') &&
        !email.includes('noreply') &&
        !email.includes('no-reply') &&
        !email.includes('donotreply') &&
        !email.includes('.png') &&
        !email.includes('.jpg') &&
        !email.includes('.gif')) {
      emails.add(email);
    }
  });

  return Array.from(emails);
}

// Extract content from URL
async function extractContent(url, visitedUrls = new Set(), depth = 0, maxDepth = 1) {
  if (depth > maxDepth || visitedUrls.has(url)) {
    return { emails: [], links: [] };
  }

  visitedUrls.add(url);

  try {
    console.log(`📍 Extracting content from: ${url}`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    });

    if (response.status !== 200) {
      console.log(`❌ Status ${response.status} for ${url}`);
      return { emails: [], links: [] };
    }

    const $ = cheerio.load(response.data);

    // Remove script and style elements
    $('script').remove();
    $('style').remove();

    // Extract all text content
    const bodyText = $('body').text() || '';
    const htmlText = $.html() || '';

    // Look for emails in different places
    const emailsFromText = extractEmailsFromText(bodyText);
    const emailsFromHtml = extractEmailsFromText(htmlText);

    // Also look for mailto links
    $('a[href^="mailto:"]').each((i, element) => {
      const mailto = $(element).attr('href');
      if (mailto) {
        const email = mailto.replace('mailto:', '').split('?')[0];
        if (email && email.includes('@')) {
          emailsFromText.push(email.toLowerCase());
        }
      }
    });

    // Look for emails in specific elements
    $('p, div, span, li, td, footer, header').each((i, element) => {
      const text = $(element).text();
      const foundEmails = extractEmailsFromText(text);
      emailsFromText.push(...foundEmails);
    });

    // Combine all emails and remove duplicates
    const allEmails = [...new Set([...emailsFromText, ...emailsFromHtml])];

    // Extract internal links
    const links = [];
    const baseHostname = new URL(url).hostname;

    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      const linkText = $(element).text().toLowerCase();

      // Prioritize contact/about pages
      if (href && (linkText.includes('contact') || linkText.includes('about') ||
                   href.includes('contact') || href.includes('about'))) {
        const normalizedUrl = normalizeUrl(href, url);

        if (normalizedUrl &&
            normalizedUrl.includes(baseHostname) &&
            !visitedUrls.has(normalizedUrl) &&
            links.length < 10) {
          links.push(normalizedUrl);
        }
      }
    });

    console.log(`✅ Found ${allEmails.length} emails and ${links.length} links on ${url}`);
    return { emails: allEmails, links };

  } catch (error) {
    console.error(`❌ Error extracting from ${url}:`, error.message);
    return { emails: [], links: [] };
  }
}

// Main scraping function
async function scrapeCompanyData(companyName) {
  const allEmails = new Set();
  const processedUrls = new Set();
  const results = {
    company: companyName,
    emails: [],
    processedUrls: 0,
    status: 'processing'
  };

  try {
    console.log(`🔍 Starting scrape for: ${companyName}`);

    // Step 1: Get URLs to check
    const urlsToCheck = await searchCompany(companyName);

    if (urlsToCheck.length === 0) {
      results.status = 'no_results';
      return results;
    }

    console.log(`📋 Found ${urlsToCheck.length} URLs to check`);

    // Step 2: Process URLs
    for (let i = 0; i < Math.min(urlsToCheck.length, 20); i++) {
      const url = urlsToCheck[i];

      if (processedUrls.has(url)) continue;

      try {
        processedUrls.add(url);
        const content = await extractContent(url, new Set(), 0, 1);

        // Add emails
        content.emails.forEach(email => {
          allEmails.add(email.toLowerCase());
        });

        // Process some internal links
        for (let j = 0; j < Math.min(content.links.length, 3); j++) {
          const link = content.links[j];
          if (!processedUrls.has(link)) {
            try {
              processedUrls.add(link);
              const linkContent = await extractContent(link, new Set(), 1, 1);
              linkContent.emails.forEach(email => {
                allEmails.add(email.toLowerCase());
              });
            } catch (linkError) {
              console.error(`Error with link ${link}:`, linkError.message);
            }
          }
        }

        // Add delay to avoid rate limiting
        if (i < urlsToCheck.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (urlError) {
        console.error(`Error with URL ${url}:`, urlError.message);
      }

      // Stop if we found enough emails
      if (allEmails.size > 10) {
        console.log('Found sufficient emails, stopping search');
        break;
      }
    }

    // Final filtering
    const filteredEmails = [...allEmails].filter(email => {
      // Additional validation
      const parts = email.split('@');
      return parts.length === 2 && parts[1].includes('.');
    });

    results.emails = filteredEmails;
    results.processedUrls = processedUrls.size;
    results.status = filteredEmails.length > 0 ? 'completed' : 'no_emails_found';

    console.log(`✅ Scraping completed. Found ${filteredEmails.length} emails from ${processedUrls.size} URLs`);

  } catch (error) {
    console.error('❌ Scraping error:', error);
    results.status = 'error';
    results.error = error.message;
  }

  return results;
}

export {
  scrapeCompanyData,
  searchCompany,
  extractContent
};