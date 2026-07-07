# Maps AI prediction to (Verdict, Message, SDG)
MISSION_MAP = {
    "Planting":           ("VERIFIED", "✅ Valid Planting Mission (SDG 13/15)", "SDG 13/15"),
    "Recycling":          ("VERIFIED", "✅ Valid Recycling Mission (SDG 12)",   "SDG 12"),
    "Cleanup":            ("VERIFIED", "✅ Valid Cleanup Mission (SDG 6/14)",   "SDG 6/14"),
    "Donation":           ("VERIFIED", "✅ Valid Donation Mission (SDG 1/2)",   "SDG 1/2"),
    "Health":             ("VERIFIED", "✅ Valid Health & Wellness (SDG 3)",    "SDG 3"),
    "Education":          ("VERIFIED", "✅ Valid Education Activity (SDG 4)",   "SDG 4"),
    "Energy":             ("VERIFIED", "✅ Valid Energy Saving Action (SDG 7)", "SDG 7"),
    "Sustainable_Cities": ("VERIFIED", "✅ Valid Sustainable Commute (SDG 11)", "SDG 11"),
    "Support_Local":      ("VERIFIED", "✅ Valid Support for Local Biz (SDG 8)", "SDG 8"),
    "Non_SDG_Invalid":    ("REJECTED", "⚠️ Image does not match any mission.",  "N/A"),
}

def get_verdict(category, confidence_percent, threshold=55):
    """
    Returns the final verdict response dictionary.
    Requires a confidence of at least `threshold` for a VERIFIED verdict.
    """
    verdict, message, sdg = MISSION_MAP.get(category, ("REJECTED", "⚠️ Unknown Image Category.", "N/A"))
    
    is_verified = (verdict == "VERIFIED")

    # If it's technically a valid category but confidence is too low
    if is_verified and confidence_percent < threshold:
        verdict = "UNCERTAIN"
        message = f"❓ Unclear Image ({confidence_percent}%). Please take a clearer photo."
        is_verified = False
        sdg = "N/A"

    source_check = "📸 Raw Picture" if is_verified else "🤖 AI Generated / Invalid"

    return {
        'prediction': category,
        'confidence': f"{confidence_percent}%",
        'confidence_raw': confidence_percent,
        'verdict': verdict,
        'message': message,
        'is_verified': is_verified,
        'sdg': sdg,
        'source_check': source_check
    }
