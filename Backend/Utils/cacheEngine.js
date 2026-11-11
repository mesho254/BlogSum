const { LRUCache } = require('lru-cache');

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 3, // 3 minutes standard TTL
  allowStale: false,
  updateAgeOnGet: false,
});

const getCached = (key) => cache.get(key);
const setCached = (key, value, ttlMs) => {
  cache.set(key, value, { ttl: ttlMs || 1000 * 60 * 3 });
};
const deleteCached = (key) => cache.delete(key);
const clearAllCache = () => cache.clear();

module.exports = {
  cache,
  getCached,
  setCached,
  deleteCached,
  clearAllCache,
};

