/**
 * Servicio de API - llama a los endpoints Lambda via CloudFront
 * Incluye automáticamente el JWT token en cada request
 */
import { getIdToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "https://d3kmmuj9rcq4o5.cloudfront.net/api";

/**
 * Fetch wrapper que incluye el JWT en el header Authorization
 */
async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return response;
}

// ─── Tipos ─────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  puntos: number;
  monedas: number;
  racha: number;
  nivel: number;
  nickname: string;
  avatar: string;
  misionesCompletadas: number;
  ultimaPausa: string | null;
  itemsComprados: string[];
}

export interface RachaInfo {
  racha: number;
  dias: boolean[];
  ultimoDia: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  avatar: string;
  puntos: number;
  racha: number;
  nivel: number;
}

// ─── Endpoints ─────────────────────────────────────────

/**
 * GET /usuario/perfil - Obtener perfil del usuario actual
 */
export async function getPerfil(): Promise<UserProfile> {
  const res = await authFetch("/usuario/perfil");
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * GET /usuario/racha - Obtener racha actual
 */
export async function getRacha(): Promise<RachaInfo> {
  const res = await authFetch("/usuario/racha");
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * POST /pausa/iniciar - Registrar inicio de pausa
 */
export async function iniciarPausa(tipo: string): Promise<void> {
  const res = await authFetch("/pausa/iniciar", {
    method: "POST",
    body: JSON.stringify({ tipo }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
}

/**
 * POST /pausa/completar - Registrar pausa completada (suma puntos y racha)
 */
export async function completarPausa(data: {
  tipo: string;
  puntosGanados: number;
  monedasGanadas: number;
}): Promise<UserProfile> {
  const res = await authFetch("/pausa/completar", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * GET /leaderboard - Obtener top usuarios
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await authFetch("/leaderboard");
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}
