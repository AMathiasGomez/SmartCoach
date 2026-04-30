import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from .stats import detect_outliers_players, player_pca_analysis

# Pesos por métrica: positivas suman, negativas restan
WEIGHTS = {
    "blocks":     1.5,   # muy valioso en volleyball
    "attacks":    1.2,
    "receptions": 1.0,
    "errors":    -1.0,   # penaliza
}

CLUSTER_LABELS = {
    0: {"label": "Alto rendimiento",      "color": "green"},
    1: {"label": "Rendimiento regular",   "color": "yellow"},
    2: {"label": "Bajo rendimiento",      "color": "red"},
}

def build_feature_matrix(players):
    return np.array([
        [
            p.blocks,
            p.attacks,
            p.receptions,
            p.errors,
        ]
        for p in players
    ])

def compute_score(p):
    return (
        p.blocks     * WEIGHTS["blocks"] +
        p.attacks    * WEIGHTS["attacks"] +
        p.receptions * WEIGHTS["receptions"] +
        p.errors     * WEIGHTS["errors"]
    )

def analyze_players(players):
    if len(players) < 3:
        # Con menos de 3 jugadores, KMeans no tiene sentido
        result = _fallback_by_score(players)
    else:
        matrix = build_feature_matrix(players)
        scaler = StandardScaler()
        matrix_scaled = scaler.fit_transform(matrix)

        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        raw_labels = kmeans.fit_predict(matrix_scaled)

        # Ordenar clusters por score promedio (0=mejor, 2=peor)
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
                "player_id":   player.player_id,
                "name":        player.name,
                "score":       round(compute_score(player), 2),
                "cluster_id":  mapped,
                **CLUSTER_LABELS[mapped],
                "stats": {
                    "blocks":     player.blocks,
                    "attacks":    player.attacks,
                    "receptions": player.receptions,
                    "errors":     player.errors,
                }
            })
        result = sorted(result, key=lambda x: x["score"], reverse=True)

    # Agregar nuevas sklearn stats
    players_dict = [{"player_id": p.player_id, "blocks": p.blocks, "attacks": p.attacks, 
                     "receptions": p.receptions, "errors": p.errors} for p in players]
    
    outliers = detect_outliers_players(players_dict)
    pca_data = player_pca_analysis(players_dict)
    
    for i, item in enumerate(result):
        item["is_outlier"] = outliers[i]["is_outlier"]
        item["outlier_score"] = outliers[i]["outlier_score"]
        item["pca"] = pca_data[i] if i < len(pca_data) else {"pca_components": [0,0], "explained_variance": {}}
    
    return result

def _fallback_by_score(players):
    scored = sorted(players, key=compute_score, reverse=True)
    result = []
    for i, player in enumerate(scored):
        cluster_id = min(i, 2)
        result.append({
            "player_id":  player.player_id,
            "name":       player.name,
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