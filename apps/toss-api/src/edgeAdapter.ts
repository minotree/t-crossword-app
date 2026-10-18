/** Supabase preserves the function name in the request path. */
export function createEdgeHandler(handler: (request: Request) => Promise<Response>, functionName = 'toss-hints') {
  return (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const prefix = `/${functionName}`;
    const fullPrefix = `/functions/v1${prefix}`;
    for (const candidate of [fullPrefix, prefix]) {
      if (url.pathname === candidate || url.pathname.startsWith(`${candidate}/`)) {
        url.pathname = url.pathname.slice(candidate.length) || '/';
        break;
      }
    }
    return handler(new Request(url, request));
  };
}
