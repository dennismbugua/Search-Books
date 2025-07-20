import React from "react";
import { BookLinks } from "./BookLinks";

export const BookCard = ({ book }) => {
  return (
    <div className="flex gap-6 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Left side - Thumbnail */}
      <div className="flex-shrink-0">
        <a
          href={
            book.source === "openLibrary"
              ? book.links.details
              : book.previewLink
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              className="w-20 h-28 object-cover rounded shadow-sm hover:shadow-md transition-shadow"
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-50 rounded flex items-center justify-center border border-gray-100">
              <svg
                className="w-8 h-8 text-gray-300"
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
        </a>
      </div>

      {/* Right side - Content */}
      <div className="flex-1">
        <div className="text-xs text-gray-600 mb-1">
          {book.source === "openLibrary" ? "Open Library" : "Google Books"}
        </div>

        <a
          href={
            book.source === "openLibrary"
              ? book.links.details
              : book.previewLink
          }
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <h3 className="text-lg font-medium text-blue-700 hover:underline mb-1">
            {book.title}
          </h3>
        </a>

        <div className="text-sm text-gray-600 mb-2">
          {book.authors?.join(", ")} • {book.publishedDate}
        </div>

        <BookLinks book={book} />
      </div>
    </div>
  );
};
