import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

console.log("Environment API URL:", import.meta.env.VITE_API_BASE_URL);
console.log("Axios Base URL:", baseURL);

export const api = axios.create({
  baseURL,
  timeout: 60000,
});