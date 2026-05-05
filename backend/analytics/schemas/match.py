from pydantic import BaseModel
from typing import Optional, List

class PlayerStats(BaseModel):
    player_id: str
    name: str
    position: str = 'Punta' 
    errors: int
    blocks: int
    attacks: int
    receptions: int
    historical_data: Optional[List['PlayerStats']] = None  # Para regresión futura

class MatchAnalyticsRequest(BaseModel):
    match_id: str
    players: list[PlayerStats]
