import React from "react";
import { BookCard } from "./BookCard";

export const BookList = ({ books, loadMore }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        {books.map((book, index) => (
          <div key={`${book.id}-${index}`} className="min-h-[600px] relative">
            <BookCard book={book} />
          </div>
        ))}
      </div>

      {/* Intersection Observer Target */}
      <div
        className="h-16 w-full mt-8"
        ref={(node) => {
          if (node) {
            const observer = new IntersectionObserver(
              (entries) => {
                if (entries[0].isIntersecting) {
                  loadMore();
                }
              },
              { threshold: 0.5 }
            );
            observer.observe(node);
            return () => observer.disconnect();
          }
        }}
      />
    </div>
  );
};
