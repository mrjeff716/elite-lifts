import axios from 'axios'

// All API calls share cookie credentials; React never reads the auth cookie.
export default axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 50000,
})
