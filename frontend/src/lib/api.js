import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;
export const STATIC_BASE = `${BACKEND_URL}/api/static`;

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: false,
});

// Attach token from localStorage automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("kg_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Best-effort image URL: use AI-generated static if available, else hint URL
export const productImage = (product) => {
    if (product?.ai_image) return `${STATIC_BASE}/${product.ai_image}`;
    if (product?.image_hint) return product.image_hint;
    return "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&q=80";
};

export const formatErr = (err) => {
    const d = err?.response?.data?.detail;
    if (!d) return err?.message || "Something went wrong";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(" ");
    return String(d);
};
