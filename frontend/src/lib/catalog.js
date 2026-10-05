export const HOUSES = [
    { key: "masalas", label: "nav.masalas", title: "vert.masalas.title", to: "/shop/masalas", tid: "nav-masalas", filterId: "filter-masalas" },
    { key: "home-furnishing", label: "nav.decor", title: "vert.decor.title", to: "/shop/home-furnishing", tid: "nav-decor", filterId: "filter-decor" },
    { key: "artificial-jewelry", label: "nav.jewelry", title: "vert.jewelry.title", to: "/shop/artificial-jewelry", tid: "nav-jewelry", filterId: "filter-jewelry" },
    { key: "christmas-decor", label: "nav.christmas", title: "vert.christmas.title", to: "/christmas", tid: "nav-christmas", filterId: "filter-christmas" },
];

export const categoryLabel = (category, t) => {
    const key = `category.${category}`;
    return t(key) === key ? category.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : t(key);
};

export const categoryLink = (house, category) => `${house.to}?category=${encodeURIComponent(category)}${house.key === "christmas-decor" ? "#christmas-collection" : ""}`;