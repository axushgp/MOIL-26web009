"""Deterministic recommendation rules; no LLM decision-making is allowed."""


def recommend(shortfall_risk: dict) -> dict:
    driver = shortfall_risk["dominant_driver"]
    if driver in {"downtime_hours", "Equipment downtime"}:
        return {
            "action": "equipment_redeployment",
            "detail": "Redeploy available equipment from the nearest underutilised mine; review the maintenance schedule.",
            "driver": driver,
        }
    if driver in {"rainfall_mm", "Rainfall"}:
        return {
            "action": "advance_stockpiling",
            "detail": "Increase the pre-monsoon stockpile buffer for this mine given the upcoming rainfall forecast.",
            "driver": driver,
        }
    if driver in {"local_reserve_confidence", "Reserve confidence"}:
        return {
            "action": "redirect_development",
            "detail": "Current working-face confidence is declining; redirect development toward the nearest higher-confidence unexplored zone.",
            "driver": driver,
        }
    return {
        "action": "monitor",
        "detail": "No single dominant driver identified; continue standard monitoring.",
        "driver": driver,
    }