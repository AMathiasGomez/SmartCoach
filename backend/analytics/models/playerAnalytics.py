import json
import sys
from statistics import mean
from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.preprocessing import StandardScaler


POSITION_ALIASES = {
    "punta": "Punta",
    "outside hitter": "Punta",
    "opuesto": "Opuesto",
    "opposite hitter": "Opuesto",
    "central": "Central",
    "middle blocker": "Central",
    "armador": "Armador",
    "setter": "Armador",
    "libero": "Libero",
    "líbero": "Libero",
    "lÃ­bero": "Libero",
}

RAW_KEYS = [
    "ataques_positivos",
    "errores_ataque",
    "aces",
    "errores_saque",
    "bloqueos_positivos",
    "errores_bloqueo",
    "recepciones_positivas",
    "recepciones_negativas",
    "defensas_positivas",
    "defensas_negativas",
    "asistencias",
    "errores_armado",
]

RADAR_WEIGHTS = {
    "Punta": {
        "ataque": 0.30,
        "recepcion": 0.25,
        "defensa": 0.20,
        "saque": 0.10,
        "bloqueo": 0.05,
        "consistencia": 0.10,
    },
    "Opuesto": {
        "ataque": 0.45,
        "bloqueo": 0.20,
        "saque": 0.15,
        "consistencia": 0.20,
    },
    "Central": {
        "bloqueo": 0.40,
        "ataque": 0.35,
        "consistencia": 0.15,
        "saque": 0.10,
    },
    "Armador": {
        "armado": 0.50,
        "consistencia": 0.20,
        "defensa": 0.15,
        "saque": 0.10,
        "bloqueo": 0.05,
    },
    "Libero": {
        "recepcion": 0.45,
        "defensa": 0.40,
        "consistencia": 0.15,
    },
}

AXIS_LABELS = {
    "ataque": "Ataque",
    "recepcion": "Recepción",
    "defensa": "Defensa",
    "saque": "Saque",
    "bloqueo": "Bloqueo",
    "armado": "Armado",
    "consistencia": "Consistencia",
}


def normalize_position(position: str) -> str:
    key = (position or "Punta").strip().lower()
    return POSITION_ALIASES.get(key, position or "Punta")


