/* LEGACY - DEPRECATED: Use Python sklearn API instead
const { kmeans } = require('ml-kmeans'); */

const WEIGHTS = {
  blocks:     1.5,
  attacks:    1.2,
  receptions: 1.0,
  errors:    -1.0,
};

const CLUSTER_LABELS = {
  0: { label: 'Alto rendimiento',    color: 'green'  },
  1: { label: 'Rendimiento regular', color: 'yellow' },
  2: { label: 'Bajo rendimiento',    color: 'red'    },
};

function computeScore(player) {
  return (
    player.blocks     * WEIGHTS.blocks +
    player.attacks    * WEIGHTS.attacks +
    player.receptions * WEIGHTS.receptions +
    player.errors     * WEIGHTS.errors
  );
}

function standardize(matrix) {
  const nFeatures = matrix[0].length;
  const means = Array(nFeatures).fill(0);
  const stds  = Array(nFeatures).fill(0);

  matrix.forEach(row => row.forEach((val, i) => means[i] += val));
  means.forEach((_, i) => means[i] /= matrix.length);

  matrix.forEach(row => row.forEach((val, i) => stds[i] += (val - means[i]) ** 2));
  stds.forEach((_, i) => stds[i] = Math.sqrt(stds[i] / matrix.length) || 1);

  return matrix.map(row => row.map((val, i) => (val - means[i]) / stds[i]));
}

function fallbackByScore(players) {
  return [...players]
    .sort((a, b) => computeScore(b) - computeScore(a))
    .map((player, i) => ({
      player_id: player.player_id,
      name:      player.name,
      score:     Math.round(computeScore(player) * 100) / 100,
      ...CLUSTER_LABELS[Math.min(i, 2)],
      cluster_id: Math.min(i, 2),
      stats: {
        blocks:     player.blocks,
        attacks:    player.attacks,
        receptions: player.receptions,
        errors:     player.errors,
      }
    }));
}

function analyzeMatchPlayers(matchId, players) {
  if (players.length < 3) {
    return { match_id: matchId, total_players: players.length, analysis: fallbackByScore(players) };
  }

  const matrix = players.map(p => [p.blocks, p.attacks, p.receptions, p.errors]);
  const scaled = standardize(matrix);

  const result = kmeans(scaled, 3, { seed: 42 });
  const labels = result.clusters;

  // Calcular score promedio por cluster para ordenarlos (0=mejor)
  const clusterScores = {};
  players.forEach((p, i) => {
    const cid = labels[i];
    if (!clusterScores[cid]) clusterScores[cid] = [];
    clusterScores[cid].push(computeScore(p));
  });

  const avgScores = Object.entries(clusterScores)
    .map(([cid, scores]) => ({ cid: Number(cid), avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.avg - a.avg);

  const remap = {};
  avgScores.forEach(({ cid }, newId) => remap[cid] = newId);

  const analysis = players
    .map((player, i) => ({
      player_id:  player.player_id,
      name:       player.name,
      score:      Math.round(computeScore(player) * 100) / 100,
      cluster_id: remap[labels[i]],
      ...CLUSTER_LABELS[remap[labels[i]]],
      stats: {
        blocks:     player.blocks,
        attacks:    player.attacks,
        receptions: player.receptions,
        errors:     player.errors,
      }
    }))
    .sort((a, b) => b.score - a.score);

  return { match_id: matchId, total_players: players.length, analysis };
}

module.exports = { analyzeMatchPlayers };