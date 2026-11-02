import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "https://next-up.capstone.uamishub.com"
).replace(/\/$/, "");

const ACCESS = "nextup.access";
const REFRESH = "nextup.refresh";
const USER = "nextup.user";
const SEED = "nextup.seed";
const SEED_AT = "nextup.seedAt";

const memory = {
  access: null,
  refresh: null,
  user: null,
  seed: null,
  seedAt: null,
  hydrated: false,
};

const listeners = new Set();

function emit() {
  for (const fn of listeners) fn(memory.user);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function mediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

async function persist(key, value) {
  if (value == null || value === "") {
    await SecureStore.deleteItemAsync(key).catch(() => {});
    return;
  }
  await SecureStore.setItemAsync(key, String(value));
}

export async function setUser(user) {
  memory.user = user;
  await persist(USER, user ? JSON.stringify(user) : null);
  emit();
}

export async function clearSession() {
  memory.access = null;
  memory.refresh = null;
  memory.user = null;
  memory.seed = null;
  memory.seedAt = null;
  await Promise.all([
    persist(ACCESS, null),
    persist(REFRESH, null),
    persist(USER, null),
    persist(SEED, null),
    persist(SEED_AT, null),
  ]);
  emit();
}

async function saveSession(session) {
  memory.access = session.accessToken;
  memory.refresh = session.refreshToken;
  memory.user = session.user;
  await persist(ACCESS, session.accessToken);
  await persist(REFRESH, session.refreshToken);
  await persist(USER, JSON.stringify(session.user));
  emit();
  return session.user;
}

function messageFrom(data, status) {
  if (!data) return status === 401 ? "Email or password is incorrect." : `Request failed (${status})`;
  if (typeof data.error === "string") return data.error;
  if (Array.isArray(data)) {
    const text = data.map((item) => item.description || item.code).filter(Boolean).join(" ");
    if (text) return text;
  }
  if (data.title && data.title !== "One or more validation errors occurred.") return data.title;
  return status === 401 ? "Email or password is incorrect." : `Request failed (${status})`;
}

async function readJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 180) };
  }
}

async function authPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (res.status === 404) {
    throw new Error(
      "Phone sign-in is not on the live API yet. Deploy the latest Next Up API, then try again."
    );
  }
  if (!res.ok) {
    const err = new Error(messageFrom(data, res.status));
    err.status = res.status;
    throw err;
  }
  return data;
}

let refreshLock = null;

async function refreshSession() {
  if (!memory.refresh) return false;
  const data = await authPost("/api/auth/mobile/refresh", { refreshToken: memory.refresh });
  await saveSession(data);
  return true;
}

function refreshOnce() {
  if (!refreshLock) {
    refreshLock = refreshSession()
      .catch(async (err) => {
        if (err.status === 401) await clearSession();
        return false;
      })
      .finally(() => {
        refreshLock = null;
      });
  }
  return refreshLock;
}

async function send(path, options) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  if (memory.access) headers.Authorization = `Bearer ${memory.access}`;
  if (memory.seed && path.startsWith("/api/feed")) {
    headers["X-Feed-Seed"] = String(memory.seed);
    if (memory.seedAt) headers["X-Feed-Seed-At"] = String(memory.seedAt);
  }
  return fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body,
  });
}

export async function api(path, options = {}) {
  const res = await send(path, options);
  const seed = res.headers.get("x-feed-seed");
  const seedAt = res.headers.get("x-feed-seed-at");
  if (seed) {
    memory.seed = seed;
    memory.seedAt = seedAt || String(Date.now());
    await persist(SEED, memory.seed);
    await persist(SEED_AT, memory.seedAt);
  }
  if (
    res.status === 401 &&
    memory.refresh &&
    !options._retry &&
    !path.startsWith("/api/auth/mobile/")
  ) {
    const ok = await refreshOnce();
    if (ok) return api(path, { ...options, _retry: true });
  }
  if (res.status === 204) return null;
  const data = await readJson(res);
  if (!res.ok) {
    const err = new Error(messageFrom(data, res.status));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (Array.isArray(data) && res.headers.get("x-feed-caught-up") === "1") {
    data.caughtUp = true;
  }
  return data;
}

export async function hydrate() {
  if (memory.hydrated) return memory.user;
  memory.access = await SecureStore.getItemAsync(ACCESS);
  memory.refresh = await SecureStore.getItemAsync(REFRESH);
  memory.seed = await SecureStore.getItemAsync(SEED);
  memory.seedAt = await SecureStore.getItemAsync(SEED_AT);
  const raw = await SecureStore.getItemAsync(USER);
  memory.user = raw ? JSON.parse(raw) : null;
  memory.hydrated = true;
  if (memory.refresh) {
    try {
      await refreshOnce();
    } catch {
      // The next signed-in request will try again.
    }
  }
  return memory.user;
}

export async function login(email, password) {
  const data = await authPost("/api/auth/mobile/login", { email: email.trim(), password });
  return saveSession(data);
}

export async function register(payload) {
  const data = await authPost("/api/auth/mobile/register", payload);
  return saveSession(data);
}

export async function logout() {
  const refreshToken = memory.refresh;
  try {
    if (refreshToken) {
      await authPost("/api/auth/mobile/logout", { refreshToken });
    }
  } catch {
    // Signing out locally still forgets the phone session.
  }
  await clearSession();
}

export function useSession() {
  const [user, setUserState] = useState(memory.user);
  const [ready, setReady] = useState(memory.hydrated);

  useEffect(() => {
    let live = true;
    const unsub = subscribe((next) => {
      if (live) setUserState(next);
    });
    hydrate().then(() => {
      if (!live) return;
      setUserState(memory.user);
      setReady(true);
    });
    return () => {
      live = false;
      unsub();
    };
  }, []);

  return { user, ready, login, register, logout, setUser };
}
