import React, { useState, useRef, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import useBookSearch from "./hooks/useBookSearch";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const { books, hasMore, loading, error } = useBookSearch(query, pageNumber);
  const listRef = useRef();

  // Handle infinite loading
  const isItemLoaded = (index) => index < books.length;
  const itemCount = hasMore ? books.length + 1 : books.length;

  const loadMoreItems = useCallback(() => {
    if (!loading && hasMore) {
      setPageNumber((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  // Update the Row component
  const Row = ({ index, style }) => {
    if (!isItemLoaded(index)) {
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

    const book = books[index];
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

  // // Update the List component props
  // <List
  //   height={700}
  //   width="100%"
  //   itemCount={itemCount}
  //   itemSize={160} // Reduced to match new minHeight
  //   className="border rounded-lg shadow-sm" // Added container styling
  //   onItemsRendered={onItemsRendered}
  //   ref={ref}
  // >
  //   {Row}
  // </List>;

  function handleSearch(e) {
    setQuery(e.target.value);
    setPageNumber(1);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {" "}
      {/* Increased max width and padding */}
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search for books..."
        className="w-full p-4 text-lg border rounded-lg shadow-sm mb-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {books.length > 0 && (
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={5}
        >
          {({ onItemsRendered, ref }) => (
            <List
              height={700} // Increased height
              width="100%"
              itemCount={itemCount}
              itemSize={180} // Adjusted to match new card height
              onItemsRendered={onItemsRendered}
              ref={ref}
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      )}
      {!loading && !error && books.length === 0 && query && (
        <div className="text-center text-gray-500">No books found</div>
      )}
      {error && (
        <div className="text-red-500 text-center">
          Something went wrong. Please try again.
        </div>
      )}
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
