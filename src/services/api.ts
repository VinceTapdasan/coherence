const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Add domain groups here:
  // auth: {
  //   login: (credentials: Credentials) =>
  //     apiFetch<{ token: string; user: User }>('/auth/login', {
  //       method: 'POST',
  //       body: JSON.stringify(credentials),
  //     }),
  // },
};
