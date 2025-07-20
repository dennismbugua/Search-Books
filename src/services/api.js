import axios from "axios";

const api = axios.create({
  baseURL: "http://openlibrary.org",
});

export const searchBooks = async (query, page) => {
  const response = await api.get("/search.json", {
    params: {
      q: query,
      page,
      limit: 100,
      fields: "title,author_name,cover_i",
    },
  });
  return response.data;
};

export const cancelRequest = (cancelToken) => {
  if (cancelToken) {
    cancelToken.cancel("Operation canceled by the user.");
  }
};
