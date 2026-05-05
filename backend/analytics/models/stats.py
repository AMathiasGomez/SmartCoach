import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from typing import List, Dict, Any

POSITION_WEIGHTS = {
    "Libero":  {"attacks": 0.0, "receptions": 2.0, "blocks": 0.0, "errors": -1.0},
    "Central": {"attacks": 1.5, "receptions": 0.0, "blocks": 2.0, "errors": -1.0},
    "Opuesto": {"attacks": 1.8, "receptions": 0.5, "blocks": 1.0, "errors": -1.0},
    "Punta":   {"attacks": 1.2, "receptions": 1.2, "blocks": 1.2, "errors": -1.0},
    "Armador": {"attacks": 0.5, "receptions": 1.5, "blocks": 0.8, "errors": -1.0},
}

DEFAULT_WEIGHTS = {"attacks": 1.2, "receptions": 1.0, "blocks": 1.5, "errors": -1.0}

def get_weights(position: str) -> dict:
    return POSITION_WEIGHTS.get(position, DEFAULT_WEIGHTS)

def _weighted_matrix(players_stats: List[Dict[str, Any]]) -> np.ndarray:
    rows = []
    for p in players_stats:
        w = get_weights(p.get('position', 'Punta'))
        rows.append([
            p['attacks']    * w["attacks"],
            p['receptions'] * w["receptions"],
            p['blocks']     * w["blocks"],
            p['errors']     * abs(w["errors"]),
        ])
    return np.array(rows)

def compute_score(player: Dict[str, Any]) -> float:
    w = get_weights(player.get('position', 'Punta'))
    return (
        player['attacks']    * w["attacks"] +
        player['receptions'] * w["receptions"] +
        player['blocks']     * w["blocks"] +
        player['errors']     * w["errors"]
    )

def predict_player_trend(player_stats_history: List[Dict[str, Any]]) -> Dict[str, Any]:
    if len(player_stats_history) < 3:
        return {"error": "Necesarios al menos 3 datos históricos"}

    X = np.array(range(len(player_stats_history))).reshape(-1, 1)
    y = np.array([compute_score(p) for p in player_stats_history])

    model = LinearRegression()
    model.fit(X, y)

    prediction = model.predict([[len(player_stats_history)]])[0]

    return {
        "predicted_next_score": float(round(prediction, 2)),
        "trend":                float(round(model.coef_[0], 3)),
        "r2_score":             float(round(model.score(X, y), 3))
    }

def detect_outliers_players(players_stats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if len(players_stats) < 5:
        return [{"is_outlier": False, "outlier_score": 0.0} for _ in players_stats]

    matrix = _weighted_matrix(players_stats)

    iso = IsolationForest(contamination=0.2, random_state=42)
    outlier_labels = iso.fit_predict(matrix)
    outlier_scores = iso.decision_function(matrix)

    return [
        {
            "is_outlier":    bool(label == -1),
            "outlier_score": float(round(score, 3))
        }
        for label, score in zip(outlier_labels, outlier_scores)
    ]

def player_pca_analysis(players_stats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    matrix = _weighted_matrix(players_stats)

    if len(matrix) < 2:
        return []

    pipe = make_pipeline(StandardScaler(), PCA(n_components=2))
    components = pipe.fit_transform(matrix)
    variance = pipe.named_steps['pca'].explained_variance_ratio_

    return [
        {
            "pca_components": [float(round(float(c1), 3)), float(round(float(c2), 3))],
            "explained_variance": {
                "pc1": float(round(float(variance[0]), 3)),
                "pc2": float(round(float(variance[1]), 3))
            }
        }
        for c1, c2 in components
    ]