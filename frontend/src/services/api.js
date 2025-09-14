import axios from "axios";

// Change this to your Spring Boot backend URL
const API_BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Upload a file
export const uploadDocument = async (file, description) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description);

  const response = await api.post("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Search documents
export const searchDocuments = async (query) => {
  const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

// Grammar fix
export const fixGrammar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/autocorrect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
