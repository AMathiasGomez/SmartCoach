import json
import subprocess
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas.match import MatchAnalyticsRequest
from models.playerAnalytics import analyze_player
from models.positionPerformance import analyze_match
from models.teamAnalytics import analyze_team
from models.performanceClassifier import classify_general

app = FastAPI(title="Volleyball Analytics API")

BASE_DIR = Path(__file__).resolve().parent
PERFORMANCE_CLASSIFIER_SCRIPT = BASE_DIR / "models" / "performanceClassifier.py"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "https://smartcoach-production.up.railway.app",
        "https://smart-coach-kappa.vercel.app"
    ], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze/players")
def analyze(data: MatchAnalyticsRequest):
    if not data.players:
        raise HTTPException(status_code=400, detail="Se requiere al menos un jugador")
    
    return analyze_match({
        "match_id": data.match_id,
        "players": [
            player.model_dump() if hasattr(player, "model_dump") else player.dict()
            for player in data.players
        ]
    })


@app.post("/analyze/player")
def analyze_player_endpoint(payload: dict):
    return analyze_player(json.dumps(payload, ensure_ascii=False))


@app.post("/analyze/team")
def analyze_team_endpoint(payload: dict):
    return analyze_team(json.dumps(payload, ensure_ascii=False))


@app.post("/analyze/classify-general")
def classify_general_endpoint(payload: dict):
    return classify_general(payload)


@app.post("/analyze/classify-performance")
def classify_performance_endpoint(payload: dict):
    process = subprocess.run(
        [sys.executable, str(PERFORMANCE_CLASSIFIER_SCRIPT)],
        input=json.dumps(payload, ensure_ascii=False),
        text=True,
        capture_output=True,
        check=False,
    )

    if process.returncode != 0:
        raise HTTPException(status_code=500, detail=process.stderr.strip() or "Error ejecutando el clasificador")

    try:
        return json.loads(process.stdout.strip() or "{}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Respuesta invalida del clasificador: {exc}") from exc
