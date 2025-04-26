'use client';

interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiresAt: number | null;
}

class CacheManager {
  private storage: Storage | null = null;
  private cache: Map<string, CacheItem<any>> = new Map();
  private namespace: string;
  private defaultTTL: number;

  constructor(namespace: string = 'finaxial', defaultTTLInMinutes: number = 60) {
    this.namespace = namespace;
    this.defaultTTL = defaultTTLInMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    if (!this.storage) return;
    
    try {
      const data = this.storage.getItem(this.namespace);
      if (data) {
        const parsed = JSON.parse(data);
        Object.keys(parsed).forEach(key => {
          this.cache.set(key, parsed[key]);
        });
        
        // Clean expired items
        this.clearExpired();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
      // Start with a fresh cache on error
      this.cache = new Map();
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (!this.storage) return;
    
    try {
      const data: Record<string, CacheItem<any>> = {};
      this.cache.forEach((value, key) => {
        data[key] = value;
      });
      this.storage.setItem(this.namespace, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item is expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  public set<T>(key: string, value: T, ttlInMinutes?: number): void {
    const timestamp = Date.now();
    const ttl = ttlInMinutes !== undefined ? ttlInMinutes * 60 * 1000 : this.defaultTTL;
    const expiresAt = ttl ? timestamp + ttl : null;
    
    this.cache.set(key, {
      value,
      timestamp,
      expiresAt
    });
    
    this.saveToStorage();
  }

  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  public clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  public clearExpired(): void {
    const now = Date.now();
    let hasExpired = false;
    
    this.cache.forEach((item, key) => {
      if (item.expiresAt && item.expiresAt < now) {
        this.cache.delete(key);
        hasExpired = true;
      }
    });
    
    if (hasExpired) {
      this.saveToStorage();
    }
  }

  public getStats(): { count: number; sizeKB: number } {
    let sizeKB = 0;
    if (this.storage) {
      const data = this.storage.getItem(this.namespace) || '';
      sizeKB = (new TextEncoder().encode(data).length / 1024);
    }
    
    return {
      count: this.cache.size,
      sizeKB: Math.round(sizeKB * 100) / 100
    };
  }
}

// Create a singleton instance for consistent cache access
export const queryCache = new CacheManager('finaxial-queries', 120); // 2 hour TTL

// Helper function to create a cache key from query and data
export function createQueryCacheKey(csvData: string, question: string): string {
  // Create a simple hash of the CSV data (first 100 chars + length)
  const dataPreview = csvData.slice(0, 100);
  const dataLength = csvData.length;
  const dataHash = `${dataPreview.replace(/[\s,]/g, '')}_${dataLength}`;
  
  // Normalize the question (lowercase, trim whitespace, remove punctuation)
  const normalizedQuestion = question
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  
  return `q_${normalizedQuestion}_${dataHash}`;
} 