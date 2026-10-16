function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    // If running in production behind same domain or custom host
    const proto = window.location.protocol || "http:";
    const host = window.location.hostname || "localhost";
    const port = window.location.port;
    // When served behind an Nginx reverse proxy (standard production setup), API is usually on /api/v1
    if (port === "" || port === "80" || port === "443") {
      return `${proto}//${host}/api/v1`;
    }
    return `${proto}//${host}:8000/api/v1`;
  }
  return "http://localhost:8000/api/v1";
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let token = typeof window !== "undefined" 
    ? (localStorage.getItem("jlab_token") || localStorage.getItem("pulselab_token")) 
    : null;
  
  // For master admin routes, attach the master session JWT token
  if (typeof window !== "undefined" && endpoint.startsWith("/admin/")) {
    const masterToken = sessionStorage.getItem("jlab_master_token") || sessionStorage.getItem("pulselab_master_token");
    if (masterToken) {
      token = masterToken;
    }
  }

  const baseUrl = getApiBaseUrl();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401 || (res.status === 404 && !endpoint.includes("/auth/login"))) {
      let isInvalidUser = false;
      let errorDetail = "";
      try {
        const cloned = res.clone();
        const data = await cloned.json();
        errorDetail = data.detail || "";
        if (typeof errorDetail === "string" && errorDetail.toLowerCase().includes("user not found")) {
          isInvalidUser = true;
        }
      } catch {
        // ignore
      }

      if (res.status === 401 || isInvalidUser) {
        if (typeof window !== "undefined" && !endpoint.includes("/auth/login") && !endpoint.includes("/admin/verify-pin")) {
          localStorage.removeItem("jlab_token");
          localStorage.removeItem("jlab_user");
          localStorage.removeItem("pulselab_token");
          localStorage.removeItem("pulselab_user");
          
          if (window.location.pathname.startsWith("/lab")) {
            window.location.href = "/login?expired=1";
          }
        }
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorData.detail || "API request failed");
    }

    return await res.json();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`API fetch to ${endpoint} failed:`, errorMsg);
    throw err;
  }
}

