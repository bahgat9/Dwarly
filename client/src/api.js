// client/src/api.js
const fallbackBase = import.meta.env.VITE_API_URL || "https://dwarly-production.up.railway.app"

// Always use relative path in browser so cookies are first-party via Vercel rewrites
let base = fallbackBase
if (typeof window !== "undefined") {
  base = ""
}

export async function api(
  url,
  { method = "GET", body, headers = {}, ...rest } = {}
) {
  // Add Authorization header if token exists (Safari fallback)
  let authHeaders = headers
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dwarly_token')
    if (token) {
      authHeaders = { ...headers, Authorization: `Bearer ${token}` }
    }
  }
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData

  const finalHeaders = isFormData
    ? headers // let browser set multipart boundaries
    : { "Content-Type": "application/json", ...authHeaders }

  const finalBody =
    body == null
      ? undefined
      : isFormData
      ? body
      : typeof body === "string"
      ? body
      : JSON.stringify(body)

  const res = await fetch(base + url, {
    method,
    headers: finalHeaders,
    credentials: "include",
    body: finalBody,
    ...rest,
  })

  const contentType = res.headers.get("content-type") || ""
  
  // Handle file responses (PDFs, images, etc.)
  if (contentType.includes("application/pdf") || 
      contentType.includes("application/msword") || 
      contentType.includes("application/vnd.openxmlformats-officedocument") ||
      contentType.includes("image/") ||
      contentType.includes("application/octet-stream")) {
    if (!res.ok) {
      const errorText = await res.text().catch(() => "")
      throw new Error(errorText || "Request failed")
    }
    return res.blob()
  }

  const parseJson = () =>
    contentType.includes("application/json") ? res.json() : null

  if (!res.ok) {
    const maybeJson = await parseJson()
    const msg =
      (maybeJson && (maybeJson.error || maybeJson.message)) ||
      (await res.text().catch(() => "")) ||
      res.statusText
    throw new Error(msg || "Request failed")
  }

  const parsed = await parseJson()
  if (parsed && typeof parsed === "object") {
    // Auto-unwrap common API envelope { success, data, ... }
    if (Object.prototype.hasOwnProperty.call(parsed, "data")) {
      return parsed.data
    }
  }
  return parsed ?? (await res.text())
}
