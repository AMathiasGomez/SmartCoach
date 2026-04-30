from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas.match import MatchAnalyticsRequest
from models.clustering import analyze_players

app = FastAPI(title="Volleyball Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "https://smartcoach-production.up.railway.app"], 
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
    
    analysis = analyze_players(data.players)
    
    return {
        "match_id": data.match_id,
        "total_players": len(data.players),
        "analysis": analysis
    }