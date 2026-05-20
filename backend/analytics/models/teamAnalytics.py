import json
import sys
from statistics import mean, pstdev
from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


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

TEAM_WEIGHTS = {
    "ofensiva": 0.24,
    "recepcion": 0.18,
    "defensa": 0.17,
    "bloqueo": 0.14,
    "saque": 0.12,
    "armado": 0.08,
    "control_errores": 0.07,
}

AXIS_LABELS = {
    "ofensiva": "Ataque",
    "recepcion": "Recepción",
    "defensa": "Defensa",
    "bloqueo": "Bloqueo",
    "saque": "Saque",
    "armado": "Armado",
    "control_errores": "Control",
}


def number(value: Any) -> float:
    try:
        parsed = float(value or 0)
        return parsed if np.isfinite(parsed) else 0.0
    except (TypeError, ValueError):
        return 0.0


def safe_div(a: float, b: float) -> float:
    return a / b if b else 0.0


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def efficiency(pos: float, neg: float) -> float:
    return safe_div(pos - neg, pos + neg)


def score_from_efficiency(value: float) -> float:
    return round(clamp((value + 1) * 50), 2)


def empty_stats() -> Dict[str, float]:
    return {key: 0.0 for key in RAW_KEYS}


def normalize_stats(row: Dict[str, Any]) -> Dict[str, float]:
    legacy_errors = number(row.get("errores"))
    return {
        "ataques_positivos": number(row.get("ataques_positivos", row.get("ataques"))),
        "errores_ataque": number(row.get("errores_ataque", legacy_errors)),
        "aces": number(row.get("aces")),
        "errores_saque": number(row.get("errores_saque")),
        "bloqueos_positivos": number(row.get("bloqueos_positivos", row.get("bloqueos"))),
        "errores_bloqueo": number(row.get("errores_bloqueo")),
        "recepciones_positivas": number(row.get("recepciones_positivas", row.get("recepciones"))),
        "recepciones_negativas": number(row.get("recepciones_negativas")),
        "defensas_positivas": number(row.get("defensas_positivas")),
        "defensas_negativas": number(row.get("defensas_negativas")),
        "asistencias": number(row.get("asistencias")),
        "errores_armado": number(row.get("errores_armado")),
    }


def aggregate(rows: List[Dict[str, Any]]) -> Dict[str, float]:
    totals = empty_stats()
    for row in rows:
        stats = normalize_stats(row)
        for key in RAW_KEYS:
            totals[key] += stats[key]
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
        "balance_ofensivo_equipo": stats["ataques_positivos"] - stats["errores_ataque"],
        "estabilidad_recepcion_equipo": stats["recepciones_positivas"] - stats["recepciones_negativas"],
        "estabilidad_defensiva_equipo": stats["defensas_positivas"] - stats["defensas_negativas"],
        "impacto_total_saque": stats["aces"] - stats["errores_saque"],
        "balance_bloqueo": stats["bloqueos_positivos"] - stats["errores_bloqueo"],
        "balance_armado": stats["asistencias"] - stats["errores_armado"],
        "eficiencia_ofensiva": efficiency(stats["ataques_positivos"], stats["errores_ataque"]),
        "eficiencia_recepcion": efficiency(stats["recepciones_positivas"], stats["recepciones_negativas"]),
        "eficiencia_defensiva": efficiency(stats["defensas_positivas"], stats["defensas_negativas"]),
        "eficiencia_saque": efficiency(stats["aces"], stats["errores_saque"]),
        "eficiencia_bloqueo": efficiency(stats["bloqueos_positivos"], stats["errores_bloqueo"]),
        "eficiencia_armado": efficiency(stats["asistencias"], stats["errores_armado"]),
        "control_errores": 1 - safe_div(total_errors, total_actions),
        "ratio_error": safe_div(total_errors, total_actions),
        "impacto_neto_colectivo": total_positive - total_errors,
        "total_acciones": total_actions,
        "total_positivas": total_positive,
        "total_errores": total_errors,
    }


def tactical_scores(metrics: Dict[str, float]) -> Dict[str, float]:
    return {
        "ofensiva": score_from_efficiency(metrics["eficiencia_ofensiva"]),
        "recepcion": score_from_efficiency(metrics["eficiencia_recepcion"]),
        "defensa": score_from_efficiency(metrics["eficiencia_defensiva"]),
        "bloqueo": score_from_efficiency(metrics["eficiencia_bloqueo"]),
        "saque": score_from_efficiency(metrics["eficiencia_saque"]),
        "armado": score_from_efficiency(metrics["eficiencia_armado"]),
        "control_errores": round(clamp(metrics["control_errores"] * 100), 2),
    }


