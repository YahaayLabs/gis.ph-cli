/**
 * Helpers for api.gis.ph JSON envelopes (PG-010 / PG-011).
 *
 * List success:  { data: T[], meta?: PaginationMeta, error: null }
 * One success:   { data: T, error: null }  (some get routes still bare)
 * Legacy:        bare T[] or bare T
 */

export type PaginationMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  next?: number | null;
  prev?: number | null;
  links?: {
    self?: string;
    next?: string | null;
    prev?: string | null;
  };
  [key: string]: unknown;
};

export type ListEnvelope<T = unknown> = {
  data: T[];
  meta?: PaginationMeta;
  error?: unknown;
};

/** Extract list items + meta from envelope or bare array. */
export function unwrapList<T = any>(response: unknown): {
  items: T[];
  meta?: PaginationMeta;
  raw: unknown;
} {
  if (Array.isArray(response)) {
    return { items: response as T[], meta: undefined, raw: response };
  }

  if (response && typeof response === "object") {
    const body = response as Record<string, unknown>;
    if (Array.isArray(body.data)) {
      return {
        items: body.data as T[],
        meta: (body.meta as PaginationMeta | undefined) ?? undefined,
        raw: response,
      };
    }
  }

  return { items: [], meta: undefined, raw: response };
}

/** Extract a single resource from envelope or bare object. */
export function unwrapOne<T = any>(response: unknown): T {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const body = response as Record<string, unknown>;
    if ("data" in body && body.data != null && !Array.isArray(body.data)) {
      return body.data as T;
    }
  }
  return response as T;
}

/** Footer line for paginated table output. */
export function formatListFooter(
  meta: PaginationMeta | undefined,
  count: number,
  label: string,
): string {
  if (meta && (meta.page != null || meta.total != null)) {
    const page = meta.page ?? 1;
    const totalPages = meta.totalPages ?? "?";
    const total = meta.total ?? count;
    return `Page ${page} of ${totalPages} | Total: ${total} ${label}`;
  }
  return `Total: ${count} ${label}`;
}
