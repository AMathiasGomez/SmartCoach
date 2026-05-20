from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas.match import MatchAnalyticsRequest
from models.positionPerformance import analyze_match

app = FastAPI(title="Volleyball Analytics API")

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
