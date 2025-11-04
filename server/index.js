
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dns from 'dns';
import whois from 'whois';
import axios from 'axios';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.post('/scan', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic URL validation and normalization
  let normalizedUrl;
  let domain;
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = 'https://' + url;
    } else {
      normalizedUrl = url;
    }
    const urlObj = new URL(normalizedUrl); // Validate URL format
    domain = urlObj.hostname;
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // DNS and WHOIS lookup
  let dnsInfo = {};
  let whoisInfo = {};
  let geoInfo = {};

  try {
    // DNS resolution
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(domain, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    dnsInfo.ipv4 = addresses;

    // Get MX records
    try {
      const mxRecords = await new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      dnsInfo.mx = mxRecords;
    } catch (e) {
      dnsInfo.mx = [];
    }

    // WHOIS lookup
    whoisInfo = await new Promise((resolve, reject) => {
      whois.lookup(domain, (err, data) => {
        if (err) resolve({}); // Don't fail on WHOIS errors
        else resolve(data);
      });
    });

    // IP Geolocation (using first IP)
    if (addresses && addresses.length > 0) {
      try {
        const geoResponse = await axios.get(`http://ip-api.com/json/${addresses[0]}`);
        geoInfo = geoResponse.data;
      } catch (e) {
        console.log('Geolocation lookup failed:', e.message);
      }
    }

  } catch (error) {
    console.log('DNS/WHOIS lookup failed:', error.message);
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // HTTP transaction logging
    const httpTransactions = [];
    const redirectChain = [];

    // Check for mixed content
    const mixedContent = [];
    const requests = [];
    page.on('request', (request) => {
      requests.push(request.url());
      if (normalizedUrl.startsWith('https://') && request.url().startsWith('http://')) {
        mixedContent.push(request.url());
      }
    });

    // Track HTTP transactions and redirects
    page.on('response', (response) => {
      const request = response.request();
      httpTransactions.push({
        url: response.url(),
        method: request.method(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        requestHeaders: request.headers(),
        timing: response.timing()
      });

      // Track redirects
      if (response.status() >= 300 && response.status() < 400) {
        const location = response.headers()['location'];
        if (location) {
          redirectChain.push({
            from: response.url(),
            to: location,
            status: response.status()
          });
        }
      }
    });

    const response = await page.goto(normalizedUrl, { waitUntil: 'networkidle2' });
    const securityDetails = response.securityDetails();

    const certificate = securityDetails ? {
      subjectName: securityDetails.subjectName(),
      issuer: securityDetails.issuer(),
      validFrom: securityDetails.validFrom(),
      validTo: securityDetails.validTo(),
      protocol: securityDetails.protocol(),
    } : null;

    const securityHeaders = response.headers();
    const cookies = await page.cookies();

    // Additional security checks
    const hasHttps = normalizedUrl.startsWith('https://');
    const hasHsts = securityHeaders['strict-transport-security'] !== undefined;
    const hasCsp = securityHeaders['content-security-policy'] !== undefined;
    const hasXFrameOptions = securityHeaders['x-frame-options'] !== undefined;
    const hasXContentTypeOptions = securityHeaders['x-content-type-options'] !== undefined;
    const hasReferrerPolicy = securityHeaders['referrer-policy'] !== undefined;

    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for additional requests

    // DOM analysis
    const domInfo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(script => ({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer,
        text: script.textContent ? script.textContent.substring(0, 200) + '...' : null
      }));

      const links = Array.from(document.querySelectorAll('link')).map(link => ({
        rel: link.rel,
        href: link.href,
        type: link.type
      }));

      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.action,
        method: form.method,
        enctype: form.enctype
      }));

      const iframes = Array.from(document.querySelectorAll('iframe')).map(iframe => ({
        src: iframe.src,
        width: iframe.width,
        height: iframe.height
      }));

      return {
        title: document.title,
        scripts: scripts.slice(0, 20), // Limit to first 20 scripts
        links: links.slice(0, 20), // Limit to first 20 links
        forms: forms.slice(0, 10), // Limit to first 10 forms
        iframes: iframes.slice(0, 10), // Limit to first 10 iframes
        totalScripts: scripts.length,
        totalLinks: links.length,
        totalForms: forms.length,
        totalIframes: iframes.length
      };
    });

    const screenshot = await page.screenshot({ encoding: 'base64' });

    await browser.close();

    res.json({
      screenshot,
      securityHeaders,
      cookies,
      certificate,
      securityAnalysis: {
        hasHttps,
        hasHsts,
        hasCsp,
        hasXFrameOptions,
        hasXContentTypeOptions,
        hasReferrerPolicy,
        mixedContent,
        totalRequests: requests.length,
      },
      dnsInfo,
      whoisInfo,
      geoInfo,
      httpTransactions: httpTransactions.slice(0, 50), // Limit to first 50 transactions
      redirectChain,
      domInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to scan the website' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
