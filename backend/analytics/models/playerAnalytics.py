import sys
import json
import numpy as np
from sklearn.preprocessing import MinMaxScaler
 
def analyze_player(stats_json):
    data = json.loads(stats_json)
    partidos = data.get("partidos", [])
    posicion = data.get("posicion", "").lower()
 
    if not partidos:
        return {
            "scores": { "ataques": 0, "bloqueos": 0, "recepciones": 0, "eficiencia": 0 },
            "overall_score": 0,
            "tendencia": "sin_datos",
            "nivel": "Sin datos",
            "partidos_analizados": 0
        }
 
    ataques    = np.array([p.get("ataques", 0)    for p in partidos], dtype=float)
    bloqueos   = np.array([p.get("bloqueos", 0)   for p in partidos], dtype=float)
    recepciones= np.array([p.get("recepciones", 0)for p in partidos], dtype=float)
    errores    = np.array([p.get("errores", 0)    for p in partidos], dtype=float)
 
    n = len(partidos)
 
    positivas = ataques + bloqueos + recepciones
    totales   = positivas + errores
    eficiencia_raw = np.where(totales > 0, positivas / totales, 0.0)
 
    def norm_to_10(arr):
        mn, mx = arr.min(), arr.max()
        if mx == mn:
            return np.full(len(arr), round(float(mn) / max(mx, 1) * 10, 2))
        scaler = MinMaxScaler(feature_range=(0, 10))
        return scaler.fit_transform(arr.reshape(-1, 1)).flatten()
 
    at_norm = norm_to_10(ataques)
    bl_norm = norm_to_10(bloqueos)
    rc_norm = norm_to_10(recepciones)
    ef_norm = eficiencia_raw * 10   
 
    weights = {
        "libero":           {"ataques": 0.05, "bloqueos": 0.05, "recepciones": 0.60, "eficiencia": 0.30},
        "setter":           {"ataques": 0.20, "bloqueos": 0.10, "recepciones": 0.30, "eficiencia": 0.40},
        "middle blocker":   {"ataques": 0.30, "bloqueos": 0.40, "recepciones": 0.10, "eficiencia": 0.20},
        "outside hitter":   {"ataques": 0.40, "bloqueos": 0.15, "recepciones": 0.25, "eficiencia": 0.20},
        "opposite hitter":  {"ataques": 0.45, "bloqueos": 0.20, "recepciones": 0.15, "eficiencia": 0.20},
    }
    pos_key = posicion.strip()
    w = weights.get(pos_key, {"ataques": 0.30, "bloqueos": 0.20, "recepciones": 0.25, "eficiencia": 0.25})
 
    overall_per_match = (
        w["ataques"]     * at_norm +
        w["bloqueos"]    * bl_norm +
        w["recepciones"] * rc_norm +
        w["eficiencia"]  * ef_norm
    )
 
    score_ataques     = round(float(at_norm.mean()), 2)
    score_bloqueos    = round(float(bl_norm.mean()), 2)
    score_recepciones = round(float(rc_norm.mean()), 2)
    score_eficiencia  = round(float(ef_norm.mean()), 2)
    overall_score     = round(float(overall_per_match.mean()), 2)
 
    if n >= 4:
        recientes   = overall_per_match[-3:].mean()
        anteriores  = overall_per_match[:-3].mean()
        diff = recientes - anteriores
        if diff > 0.5:
            tendencia = "mejorando"
        elif diff < -0.5:
            tendencia = "bajando"
        else:
            tendencia = "estable"
    elif n >= 2:
        tendencia = "mejorando" if overall_per_match[-1] >= overall_per_match[0] else "bajando"
    else:
        tendencia = "estable"
 
    if overall_score >= 8:
        nivel = "Élite"
    elif overall_score >= 6:
        nivel = "Alto"
    elif overall_score >= 4:
        nivel = "Medio"
    elif overall_score >= 2:
        nivel = "Bajo"
    else:
        nivel = "Inicial"
 
    historial = [round(float(v), 2) for v in overall_per_match.tolist()]
 
    return {
        "scores": {
            "ataques":     score_ataques,
            "bloqueos":    score_bloqueos,
            "recepciones": score_recepciones,
            "eficiencia":  score_eficiencia
        },
        "overall_score":      overall_score,
        "tendencia":          tendencia,
        "nivel":              nivel,
        "partidos_analizados": n,
        "historial_scores":   historial
    }
 
 
if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    try:
        result = analyze_player(raw)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)