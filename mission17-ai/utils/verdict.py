"""Map TensorFlow CNN categories to Mission17 review verdicts."""


MISSION_MAP = {
    'Planting': ('VERIFIED', 'Valid planting mission (SDG 13/15).', 'SDG 13/15'),
    'Recycling': ('VERIFIED', 'Valid recycling mission (SDG 12).', 'SDG 12'),
    'Cleanup': ('VERIFIED', 'Valid cleanup mission (SDG 6/14).', 'SDG 6/14'),
    'Donation': ('VERIFIED', 'Valid donation mission (SDG 1/2).', 'SDG 1/2'),
    'Health': ('VERIFIED', 'Valid health and wellness activity (SDG 3).', 'SDG 3'),
    'Education': ('VERIFIED', 'Valid education activity (SDG 4).', 'SDG 4'),
    'Energy': ('VERIFIED', 'Valid energy-saving action (SDG 7).', 'SDG 7'),
    'Sustainable_Cities': ('VERIFIED', 'Valid sustainable commute (SDG 11).', 'SDG 11'),
    'Support_Local': ('VERIFIED', 'Valid support for a local business (SDG 8).', 'SDG 8'),
    'Non_SDG_Invalid': ('REJECTED', 'Image does not match a supported mission.', 'N/A'),
}


def get_verdict(category, confidence_percent, threshold=55):
    """Return a stable verdict schema for a model category and confidence."""
    verdict, message, sdg = MISSION_MAP.get(
        category,
        ('REJECTED', 'Unknown image category.', 'N/A'),
    )
    is_verified = verdict == 'VERIFIED'

    if is_verified and confidence_percent < threshold:
        verdict = 'UNCERTAIN'
        message = f'Unclear image ({confidence_percent}%). Please take a clearer photo.'
        is_verified = False
        sdg = 'N/A'

    return {
        'status': verdict,
        'prediction': category,
        'confidence': f'{confidence_percent}%',
        'confidence_raw': confidence_percent,
        'verdict': verdict,
        'message': message,
        'is_verified': is_verified,
        'sdg': sdg,
        'source_check': 'Raw picture reviewed' if is_verified else 'Requires review',
    }
