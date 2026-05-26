import json
import sys
from statistics import mean
from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.cluster import KMeans
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
}

POSITION_WEIGHTS = {
    "Punta": {
        "ofensiva": 0.30,
        "recepcion": 0.25,
        "defensa": 0.20,
        "saque": 0.15,
        "bloqueo": 0.10,
    },
    "Opuesto": {
        "ofensiva": 0.45,
        "bloqueo": 0.20,
        "saque": 0.20,
        "disciplina": 0.15,
    },
    "Central": {
        "bloqueo": 0.40,
        "ofensiva": 0.40,
        "disciplina": 0.20,
    },
    "Armador": {
        "armado": 0.45,
        "defensa": 0.25,
        "saque": 0.15,
        "bloqueo": 0.15,
    },
    "Libero": {
        "recepcion": 0.50,
        "defensa": 0.40,
        "disciplina": 0.10,
    },
}

METRIC_LABELS = {
    "ofensiva": "Ataque",
    "saque": "Saque",
    "recepcion": "Recepcion",
    "defensa": "Defensa",
    "bloqueo": "Bloqueo",
    "armado": "Armado",
    "disciplina": "Control de errores",
}


def normalize_position(position: str) -> str:
    key = (position or "Punta").strip().lower()
    return POSITION_ALIASES.get(key, position or "Punta")


