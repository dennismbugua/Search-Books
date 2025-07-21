import axios from 'axios';

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY; // Replace with your API key
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export const searchGoogleBooks = async (query, startIndex = 0) => {
  try {
    const response = await axios.get(GOOGLE_BOOKS_API, {
      params: {
        q: query,
        startIndex,
        maxResults: 20,
        key: GOOGLE_API_KEY
      }
    });

return response.data.items?.map(book => ({
  id: book.id,
  title: book.volumeInfo.title,
  authors: book.volumeInfo.authors || ['Unknown'],
  thumbnail: book.volumeInfo.imageLinks?.thumbnail,
  publishedDate: book.volumeInfo.publishedDate,
  source: 'google',
  previewLink: book.volumeInfo.previewLink,
  infoLink: book.volumeInfo.infoLink
})) || [];
  } catch (error) {
    console.error('Google Books API Error:', error);
    return [];
  }
};