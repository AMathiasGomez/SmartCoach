import sys, json
import numpy as np
from sklearn.preprocessing import MinMaxScaler
 
def norm_to_10(arr):
    arr = np.array(arr, dtype=float)
    mn, mx = arr.min(), arr.max()
    if mx == mn:
        return np.full(len(arr), round(float(mn) / max(mx, 1) * 10, 2))
    scaler = MinMaxScaler(feature_range=(0, 10))
    return scaler.fit_transform(arr.reshape(-1, 1)).flatten()
 
WEIGHTS = {
    "libero":          {"ataques": 0.05, "bloqueos": 0.05, "recepciones": 0.60, "eficiencia": 0.30},
    "setter":          {"ataques": 0.20, "bloqueos": 0.10, "recepciones": 0.30, "eficiencia": 0.40},
    "middle blocker":  {"ataques": 0.30, "bloqueos": 0.40, "recepciones": 0.10, "eficiencia": 0.20},
    "outside hitter":  {"ataques": 0.40, "bloqueos": 0.15, "recepciones": 0.25, "eficiencia": 0.20},
    "opposite hitter": {"ataques": 0.45, "bloqueos": 0.20, "recepciones": 0.15, "eficiencia": 0.20},
    "default":         {"ataques": 0.30, "bloqueos": 0.20, "recepciones": 0.25, "eficiencia": 0.25},
}
 
def score_jugador(partidos, posicion):
    if not partidos: return 0.0
    w = WEIGHTS.get(posicion.lower().strip(), WEIGHTS["default"])
    at = np.array([p.get("ataques", 0)     for p in partidos], dtype=float)
    bl = np.array([p.get("bloqueos", 0)    for p in partidos], dtype=float)
    rc = np.array([p.get("recepciones", 0) for p in partidos], dtype=float)
    er = np.array([p.get("errores", 0)     for p in partidos], dtype=float)
    pos_sum = at + bl + rc
    ef = np.where(pos_sum + er > 0, pos_sum / (pos_sum + er), 0.0) * 10
    s = w["ataques"]*norm_to_10(at) + w["bloqueos"]*norm_to_10(bl) + w["recepciones"]*norm_to_10(rc) + w["eficiencia"]*ef
    return round(float(s.mean()), 2)
 
def analyze_team(stats_json):
    data       = json.loads(stats_json)
    jugadores  = data.get("jugadores", [])
 
    if not jugadores:
        return {"overall_score": 0, "nivel": "Sin datos", "tendencia": "sin_datos",
                "promedios_equipo": {"ataques":0,"bloqueos":0,"recepciones":0,"eficiencia":0},
                "totales_equipo":   {"ataques":0,"bloqueos":0,"recepciones":0,"errores":0},
                "jugador_destacado": None, "ranking_jugadores": [], "partidos_analizados": 0}
 
    ranking = []
    for j in jugadores:
        s = score_jugador(j.get("partidos", []), j.get("posicion", ""))
        ranking.append({"jugador_id": j["jugador_id"], "nombre": j["nombre"],
                        "posicion": j.get("posicion",""), "score": s,
                        "partidos": len(j.get("partidos",[]))})
    ranking.sort(key=lambda x: x["score"], reverse=True)
 
    todos = [p for j in jugadores for p in j.get("partidos", [])]
    n = len(todos)
 
    if n:
        avg_at = float(np.mean([p.get("ataques",0)     for p in todos]))
        avg_bl = float(np.mean([p.get("bloqueos",0)    for p in todos]))
        avg_rc = float(np.mean([p.get("recepciones",0) for p in todos]))
        avg_er = float(np.mean([p.get("errores",0)     for p in todos]))
        pos_sum = avg_at + avg_bl + avg_rc
        ef_avg = round(pos_sum / (pos_sum + avg_er) * 10, 2) if (pos_sum + avg_er) > 0 else 0
        raw = np.array([avg_at, avg_bl, avg_rc])
        norm = (raw / raw.max() * 10) if raw.max() > 0 else raw
        prom = {"ataques": round(float(norm[0]),2), "bloqueos": round(float(norm[1]),2),
                "recepciones": round(float(norm[2]),2), "eficiencia": ef_avg}
        totales = {"ataques": int(np.sum([p.get("ataques",0) for p in todos])),
                   "bloqueos": int(np.sum([p.get("bloqueos",0) for p in todos])),
                   "recepciones": int(np.sum([p.get("recepciones",0) for p in todos])),
                   "errores": int(np.sum([p.get("errores",0) for p in todos]))}
    else:
        prom = {"ataques":0,"bloqueos":0,"recepciones":0,"eficiencia":0}
        totales = {"ataques":0,"bloqueos":0,"recepciones":0,"errores":0}
        ef_avg = 0
 
    scores_ind = [r["score"] for r in ranking if r["score"] > 0]
    overall = round(float(np.mean(scores_ind)), 2) if scores_ind else 0
    nivel = ("Élite" if overall>=8 else "Alto" if overall>=6 else "Medio" if overall>=4 else "Bajo" if overall>=2 else "Inicial")
 
    ef_series = []
    for p in todos:
        ps = p.get("ataques",0)+p.get("bloqueos",0)+p.get("recepciones",0)
        er = p.get("errores",0)
        ef_series.append(ps/(ps+er) if ps+er>0 else 0)
    if len(ef_series) >= 4:
        mid = len(ef_series)//2
        tendencia = "mejorando" if np.mean(ef_series[mid:])>np.mean(ef_series[:mid])+0.03 else \
                    "bajando"   if np.mean(ef_series[mid:])<np.mean(ef_series[:mid])-0.03 else "estable"
    else:
        tendencia = "estable"
 
    return {
        "promedios_equipo": prom,
        "totales_equipo":   totales,
        "overall_score":    overall,
        "nivel":            nivel,
        "tendencia":        tendencia,
        "jugador_destacado": ranking[0] if ranking else None,
        "ranking_jugadores": ranking,
        "partidos_analizados": n
    }
 
if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    try:
        print(json.dumps(analyze_team(raw)))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
 