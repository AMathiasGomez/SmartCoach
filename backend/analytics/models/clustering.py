import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from .stats import detect_outliers_players, player_pca_analysis

POSITION_WEIGHTS = {
    "Libero":  {"attacks": 0.0, "receptions": 2.0, "blocks": 0.0, "errors": -1.0},
    "Central": {"attacks": 1.5, "receptions": 0.0, "blocks": 2.0, "errors": -1.0},
    "Opuesto": {"attacks": 1.8, "receptions": 0.5, "blocks": 1.0, "errors": -1.0},
    "Punta":   {"attacks": 1.2, "receptions": 1.2, "blocks": 1.2, "errors": -1.0},
    "Armador": {"attacks": 0.5, "receptions": 1.5, "blocks": 0.8, "errors": -1.0},
}

DEFAULT_WEIGHTS = {"attacks": 1.2, "receptions": 1.0, "blocks": 1.5, "errors": -1.0}

CLUSTER_LABELS = {
    0: {"label": "Alto rendimiento",    "color": "green"},
    1: {"label": "Rendimiento regular", "color": "yellow"},
    2: {"label": "Bajo rendimiento",    "color": "red"},
}

def get_weights(position: str) -> dict:
    return POSITION_WEIGHTS.get(position, DEFAULT_WEIGHTS)

def compute_score(p) -> float:
    w = get_weights(getattr(p, 'position', 'Punta'))
    return (
        p.attacks    * w["attacks"] +
        p.receptions * w["receptions"] +
        p.blocks     * w["blocks"] +
        p.errors     * w["errors"]
    )

def build_feature_matrix(players):
    """Matrix con pesos aplicados por posición antes de escalar."""
    return np.array([
        [
            p.attacks    * get_weights(p.position)["attacks"],
            p.receptions * get_weights(p.position)["receptions"],
            p.blocks     * get_weights(p.position)["blocks"],
            abs(p.errors * get_weights(p.position)["errors"]),
        ]
        for p in players
    ])

def analyze_players(players):
    if len(players) < 3:
        result = _fallback_by_score(players)
    else:
        matrix = build_feature_matrix(players)
        scaler = StandardScaler()
        matrix_scaled = scaler.fit_transform(matrix)

        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        raw_labels = kmeans.fit_predict(matrix_scaled)

        cluster_scores = {}
        for i, player in enumerate(players):
            cid = int(raw_labels[i])
            cluster_scores.setdefault(cid, []).append(compute_score(player))

        avg_scores = {cid: np.mean(scores) for cid, scores in cluster_scores.items()}
        sorted_clusters = sorted(avg_scores, key=avg_scores.get, reverse=True)
        remap = {old: new for new, old in enumerate(sorted_clusters)}

        result = []
        for i, player in enumerate(players):
            mapped = remap[int(raw_labels[i])]
            result.append({
                "player_id":  player.player_id,
                "name":       player.name,
                "position":   player.position,
                "score":      round(compute_score(player), 2),
                "cluster_id": mapped,
                **CLUSTER_LABELS[mapped],
                "stats": {
                    "blocks":     player.blocks,
                    "attacks":    player.attacks,
                    "receptions": player.receptions,
                    "errors":     player.errors,
                }
            })
        result = sorted(result, key=lambda x: x["score"], reverse=True)

    # Agregar outliers y PCA
    players_dict = [{
        "player_id":  p.player_id,
        "position":   p.position,
        "blocks":     p.blocks,
        "attacks":    p.attacks,
        "receptions": p.receptions,
        "errors":     p.errors
    } for p in players]

    outliers = detect_outliers_players(players_dict)
    pca_data = player_pca_analysis(players_dict)

    for i, item in enumerate(result):
        item["is_outlier"]    = outliers[i]["is_outlier"]
        item["outlier_score"] = outliers[i]["outlier_score"]
        item["pca"] = pca_data[i] if i < len(pca_data) else {"pca_components": [0, 0], "explained_variance": {}}

    return result

def _fallback_by_score(players):
    scored = sorted(players, key=compute_score, reverse=True)
    result = []
    for i, player in enumerate(scored):
        cluster_id = min(i, 2)
        result.append({
            "player_id":  player.player_id,
            "name":       player.name,
            "position":   player.position,
            "score":      round(compute_score(player), 2),
            "cluster_id": cluster_id,
            **CLUSTER_LABELS[cluster_id],
            "stats": {
                "blocks":     player.blocks,
                "attacks":    player.attacks,
                "receptions": player.receptions,
                "errors":     player.errors,
            }
        })
    return result