import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const fetchProducts = async (params = {}) => {
  const { data } = await api.get("/products", { params });
  return data;
};

export const searchProducts = async (q, limit = 8) => {
  const { data } = await api.get("/search/products", { params: { q, limit } });
  return data;
};

export const trackOrder = async (orderNumber, email) => {
  const { data } = await api.post("/track", { order_number: orderNumber, email });
  return data;
};

export const fetchProduct = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const fetchBrands = async () => {
  const { data } = await api.get("/brands");
  return data;
};

export const fetchReviews = async () => {
  const { data } = await api.get("/reviews");
  return data;
};

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data;
};

export const createCheckoutSession = async (payload) => {
  const { data } = await api.post("/checkout/session", payload);
  return data;
};

export const getCheckoutStatus = async (sessionId) => {
  const { data } = await api.get(`/checkout/status/${sessionId}`);
  return data;
};
