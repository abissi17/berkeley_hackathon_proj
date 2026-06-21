/**
 * Scrape autism/developmental health providers near a zip code using
 * Browserbase + Playwright DOM selectors (no LLM API key needed).
 *
 * Usage:  node scrape_providers.mjs <zip_code>
 * Output: JSON array of providers written to stdout.
 */

import { Stagehand } from "@browserbasehq/stagehand";

const zip = process.argv[2] || "94704";
const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
  process.stderr.write("Missing BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID\n");
  process.exit(1);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function scrapePsychologyToday(page) {
  // Autism-specific search on Psychology Today
  const url = `https://www.psychologytoday.com/us/therapists/${zip}?spec=autism-spectrum-disorder`;
  process.stderr.write(`Scraping Psychology Today: ${url}\n`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(4000);

  const providers = await page.evaluate(() => {
    const results = [];

    // Real profile URLs end with a standalone 6+ digit ID: /us/therapists/name-city-st/1234567
    const profileLinks = Array.from(document.querySelectorAll("a[href]")).filter(a => {
      return /\/us\/therapists\/[^?#\/]+-[a-z]{2}\/\d{6,}$/.test(a.href);
    });

    // Deduplicate by href
    const seen = new Set();
    profileLinks.forEach(a => {
      if (seen.has(a.href)) return;
      seen.add(a.href);

      const name = a.innerText.trim();
      if (!name || name.length < 4 || /^(view|profile|click|more)$/i.test(name)) return;

      // Walk up to find the card container and extract more info
      let card = a.closest("[class*='profile'], [class*='result'], [class*='card'], li, article");
      let type = "Therapist";
      let address = "";
      let phone = "";

      if (card) {
        // Specialties
        const specEl = card.querySelector("[class*='special'], [class*='taxonomy'], [class*='tags']");
        if (specEl) type = specEl.innerText.replace(/\n+/g, ", ").trim() || type;

        // Location
        const locEl = card.querySelector("[class*='location'], [class*='city'], [class*='address']");
        if (locEl) address = locEl.innerText.trim();

        // Phone
        const phoneEl = card.querySelector("a[href^='tel:']");
        if (phoneEl) phone = phoneEl.href.replace("tel:", "").trim();
      }

      results.push({ name, type, address, phone, website: a.href });
    });

    return results;
  });

  process.stderr.write(`[PT] Found ${providers.length} therapist profiles\n`);

  // If we got profiles, try to enrich the first few with location data
  if (providers.length > 0 && !providers[0].address) {
    const enriched = await page.evaluate(() => {
      // Try to find location info in text near each profile link
      const results = [];
      document.querySelectorAll("a[href]").forEach(a => {
        if (!/\/us\/therapists\/.+-\d+$/.test(a.href)) return;
        const name = a.innerText.trim();
        if (!name || name.length < 4) return;

        // Only real profile URLs: /us/therapists/name-city-st/1234567
        if (!/\/us\/therapists\/[^?#\/]+-[a-z]{2}\/\d{6,}$/.test(a.href)) return;

        // Search sibling/parent text for city, state pattern
        const parent = a.parentElement?.parentElement?.parentElement;
        const parentText = parent ? parent.innerText : "";
        const cityMatch = parentText.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/);
        const phoneMatch = parentText.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);

        results.push({
          name,
          type: "Therapist — Autism Spectrum",
          address: cityMatch ? cityMatch[1].trim() : "",
          phone: phoneMatch ? phoneMatch[0] : "",
          website: a.href,
        });
      });

      // Deduplicate by href
      const seen = new Set();
      return results.filter(r => {
        if (seen.has(r.website)) return false;
        seen.add(r.website);
        return true;
      });
    });
    if (enriched.length > 0) return enriched;
  }

  return providers;
}

async function scrapeGoogleMaps(page) {
  const query = encodeURIComponent(`autism therapist near ${zip}`);
  const url = `https://www.google.com/maps/search/${query}`;
  process.stderr.write(`Scraping Google Maps: ${url}\n`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(5000);

  const providers = await page.evaluate(() => {
    const results = [];
    // Google Maps result list items
    const items = document.querySelectorAll(
      "[role='article'], .Nv2PK, .lI9IFe, [jsaction*='mouseover']"
    );

    items.forEach(item => {
      const nameEl = item.querySelector(
        ".qBF1Pd, .fontHeadlineSmall, .NrDZNb, [aria-label]"
      );
      if (!nameEl) return;
      const name = (nameEl.innerText || nameEl.getAttribute("aria-label") || "").trim();
      // Skip garbage entries: too short/long, newlines, all-lowercase UI strings, known Maps chrome
      const UI_JUNK = new Set(["stars", "close", "open", "closed", "directions", "save", "share", "website", "call"]);
      if (!name || name.length < 4 || name.length > 120 || name.includes("\n")) return;
      if (UI_JUNK.has(name.toLowerCase())) return;
      if (/^[a-z\s·]+$/.test(name)) return; // all-lowercase = UI element, not a business name

      // Category label (often 2nd line under name)
      const spans = item.querySelectorAll(".W4Efsd span, .Io6YTe");
      let type = "";
      let address = "";
      spans.forEach((s, i) => {
        const t = s.innerText.trim().replace(/^·\s*/, "");
        if (!t || t === "·") return;
        if (i === 0 && !type) type = t;
        else if (!address && t.match(/\d+\s+\w+/)) address = t;
      });

      // Phone — try tel: link first, then regex on item text
      const phoneEl = item.querySelector("a[href^='tel:']");
      let phone = phoneEl ? phoneEl.href.replace("tel:", "").trim() : "";
      if (!phone) {
        const phoneMatch = item.innerText.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
        if (phoneMatch) phone = phoneMatch[0];
      }

      const linkEl = item.querySelector("a[href*='maps/place'], a[data-cid]");
      const website = linkEl ? linkEl.href : "";

      results.push({
        name,
        type: type || "Mental health provider",
        address: address.replace(/^·\s*/, "") || "",
        phone,
        website,
      });
    });

    return results;
  });

  process.stderr.write(`[Maps] Found ${providers.length} listings\n`);
  return providers;
}

async function scrape() {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: BROWSERBASE_API_KEY,
    projectId: BROWSERBASE_PROJECT_ID,
    verbose: 0,
  });

  try {
    await stagehand.init();
    const page = stagehand.context.pages()[0] || await stagehand.context.newPage();

    // Psychology Today first — best structured therapist data
    let providers = await scrapePsychologyToday(page);

    // Supplement with Google Maps
    if (providers.length < 4) {
      const maps = await scrapeGoogleMaps(page);
      const seen = new Set(providers.map(p => p.name.toLowerCase()));
      for (const p of maps) {
        if (p.name && !seen.has(p.name.toLowerCase())) {
          providers.push(p);
          seen.add(p.name.toLowerCase());
        }
      }
    }

    process.stderr.write(`[total] Returning ${providers.length} providers\n`);
    process.stdout.write(JSON.stringify(providers.slice(0, 10)));
  } finally {
    await stagehand.close();
  }
}

scrape().catch(err => {
  process.stderr.write(`Scraping error: ${err.message}\n`);
  process.stdout.write("[]");
  process.exit(0);
});
