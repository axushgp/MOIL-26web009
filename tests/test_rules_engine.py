from module3_recommendations.rules_engine import recommend


def test_equipment_rule():
    assert recommend({"dominant_driver": "downtime_hours"})["action"] == "equipment_redeployment"


def test_rainfall_rule():
    assert recommend({"dominant_driver": "rainfall_mm"})["action"] == "advance_stockpiling"


def test_reserve_confidence_rule():
    assert recommend({"dominant_driver": "local_reserve_confidence"})["action"] == "redirect_development"


def test_monitor_rule():
    assert recommend({"dominant_driver": "unknown"})["action"] == "monitor"