import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const useCategories = () => {
    const [tree, setTree] = useState({});
    const [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        api.get("/products/verticals").then(({ data }) => { if (active) setTree(data); })
            .catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, []);
    return { tree, error };
};