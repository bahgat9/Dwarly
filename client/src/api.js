// client/src/api.js
const fallbackBase = import.meta.env.VITE_API_URL || "https://dwarly-production.up.railway.app"

// Use proxy in dev (localhost), absolute backend URL in production
let base = fallbackBase
if (typeof window !== "undefined") {
  const origin = window.location.origin
  const isLocalhost = /localhost|127\.0\.0\.1/i.test(origin)
  base = isLocalhost ? "" : fallbackBase
}

export async function api(
  url,
  { method = "GET", body, headers = {}, ...rest } = {}
) {
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData

  const finalHeaders = isFormData
    ? headers // let browser set multipart boundaries
    : { "Content-Type": "application/json", ...headers }

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
