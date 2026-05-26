const { kmeans } = require('ml-kmeans');

const POSITION_ALIASES = {
  punta: 'Punta',
  'outside hitter': 'Punta',
  opuesto: 'Opuesto',
  'opposite hitter': 'Opuesto',
  central: 'Central',
  'middle blocker': 'Central',
  armador: 'Armador',
  setter: 'Armador',
  libero: 'Libero',
  líbero: 'Libero',
};

const POSITION_WEIGHTS = {
  Punta: { ofensiva: 0.30, recepcion: 0.25, defensa: 0.20, saque: 0.15, bloqueo: 0.10 },
  Opuesto: { ofensiva: 0.45, bloqueo: 0.20, saque: 0.20, disciplina: 0.15 },
  Central: { bloqueo: 0.40, ofensiva: 0.40, disciplina: 0.20 },
  Armador: { armado: 0.45, defensa: 0.25, saque: 0.15, bloqueo: 0.15 },
  Libero: { recepcion: 0.50, defensa: 0.40, disciplina: 0.10 },
};

const METRIC_LABELS = {
  ofensiva: 'Ataque',
  saque: 'Saque',
  recepcion: 'Recepcion',
  defensa: 'Defensa',
  bloqueo: 'Bloqueo',
  armado: 'Armado',
  disciplina: 'Control de errores',
};

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDiv(a, b) {
  return b ? a / b : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function efficiencyToScore(value) {
  return Math.round(clamp((value + 1) * 50, 0, 100) * 100) / 100;
}

function normalizePosition(position) {
  const key = String(position || 'Punta').trim().toLowerCase();
  return POSITION_ALIASES[key] || position || 'Punta';
}

function categoryFromScore(score) {
  if (score >= 85) return { category: 'Excelente', color: 'green' };
  if (score >= 70) return { category: 'Bueno', color: 'green' };
  if (score >= 50) return { category: 'Regular', color: 'yellow' };
  return { category: 'Malo', color: 'red' };
}

function hasRegisteredStats(stats) {
  return Object.values(stats).some(value => number(value) > 0);
}

function legacyToPositionStats(player) {
  return {
    ataques_positivos: number(player.ataques_positivos ?? player.attacks),
    errores_ataque: number(player.errores_ataque ?? player.errors),
    aces: number(player.aces),
    errores_saque: number(player.errores_saque),
    bloqueos_positivos: number(player.bloqueos_positivos ?? player.blocks),
    errores_bloqueo: number(player.errores_bloqueo),
    recepciones_positivas: number(player.recepciones_positivas ?? player.receptions),
    recepciones_negativas: number(player.recepciones_negativas),
    defensas_positivas: number(player.defensas_positivas),
    defensas_negativas: number(player.defensas_negativas),
    asistencias: number(player.asistencias),
    errores_armado: number(player.errores_armado),
  };
}

function calculateEfficiencies(stats) {
  const totalAttack = stats.ataques_positivos + stats.errores_ataque;
  const totalServe = stats.aces + stats.errores_saque;
  const totalReception = stats.recepciones_positivas + stats.recepciones_negativas;
  const totalDefense = stats.defensas_positivas + stats.defensas_negativas;
  const totalBlock = stats.bloqueos_positivos + stats.errores_bloqueo;
  const totalSetting = stats.asistencias + stats.errores_armado;
  const totalErrors = stats.errores_ataque + stats.errores_saque + stats.errores_bloqueo +
    stats.recepciones_negativas + stats.defensas_negativas + stats.errores_armado;
  const totalActions = Object.values(stats).reduce((sum, value) => sum + value, 0);

  return {
    eficiencia_ofensiva: safeDiv(stats.ataques_positivos - stats.errores_ataque, totalAttack),
    eficiencia_saque: safeDiv(stats.aces - stats.errores_saque, totalServe),
    eficiencia_recepcion: safeDiv(stats.recepciones_positivas - stats.recepciones_negativas, totalReception),
    eficiencia_defensiva: safeDiv(stats.defensas_positivas - stats.defensas_negativas, totalDefense),
    eficiencia_bloqueo: safeDiv(stats.bloqueos_positivos - stats.errores_bloqueo, totalBlock),
    eficiencia_armado: safeDiv(stats.asistencias - stats.errores_armado, totalSetting),
    disciplina: totalActions ? 1 - safeDiv(totalErrors, totalActions) : 0,
    total_acciones: totalActions,
    total_errores: totalErrors,
  };
}

function relevantMetrics(position, metrics) {
  const values = {
    ofensiva: metrics.eficiencia_ofensiva,
    saque: metrics.eficiencia_saque,
    recepcion: metrics.eficiencia_recepcion,
    defensa: metrics.eficiencia_defensiva,
    bloqueo: metrics.eficiencia_bloqueo,
    armado: metrics.eficiencia_armado,
    disciplina: (metrics.disciplina * 2) - 1,
  };
  return Object.keys(POSITION_WEIGHTS[position] || POSITION_WEIGHTS.Punta)
    .reduce((acc, key) => ({ ...acc, [key]: values[key] }), {});
}

function calculateScore(position, metrics) {
  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.Punta;
  const values = relevantMetrics(position, metrics);
  let score = 0;
  const breakdown = {};

  Object.entries(weights).forEach(([key, weight]) => {
    const partial = key === 'disciplina'
      ? Math.round(metrics.disciplina * 10000) / 100
      : efficiencyToScore(values[key]);
    breakdown[key] = Math.round(partial * weight * 100) / 100;
    score += partial * weight;
  });

  return { score: Math.round(score * 100) / 100, breakdown };
}

function detectStrengthsWeaknesses(position, metrics) {
  const relevant = relevantMetrics(position, metrics);
  return {
    strengths: Object.entries(relevant).filter(([, value]) => value >= 0.40).map(([key]) => METRIC_LABELS[key]),
    weaknesses: Object.entries(relevant).filter(([, value]) => value < 0).map(([key]) => METRIC_LABELS[key]),
  };
}

function generateInterpretations(position, metrics, score) {
  const messages = [];

  if (['Punta', 'Opuesto', 'Central'].includes(position)) {
    if (metrics.eficiencia_ofensiva >= 0.45) messages.push('Gran aporte ofensivo con buena relacion entre puntos y errores.');
    else if (metrics.eficiencia_ofensiva < 0) messages.push('Debe mejorar la efectividad en ataque: los errores pesaron demasiado.');
  }

  if (['Punta', 'Libero'].includes(position)) {
    if (metrics.eficiencia_recepcion >= 0.50) messages.push('Recepcion solida y confiable para sostener el primer contacto.');
    else if (metrics.eficiencia_recepcion < 0) messages.push('Problemas en recepcion; conviene revisar ubicacion y lectura del saque rival.');
  }

  if (['Libero', 'Punta', 'Armador'].includes(position)) {
    if (metrics.eficiencia_defensiva >= 0.40) messages.push('Buen rendimiento defensivo y aporte en continuidad de juego.');
    else if (metrics.eficiencia_defensiva < 0) messages.push('Bajo impacto defensivo frente al volumen de acciones recibidas.');
  }

  if (['Central', 'Opuesto', 'Armador'].includes(position) && metrics.eficiencia_bloqueo >= 0.40) {
    messages.push('Buen aporte en bloqueo, especialmente valioso para su posicion.');
  }

  if (position === 'Armador' && metrics.eficiencia_armado >= 0.60) {
    messages.push('Buena precision en la distribucion del juego.');
  }

  if (metrics.total_acciones === 0) messages.push('No hay acciones registradas suficientes para una lectura profunda.');
  else if (score >= 85) messages.push('Rendimiento integral muy alto para las exigencias de la posicion.');
  else if (score < 50) messages.push('Rendimiento por debajo de lo esperado; se recomienda revisar los fundamentos clave de la posicion.');

  return messages;
}

function compareDiff(diff) {
  if (diff >= 8) return 'por_encima';
  if (diff <= -8) return 'por_debajo';
  return 'similar';
}

function addProfiles(players) {
  const playersWithStats = players.filter(player => !player.sin_estadisticas);

  players
    .filter(player => player.sin_estadisticas)
    .forEach(player => {
      player.cluster_id = null;
      player.profile = 'Sin estadisticas';
    });

  if (playersWithStats.length < 3) {
    playersWithStats.forEach(player => { player.cluster_id = 0; player.profile = 'Perfil individual'; });
    return;
  }

  const matrix = playersWithStats.map(p => [
    p.metric_scores.ofensiva,
    p.metric_scores.recepcion,
    p.metric_scores.defensa,
    p.metric_scores.bloqueo,
    p.metric_scores.saque,
    p.score,
  ]);

  const result = kmeans(matrix, Math.min(3, players.length), { seed: 42 });
  const labels = result.clusters;
  const clusterScores = {};

  playersWithStats.forEach((player, index) => {
    const label = labels[index];
    clusterScores[label] = clusterScores[label] || [];
    clusterScores[label].push(player.score);
  });

  const sorted = Object.entries(clusterScores)
    .map(([label, scores]) => ({ label: Number(label), avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.avg - a.avg);

  const remap = {};
  sorted.forEach(({ label }, index) => { remap[label] = index; });
  const profiles = ['Impacto alto', 'Rendimiento estable', 'Necesita atencion'];

  playersWithStats.forEach((player, index) => {
    player.cluster_id = remap[labels[index]];
    player.profile = profiles[Math.min(player.cluster_id, profiles.length - 1)];
  });
}

function analyzePlayer(player) {
  const position = normalizePosition(player.position || player.posicion);
  const stats = legacyToPositionStats(player);

  if (!hasRegisteredStats(stats)) {
    return {
      player_id: String(player.player_id || ''),
      name: player.name || 'Jugador',
      position,
      score: null,
      category: 'Sin datos',
      label: 'Sin datos',
      color: 'neutral',
      sin_estadisticas: true,
      metrics: { total_acciones: 0, total_errores: 0 },
      metric_scores: {},
      score_breakdown: {},
      strengths: [],
      weaknesses: [],
      interpretations: ['No se registraron estadisticas para este jugador en el partido.'],
      recommendations: [],
      stats: {
        blocks: 0,
        attacks: 0,
        receptions: 0,
        errors: 0,
        raw: stats,
      },
    };
  }

  const metrics = calculateEfficiencies(stats);
  const { score, breakdown } = calculateScore(position, metrics);
  const { category, color } = categoryFromScore(score);
  const { strengths, weaknesses } = detectStrengthsWeaknesses(position, metrics);

  return {
    player_id: String(player.player_id || ''),
    name: player.name || 'Jugador',
    position,
    score,
    category,
    label: category,
    color,
    metrics,
    metric_scores: {
      ofensiva: efficiencyToScore(metrics.eficiencia_ofensiva),
      saque: efficiencyToScore(metrics.eficiencia_saque),
      recepcion: efficiencyToScore(metrics.eficiencia_recepcion),
      defensa: efficiencyToScore(metrics.eficiencia_defensiva),
      bloqueo: efficiencyToScore(metrics.eficiencia_bloqueo),
      armado: efficiencyToScore(metrics.eficiencia_armado),
      disciplina: Math.round(metrics.disciplina * 10000) / 100,
    },
    score_breakdown: breakdown,
    strengths,
    weaknesses,
    interpretations: generateInterpretations(position, metrics, score),
    recommendations: [],
    stats: {
      blocks: stats.bloqueos_positivos,
      attacks: stats.ataques_positivos,
      receptions: stats.recepciones_positivas,
      errors: metrics.total_errores,
      raw: stats,
    },
  };
}

function analyzeMatchPlayers(matchId, players) {
  const analysis = players.map(analyzePlayer);
  addProfiles(analysis);
  const playersWithStats = analysis.filter(player => !player.sin_estadisticas);

  const teamAverage = playersWithStats.length
    ? playersWithStats.reduce((sum, player) => sum + player.score, 0) / playersWithStats.length
    : 0;

  const bestByPosition = {};
  playersWithStats.forEach(player => {
    bestByPosition[player.position] = Math.max(bestByPosition[player.position] || 0, player.score);
  });

  analysis.forEach(player => {
    if (player.sin_estadisticas) {
      player.comparisons = null;
      return;
    }

    player.comparisons = {
      team_average_score: Math.round(teamAverage * 100) / 100,
      vs_team_average: compareDiff(player.score - teamAverage),
      best_match_score: Math.max(...playersWithStats.map(item => item.score)),
      best_position_score: bestByPosition[player.position],
      vs_best_same_position: compareDiff(player.score - bestByPosition[player.position]),
    };
  });

  analysis.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return {
    match_id: matchId,
    total_players: analysis.length,
    analysis,
  };
}

module.exports = { analyzeMatchPlayers };
