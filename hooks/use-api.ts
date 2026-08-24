"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api, type RequestOptions } from "@/lib/api-client";

/* ------------------------------- useApi (GET) ----------------------------- */

interface UseApiOptions<T> extends RequestOptions {
  /** Désactive le fetch initial. */
  enabled?: boolean;
  /** Re-fetch quand une de ces deps change. */
  deps?: unknown[];
  /** Callback succès. */
  onSuccess?: (data: T) => void;
  /** Callback erreur. */
  onError?: (error: ApiError) => void;
}

export interface UseApiResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * Hook GET avec état (loading, error, data) + refetch + annulation auto au démontage.
 *
 * @example
 *   const { data, loading, error, refetch } = useApi<{ users: User[] }>("/api/admin/users");
 */
export function useApi<T = unknown>(
  path: string | null,
  opts: UseApiOptions<T> = {},
): UseApiResult<T> {
  const { enabled = true, deps = [], onSuccess, onError, ...reqOpts } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled && !!path);
  const abortRef = useRef<AbortController | null>(null);

  const fetcher = useCallback(async () => {
    if (!path) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path, { ...reqOpts, signal: ctrl.signal });
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const e = err instanceof ApiError ? err : new ApiError((err as Error).message, { code: "UNKNOWN" });
      setError(e);
      onError?.(e);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    if (!enabled || !path) return;
    fetcher();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, path, ...deps]);

  return { data, error, loading, refetch: fetcher, setData };
}

/* ----------------------------- useMutation (POST/PUT/...) ----------------- */

type Method = "POST" | "PUT" | "PATCH" | "DELETE";

interface UseMutationOptions<TData, TVars> {
  method?: Method;
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (error: ApiError, vars: TVars) => void;
}

export interface UseMutationResult<TData, TVars> {
  mutate: (vars: TVars) => Promise<TData>;
  data: TData | null;
  error: ApiError | null;
  loading: boolean;
  reset: () => void;
}

/**
 * Hook pour les mutations (POST/PUT/PATCH/DELETE) avec état (loading, error).
 *
 * @example
 *   const sendOtp = useMutation<{ identifier: string }, { identifier: string }>(
 *     "/api/auth/otp/request"
 *   );
 *   await sendOtp.mutate({ identifier: "test@x.com" });
 */
export function useMutation<TData = unknown, TVars = unknown>(
  path: string,
  opts: UseMutationOptions<TData, TVars> = {},
): UseMutationResult<TData, TVars> {
  const { method = "POST", onSuccess, onError } = opts;
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (vars: TVars): Promise<TData> => {
      setLoading(true);
      setError(null);
      try {
        const fn =
          method === "POST"   ? api.post<TData> :
          method === "PUT"    ? api.put<TData>  :
          method === "PATCH"  ? api.patch<TData>:
          /* DELETE */          (p: string) => api.del<TData>(p);
        const result = method === "DELETE"
          ? await api.del<TData>(path)
          : await fn(path, vars as unknown);
        setData(result);
        onSuccess?.(result, vars);
        return result;
      } catch (err) {
        const e = err instanceof ApiError ? err : new ApiError((err as Error).message, { code: "UNKNOWN" });
        setError(e);
        onError?.(e, vars);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [path, method, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, data, error, loading, reset };
}
