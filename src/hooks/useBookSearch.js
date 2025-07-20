import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { searchGoogleBooks } from "../services/googleBooksApi";

const RESULTS_PER_PAGE = 40;
const CACHE = new Map();

export default function useBookSearch(query, pageNumber) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [books, setBooks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const abortController = useRef(null);

  const fetchData = useCallback(async () => {
    if (!query.trim()) {
      setBooks([]);
      setHasMore(false);
      return;
    }

    try {
      setError(false);
      setLoading(true);

      if (abortController.current) {
        abortController.current.abort();
      }

      const cacheKey = `${query}-${pageNumber}`;
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
            q: query,
            page: pageNumber,
            limit: RESULTS_PER_PAGE,
            fields: "title,author_name,cover_i,first_publish_year",
            // fields: "title,author_name",
          },
          signal: abortController.current.signal,
        }),
        searchGoogleBooks(query, (pageNumber - 1) * 20),
      ]);

      // Process Open Library results
      const openLibraryBooks = openLibraryResponse.data.docs
        .slice(0, RESULTS_PER_PAGE)
        .map((b) => ({
          id: b.key,
          title: b.title,
          authors: b.author_name || ["Unknown"],
          thumbnail: b.cover_i
            ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
            : null,
          publishedDate: b.first_publish_year,
          source: "openLibrary",
          // Add links for Open Library books
          links: {
            details: `https://openlibrary.org${b.key}`,
            preview: `https://openlibrary.org${b.key}/preview`,
            info: `https://openlibrary.org${b.key}/about`,
          },
        }));

      // Combine and deduplicate results
      const combinedBooks = [...openLibraryBooks, ...googleBooks].filter(
        (book, index, self) =>
          index === self.findIndex((b) => b.title === book.title)
      );

      CACHE.set(cacheKey, {
        books: combinedBooks,
        hasMore:
          openLibraryResponse.data.numFound > pageNumber * RESULTS_PER_PAGE,
      });

      setBooks((prev) =>
        pageNumber === 1 ? combinedBooks : [...prev, ...combinedBooks]
      );
      setHasMore(
        openLibraryResponse.data.numFound > pageNumber * RESULTS_PER_PAGE
      );
    } catch (e) {
      if (!axios.isCancel(e)) {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [query, pageNumber]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [query, pageNumber, fetchData]);

  return { loading, error, books, hasMore };
}
