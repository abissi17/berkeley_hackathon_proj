"""
Anthropic Claude API integration for roadmap generation, letter drafting,
and chat responses.

Currently returns MOCK data.  When the Anthropic API key is configured
in .env, swap the mock paths for real API calls.
"""

import os
import json

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


# ---------------------------------------------------------------------------
# Mock data — used when ANTHROPIC_API_KEY is not set
# ---------------------------------------------------------------------------

MOCK_ROADMAP = [
    {
        "title": "Schedule a developmental evaluation",
        "description": (
            "Contact your pediatrician to request a comprehensive "
            "developmental evaluation. If there is a wait, ask to be put on "
            "the cancellation list."
        ),
        "timeline": "This week",
        "priority": "high",
        "category": "medical",
    },
    {
        "title": "Contact your school district for an assessment",
        "description": (
            "Under IDEA, your child may qualify for a free evaluation through "
            "the school district. Write a letter requesting an assessment — "
            "we've drafted one in the Letters tab."
        ),
        "timeline": "Within 2 weeks",
        "priority": "high",
        "category": "school",
    },
    {
        "title": "Connect with a speech-language pathologist",
        "description": (
            "Given your concerns about communication, a speech evaluation is "
            "a good starting point. Many SLPs have waitlists — call several "
            "to find the soonest availability."
        ),
        "timeline": "Within 2–4 weeks",
        "priority": "high",
        "category": "therapy",
    },
    {
        "title": "Check your insurance coverage for therapy services",
        "description": (
            "Call your insurance provider and ask what developmental and "
            "rehabilitative therapy services are covered. Ask specifically "
            "about speech therapy, occupational therapy, and ABA if relevant."
        ),
        "timeline": "This week",
        "priority": "medium",
        "category": "insurance",
    },
    {
        "title": "Explore Early Start / Regional Center services",
        "description": (
            "If your child is under 3, California's Early Start program "
            "provides free early intervention services regardless of income. "
            "Contact your local regional center to request an intake."
        ),
        "timeline": "Within 2 weeks",
        "priority": "high",
        "category": "support",
    },
    {
        "title": "Keep a behavior and concern journal",
        "description": (
            "Document specific examples of behaviors or milestones that "
            "concern you. Note dates, settings, and what happened before "
            "and after. This journal will be invaluable during evaluations."
        ),
        "timeline": "Ongoing",
        "priority": "medium",
        "category": "support",
    },
    {
        "title": "Find a parent support group",
        "description": (
            "Connecting with other parents who have navigated similar "
            "challenges can provide emotional support and practical tips. "
            "Many groups meet virtually."
        ),
        "timeline": "When ready",
        "priority": "low",
        "category": "support",
    },
]

MOCK_LETTERS = {
    "school": (
        "[YOUR NAME]\n"
        "[YOUR ADDRESS]\n"
        "[CITY, STATE ZIP]\n"
        "[DATE]\n\n"
        "[SCHOOL DISTRICT NAME]\n"
        "[DISTRICT ADDRESS]\n\n"
        "To the Director of Special Education:\n\n"
        "I am writing to formally request a comprehensive evaluation for my child, "
        "[CHILD NAME], who is [AGE] months old and resides within the "
        "[SCHOOL DISTRICT NAME] school district.\n\n"
        "I have concerns regarding my child's development in the following areas:\n"
        "- [List specific concerns]\n\n"
        "Under the Individuals with Disabilities Education Act (IDEA), I am "
        "requesting that the school district conduct a full and individual "
        "evaluation to determine whether my child is eligible for special "
        "education and related services.\n\n"
        "I understand that the district must respond to this request within "
        "15 calendar days and complete the evaluation within 60 calendar days "
        "of receiving my signed consent.\n\n"
        "Please contact me at [YOUR PHONE] to schedule the assessment. "
        "I look forward to working with you.\n\n"
        "Sincerely,\n"
        "[YOUR NAME]"
    ),
    "insurance": (
        "[YOUR NAME]\n"
        "[YOUR ADDRESS]\n"
        "[CITY, STATE ZIP]\n"
        "[DATE]\n\n"
        "[INSURANCE COMPANY NAME]\n"
        "[INSURANCE ADDRESS]\n\n"
        "Re: Request for Coverage — Member ID [YOUR MEMBER ID]\n\n"
        "To Whom It May Concern:\n\n"
        "I am writing to request coverage for developmental and therapeutic "
        "services for my child, [CHILD NAME], who is covered under my health "
        "plan (Member ID: [YOUR MEMBER ID]).\n\n"
        "My child's pediatrician has recommended evaluation for [developmental "
        "concerns / speech delay / other]. These evaluations, and any "
        "subsequently recommended therapies, are medically necessary services "
        "under the Early and Periodic Screening, Diagnostic and Treatment "
        "(EPSDT) benefit.\n\n"
        "Please provide written confirmation of coverage for:\n"
        "1. Comprehensive developmental evaluation\n"
        "2. Speech-language therapy (if recommended)\n"
        "3. Occupational therapy (if recommended)\n"
        "4. Applied Behavior Analysis (ABA) therapy (if recommended)\n\n"
        "If you require additional documentation, please specify what is needed "
        "and I will provide it promptly.\n\n"
        "Sincerely,\n"
        "[YOUR NAME]"
    ),
    "regional_center": (
        "[YOUR NAME]\n"
        "[YOUR ADDRESS]\n"
        "[CITY, STATE ZIP]\n"
        "[DATE]\n\n"
        "[REGIONAL CENTER NAME]\n"
        "[REGIONAL CENTER ADDRESS]\n\n"
        "Re: Request for Early Start / Intake Evaluation\n\n"
        "To the Intake Coordinator:\n\n"
        "I am writing to request an evaluation for my child, [CHILD NAME], "
        "who is [AGE] months old and lives in [CITY, CA ZIP CODE].\n\n"
        "I have concerns about my child's development in the areas of "
        "[communication / social skills / behavior / motor skills]. "
        "I believe my child may be eligible for early intervention services "
        "through the California Early Start program.\n\n"
        "Under the Individuals with Disabilities Education Act (IDEA) Part C "
        "and the California Early Intervention Services Act, I request that "
        "you conduct an intake and evaluation to determine eligibility for "
        "services.\n\n"
        "I can be reached at [YOUR PHONE]. I understand that the regional "
        "center must respond within 45 calendar days.\n\n"
        "Thank you for your assistance.\n\n"
        "Sincerely,\n"
        "[YOUR NAME]"
    ),
}