def global_score(scores: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
    breakdown = {key: round(scores[key] * weight, 2) for key, weight in TEAM_WEIGHTS.items()}
    return round(sum(breakdown.values()), 2), breakdown


def level(score: float) -> str:
    if score >= 85:
        return "Excelente"
    if score >= 70:
        return "Bueno"
    if score >= 55:
        return "Regular"
    if score >= 40:
        return "Bajo"
    return "Crítico"


def analyze_sets(sets: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not sets:
        return {
            "set_scores": [],
            "consistency_score": 0,
            "strong_sets": [],
            "weak_sets": [],
            "alerts": [],
            "variability": 0,
        }

    set_scores = []
    for item in sets:
        stats = normalize_stats(item)
        metrics = derived_metrics(stats)
        scores = tactical_scores(metrics)
        score, _ = global_score(scores)
        set_scores.append({
            "match_id": item.get("partido_id"),
            "set_number": int(number(item.get("numero_set"))),
            "score": score,
            "recepcion": scores["recepcion"],
            "ofensiva": scores["ofensiva"],
            "control_errores": scores["control_errores"],
        })

    values = [item["score"] for item in set_scores]
    variability = round(pstdev(values), 2) if len(values) > 1 else 0
    consistency = round(clamp(100 - variability * 2), 2)
    avg = mean(values)
    strong_sets = [item for item in set_scores if item["score"] >= avg + 8]
    weak_sets = [item for item in set_scores if item["score"] <= avg - 8]

    alerts = []
    if variability >= 12:
        alerts.append("Alta variabilidad entre sets: el equipo alterna tramos fuertes con caídas claras.")
    if weak_sets:
        alerts.append("Se detectaron sets con rendimiento táctico claramente por debajo del promedio.")

    for current, previous in zip(set_scores[1:], set_scores[:-1]):
        if current["recepcion"] <= previous["recepcion"] - 15:
            alerts.append(f"Caída importante en recepción en el set {current['set_number']}.")
            break

    return {
        "set_scores": set_scores,
        "consistency_score": consistency,
        "strong_sets": strong_sets[:3],
        "weak_sets": weak_sets[:3],
        "alerts": alerts[:4],
        "variability": variability,
    }


def player_score(player: Dict[str, Any]) -> Dict[str, Any]:
    rows = player.get("partidos", [])
    stats = aggregate(rows)
    metrics = derived_metrics(stats)
    scores = tactical_scores(metrics)
    score, _ = global_score(scores)
    return {
        "jugador_id": player.get("jugador_id"),
        "nombre": player.get("nombre", "Jugador"),
        "posicion": player.get("posicion", ""),
        "score": round(score / 10, 2),
        "score_100": score,
        "partidos": len(rows),
    }


def detect_strengths_weaknesses(scores: Dict[str, float]) -> Tuple[List[str], List[str]]:
    strengths = [AXIS_LABELS[key] for key, value in scores.items() if value >= 75]
    weaknesses = [AXIS_LABELS[key] for key, value in scores.items() if value < 50]
    return strengths[:5], weaknesses[:5]


def tactical_profile(scores: Dict[str, float], metrics: Dict[str, float]) -> str:
    if scores["ofensiva"] >= 75 and scores["control_errores"] < 60:
        return "Equipo ofensivamente agresivo"
    if scores["defensa"] >= 75 and scores["recepcion"] >= 70:
        return "Equipo defensivamente sólido"
    if scores["bloqueo"] >= 78:
        return "Juego basado en bloqueo"
    if scores["recepcion"] < 50:
        return "Equipo vulnerable en recepción"
    if scores["control_errores"] < 55:
        return "Equipo inconsistente"
    if min(scores.values()) >= 62 and max(scores.values()) - min(scores.values()) <= 18:
        return "Equipo equilibrado"
    if scores["ofensiva"] >= 70 and scores["recepcion"] < 55:
        return "Alta dependencia ofensiva"
    return "Perfil colectivo en desarrollo"


def generate_insights(scores: Dict[str, float], metrics: Dict[str, float], set_analysis: Dict[str, Any]) -> List[str]:
    insights = []

    if scores["ofensiva"] >= 75 and scores["saque"] < 55:
        insights.append("El equipo mostró buena estabilidad ofensiva, pero el saque tuvo una relación riesgo-beneficio baja.")
    if scores["defensa"] >= 75 and scores["recepcion"] >= 70:
        insights.append("La primera línea sostuvo bien el partido: recepción y defensa aparecen como bases colectivas.")
    if scores["bloqueo"] >= 75 and scores["defensa"] >= 65:
        insights.append("Buen balance entre bloqueo y defensa para controlar la continuidad rival.")
    if scores["control_errores"] < 55:
        insights.append("El volumen de errores no forzados limita el rendimiento global del equipo.")
    if scores["recepcion"] < 50:
        insights.append("La recepción es una vulnerabilidad táctica: afecta la construcción ofensiva posterior.")
    if metrics["impacto_total_saque"] < 0:
        insights.append("El saque generó más errores que puntos directos; conviene reducir riesgo o mejorar selección de zonas.")
    if set_analysis.get("alerts"):
        insights.extend(set_analysis["alerts"])
    if not insights:
        insights.append("El equipo muestra un rendimiento colectivo balanceado, sin una brecha táctica dominante.")

    return insights[:6]


def recommendations(weaknesses: List[str]) -> List[str]:
    catalog = {
        "Ataque": "Trabajar selección de ataque y reducción de errores en transiciones.",
        "Recepción": "Priorizar recepción bajo presión: plataforma, comunicación y ocupación de zonas.",
        "Defensa": "Reforzar lectura, posición base y cobertura posterior al bloqueo.",
        "Bloqueo": "Ajustar tiempos de salto, cierre de manos y lectura del armador rival.",
        "Saque": "Reducir riesgo del saque hasta mejorar la eficiencia colectiva.",
        "Armado": "Mejorar precisión del primer pase para sostener opciones de distribución.",
        "Control": "Reducir acciones de alto riesgo en secuencias donde el equipo encadena errores.",
    }
    return [catalog[item] for item in weaknesses if item in catalog][:4]


def sklearn_style_cluster(scores: Dict[str, float]) -> Dict[str, Any]:
    style_centers = np.array([
        [82, 60, 58, 55, 62, 55, 58],  # ofensivo
        [60, 78, 80, 65, 55, 55, 72],  # defensivo
        [58, 58, 62, 82, 55, 55, 70],  # bloqueo
        [66, 66, 66, 66, 66, 66, 78],  # equilibrado
        [55, 50, 50, 52, 48, 52, 45],  # inconsistente
    ], dtype=float)
    names = [
        "Estilo ofensivo",
        "Estilo defensivo",
        "Estilo de red",
        "Estilo equilibrado",
        "Estilo inconsistente",
    ]
    vector = np.array([[scores[key] for key in TEAM_WEIGHTS.keys()]], dtype=float)
    data = np.vstack([style_centers, vector])
    scaled = StandardScaler().fit_transform(data)
    model = KMeans(n_clusters=5, random_state=42, n_init=10).fit(scaled[:5])
    label = int(model.predict(scaled[-1:])[0])
    return {"style_cluster": label, "style_name": names[label]}


def analyze_team(stats_json: str) -> Dict[str, Any]:
    data = json.loads(stats_json)
    jugadores = data.get("jugadores", [])
    sets = data.get("sets", [])

    player_rows = [p for player in jugadores for p in player.get("partidos", [])]
    if not player_rows:
        return {
            "overall_score": 0,
            "overall_score_100": 0,
            "nivel": "Sin datos",
            "tendencia": "sin_datos",
            "promedios_equipo": {"ataques": 0, "bloqueos": 0, "recepciones": 0, "eficiencia": 0},
            "totales_equipo": {"ataques": 0, "bloqueos": 0, "recepciones": 0, "errores": 0},
            "radar_axes": {},
            "insights": ["No hay estadísticas suficientes para un análisis colectivo."],
            "ranking_jugadores": [],
            "partidos_analizados": 0,
        }

    totals = aggregate(player_rows)
    metrics = derived_metrics(totals)
    scores = tactical_scores(metrics)
    overall, breakdown = global_score(scores)
    set_analysis = analyze_sets(sets)
    strengths, weaknesses = detect_strengths_weaknesses(scores)
    ranking = sorted([player_score(player) for player in jugadores], key=lambda item: item["score_100"], reverse=True)
    style = sklearn_style_cluster(scores)

    if set_analysis["set_scores"]:
        first_half = set_analysis["set_scores"][: max(1, len(set_analysis["set_scores"]) // 2)]
        second_half = set_analysis["set_scores"][len(first_half):] or first_half
        diff = mean([item["score"] for item in second_half]) - mean([item["score"] for item in first_half])
        tendencia = "mejorando" if diff > 5 else "bajando" if diff < -5 else "estable"
    else:
        tendencia = "estable"

    return {
        "raw_stats": {key: int(value) for key, value in totals.items()},
        "derived_metrics": {key: round(value, 4) for key, value in metrics.items()},
        "tactical_scores": scores,
        "radar_axes": scores,
        "radar_labels": {key: AXIS_LABELS[key] for key in scores},
        "score_breakdown": breakdown,
        "overall_score": round(overall / 10, 2),
        "overall_score_100": overall,
        "nivel": level(overall),
        "tendencia": tendencia,
        "profile": tactical_profile(scores, metrics),
        "style_cluster": style,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "insights": generate_insights(scores, metrics, set_analysis),
        "recommendations": recommendations(weaknesses),
        "set_analysis": set_analysis,
        "promedios_equipo": {
            "ataques": round(scores["ofensiva"] / 10, 2),
            "bloqueos": round(scores["bloqueo"] / 10, 2),
            "recepciones": round(scores["recepcion"] / 10, 2),
            "eficiencia": round(scores["control_errores"] / 10, 2),
        },
        "totales_equipo": {
            "ataques": int(totals["ataques_positivos"]),
            "bloqueos": int(totals["bloqueos_positivos"]),
            "recepciones": int(totals["recepciones_positivas"]),
            "errores": int(metrics["total_errores"]),
        },
        "jugador_destacado": ranking[0] if ranking else None,
        "ranking_jugadores": ranking,
        "partidos_analizados": len({row.get("partido_id") for row in player_rows if row.get("partido_id")}),
    }


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    try:
        print(json.dumps(analyze_team(raw), ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
