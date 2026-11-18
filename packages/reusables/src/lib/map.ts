const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");

export const MAP_TILES_LIGHT = `${BACKEND_URL}/maps/styles/light/{z}/{x}/{y}{r}.png`;
export const MAP_ATTRIBUTION = "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>";
