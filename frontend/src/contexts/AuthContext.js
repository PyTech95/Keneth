import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    const load = useCallback(async () => {
        const token = localStorage.getItem("kg_token");
        if (!token) {
            setReady(true);
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch (e) {
            localStorage.removeItem("kg_token");
            setUser(null);
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("kg_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (email, password, name) => {
        const { data } = await api.post("/auth/register", { email, password, name });
        localStorage.setItem("kg_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem("kg_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, ready, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
