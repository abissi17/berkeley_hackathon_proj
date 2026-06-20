"""
Browserbase integration for scraping local therapy providers by zip code.

Currently returns MOCK data.  When the Browserbase API key is configured
in .env, the real scraping logic will search Psychology Today, ASHA,
Autism Speaks, and California regional center directories.

The FALLBACK_PROVIDERS list is always available so the Providers tab is
never blank during a demo.
"""

import os

BROWSERBASE_API_KEY = os.getenv("BROWSERBASE_API_KEY", "")
BROWSERBASE_PROJECT_ID = os.getenv("BROWSERBASE_PROJECT_ID", "")

# ---------------------------------------------------------------------------
# Fallback list — returned when scraping fails or no API key is configured.
# Always keep this populated.
# ---------------------------------------------------------------------------

FALLBACK_PROVIDERS = [
    {
        "name": "ASHA ProFind",
        "type": "Speech therapy",
        "address": "National directory",
        "phone": "800-638-8255",
        "website": "https://www.asha.org/profind/",
    },
    {
        "name": "Autism Speaks Provider Directory",
        "type": "ABA therapy",
        "address": "National directory",
        "phone": "",
        "website": "https://www.autismspeaks.org/resource-guide",
    },
    {
        "name": "CHADD",
        "type": "ADHD support",
        "address": "National directory",
        "phone": "800-233-4050",
        "website": "https://chadd.org",
    },
    {
        "name": "Early Start (California)",
        "type": "Early intervention",
        "address": "California statewide",
        "phone": "916-654-1690",
        "website": "https://www.dds.ca.gov/earlystart/",
    },
]


def scrape_providers(zip_code: str) -> list[dict]:
    """
    Scrape local provider directories for the given zip code.

    When Browserbase is configured, performs a live scrape.  Otherwise
    returns mock results with local-looking clinic names generated from
    the zip code.

    Returns a list of provider dicts with: name, type, address, phone, website.
    """
    if BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID:
        return _call_browserbase(zip_code)

    # --- mock path: generate plausible clinic names from zip code ---
    return [
        {
            "name": f"Bay Area Children's Therapy — {zip_code}",
            "type": "Speech & occupational therapy",
            "address": f"123 Main St, Suite 200, {zip_code}",
            "phone": "(510) 555-0100",
            "website": "https://www.bayareachildrenstherapy.com",
        },
        {
            "name": "Developmental Pathways Clinic",
            "type": "Developmental pediatrician",
            "address": f"456 Oak Ave, {zip_code}",
            "phone": "(510) 555-0123",
            "website": "https://www.devpathwaysclinic.com",
        },
        {
            "name": "Pacific Speech & Language Center",
            "type": "Speech therapy",
            "address": f"789 Elm Dr, {zip_code}",
            "phone": "(510) 555-0145",
            "website": "https://www.pacificspeech.com",
        },
        {
            "name": "Bright Start ABA Services",
            "type": "ABA therapy",
            "address": f"321 Park Blvd, Suite 100, {zip_code}",
            "phone": "(510) 555-0167",
            "website": "https://www.brightstartaba.com",
        },
        *FALLBACK_PROVIDERS,
    ]


def _call_browserbase(zip_code: str) -> list[dict]:
    """Real Browserbase scraping.  Stub — returns mock data for now."""
    return scrape_providers(zip_code)
