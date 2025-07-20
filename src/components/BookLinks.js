import React from "react";

export const BookLinks = ({ book }) => {
  return (
    <div className="flex gap-4 text-sm mt-2">
      {book.source === "openLibrary" ? (
        <>
          <a
            href={book.links.details}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline"
          >
            View Details
          </a>
          <a
            href={book.links.preview}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline"
          >
            Preview
          </a>
          <a
            href={book.links.info}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline"
          >
            More Info
          </a>
        </>
      ) : (
        <a
          href={book.previewLink || book.infoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:underline"
        >
          View on Google Books
        </a>
      )}
    </div>
  );
};
