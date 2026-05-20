#!/usr/bin/env python3
"""
SmartCoach - Clasificador General de Rendimiento por Equipo
Usa historial completo de jugadores (sin partido específico)
Combina: score histórico + promedios de estadísticas de todos los partidos
Algoritmo: K-Means (3 clusters: Alto / Medio / Bajo)
"""

import sys
import json
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

def classify_general(data: dict) -> dict:
    """
    Clasifica todos los jugadores de un equipo en Alto / Medio / Bajo
    usando su historial completo.

    Payload esperado:
    {
        "team_id": "12",
        "team_name": "Nombre del equipo",
        "players": [
            {
                "player_id": "45",
                "name": "Nishida",
                "posicion": "Opuesto",
                "score_historico": 4.91,   <- score acumulado del análisis de equipo
                "partidos": 8,             <- partidos jugados
                "promedios": {             <- promedio de stats en todos sus partidos
                    "ataques": 9.6,
                    "bloqueos": 1.2,
                    "recepciones": 7.4,
                    "errores": 1.8
                }
            }, ...
        ]
    }
    """

    team_id   = data.get("team_id", "")
    team_name = data.get("team_name", "Equipo")
    players   = data.get("players", [])

    if not players:
        return {"error": "No se encontraron jugadores en el payload."}

    n_players = len(players)

    # ── Construir matriz de features ─────────────────────────────────────────
    # Features:
    #   1. score_historico   → rendimiento acumulado general
    #   2. ataques_prom      → promedio de ataques por partido
    #   3. bloqueos_prom     → promedio de bloqueos por partido
    #   4. recepciones_prom  → promedio de recepciones por partido
    #   5. errores_prom      → promedio de errores (penaliza)
    #   6. partidos          → continuidad / experiencia

    players_data  = []
    feature_matrix = []

    for p in players:
        pid       = str(p.get("player_id", ""))
        name      = p.get("name", "Desconocido")
        posicion  = p.get("posicion", "Desconocido")
        score_h   = float(p.get("score_historico", 0))
        partidos  = float(p.get("partidos", 1))
        promedios = p.get("promedios", {})

        ataques     = float(promedios.get("ataques",     0))
        bloqueos    = float(promedios.get("bloqueos",    0))
        recepciones = float(promedios.get("recepciones", 0))
        errores     = float(promedios.get("errores",     0))

        players_data.append({
            "player_id":      pid,
            "name":           name,
            "posicion":       posicion,
            "score_historico": score_h,
            "partidos":       int(partidos),
            "ataques":        ataques,
            "bloqueos":       bloqueos,
            "recepciones":    recepciones,
            "errores":        errores,
        })

        feature_matrix.append([
            score_h,
            ataques,
            bloqueos,
            recepciones,
            errores,
            partidos,
        ])

    n_clusters = min(3, n_players)

    X        = np.array(feature_matrix, dtype=float)
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    max_partidos = max(p["partidos"] for p in players_data) or 1

    for i, p in enumerate(players_data):
        positivas = p["ataques"] + p["bloqueos"] + p["recepciones"]
        max_pos   = max(
            (pl["ataques"] + pl["bloqueos"] + pl["recepciones"]) for pl in players_data
        ) or 1
        continuidad = p["partidos"] / max_partidos

        p["combined_score"] = round(
            0.50 * p["score_historico"] +
            0.30 * (positivas / max_pos) * 10 + 
            0.20 * continuidad * 10,
            4
        )
        
    cluster_scores = {}
    for i, label in enumerate(labels):
        cluster_scores.setdefault(label, []).append(players_data[i]["combined_score"])

    cluster_avg    = {k: np.mean(v) for k, v in cluster_scores.items()}
    sorted_clusters = sorted(cluster_avg.items(), key=lambda x: x[1], reverse=True)

    nivel_map  = {}
    niveles    = ["Alto", "Medio", "Bajo"][:n_clusters]
    color_map  = {"Alto": "green", "Medio": "yellow", "Bajo": "red"}

    for idx, (cluster_id, _) in enumerate(sorted_clusters):
        nivel_map[cluster_id] = niveles[idx]

    results = []
    for i, p in enumerate(players_data):
        cluster_id = int(labels[i])
        nivel      = nivel_map[cluster_id]

        results.append({
            "player_id":      p["player_id"],
            "name":           p["name"],
            "posicion":       p["posicion"],
            "nivel":          nivel,
            "color":          color_map[nivel],
            "combined_score": p["combined_score"],
            "cluster_id":     cluster_id,
            "breakdown": {
                "score_historico": p["score_historico"],
                "ataques_prom":    round(p["ataques"], 2),
                "bloqueos_prom":   round(p["bloqueos"], 2),
                "recepciones_prom":round(p["recepciones"], 2),
                "errores_prom":    round(p["errores"], 2),
                "partidos":        p["partidos"],
            }
        })

    results.sort(key=lambda x: x["combined_score"], reverse=True)

    nivel_counts = {"Alto": 0, "Medio": 0, "Bajo": 0}
    for r in results:
        nivel_counts[r["nivel"]] += 1

    top = results[0] if results else None

    return {
        "team_id":       team_id,
        "team_name":     team_name,
        "classification": results,
        "total_players": n_players,
        "summary": {
            "alto":  nivel_counts["Alto"],
            "medio": nivel_counts["Medio"],
            "bajo":  nivel_counts["Bajo"],
            "top_player": {
                "player_id":     top["player_id"],
                "name":          top["name"],
                "nivel":         top["nivel"],
                "combined_score": top["combined_score"],
            } if top else None
        }
    }


if __name__ == "__main__":
    try:
        raw    = sys.stdin.read()
        payload = json.loads(raw)
        result  = classify_general(payload)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)