def _inject_child_context(template: str, child: dict) -> str:
    """Replace placeholders in a letter with child context where possible."""
    replacements = {
        "[CHILD NAME]": child.get("child_name", "[CHILD NAME]"),
        "[AGE]": str(child.get("child_age_months", "[AGE]")),
        "[ZIP CODE]": child.get("zip_code", "[ZIP CODE]"),
        "[CITY, STATE ZIP]": child.get("zip_code", "[CITY, STATE ZIP]"),
    }
    for k, v in replacements.items():
        template = template.replace(k, v)
    return template


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def generate_roadmap_and_letters(intake_data: dict) -> dict:
    """
    Generate a personalized roadmap and three draft letters based on
    intake form data.

    In production this calls the Anthropic API.  For local development
    without an API key, it returns realistic mock data keyed to the
    child's name and concerns.
    """
    child_name = intake_data.get("child_name", "your child")
    concerns = intake_data.get("concerns", "")

    # Use real API when key is present
    if ANTHROPIC_API_KEY:
        return _call_claude_for_roadmap(intake_data)

    # --- mock path ---
    roadmap = MOCK_ROADMAP
    letters = {
        k: _inject_child_context(v, intake_data) for k, v in MOCK_LETTERS.items()
    }
    return {"roadmap": roadmap, "letters": letters}


def _call_claude_for_roadmap(intake_data: dict) -> dict:
    """
    Real Anthropic API call.  Implemented when the API key is present.
    Stub for now — returns mock data as a fallback.
    """
    # TODO: implement with anthropic SDK
    return {
        "roadmap": MOCK_ROADMAP,
        "letters": {
            k: _inject_child_context(v, intake_data)
            for k, v in MOCK_LETTERS.items()
        },
    }


def get_chat_reply(intake_data: dict, history: list[dict], message: str) -> str:
    """
    Return a context-aware chat reply.

    When ANTHROPIC_API_KEY is set, calls Claude with the full system
    prompt + history.  Otherwise returns a mock reply.
    """
    if ANTHROPIC_API_KEY:
        return _call_claude_for_chat(intake_data, history, message)

    # --- mock path ---
    child_name = intake_data.get("child_name", "your child")
    diagnosis = intake_data.get("diagnosis_status", "none")

    mock_replies = {
        "evaluation": (
            f"The best place to start is by requesting a developmental "
            f"evaluation through your pediatrician. They can refer you to "
            f"a specialist. You can also request an evaluation through "
            f"your school district under IDEA — this is your legal right "
            f"and the evaluation is free."
        ),
        "insurance": (
            f"Check your insurance plan's Summary of Benefits for "
            f"'rehabilitative therapy' or 'habilitative services.' "
            f"Call the member services number on your card and ask "
            f"specifically about speech therapy and occupational therapy "
            f"coverage for children. Get any approvals in writing."
        ),
        "iep": (
            f"An IEP (Individualized Education Program) is a legal document "
            f"under IDEA. First, request an evaluation in writing. Once "
            f"eligibility is determined, the school must develop an IEP "
            f"within 30 days. You are an equal member of the IEP team."
        ),
    }

    msg_lower = message.lower()
    for keyword, reply in mock_replies.items():
        if keyword in msg_lower:
            return reply

    return (
        f"Thank you for asking about {child_name}. Based on what you've "
        f"shared, I recommend discussing this with your child's doctor. "
        f"Every child develops differently, and a professional can help "
        f"determine what next steps make sense for your situation."
    )


def _call_claude_for_chat(intake_data: dict, history: list[dict], message: str) -> str:
    """Real Claude chat call.  Stub — returns mock fallback."""
    return get_chat_reply(intake_data, history, message)
