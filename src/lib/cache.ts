// Simple in-memory cache with LRU eviction
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize = 100, ttlMinutes = 30) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key: string, value: T): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } 
    // Remove oldest if at capacity
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instances
const suggestionCache = new LRUCache(50, 60); // 1 hour TTL
const flightCache = new LRUCache(100, 30); // 30 minutes TTL
const hotelCache = new LRUCache(100, 30); // 30 minutes TTL

export { suggestionCache, flightCache, hotelCache };

// Cache key generators
export const generateCacheKey = {
  suggestions: (params: {
    from: string;
    budget: number;
    vibes: string[];
    adults: number;
    kids: number;
  }) => `suggestions_${params.from}_${params.budget}_${params.vibes.sort().join(',')}_${params.adults}_${params.kids}`,
  
  flights: (params: {
    origin: string;
    destination: string;
    date: string;
    adults: number;
  }) => `flights_${params.origin}_${params.destination}_${params.date}_${params.adults}`,
  
  hotels: (params: {
    destination: string;
    checkin: string;
    checkout: string;
    adults: number;
  }) => `hotels_${params.destination}_${params.checkin}_${params.checkout}_${params.adults}`,
};

// Metrics tracking
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit() {
    this.hits++;
  },
  
  recordMiss() {
    this.misses++;
  },
  
  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      total
    };
  },
  
  reset() {
    this.hits = 0;
    this.misses = 0;
  }
};