def number(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def safe_div(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def efficiency_to_score(value: float) -> float:
    return round(clamp((value + 1) * 50, 0, 100), 2)


def category_from_score(score: float) -> Tuple[str, str]:
    if score >= 85:
        return "Excelente", "green"
    if score >= 70:
        return "Bueno", "green"
    if score >= 50:
        return "Regular", "yellow"
    return "Malo", "red"


def has_registered_stats(stats: Dict[str, float]) -> bool:
    return any(number(value) > 0 for value in stats.values())


def legacy_to_position_stats(player: Dict[str, Any]) -> Dict[str, float]:
    stats = dict(player.get("stats") or {})
    stats.update(player)

    return {
        "ataques_positivos": number(stats.get("ataques_positivos", stats.get("attacks"))),
        "errores_ataque": number(stats.get("errores_ataque", stats.get("errors"))),
        "aces": number(stats.get("aces")),
        "errores_saque": number(stats.get("errores_saque")),
        "bloqueos_positivos": number(stats.get("bloqueos_positivos", stats.get("blocks"))),
        "errores_bloqueo": number(stats.get("errores_bloqueo")),
        "recepciones_positivas": number(stats.get("recepciones_positivas", stats.get("receptions"))),
        "recepciones_negativas": number(stats.get("recepciones_negativas")),
        "defensas_positivas": number(stats.get("defensas_positivas")),
        "defensas_negativas": number(stats.get("defensas_negativas")),
        "asistencias": number(stats.get("asistencias")),
        "errores_armado": number(stats.get("errores_armado")),
    }


def calculate_efficiencies(stats: Dict[str, float]) -> Dict[str, float]:
    total_attack = stats["ataques_positivos"] + stats["errores_ataque"]
    total_serve = stats["aces"] + stats["errores_saque"]
    total_reception = stats["recepciones_positivas"] + stats["recepciones_negativas"]
    total_defense = stats["defensas_positivas"] + stats["defensas_negativas"]
    total_block = stats["bloqueos_positivos"] + stats["errores_bloqueo"]
    total_setting = stats["asistencias"] + stats["errores_armado"]

    total_errors = (
        stats["errores_ataque"]
        + stats["errores_saque"]
        + stats["errores_bloqueo"]
        + stats["recepciones_negativas"]
        + stats["defensas_negativas"]
        + stats["errores_armado"]
    )
    total_actions = sum(stats.values())

    return {
        "eficiencia_ofensiva": round(safe_div(stats["ataques_positivos"] - stats["errores_ataque"], total_attack), 4),
        "eficiencia_saque": round(safe_div(stats["aces"] - stats["errores_saque"], total_serve), 4),
        "eficiencia_recepcion": round(safe_div(stats["recepciones_positivas"] - stats["recepciones_negativas"], total_reception), 4),
        "eficiencia_defensiva": round(safe_div(stats["defensas_positivas"] - stats["defensas_negativas"], total_defense), 4),
        "eficiencia_bloqueo": round(safe_div(stats["bloqueos_positivos"] - stats["errores_bloqueo"], total_block), 4),
        "eficiencia_armado": round(safe_div(stats["asistencias"] - stats["errores_armado"], total_setting), 4),
        "disciplina": round(1 - safe_div(total_errors, total_actions), 4) if total_actions else 0,
        "total_acciones": int(total_actions),
        "total_errores": int(total_errors),
    }


def calculate_score(position: str, metrics: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
    weights = POSITION_WEIGHTS.get(position, POSITION_WEIGHTS["Punta"])
    metric_map = {
        "ofensiva": metrics["eficiencia_ofensiva"],
        "saque": metrics["eficiencia_saque"],
        "recepcion": metrics["eficiencia_recepcion"],
        "defensa": metrics["eficiencia_defensiva"],
        "bloqueo": metrics["eficiencia_bloqueo"],
        "armado": metrics["eficiencia_armado"],
        "disciplina": (metrics["disciplina"] * 2) - 1,
    }

    breakdown = {}
    score = 0.0
    for key, weight in weights.items():
        partial = efficiency_to_score(metric_map[key])
        breakdown[key] = round(partial * weight, 2)
        score += partial * weight

    return round(score, 2), breakdown


def relevant_metrics(position: str, metrics: Dict[str, float]) -> Dict[str, float]:
    values = {
        "ofensiva": metrics["eficiencia_ofensiva"],
        "saque": metrics["eficiencia_saque"],
        "recepcion": metrics["eficiencia_recepcion"],
        "defensa": metrics["eficiencia_defensiva"],
        "bloqueo": metrics["eficiencia_bloqueo"],
        "armado": metrics["eficiencia_armado"],
        "disciplina": (metrics["disciplina"] * 2) - 1,
    }
    weights = POSITION_WEIGHTS.get(position, POSITION_WEIGHTS["Punta"])
    return {key: values[key] for key in weights}


def detect_strengths_weaknesses(position: str, metrics: Dict[str, float]) -> Tuple[List[str], List[str]]:
    relevant = relevant_metrics(position, metrics)
    strengths = [METRIC_LABELS[key] for key, value in relevant.items() if value >= 0.40]
    weaknesses = [METRIC_LABELS[key] for key, value in relevant.items() if value < 0]
    return strengths, weaknesses


def generate_interpretations(position: str, metrics: Dict[str, float], score: float) -> List[str]:
    messages = []

    if position in ("Punta", "Opuesto", "Central"):
        if metrics["eficiencia_ofensiva"] >= 0.45:
            messages.append("Gran aporte ofensivo con buena relacion entre puntos y errores.")
        elif metrics["eficiencia_ofensiva"] < 0:
            messages.append("Debe mejorar la efectividad en ataque: los errores pesaron demasiado.")

    if position in ("Punta", "Libero"):
        if metrics["eficiencia_recepcion"] >= 0.50:
            messages.append("Recepcion solida y confiable para sostener el primer contacto.")
        elif metrics["eficiencia_recepcion"] < 0:
            messages.append("Problemas en recepcion; conviene revisar ubicacion y lectura del saque rival.")

    if position in ("Libero", "Punta", "Armador"):
        if metrics["eficiencia_defensiva"] >= 0.40:
            messages.append("Buen rendimiento defensivo y aporte en continuidad de juego.")
        elif metrics["eficiencia_defensiva"] < 0:
            messages.append("Bajo impacto defensivo frente al volumen de acciones recibidas.")

    if position in ("Central", "Opuesto", "Armador"):
        if metrics["eficiencia_bloqueo"] >= 0.40:
            messages.append("Buen aporte en bloqueo, especialmente valioso para su posicion.")
        elif metrics["eficiencia_bloqueo"] < 0:
            messages.append("El bloqueo necesita ajustes de tiempo o lectura.")

    if position == "Armador":
        if metrics["eficiencia_armado"] >= 0.60:
            messages.append("Buena precision en la distribucion del juego.")
        elif metrics["eficiencia_armado"] < 0:
            messages.append("Demasiados errores en armado para el rol de conduccion.")

    if metrics["total_acciones"] == 0:
        messages.append("No hay acciones registradas suficientes para una lectura profunda.")
    elif score >= 85:
        messages.append("Rendimiento integral muy alto para las exigencias de la posicion.")
    elif score < 50:
        messages.append("Rendimiento por debajo de lo esperado; se recomienda revisar los fundamentos clave de la posicion.")

    return messages


def generate_recommendations(weaknesses: List[str]) -> List[str]:
    catalog = {
        "Ataque": "Trabajar seleccion de golpe y reducir errores no forzados en ataque.",
        "Saque": "Practicar saque con objetivo de zona antes de aumentar riesgo.",
        "Recepcion": "Reforzar plataforma, lectura de trayectoria y comunicacion en recepcion.",
        "Defensa": "Entrenar posicion inicial, reaccion y cobertura tras bloqueo.",
        "Bloqueo": "Ajustar tiempo de salto, cierre de manos y lectura del armado rival.",
        "Armado": "Reforzar precision de pase y toma de decision bajo presion.",
        "Control de errores": "Reducir acciones de alto riesgo en momentos de baja eficiencia.",
    }
    return [catalog[item] for item in weaknesses if item in catalog][:3]


def compare_with_context(players: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    players_with_stats = [player for player in players if not player.get("sin_estadisticas")]

    if not players_with_stats:
        for player in players:
            player["comparisons"] = None
        return players

    team_average = mean([p["score"] for p in players_with_stats])
    best_score = max([p["score"] for p in players_with_stats])
    best_by_position = {}
    for player in players_with_stats:
        pos = player["position"]
        best_by_position[pos] = max(best_by_position.get(pos, 0), player["score"])

    for player in players:
        if player.get("sin_estadisticas"):
            player["comparisons"] = None
            continue

        diff_team = player["score"] - team_average
        diff_best = player["score"] - best_by_position[player["position"]]
        player["comparisons"] = {
            "team_average_score": round(team_average, 2),
            "vs_team_average": compare_diff(diff_team),
            "best_match_score": round(best_score, 2),
            "best_position_score": round(best_by_position[player["position"]], 2),
            "vs_best_same_position": compare_diff(diff_best),
        }
    return players


def compare_diff(diff: float) -> str:
    if diff >= 8:
        return "por_encima"
    if diff <= -8:
        return "por_debajo"
    return "similar"


def add_sklearn_profiles(players: List[Dict[str, Any]]) -> None:
    players_with_stats = [player for player in players if not player.get("sin_estadisticas")]

    for player in players:
        if player.get("sin_estadisticas"):
            player["profile"] = "Sin estadisticas"
            player["cluster_id"] = None

    if len(players_with_stats) < 3:
        for player in players_with_stats:
            player["profile"] = "Perfil individual"
            player["cluster_id"] = 0
        return

    matrix = np.array([
        [
            p["metric_scores"].get("ofensiva", 50),
            p["metric_scores"].get("recepcion", 50),
            p["metric_scores"].get("defensa", 50),
            p["metric_scores"].get("bloqueo", 50),
            p["metric_scores"].get("saque", 50),
            p["score"],
        ]
        for p in players_with_stats
    ])
    scaled = StandardScaler().fit_transform(matrix)
    cluster_count = min(3, len(players_with_stats))
    labels = KMeans(n_clusters=cluster_count, random_state=42, n_init=10).fit_predict(scaled)

    cluster_scores = {}
    for index, label in enumerate(labels):
        cluster_scores.setdefault(int(label), []).append(players_with_stats[index]["score"])

    sorted_clusters = sorted(cluster_scores, key=lambda label: mean(cluster_scores[label]), reverse=True)
    remap = {old: new for new, old in enumerate(sorted_clusters)}
    profile_names = ["Impacto alto", "Rendimiento estable", "Necesita atencion"]

    for index, player in enumerate(players_with_stats):
        cluster_id = remap[int(labels[index])]
        player["cluster_id"] = cluster_id
        player["profile"] = profile_names[min(cluster_id, len(profile_names) - 1)]


def analyze_player(player: Dict[str, Any]) -> Dict[str, Any]:
    position = normalize_position(player.get("position") or player.get("posicion"))
    stats = legacy_to_position_stats(player)

    if not has_registered_stats(stats):
        return {
            "player_id": str(player.get("player_id", "")),
            "name": player.get("name", "Jugador"),
            "position": position,
            "score": None,
            "category": "Sin datos",
            "label": "Sin datos",
            "color": "neutral",
            "sin_estadisticas": True,
            "metrics": {"total_acciones": 0, "total_errores": 0},
            "metric_scores": {},
            "score_breakdown": {},
            "strengths": [],
            "weaknesses": [],
            "interpretations": ["No se registraron estadisticas para este jugador en el partido."],
            "recommendations": [],
            "stats": {
                "blocks": 0,
                "attacks": 0,
                "receptions": 0,
                "errors": 0,
                "raw": stats,
            },
        }

    metrics = calculate_efficiencies(stats)
    score, breakdown = calculate_score(position, metrics)
    category, color = category_from_score(score)
    strengths, weaknesses = detect_strengths_weaknesses(position, metrics)

    metric_scores = {
        "ofensiva": efficiency_to_score(metrics["eficiencia_ofensiva"]),
        "saque": efficiency_to_score(metrics["eficiencia_saque"]),
        "recepcion": efficiency_to_score(metrics["eficiencia_recepcion"]),
        "defensa": efficiency_to_score(metrics["eficiencia_defensiva"]),
        "bloqueo": efficiency_to_score(metrics["eficiencia_bloqueo"]),
        "armado": efficiency_to_score(metrics["eficiencia_armado"]),
        "disciplina": round(metrics["disciplina"] * 100, 2),
    }

    return {
        "player_id": str(player.get("player_id", "")),
        "name": player.get("name", "Jugador"),
        "position": position,
        "score": score,
        "category": category,
        "label": category,
        "color": color,
        "metrics": metrics,
        "metric_scores": metric_scores,
        "score_breakdown": breakdown,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "interpretations": generate_interpretations(position, metrics, score),
        "recommendations": generate_recommendations(weaknesses),
        "stats": {
            "blocks": int(stats["bloqueos_positivos"]),
            "attacks": int(stats["ataques_positivos"]),
            "receptions": int(stats["recepciones_positivas"]),
            "errors": int(metrics["total_errores"]),
            "raw": stats,
        },
    }


def analyze_match(payload: Dict[str, Any]) -> Dict[str, Any]:
    players = payload.get("players", [])
    analysis = [analyze_player(player) for player in players]
    add_sklearn_profiles(analysis)
    compare_with_context(analysis)
    analysis.sort(key=lambda item: item["score"] if item["score"] is not None else -1, reverse=True)
    players_with_stats = [player for player in analysis if not player.get("sin_estadisticas")]

    return {
        "match_id": str(payload.get("match_id", "")),
        "total_players": len(analysis),
        "analysis": analysis,
        "summary": {
            "team_average_score": round(mean([p["score"] for p in players_with_stats]), 2) if players_with_stats else 0,
            "top_player": players_with_stats[0] if players_with_stats else None,
            "categories": {
                category: len([p for p in analysis if p["category"] == category])
                for category in ["Excelente", "Bueno", "Regular", "Malo", "Sin datos"]
            },
        },
    }


if __name__ == "__main__":
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw)
        print(json.dumps(analyze_match(payload), ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
