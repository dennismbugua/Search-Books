import React, { useState, useRef, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import useBookSearch from "./hooks/useBookSearch";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [sortBy, setSortBy] = useState("title"); // Add sorting state
  const [sortOrder, setSortOrder] = useState("asc"); // Add sort order state

  const listRef = useRef();

  const handlePageReset = useCallback(() => {
    setPageNumber(1);
  }, []);

  const { books, hasMore, loading, error } = useBookSearch(
    query,
    pageNumber,
    handlePageReset
  );

  // Handle infinite loading
  const isItemLoaded = (index) => index < books.length;
  const itemCount = hasMore ? books.length + 1 : books.length;

  const loadMoreItems = useCallback(() => {
    if (!loading && hasMore) {
      setPageNumber((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  // Add sorting function
  const sortedBooks = [...books].sort((a, b) => {
    let aValue, bValue;

    if (sortBy === "authors") {
      // Handle authors array by joining names
      aValue = (a[sortBy]?.[0] || "").toLowerCase();
      bValue = (b[sortBy]?.[0] || "").toLowerCase();
    } else {
      // Handle other fields (title, publishedDate)
      aValue = (a[sortBy] || "").toLowerCase();
      bValue = (b[sortBy] || "").toLowerCase();
    }

    return sortOrder === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Add sort handler
  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Update the Row component
  const Row = ({ book, style }) => {
    if (!book) {
      return (
        <div style={style} className="p-4 border-b animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-24 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      );
    }

    // const book = books[index];
    return (
      <div
        style={{
          ...style,
          height: "auto",
          minHeight: "160px",
          padding: "16px",
        }}
        className="border-b hover:bg-gray-50 transition-colors"
      >
        <div className="flex gap-6">
          {" "}
          {/* Fixed gap size */}
          {/* Book Cover */}
          <div className="flex-shrink-0 w-[100px]">
            {" "}
            {/* Fixed width container */}
            {book.thumbnail ? (
              <img
                src={book.thumbnail}
                alt={book.title}
                className="w-20 h-30 object-cover rounded-md shadow-sm hover:shadow-md transition-shadow"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-30 bg-gray-100 rounded-md flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
          {/* Book Details */}
          <div className="flex-1 min-w-0">
            {" "}
            {/* Added min-width to prevent text overflow */}
            <h3 className="font-semibold text-lg text-gray-900 leading-tight hover:text-blue-600 transition-colors truncate">
              {book.title}
            </h3>
            <p className="text-gray-600 text-sm mt-1 truncate">
              By {book.authors.join(", ")}
            </p>
            {book.publishedDate && (
              <p className="text-gray-500 text-sm mt-1">
                Published: {book.publishedDate}
              </p>
            )}
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
              >
                {book.source === "openLibrary"
                  ? "Open Library"
                  : "Google Books"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  function handleSearch(e) {
    setQuery(e.target.value);
    setPageNumber(1);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col gap-6">
        {/* Search and Sort Controls */}
      <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full"> {/* Added max-width and center alignment */}
        {/* Search Bar */}
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search for books..."
          className="w-full p-3 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

          {/* Sort Controls */}
          {/* Sort Controls */}
          <div className="flex items-center justify-end gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="appearance-none px-6 py-3 pr-10 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[180px] cursor-pointer"
              >
                <option value="title">Sort by Title</option>
                <option value="authors">Sort by Author</option>
                <option value="publishedDate">Sort by Date</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors min-w-[48px] flex items-center justify-center"
              aria-label={
                sortOrder === "asc" ? "Sort ascending" : "Sort descending"
              }
            >
              <span className="text-xl">{sortOrder === "asc" ? "↑" : "↓"}</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        {books.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {books.length} results
          </div>
        )}

        {/* Book List */}
        {books.length > 0 && (
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
              >
                {({ index, style }) => (
                  <Row book={sortedBooks[index]} style={style} />
                )}
              </List>
            )}
          </InfiniteLoader>
        )}

        {/* Status Messages */}
        {!loading && !error && books.length === 0 && (
          <div className="text-center text-gray-500">
            {query
              ? "No books found"
              : "Search for books or browse the collection"}
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center">
            Something went wrong. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

// {/* Footer */}
//   <footer className="footer">
//     <p>
//       &copy;{" "}
//       <a
//         href="https://github.com/dennismbugua/Search-Books"
//         target="_blank"
//         rel="noopener noreferrer"
//       >
//         Source Code
//       </a>
//     </p>
//   </footer>
// </div>
//   );
// }
