from pydantic import BaseModel
from typing import List, Optional


class PlayerStats(BaseModel):
    player_id: str
    name: str
    position: str = "Punta"
    errors: int = 0
    blocks: int = 0
    attacks: int = 0
    receptions: int = 0
    ataques_positivos: int = 0
    errores_ataque: int = 0
    aces: int = 0
    errores_saque: int = 0
    bloqueos_positivos: int = 0
    errores_bloqueo: int = 0
    recepciones_positivas: int = 0
    recepciones_negativas: int = 0
    defensas_positivas: int = 0
    defensas_negativas: int = 0
    asistencias: int = 0
    errores_armado: int = 0
    historical_data: Optional[List["PlayerStats"]] = None


class MatchAnalyticsRequest(BaseModel):
    match_id: str
    players: list[PlayerStats]
