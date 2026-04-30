import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from typing import List, Dict, Any

def predict_player_trend(player_stats_history: List[Dict[str, Any]]) -> Dict[str, Any]:
    if len(player_stats_history) < 3:
        return {"error": "Necesarios al menos 3 datos históricos"}
    
    X = np.array(range(len(player_stats_history))).reshape(-1, 1)
    y = np.array([compute_score(p) for p in player_stats_history])
    
    model = LinearRegression()
    model.fit(X, y)
    
    next_time = len(player_stats_history)
    prediction = model.predict([[next_time]])[0]
    
    return {
        "predicted_next_score": float(round(prediction, 2)),
        "trend": float(round(model.coef_[0], 3)),
        "r2_score": float(round(model.score(X, y), 3))
    }

def detect_outliers_players(players_stats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if len(players_stats) < 5:
        return [{"is_outlier": False, "outlier_score": 0.0} for _ in players_stats]
    
    matrix = np.array([
        [p['blocks'], p['attacks'], p['receptions'], p['errors']]
        for p in players_stats
    ])
    
    iso = IsolationForest(contamination=0.2, random_state=42)
    outlier_labels = iso.fit_predict(matrix)
    outlier_scores = iso.decision_function(matrix)
    
    results = []
    for label, score in zip(outlier_labels, outlier_scores):
        results.append({
            "is_outlier": bool(label == -1),
            "outlier_score": float(round(score, 3))
        })
    
    return results

def player_pca_analysis(players_stats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    matrix = np.array([
        [p['blocks'], p['attacks'], p['receptions'], p['errors']]
        for p in players_stats
    ])
    
    if len(matrix) < 2:
        return []
    
    pipe = make_pipeline(StandardScaler(), PCA(n_components=2))
    components = pipe.fit_transform(matrix)
    variance = pipe.named_steps['pca'].explained_variance_ratio_
    
    return [{
        "pca_components": [float(round(float(c1), 3)), float(round(float(c2), 3))],
        "explained_variance": {
            "pc1": float(round(float(variance[0]), 3)),
            "pc2": float(round(float(variance[1]), 3))
        }
    } for c1, c2 in components]

def compute_score(player: Dict[str, Any]) -> float:
    WEIGHTS = {"blocks": 1.5, "attacks": 1.2, "receptions": 1.0, "errors": -1.0}
    return (
        player['blocks'] * WEIGHTS["blocks"] +
        player['attacks'] * WEIGHTS["attacks"] +
        player['receptions'] * WEIGHTS["receptions"] +
        player['errors'] * WEIGHTS["errors"]
    )   