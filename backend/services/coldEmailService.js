import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

class ColdEmailService {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.geminiApiKey = process.env.GEMINI_API_KEY;

    if (this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }

  /**
   * Search Google for company URLs - First API
   * @param {string} companyName - The company name to search
   * @returns {Promise<Array>} Array of URLs with metadata
   */
  async searchCompanyLinks(companyName) {
    try {
      const urls = [];

      // Try Google Custom Search API first
      if (this.googleApiKey && this.searchEngineId) {
        try {
          const url = 'https://www.googleapis.com/customsearch/v1';
          const params = {
            key: this.googleApiKey,
            cx: this.searchEngineId,
            q: `${companyName} contact email site:`,
            num: 10
          };

          const response = await axios.get(url, { params, timeout: 10000 });

          if (response.data && response.data.items) {
            response.data.items.forEach(item => {
              urls.push({
                url: item.link,
                title: item.title,
                snippet: item.snippet,
                displayLink: item.displayLink,
                source: 'google'
              });
            });
          }
        } catch (error) {
          console.error('Google Custom Search API error:', error.message);
        }
      }

      // Add fallback URLs for common domains
      const cleanName = companyName.toLowerCase().replace(/\s+/g, '');
      const fallbackDomains = [
        // Main domains
        { url: `https://www.${cleanName}.com`, title: `${companyName} - .com` },
        { url: `https://www.${cleanName}.in`, title: `${companyName} - .in` },
        { url: `https://www.${cleanName}.co.in`, title: `${companyName} - .co.in` },
        { url: `https://www.${cleanName}.io`, title: `${companyName} - .io` },
        { url: `https://www.${cleanName}.net`, title: `${companyName} - .net` },
        { url: `https://www.${cleanName}.org`, title: `${companyName} - .org` },
        { url: `https://www.${cleanName}.co`, title: `${companyName} - .co` },
        { url: `https://www.${cleanName}.co.uk`, title: `${companyName} - .co.uk` },
        { url: `https://www.${cleanName}.ai`, title: `${companyName} - .ai` },

        // Contact pages
        { url: `https://${cleanName}.com/contact`, title: `${companyName} - Contact (.com)` },
        { url: `https://${cleanName}.in/contact`, title: `${companyName} - Contact (.in)` },
        { url: `https://${cleanName}.com/contact-us`, title: `${companyName} - Contact Us (.com)` },
        { url: `https://${cleanName}.in/contact-us`, title: `${companyName} - Contact Us (.in)` },
        { url: `https://${cleanName}.com/about`, title: `${companyName} - About (.com)` },
        { url: `https://${cleanName}.in/about`, title: `${companyName} - About (.in)` },
        { url: `https://${cleanName}.com/about-us`, title: `${companyName} - About Us (.com)` },
        { url: `https://${cleanName}.in/about-us`, title: `${companyName} - About Us (.in)` },
        { url: `https://${cleanName}.com/team`, title: `${companyName} - Team (.com)` },
        { url: `https://${cleanName}.in/team`, title: `${companyName} - Team (.in)` },
      ];

      // Add fallback URLs with metadata
      fallbackDomains.forEach(domain => {
        urls.push({
          ...domain,
          snippet: `Check ${domain.title} for contact information`,
          displayLink: new URL(domain.url).hostname,
          source: 'fallback'
        });
      });

      // Remove duplicates based on URL
      const uniqueUrls = [];
      const seenUrls = new Set();

      urls.forEach(item => {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          uniqueUrls.push(item);
        }
      });

      return uniqueUrls;
    } catch (error) {
      console.error('Error searching company links:', error);
      throw error;
    }
  }

  /**
   * Process a single URL to extract emails and discover new links
   * @param {string} url - The URL to process
   * @param {number} depth - Current depth of crawling (0 = main page, 1 = linked page)
   * @param {Set} processedUrls - Set of already processed URLs
   * @returns {Promise<Object>} Object containing emails and new links found
   */
  async processUrl(url, depth = 0, processedUrls = new Set()) {
    const result = {
      url,
      emails: [],
      links: [],
      error: null,
      processed: false
    };

    // Skip if already processed
    if (processedUrls.has(url)) {
      result.processed = true;
      return result;
    }

    try {
      // Add to processed set
      processedUrls.add(url);

      // Scrape the URL
      const html = await this.scrapeUrl(url);
      if (!html) {
        result.error = 'Failed to fetch page';
        return result;
      }

      // Extract emails using multiple methods
      const emails = new Set();

      // Method 1: Regex extraction
      const regexEmails = this.extractEmailsWithRegex(html);
      regexEmails.forEach(email => emails.add(email.toLowerCase()));

      // Method 2: AI extraction if available
      if (this.geminiApiKey && depth === 0) { // Only use AI for main pages to save API calls
        try {
          const textContent = this.extractTextFromHtml(html);
          const aiEmails = await this.extractEmailsWithAI(textContent, url);
          aiEmails.forEach(email => emails.add(email.toLowerCase()));
        } catch (error) {
          console.error('AI extraction error:', error.message);
        }
      }

      // Convert Set to Array
      result.emails = Array.from(emails);

      // Extract links if depth is 0 (only from main pages)
      if (depth === 0) {
        const $ = cheerio.load(html);
        const baseUrl = new URL(url);

        // Find all links on the page
        $('a[href]').each((index, element) => {
          const href = $(element).attr('href');
          if (href) {
            try {
              let fullUrl;
              if (href.startsWith('http')) {
                fullUrl = href;
              } else if (href.startsWith('/')) {
                fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
              } else {
                fullUrl = `${baseUrl.protocol}//${baseUrl.host}/${href}`;
              }

              // Filter for relevant pages (contact, about, team, etc.)
              const relevantKeywords = ['contact', 'about', 'team', 'staff', 'people', 'email', 'support', 'help'];
              const lowerUrl = fullUrl.toLowerCase();

              if (relevantKeywords.some(keyword => lowerUrl.includes(keyword))) {
                // Check if it's the same domain
                const linkUrl = new URL(fullUrl);
                if (linkUrl.host === baseUrl.host && !processedUrls.has(fullUrl)) {
                  result.links.push({
                    url: fullUrl,
                    text: $(element).text().trim().substring(0, 50)
                  });
                }
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });

        // Limit links to prevent too many requests
        result.links = result.links.slice(0, 5);
      }

    } catch (error) {
      result.error = error.message;
      console.error(`Error processing ${url}:`, error.message);
    }

    return result;
  }

  /**
   * Scrape HTML from a URL
   */
  async scrapeUrl(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Extract text content from HTML
   */
  extractTextFromHtml(html) {
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script').remove();
    $('style').remove();

    // Get text content
    let text = $('body').text();

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Limit text length for AI processing
    if (text.length > 10000) {
      text = text.substring(0, 10000);
    }

    return text;
  }

  /**
   * Extract emails using regex
   */
  extractEmailsWithRegex(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];

    // Filter out common non-email patterns
    const filtered = matches.filter(email => {
      const lower = email.toLowerCase();
      // Skip images and example emails
      return !lower.includes('.png') &&
             !lower.includes('.jpg') &&
             !lower.includes('.jpeg') &&
             !lower.includes('.gif') &&
             !lower.includes('example.com') &&
             !lower.includes('test.com') &&
             !lower.includes('your-email') &&
             !lower.includes('email@') &&
             email.length < 100; // Reasonable email length
    });

    return [...new Set(filtered)]; // Remove duplicates
  }

  /**
   * Extract emails using AI
   */
  async extractEmailsWithAI(text, companyContext = '') {
    if (!this.geminiApiKey || !text) return [];

    try {
      const prompt = `Extract all valid email addresses from the following text.
      Context: This is from a company website (${companyContext}).
      Only return actual email addresses, not placeholders or examples.
      Return the emails as a comma-separated list.
      If no emails are found, return "NONE".

      Text:
      ${text}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const emails = response.text();

      if (emails.toUpperCase().includes('NONE') || !emails) {
        return [];
      }

      // Parse the response
      const emailList = emails.split(',').map(e => e.trim()).filter(e => {
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(e);
      });

      return emailList;
    } catch (error) {
      console.error('Error with Gemini AI:', error);
      return [];
    }
  }
}

export default new ColdEmailService();