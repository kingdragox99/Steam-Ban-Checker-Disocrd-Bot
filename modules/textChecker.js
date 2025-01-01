// Cache pour les résultats de vérification
const checkCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function textChecker(string, data) {
  // Créer une clé unique pour le cache
  const cacheKey = `${string}_${JSON.stringify(data)}`;

  // Vérifier le cache
  const cached = checkCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // Optimisation : convertir en Set pour une recherche plus rapide
  const validCommands = new Set(Object.values(data));

  // Optimisation : vérifier d'abord les cas simples
  const result =
    validCommands.has(string) ||
    Array.from(validCommands).some((cmd) => string.includes(cmd));

  // Mettre en cache
  checkCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });

  return result;
}

// Nettoyer le cache périodiquement
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of checkCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      checkCache.delete(key);
    }
  }
}, CACHE_TTL);

module.exports = textChecker;
