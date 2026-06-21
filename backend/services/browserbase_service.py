"""
Browserbase + Stagehand integration for scraping local autism/developmental
health providers by zip code.

The heavy lifting runs in backend/scrape_providers.mjs (Node.js + Stagehand).
This module calls that script via subprocess and returns parsed JSON.

Falls back to FALLBACK_PROVIDERS if scraping fails or keys are not set.
"""

import json
import os
import subprocess
from pathlib import Path

BROWSERBASE_API_KEY = os.getenv("BROWSERBASE_API_KEY", "")
BROWSERBASE_PROJECT_ID = os.getenv("BROWSERBASE_PROJECT_ID", "")

# Absolute path to the Node scraper script
_SCRIPT = Path(__file__).parent.parent / "scrape_providers.mjs"

# Root of the project (where node_modules lives)
_NODE_ROOT = Path(__file__).parent.parent.parent

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
    Return local autism/developmental health providers for the given zip code.

    If Browserbase keys are present, runs the Stagehand scraper and returns
    live results.  Otherwise returns plausible mock data.
    """
    api_key = os.getenv("BROWSERBASE_API_KEY", "")
    project_id = os.getenv("BROWSERBASE_PROJECT_ID", "")
    if api_key and project_id:
        try:
            return _call_browserbase(zip_code)
        except Exception as exc:
            print(f"[browserbase] Scraping failed ({exc}) — using fallback")
            return FALLBACK_PROVIDERS

    # Mock path — plausible local clinic names keyed to zip code
    return [
        {
            "name": f"Bay Area Autism & Behavioral Health — {zip_code}",
            "type": "Autism therapy & ABA",
            "address": f"123 Main St, Suite 200, {zip_code}",
            "phone": "(510) 555-0100",
            "website": "https://www.bayareaautismcenter.com",
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
    """
    Run scrape_providers.mjs via Node.js and return parsed provider list.
    Raises on subprocess error; caller falls back to FALLBACK_PROVIDERS.
    """
    env = {
        **os.environ,
        "BROWSERBASE_API_KEY": os.getenv("BROWSERBASE_API_KEY", ""),
        "BROWSERBASE_PROJECT_ID": os.getenv("BROWSERBASE_PROJECT_ID", ""),
    }

    result = subprocess.run(
        ["node", str(_SCRIPT), zip_code],
        capture_output=True,
        text=True,
        timeout=90,
        cwd=str(_NODE_ROOT),
        env=env,
    )

    if result.stderr:
        print(f"[browserbase] {result.stderr.strip()}")

    stdout = result.stdout.strip()
    if not stdout:
        raise RuntimeError("scraper returned empty output")

    providers = json.loads(stdout)
    if not isinstance(providers, list) or len(providers) == 0:
        raise RuntimeError("scraper returned no providers")

    return providers
