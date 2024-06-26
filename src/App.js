import React, { useState, useRef, useCallback } from "react";
import useBookSearch from "./useBookSearch";
import "./App.css"; // Import custom CSS for styling

export default function App() {
  const [query, setQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const { books, hasMore, loading, error } = useBookSearch(query, pageNumber);

  const observer = useRef();
  const lastBookElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPageNumber((prevPageNumber) => prevPageNumber + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  function handleSearch(e) {
    setQuery(e.target.value);
    setPageNumber(1);
  }

  return (
    <div className="app-container">
      <div className="search-container">
        <input
          className="search-input"
          placeholder="Search Books"
          type="search"
          value={query}
          onChange={handleSearch}
        />
      </div>

      <div className="books-list">
        {loading && <div className="loading-text">Loading...</div>}
        {error && <div className="error-text">Error loading books.</div>}
        {!loading && books.length === 0 && (
          <div className="no-results-text">
            {query
              ? "No results found for this search. Ensure your search is correct "
              : "Search results will be displayed here."}
          </div>
        )}
        {books.map((book, index) => (
          <div
            key={book}
            ref={index === books.length - 1 ? lastBookElementRef : null}
            className="book-item"
          >
            {book}
          </div>
        ))}
        {!loading && !hasMore && books.length > 0 && (
          <div className="no-more-results-text">No more results.</div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          &copy;{" "}
          <a
            href="https://github.com/dennismbugua/Search-Books"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source Code
          </a>
        </p>
      </footer>
    </div>
  );
}
