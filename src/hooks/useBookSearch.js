import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { searchGoogleBooks } from "../services/googleBooksApi";

/**
 * Performance and Cache Configuration
 *
 * WHY: These values balance performance, memory usage, and data freshness:
 * - 40 results: Good balance between loading time and content variety
 * - 15 minutes cache: Fresh enough for book data, reduces API calls
 * - 100 entries: Prevents memory bloat while caching frequent searches
 * - 10 second timeout: Prevents hanging requests on slow connections
 */
const RESULTS_PER_PAGE = 40;
const CACHE_EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2; // Number of retry attempts on failure

/**
 * Enhanced Cache with Expiration and Size Management
 *
 * WHY: Prevents memory leaks and ensures data freshness in production.
 * LRU-style eviction prevents unlimited growth and improves performance.
 */
class BookCache {
  constructor() {
    this.cache = new Map();
    this.accessOrder = new Map();
    this.hitCount = 0;
    this.missCount = 0;
  }

  set(key, data) {
    const now = Date.now();

    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      size: this.estimateSize(data),
    });
    this.accessOrder.set(key, now);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }

    const now = Date.now();

    if (now - entry.timestamp > CACHE_EXPIRATION_TIME) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.missCount++;
      return null;
    }

    entry.accessCount++;
    this.accessOrder.set(key, now);
    this.hitCount++;

    return entry.data;
  }

  has(key) {
    return this.get(key) !== null;
  }

  evictOldest() {
    const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2) || 1;
    const sortedEntries = Array.from(this.accessOrder.entries()).sort(
      ([, a], [, b]) => a - b
    );

    for (let i = 0; i < entriesToRemove && sortedEntries.length > 0; i++) {
      const [key] = sortedEntries[i];
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }
  }

  estimateSize(data) {
    return JSON.stringify(data).length * 2;
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate =
      totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
    const totalMemory = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );

    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      hitRate: Math.round(hitRate),
      totalMemory: Math.round(totalMemory / 1024),
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }
}

// Global cache instance
const BOOK_CACHE = new BookCache();

/**
 * Default query for initial load
 */
const DEFAULT_QUERY = "fiction";

/**
 * Input sanitization function
 */
