import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

if (!BASE_URL) {
  throw new Error('[truckmoov/api] VITE_BACKEND_URL is not set. Add it to your .env file.');
}

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
})

