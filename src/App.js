/**
 * Book Search Application with Enhanced Performance and Security
 *
 * A React application that allows users to search for books using multiple APIs,
 * sort results, and view book details. Uses virtual scrolling for performance
 * with large datasets and React.memo for optimal re-rendering.
 *
 * WHY: Combines Google Books API and Open Library API to provide comprehensive
 * book search results. Virtual scrolling prevents DOM bloat when displaying
 * hundreds of results. Memoization prevents unnecessary re-renders.
 *
 * @component
 * @example
 * return (
 *   <App />
 * )
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import useBookSearch from "./hooks/useBookSearch";
import "./App.css";

/**
 * Memoized Book Row Component
 * 
 * WHY: React.memo prevents re-rendering when props haven't changed,
 * significantly improving performance with large lists. Custom comparison
 * function provides precise control over when re-renders occur.
 * 
 * @param {Object} book - Book data object
 * @param {Object} style - Inline styles from react-window (required for virtualization)
 * @param {Function} onClick - Click handler for book interactions
 * @returns {JSX.Element} Rendered book row
 */


















































































/**
 * Memoized Book Row Component
 * 
 * WHY: React.memo prevents re-rendering when props haven't changed,
 * significantly improving performance with large lists. Custom comparison
 * function provides precise control over when re-renders occur.
 * 
 * @param {Object} book - Book data object
 * @param {Object} style - Inline styles from react-window (required for virtualization)
 * @param {Function} onClick - Click handler for book interactions
 * @returns {JSX.Element} Rendered book row
 */
