import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { searchGoogleBooks } from "../services/googleBooksApi";

const RESULTS_PER_PAGE = 40;
const CACHE = new Map();
const DEFAULT_QUERY = "subject:fiction"; // Default query for initial load

export default function useBookSearch(query, pageNumber, onPageReset) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [books, setBooks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const abortController = useRef(null);

  const fetchData = useCallback(async () => {
    // Use default query if no search query is provided
    const searchQuery = query.trim() || DEFAULT_QUERY;

    try {
      setError(false);
      setLoading(true);

      // Cancel previous requests
      if (abortController.current) {
        abortController.current.abort();
      }

      // Check cache
      const cacheKey = `${searchQuery}-${pageNumber}`;
      if (CACHE.has(cacheKey)) {
        const cachedData = CACHE.get(cacheKey);
        setBooks((prev) =>
          pageNumber === 1 ? cachedData.books : [...prev, ...cachedData.books]
        );
        setHasMore(cachedData.hasMore);
        setLoading(false);
        return;
      }

      abortController.current = new AbortController();

      // Fetch from both APIs concurrently
      const [openLibraryResponse, googleBooks] = await Promise.all([
        axios({
          method: "GET",
          url: "http://openlibrary.org/search.json",
          params: {
            q: searchQuery,
            page: pageNumber,
            limit: RESULTS_PER_PAGE,
            fields: "title,author_name,cover_i,first_publish_year,key",
          },
          signal: abortController.current.signal,
        }),
        searchGoogleBooks(searchQuery, (pageNumber - 1) * 20),
      ]);

      // Process Open Library results
      const openLibraryBooks = openLibraryResponse.data.docs
        .slice(0, RESULTS_PER_PAGE)
        .map((book) => ({
          id: book.key,
          title: book.title,
          authors: book.author_name || ["Unknown"],
          thumbnail: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null,
          publishedDate: book.first_publish_year?.toString(),
          source: "openLibrary",
          links: {
            details: `https://openlibrary.org${book.key}`,
            preview: `https://openlibrary.org${book.key}/preview`,
            info: `https://openlibrary.org${book.key}/about`,
          },
        }));

      // Combine and deduplicate results
      const combinedBooks = [...openLibraryBooks, ...(googleBooks || [])]
        .filter(Boolean) // Remove any null/undefined entries
        .filter(
          (book, index, self) =>
            index ===
            self.findIndex(
              (b) =>
                b.title.toLowerCase() === book.title.toLowerCase() &&
                b.authors.join() === book.authors.join()
            )
        );

      // Cache the results
      CACHE.set(cacheKey, {
        books: combinedBooks,
        hasMore:
          openLibraryResponse.data.numFound > pageNumber * RESULTS_PER_PAGE,
      });

      // Update state
      setBooks((prev) =>
        pageNumber === 1 ? combinedBooks : [...prev, ...combinedBooks]
      );
      setHasMore(
        openLibraryResponse.data.numFound > pageNumber * RESULTS_PER_PAGE
      );
    } catch (e) {
      if (!axios.isCancel(e)) {
        console.error("Search error:", e);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [query, pageNumber]);

  // Fetch data when query or page changes
  useEffect(() => {
    fetchData();
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [query, pageNumber, fetchData]);

  // Clear books when query changes
  useEffect(() => {
    if (query !== "") {
      setBooks([]);
      // setPageNumber(1);

      // Call the callback to reset page number in parent
      onPageReset?.();
    }
  }, [query]);

  return { loading, error, books, hasMore };
}