const sanitizeQuery = (query) => {
  if (!query || typeof query !== "string") return DEFAULT_QUERY;

  return query
    .trim()
    .replace(/[<>\"'&]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 200);
};

/**
 * Utility function for string sanitization
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[<>\"'&]/g, "").trim();
};

/**
 * Advanced book similarity comparison
 */
const isSimilarBook = (book1, book2) => {
  const normalizeTitle = (title) =>
    title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const title1 = normalizeTitle(book1.title);
  const title2 = normalizeTitle(book2.title);

  const titleMatch =
    title1 === title2 ||
    (title1.length > 5 &&
      title2.length > 5 &&
      (title1.includes(title2) || title2.includes(title1)));

  const authors1 = book1.authors.map((a) => a.toLowerCase()).sort();
  const authors2 = book2.authors.map((a) => a.toLowerCase()).sort();
  const authorMatch = authors1.some((a1) =>
    authors2.some((a2) => a1.includes(a2) || a2.includes(a1))
  );

  return titleMatch && authorMatch;
};

/**
 * Enhanced custom hook for book search functionality
 */
export default function useBookSearch(query, pageNumber, onPageReset) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [books, setBooks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [cacheStats, setCacheStats] = useState(BOOK_CACHE.getStats());
  const [retryCount, setRetryCount] = useState(0);

  const abortController = useRef(null);
  const pendingRequests = useRef(new Set());
  const retryTimeouts = useRef(new Map());

  /**
   * Enhanced data fetching with comprehensive error handling and retry logic
   */
  const fetchData = useCallback(
    async (retryAttempt = 0) => {
      const sanitizedQuery = sanitizeQuery(query) || DEFAULT_QUERY;
      const cacheKey = `${sanitizedQuery}-${pageNumber}`;

      console.log("Fetching data for:", {
        sanitizedQuery,
        pageNumber,
        cacheKey,
      });

      if (pendingRequests.current.has(cacheKey)) {
        console.log("Request already pending for:", cacheKey);
        return;
      }

      try {
        setError(false);
        setLoading(true);

        // Check cache first
        if (BOOK_CACHE.has(cacheKey)) {
          console.log("Cache hit for:", cacheKey);
          const cachedData = BOOK_CACHE.get(cacheKey);
          setBooks((prev) =>
            pageNumber === 1 ? cachedData.books : [...prev, ...cachedData.books]
          );
          setHasMore(cachedData.hasMore);
          setCacheStats(BOOK_CACHE.getStats());
          setLoading(false);
          setRetryCount(0);
          return;
        }

        // Cancel previous requests
        if (abortController.current) {
          abortController.current.abort();
        }

        abortController.current = new AbortController();
        pendingRequests.current.add(cacheKey);

        console.log("Making API calls...");

        // Fetch from both APIs with enhanced error handling
        const [openLibraryResult, googleBooksResult] = await Promise.allSettled(
          [
            // Open Library API call
            axios({
              method: "GET",
              url: "https://openlibrary.org/search.json",
              params: {
                q: sanitizedQuery,
                page: pageNumber,
                limit: RESULTS_PER_PAGE,
                fields: "title,author_name,cover_i,first_publish_year,key",
              },
              signal: abortController.current.signal,
              timeout: REQUEST_TIMEOUT,
              headers: {
                Accept: "application/json",
                "User-Agent": "BookSearchApp/1.0",
              },
            }),

            // Google Books API call with fallback
            searchGoogleBooks(sanitizedQuery, (pageNumber - 1) * 20).catch(
              (error) => {
                console.warn("Google Books API unavailable:", error.message);
                return [];
              }
            ),
          ]
        );

        console.log("API Results:", { openLibraryResult, googleBooksResult });

        // Process Open Library results
        let openLibraryBooks = [];
        let totalResults = 0;

        if (openLibraryResult.status === "fulfilled") {
          const response = openLibraryResult.value;
          totalResults = response.data.numFound || 0;

          console.log("Open Library response:", response.data);

          openLibraryBooks = response.data.docs
            .slice(0, RESULTS_PER_PAGE)
            .map((book) => ({
              id:
                sanitizeString(book.key) || `ol-${Date.now()}-${Math.random()}`,
              title: sanitizeString(book.title) || "Unknown Title",
              authors: Array.isArray(book.author_name)
                ? book.author_name
                    .map((author) => sanitizeString(author))
                    .slice(0, 3)
                : ["Unknown Author"],
              thumbnail: book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : null,
              publishedDate: book.first_publish_year?.toString() || null,
              source: "openLibrary",
              links: {
                details: `https://openlibrary.org${sanitizeString(book.key)}`,
                preview: `https://openlibrary.org${sanitizeString(
                  book.key
                )}/preview`,
                info: `https://openlibrary.org${sanitizeString(
                  book.key
                )}/about`,
              },
            }))
            .filter((book) => book.title && book.title !== "Unknown Title");
        } else {
          console.warn("Open Library API failed:", openLibraryResult.reason);
        }

        // Process Google Books results
        let googleBooks = [];
        if (googleBooksResult.status === "fulfilled") {
          googleBooks = googleBooksResult.value || [];
        }

        console.log("Processed books:", { openLibraryBooks, googleBooks });

        // Enhanced deduplication algorithm
        const combinedBooks = [...openLibraryBooks, ...googleBooks]
          .filter(Boolean)
          .reduce((acc, book) => {
            const isDuplicate = acc.some((existing) =>
              isSimilarBook(existing, book)
            );
            if (!isDuplicate) {
              acc.push(book);
            }
            return acc;
          }, []);

        console.log("Final combined books:", combinedBooks);

        // Cache the results
        const resultData = {
          books: combinedBooks,
          hasMore: totalResults > pageNumber * RESULTS_PER_PAGE,
          totalResults,
          searchQuery: sanitizedQuery,
          pageNumber,
          timestamp: Date.now(),
        };

        BOOK_CACHE.set(cacheKey, resultData);

        // Update state
        setBooks((prev) =>
          pageNumber === 1 ? combinedBooks : [...prev, ...combinedBooks]
        );
        setHasMore(resultData.hasMore);
        setCacheStats(BOOK_CACHE.getStats());
        setRetryCount(0);
      } catch (error) {
        console.error("Fetch error:", error);
        if (!axios.isCancel(error)) {
          console.error("Search error:", {
            message: error.message,
            query: sanitizedQuery,
            pageNumber,
            retryAttempt,
            timestamp: new Date().toISOString(),
          });

          // Implement exponential backoff retry logic
          if (retryAttempt < MAX_RETRIES) {
            const retryDelay = Math.pow(2, retryAttempt) * 1000;
            setRetryCount(retryAttempt + 1);

            const timeoutId = setTimeout(() => {
              fetchData(retryAttempt + 1);
            }, retryDelay);

            retryTimeouts.current.set(cacheKey, timeoutId);
          } else {
            setError(true);
          }
        }
      } finally {
        setLoading(false);
        pendingRequests.current.delete(cacheKey);
      }
    },
    [query, pageNumber]
  );

  /**
   * Manual retry function for user-initiated retries
   */
  const retrySearch = useCallback(() => {
    setError(false);
    setRetryCount(0);
    fetchData(0);
  }, [fetchData]);

  // Fetch data when query or page changes
  useEffect(() => {
    fetchData();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      retryTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      retryTimeouts.current.clear();
    };
  }, [fetchData]);

  // Clear books when query changes
  useEffect(() => {
    if (query !== "") {
      setBooks([]);
      onPageReset?.();
    }
  }, [query, onPageReset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingRequests.current.clear();
      retryTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      retryTimeouts.current.clear();
    };
  }, []);

  return {
    loading,
    error,
    books,
    hasMore,
    cacheStats,
    retryCount,
    retrySearch,
  };
}

/**
 * Utility exports
 */
export const clearBookCache = () => {
  BOOK_CACHE.clear();
};

export const getBookCacheStats = () => {
  return BOOK_CACHE.getStats();
};

export { BOOK_CACHE };