def number(value: Any) -> float:
    try:
        parsed = float(value or 0)
        return parsed if np.isfinite(parsed) else 0.0
    except (TypeError, ValueError):
        return 0.0


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def safe_div(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def efficiency(positive: float, negative: float) -> float:
    return safe_div(positive - negative, positive + negative)


def score_from_efficiency(value: float) -> float:
    return round(clamp((value + 1) * 50), 2)


def aggregate_raw_stats(matches: List[Dict[str, Any]]) -> Dict[str, float]:
    totals = {key: 0.0 for key in RAW_KEYS}

    for match in matches:
        legacy_errors = number(match.get("errores"))

        totals["ataques_positivos"] += number(match.get("ataques_positivos", match.get("ataques")))
        totals["errores_ataque"] += number(match.get("errores_ataque", legacy_errors))
        totals["aces"] += number(match.get("aces"))
        totals["errores_saque"] += number(match.get("errores_saque"))
        totals["bloqueos_positivos"] += number(match.get("bloqueos_positivos", match.get("bloqueos")))
        totals["errores_bloqueo"] += number(match.get("errores_bloqueo"))
        totals["recepciones_positivas"] += number(match.get("recepciones_positivas", match.get("recepciones")))
        totals["recepciones_negativas"] += number(match.get("recepciones_negativas"))
        totals["defensas_positivas"] += number(match.get("defensas_positivas"))
        totals["defensas_negativas"] += number(match.get("defensas_negativas"))
        totals["asistencias"] += number(match.get("asistencias"))
        totals["errores_armado"] += number(match.get("errores_armado"))

    return totals


def derived_metrics(stats: Dict[str, float]) -> Dict[str, float]:
    total_errors = (
        stats["errores_ataque"]
        + stats["errores_saque"]
        + stats["errores_bloqueo"]
        + stats["recepciones_negativas"]
        + stats["defensas_negativas"]
        + stats["errores_armado"]
    )
    total_positive = (
        stats["ataques_positivos"]
        + stats["aces"]
        + stats["bloqueos_positivos"]
        + stats["recepciones_positivas"]
        + stats["defensas_positivas"]
        + stats["asistencias"]
    )
    total_actions = total_positive + total_errors

    return {
        "balance_ofensivo": stats["ataques_positivos"] - stats["errores_ataque"],
        "balance_saque": stats["aces"] - stats["errores_saque"],
        "balance_bloqueo": stats["bloqueos_positivos"] - stats["errores_bloqueo"],
        "balance_recepcion": stats["recepciones_positivas"] - stats["recepciones_negativas"],
        "balance_defensivo": stats["defensas_positivas"] - stats["defensas_negativas"],
        "balance_armado": stats["asistencias"] - stats["errores_armado"],
        "eficiencia_ataque": efficiency(stats["ataques_positivos"], stats["errores_ataque"]),
        "eficiencia_saque": efficiency(stats["aces"], stats["errores_saque"]),
        "eficiencia_bloqueo": efficiency(stats["bloqueos_positivos"], stats["errores_bloqueo"]),
        "eficiencia_recepcion": efficiency(stats["recepciones_positivas"], stats["recepciones_negativas"]),
        "eficiencia_defensa": efficiency(stats["defensas_positivas"], stats["defensas_negativas"]),
        "eficiencia_armado": efficiency(stats["asistencias"], stats["errores_armado"]),
        "impacto_neto": total_positive - total_errors,
        "control_errores": 1 - safe_div(total_errors, total_actions),
        "ratio_error": safe_div(total_errors, total_actions),
        "total_acciones": total_actions,
        "total_positivas": total_positive,
        "total_errores": total_errors,
    }


def build_radar_axes(position: str, metrics: Dict[str, float]) -> Dict[str, float]:
    all_axes = {
        "ataque": score_from_efficiency(metrics["eficiencia_ataque"]),
        "recepcion": score_from_efficiency(metrics["eficiencia_recepcion"]),
        "defensa": score_from_efficiency(metrics["eficiencia_defensa"]),
        "saque": score_from_efficiency(metrics["eficiencia_saque"]),
        "bloqueo": score_from_efficiency(metrics["eficiencia_bloqueo"]),
        "armado": score_from_efficiency(metrics["eficiencia_armado"]),
        "consistencia": round(clamp(metrics["control_errores"] * 100), 2),
    }
    return {axis: all_axes[axis] for axis in RADAR_WEIGHTS.get(position, RADAR_WEIGHTS["Punta"])}


def weighted_score(position: str, axes: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
    weights = RADAR_WEIGHTS.get(position, RADAR_WEIGHTS["Punta"])
    breakdown = {axis: round(axes[axis] * weight, 2) for axis, weight in weights.items()}
    return round(sum(breakdown.values()), 2), breakdown


def level_from_score(score: float) -> str:
    if score >= 85:
        return "Excelente"
    if score >= 70:
        return "Bueno"
    if score >= 55:
        return "Regular"
    if score >= 40:
        return "Bajo"
    return "Crítico"


def detect_strengths_weaknesses(axes: Dict[str, float]) -> Tuple[List[str], List[str]]:
    strengths = [AXIS_LABELS[key] for key, value in axes.items() if value >= 75]
    weaknesses = [AXIS_LABELS[key] for key, value in axes.items() if value < 50]
    return strengths[:4], weaknesses[:4]


def detect_profile(position: str, axes: Dict[str, float]) -> str:
    get = lambda key: axes.get(key, 0)

    if position == "Punta":
        if get("ataque") >= 75 and get("recepcion") >= 70 and get("defensa") >= 70:
            return "Punta completo"
        if get("ataque") >= 75 and get("consistencia") < 60:
            return "Atacante agresivo e inconsistente"
        if get("recepcion") >= 75 and get("defensa") >= 70:
            return "Punta de estabilidad"
    if position == "Opuesto":
        if get("ataque") >= 80:
            return "Opuesto terminal"
        if get("bloqueo") >= 75 and get("saque") >= 65:
            return "Opuesto de presión en red"
    if position == "Central":
        if get("bloqueo") >= 75 and get("ataque") >= 70:
            return "Central dominante en red"
        if get("bloqueo") >= 75:
            return "Especialista de bloqueo"
    if position == "Armador":
        if get("armado") >= 80 and get("consistencia") >= 70:
            return "Armador organizador"
        if get("defensa") >= 70:
            return "Armador con aporte defensivo"
    if position == "Libero":
        if get("recepcion") >= 80 and get("defensa") >= 75:
            return "Líbero confiable"
        if get("defensa") >= 80:
            return "Especialista defensivo"

    if get("consistencia") >= 75:
        return "Jugador estable"
    return "Perfil en desarrollo"


def generate_insights(position: str, axes: Dict[str, float], metrics: Dict[str, float], score: float) -> List[str]:
    insights = []
    get = lambda key: axes.get(key, 0)

    if position == "Punta":
        if get("ataque") >= 75 and get("consistencia") < 60:
            insights.append("Jugador ofensivamente agresivo, pero con margen de mejora en el control de errores.")
        if get("recepcion") >= 75 and get("defensa") >= 70:
            insights.append("Aporta estabilidad en primera línea: recepción y defensa sostienen bien el juego.")
        if get("ataque") < 50 and get("recepcion") >= 70:
            insights.append("Buen soporte en recepción, aunque el impacto ofensivo fue limitado.")

    if position == "Opuesto":
        if get("ataque") >= 75:
            insights.append("Buen impacto como salida ofensiva principal.")
        if get("bloqueo") >= 70:
            insights.append("Aporta presencia en red y ayuda a contener el ataque rival.")
        if get("consistencia") < 55:
            insights.append("El rendimiento depende de reducir errores en acciones de riesgo.")

    if position == "Central":
        if get("bloqueo") >= 75:
            insights.append("Central con buen impacto en bloqueo y lectura de red.")
        if get("ataque") >= 70:
            insights.append("Eficiente en acciones ofensivas rápidas.")
        if get("consistencia") < 55:
            insights.append("Necesita reducir errores para sostener su impacto en la red.")

    if position == "Armador":
        if get("armado") >= 80:
            insights.append("Buena distribución ofensiva y precisión en la conducción del juego.")
        if get("defensa") >= 70:
            insights.append("Aporta continuidad con presencia defensiva.")
        if get("consistencia") < 55:
            insights.append("Los errores de control afectan la fluidez del equipo.")

    if position == "Libero":
        if get("recepcion") >= 80:
            insights.append("Líbero confiable en recepción, sostiene con calidad el primer contacto.")
        if get("defensa") >= 75:
            insights.append("Alta estabilidad defensiva y buen aporte en continuidad.")
        if get("recepcion") < 55:
            insights.append("Debe mejorar la estabilidad en recepción ante presión de saque.")

    if score >= 85:
        insights.append("Rendimiento integral muy alto para las exigencias de su posición.")
    elif score < 50:
        insights.append("Rendimiento por debajo del estándar esperado; conviene priorizar fundamentos clave.")

    if not insights and metrics["total_acciones"] > 0:
        insights.append("Rendimiento equilibrado, sin extremos claros entre fortalezas y áreas de mejora.")

    return insights[:5]


def generate_recommendations(weaknesses: List[str]) -> List[str]:
    catalog = {
        "Ataque": "Trabajar selección de golpe y reducir errores no forzados en ataque.",
        "Recepción": "Reforzar plataforma, lectura del saque y comunicación en recepción.",
        "Defensa": "Entrenar posición inicial, reacción y cobertura posterior al bloqueo.",
        "Saque": "Priorizar saque dirigido antes de aumentar riesgo.",
        "Bloqueo": "Ajustar tiempo de salto, lectura del armador rival y cierre de manos.",
        "Armado": "Reforzar precisión de pase y toma de decisión bajo presión.",
        "Consistencia": "Reducir acciones de alto riesgo cuando el balance del fundamento sea negativo.",
    }
    return [catalog[item] for item in weaknesses if item in catalog][:3]


def confidence_from_volume(total_actions: float, matches: int) -> float:
    volume_confidence = min(1.0, total_actions / 60)
    match_confidence = min(1.0, matches / 5)
    return round((0.65 * volume_confidence + 0.35 * match_confidence) * 100, 2)


def trend_from_matches(position: str, matches: List[Dict[str, Any]]) -> Tuple[str, List[float]]:
    if not matches:
        return "sin_datos", []

    ordered = list(reversed(matches))
    scores = []
    for match in ordered:
        match_stats = aggregate_raw_stats([match])
        match_metrics = derived_metrics(match_stats)
        match_axes = build_radar_axes(position, match_metrics)
        score, _ = weighted_score(position, match_axes)
        scores.append(score)

    if len(scores) >= 4:
        diff = mean(scores[-3:]) - mean(scores[:-3])
        if diff > 5:
            return "mejorando", scores
        if diff < -5:
            return "bajando", scores
        return "estable", scores

    if len(scores) >= 2:
        if scores[-1] >= scores[0] + 5:
            return "mejorando", scores
        if scores[-1] <= scores[0] - 5:
            return "bajando", scores

    return "estable", scores


def sklearn_context(axes: Dict[str, float]) -> Dict[str, Any]:
    values = np.array(list(axes.values()), dtype=float)
    if len(values) < 2:
        return {"balance": "Sin comparación suficiente", "feature_zones": []}

    scaled = StandardScaler().fit_transform(values.reshape(-1, 1)).flatten()
    zones = []
    for axis, z_value in zip(axes.keys(), scaled):
        if z_value >= 0.75:
            zones.append({"axis": axis, "label": AXIS_LABELS[axis], "type": "fortaleza_relativa"})
        elif z_value <= -0.75:
            zones.append({"axis": axis, "label": AXIS_LABELS[axis], "type": "brecha_relativa"})

    return {
        "balance": "Perfil equilibrado" if len(zones) <= 1 else "Perfil con contrastes marcados",
        "feature_zones": zones,
    }


def legacy_scores(axes: Dict[str, float]) -> Dict[str, float]:
    return {
        "ataques": round(axes.get("ataque", 0) / 10, 2),
        "bloqueos": round(axes.get("bloqueo", 0) / 10, 2),
        "recepciones": round(axes.get("recepcion", 0) / 10, 2),
        "eficiencia": round(axes.get("consistencia", 0) / 10, 2),
    }


def analyze_player(stats_json: str) -> Dict[str, Any]:
    data = json.loads(stats_json)
    matches = data.get("partidos", [])
    position = normalize_position(data.get("posicion", ""))

    if not matches:
        return {
            "scores": {"ataques": 0, "bloqueos": 0, "recepciones": 0, "eficiencia": 0},
            "radar_axes": {},
            "overall_score": 0,
            "overall_score_10": 0,
            "tendencia": "sin_datos",
            "nivel": "Sin datos",
            "partidos_analizados": 0,
            "insights": ["No hay acciones registradas suficientes para generar un análisis individual."],
            "recommendations": [],
        }

    raw_stats = aggregate_raw_stats(matches)
    metrics = derived_metrics(raw_stats)
    axes = build_radar_axes(position, metrics)
    score, breakdown = weighted_score(position, axes)
    tendencia, history = trend_from_matches(position, matches)
    strengths, weaknesses = detect_strengths_weaknesses(axes)
    profile = detect_profile(position, axes)
    confidence = confidence_from_volume(metrics["total_acciones"], len(matches))

    return {
        "position": position,
        "raw_stats": {key: int(value) for key, value in raw_stats.items()},
        "derived_metrics": {key: round(value, 4) for key, value in metrics.items()},
        "radar_axes": axes,
        "radar_labels": {key: AXIS_LABELS[key] for key in axes},
        "score_breakdown": breakdown,
        "scores": legacy_scores(axes),
        "overall_score": round(score / 10, 2),
        "overall_score_100": score,
        "overall_score_10": round(score / 10, 2),
        "tendencia": tendencia,
        "nivel": level_from_score(score),
        "profile": profile,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "insights": generate_insights(position, axes, metrics, score),
        "recommendations": generate_recommendations(weaknesses),
        "confidence": confidence,
        "partidos_analizados": len(matches),
        "historial_scores": [round(value / 10, 2) for value in history],
        "historial_scores_100": history,
        "sklearn_context": sklearn_context(axes),
    }


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    try:
        result = analyze_player(raw)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