const BookRow = React.memo(({ book, style, onClick }) => {
  /**
   * Handle book title click to open external links
   *
   * WHY: Different APIs provide different link structures:
   * - Open Library: Uses book.id as path, has structured links object
   * - Google Books: Provides direct infoLink and previewLink URLs
   *
   * Security: Uses noopener,noreferrer to prevent potential security issues
   * when opening external links in new tabs.
   *
   * NOTE: useCallback is defined at top level to follow React Hooks rules
   */
  const handleTitleClick = useCallback(() => {
    if (!book) return; // Guard clause for when book doesn't exist
    
    let linkToOpen = null;

    // Determine which link to open based on book source
    if (book.source === "openLibrary") {
      // WHY: Open Library books use their ID as the path
      linkToOpen = book.links?.details || `https://openlibrary.org${book.id}`;
    } else if (book.source === "google") {
      // WHY: Google Books provides ready-to-use URLs
      linkToOpen = book.infoLink || book.previewLink;
    }

    // Open link in new tab if available
    if (linkToOpen) {
      // WHY: noopener,noreferrer prevents potential security vulnerabilities
      window.open(linkToOpen, "_blank", "noopener,noreferrer");
    }
  }, [book?.source, book?.links, book?.id, book?.infoLink, book?.previewLink]);

  /**
   * Handle image loading errors
   * 
   * WHY: Provides fallback when book cover images fail to load,
   * maintaining consistent layout and user experience.
   *
   * NOTE: Always defined at top level, uses guard clause for safety
   */
  const handleImageError = useCallback((e) => {
    if (!e.target || !e.target.nextSibling) return;
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  }, []);

  /**
   * Handle keyboard navigation for accessibility
   * 
   * WHY: Ensures the application is accessible to users who navigate
   * with keyboards or screen readers.
   *
   * NOTE: Always defined at top level, delegates to handleTitleClick
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTitleClick();
    }
  }, [handleTitleClick]);

  /**
   * Loading skeleton component
   * 
   * WHY: Skeleton loading provides better UX than blank space while data loads.
   * Structure matches actual content to prevent layout shift.
   */
  if (!book) {
    return (
      <div style={style} className="p-4 border-b animate-pulse">
        <div className="flex gap-4">
          <div className="w-16 h-24 bg-gray-200 rounded" aria-label="Loading book cover"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" aria-label="Loading title"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" aria-label="Loading author"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4" aria-label="Loading publication date"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        height: "auto",
        minHeight: "160px",
        padding: "16px",
      }}
      className="border-b hover:bg-gray-50 transition-colors"
      role="article"
      aria-label={`Book: ${book.title} by ${book.authors.join(", ")}`}
    >
      <div className="flex gap-6">
        {/* Book Cover Section */}
        <div className="flex-shrink-0 w-[100px]">
          {book.thumbnail ? (
            <>
              <img
                src={book.thumbnail}
                alt={`Cover of ${book.title}`}
                className="w-20 h-30 object-cover rounded-md shadow-sm hover:shadow-md transition-shadow"
                loading="lazy"
                onError={handleImageError}
              />
              {/* Hidden fallback div, shown when image fails */}
              <div 
                className="w-20 h-30 bg-gray-100 rounded-md flex items-center justify-center hidden"
                aria-label="No book cover available"
              >
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </>
          ) : (
            <div 
              className="w-20 h-30 bg-gray-100 rounded-md flex items-center justify-center"
              aria-label="No book cover available"
            >
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Book Information Section */}
        <div className="flex-1 min-w-0">
          {/* Book Title - Clickable */}
          <h3
            className="font-semibold text-lg text-gray-900 leading-tight hover:text-blue-600 transition-colors truncate cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            onClick={handleTitleClick}
            onKeyDown={handleKeyDown}
            title="Click to view book details"
            role="button"
            tabIndex={0}
            aria-label={`View details for ${book.title}`}
          >
            {book.title}
          </h3>

          {/* Authors */}
          <p className="text-gray-600 text-sm mt-1 truncate">
            By {book.authors.join(", ")}
          </p>

          {/* Publication Date */}
          {book.publishedDate && (
            <p className="text-gray-500 text-sm mt-1">
              Published: {book.publishedDate}
            </p>
          )}

          {/* Source Badge */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${
                  book.source === "openLibrary"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }
              `}
              aria-label={`Source: ${book.source === "openLibrary" ? "Open Library" : "Google Books"}`}
            >
              {book.source === "openLibrary" ? "Open Library" : "Google Books"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  /**
   * Custom comparison function for React.memo
   * 
   * WHY: Provides precise control over when component re-renders.
   * Only re-render if book ID changes or style object changes.
   * This prevents unnecessary re-renders when parent state changes.
   */
  return (
    prevProps.book?.id === nextProps.book?.id &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
  );
});

// Set display name for better debugging
BookRow.displayName = 'BookRow';











































































/**
 * Memoized Search Controls Component
 * 
 * WHY: Separating controls into their own component with React.memo
 * prevents re-rendering when only the book list changes.
 */
const SearchControls = React.memo(({ 
  query, 
  onSearchChange, 
  sortBy, 
  sortOrder, 
  onSortChange, 
  onSortOrderChange,
  isSearching,
  resultsCount
}) => (
  <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
    {/* Search Bar */}
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={onSearchChange}
        placeholder="Search for books..."
        className="w-full p-3 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        maxLength={100}
        aria-label="Search for books"
        aria-describedby="search-help"
      />
      <div id="search-help" className="sr-only">
        Enter book title, author, or keywords to search
      </div>
      
      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div 
            className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"
            aria-label="Searching..."
            role="status"
          ></div>
        </div>
      )}
    </div>

    {/* Sort Controls */}
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Results Count */}
      {resultsCount > 0 && (
        <div className="text-sm text-gray-600 order-2 sm:order-1">
          Showing {resultsCount} results
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center gap-3 order-1 sm:order-2">
        <div className="relative w-full sm:w-[140px]">
          <select
            value={sortBy}
            onChange={onSortChange}
            className="w-full appearance-none px-4 py-2.5 pr-8 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            aria-label="Sort books by"
          >
            <option value="title">Sort by Title</option>
            <option value="authors">Sort by Author</option>
            <option value="publishedDate">Sort by Date</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg
              className="h-4 w-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        <button
          onClick={onSortOrderChange}
          className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition-colors min-w-[40px] flex items-center justify-center"
          aria-label={sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
        >
          <span className="text-lg" aria-hidden="true">
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        </button>
      </div>
    </div>
  </div>
));

SearchControls.displayName = 'SearchControls';

/**
 * Main App Component
 * 
 * WHY: Manages global state and coordinates between search functionality,
 * sorting, and virtual list rendering. Uses React hooks for optimal
 * performance and state management.
 */
export default function App() {
  // State Management
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  const listRef = useRef();
  const debounceTimer = useRef(null);

  /**
   * Debounce search functionality
   *
   * WHY: Prevents excessive API calls while user is typing. 300ms delay provides
   * good balance between responsiveness and API efficiency. Without debouncing,
   * each keystroke would trigger an API call, potentially hitting rate limits
   * and degrading performance.
   *
   * @param {string} query - The search term that triggers API calls
   */
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPageNumber(1); // Reset to first page on new search
    }, 300); // 300ms delay - optimal for user experience vs API efficiency

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  /**
   * Page reset handler
   * 
   * WHY: useCallback prevents function recreation on every render,
   * avoiding unnecessary effect triggers in child components.
   */
  const handlePageReset = useCallback(() => {
    setPageNumber(1);
  }, []);

  const { books, hasMore, loading, error } = useBookSearch(
    debouncedQuery, // Use debounced query instead of direct query
    pageNumber,
    handlePageReset
  );

  /**
   * Memoized sorting function
   *
   * WHY: useMemo prevents expensive sorting operation on every render.
   * Different data types require different sorting logic:
   * - Authors: Array of strings, sort by first author
   * - Title/Date: Simple string comparison
   * - Locale compare: Handles international characters properly
   *
   * @param {Array} books - Array of book objects to sort
   * @returns {Array} Sorted array of books
   */
  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "authors") {
        // WHY: Authors is an array, use first author for sorting consistency
        aValue = (a[sortBy]?.[0] || "").toLowerCase();
        bValue = (b[sortBy]?.[0] || "").toLowerCase();
      } else {
        aValue = (a[sortBy] || "").toLowerCase();
        bValue = (b[sortBy] || "").toLowerCase();
      }

      // WHY: localeCompare handles unicode characters and provides consistent sorting
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [books, sortBy, sortOrder]);

  /**
   * Memoized event handlers
   * 
   * WHY: useCallback prevents function recreation, reducing re-renders
   * of child components that depend on these handlers.
   */
  const handleSearch = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleSort = useCallback((field) => {
    if (field === sortBy) {
      setSortOrder(prevOrder => prevOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }, [sortBy]);

  const handleSortChange = useCallback((e) => {
    handleSort(e.target.value);
  }, [handleSort]);

  const handleSortOrderChange = useCallback(() => {
    setSortOrder(prevOrder => prevOrder === "asc" ? "desc" : "asc");
  }, []);

  /**
   * Book click handler
   * 
   * WHY: Centralized click handling for better maintainability
   * and consistent behavior across all book items.
   */
  const handleBookClick = useCallback((book) => {
    let linkToOpen = null;

    if (book.source === "openLibrary") {
      linkToOpen = book.links?.details || `https://openlibrary.org${book.id}`;
    } else if (book.source === "google") {
      linkToOpen = book.infoLink || book.previewLink;
    }

    if (linkToOpen) {
      window.open(linkToOpen, "_blank", "noopener,noreferrer");
    }
  }, []);

  /**
   * Infinite loading configuration
   * 
   * WHY: Virtual scrolling with infinite loading provides smooth
   * performance even with thousands of results.
   */
  const isItemLoaded = useCallback((index) => index < books.length, [books.length]);
  const itemCount = hasMore ? books.length + 1 : books.length;

  const loadMoreItems = useCallback(() => {
    if (!loading && hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  }, [loading, hasMore]);

  /**
   * Memoized row renderer for virtual list
   * 
   * WHY: Prevents recreation of row renderer function, which would
   * cause unnecessary re-renders of the virtual list.
   */
  const renderRow = useCallback(({ index, style }) => (
    <BookRow 
      book={sortedBooks[index]} 
      style={style} 
      onClick={handleBookClick}
    />
  ), [sortedBooks, handleBookClick]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col gap-6">
        {/* Search and Sort Controls */}
        <SearchControls
          query={query}
          onSearchChange={handleSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onSortOrderChange={handleSortOrderChange}
          isSearching={query !== debouncedQuery}
          resultsCount={books.length}
        />

        {/* Book List with Virtual Scrolling */}
        {books.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              threshold={5}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  height={700}
                  width="100%"
                  itemCount={itemCount}
                  itemSize={180}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                  className="focus:outline-none"
                  role="grid"
                  aria-label="Book search results"
                >
                  {renderRow}
                </List>
              )}
            </InfiniteLoader>
          </div>
        )}

        {/* Status Messages */}
        {!loading && !error && books.length === 0 && (
          <div className="text-center text-gray-500 py-12" role="status">
            <div className="text-lg mb-2">
              {debouncedQuery 
                ? "No books found" 
                : "Welcome to Book Search"}
            </div>
            <div className="text-sm">
              {debouncedQuery
                ? "Try adjusting your search terms or browse popular titles"
                : "Search for books by title, author, or keywords"}
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-12" role="alert">
            <div className="text-lg mb-4">Something went wrong</div>
            <div className="text-sm mb-4">
              Please check your connection and try again
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:ring-2 focus:ring-red-300"
            >
              Refresh Page
            </button>
          </div>
        )}

        {loading && books.length === 0 && (
          <div className="text-center text-gray-500 py-12" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div>Loading books...</div>
          </div>
        )}
      </div>
    </div>
  );
}