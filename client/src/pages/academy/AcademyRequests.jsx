import React, { useEffect, useState } from "react"
import { api } from "../../api"
import Pagination from "../../components/Pagination"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"
import { useLanguage } from "../../context/LanguageContext"

export default function AcademyRequests({ session }) {
  const { t } = useLanguage()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  async function loadRequests(p = 1) {
    try {
      setLoading(true)
      const data = await api(
        `/api/playerRequests/academy/${session.academyId}?page=${p}&limit=5`
      )
      setRequests(data.items || [])
      setPages(data.pages || 1)
      setPage(data.page || 1)
    } catch (err) {
      console.error("Failed to load requests:", err)
      alert("⚠️ Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      if (
        status === "rejected" &&
        !window.confirm("Are you sure you want to reject this request?")
      ) {
        return
      }

      // Optimistic UI update
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      )

      await api(`/api/playerRequests/academy/${session.academyId}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })
    } catch (err) {
      console.error("Failed to update request:", err)
      alert("⚠️ Failed to update request")
      // Reload from backend to avoid stale state
      loadRequests(page)
    }
  }

  async function deleteRequest(id) {
    try {
      await api(`/api/playerRequests/academy/${session.academyId}/${id}`, {
        method: "DELETE",
      })
      setRequests(prev => prev.filter(r => r._id !== id))
    } catch (err) {
      console.error("Failed to delete request:", err)
      alert("⚠️ Failed to delete request")
    }
  }

  useEffect(() => {
    loadRequests(1)
  }, [])

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">📥 {t("academyRequests.title")}</h1>

      {loading ? (
        <LoadingSkeleton lines={5} />
      ) : requests.length === 0 ? (
        <p className="text-white/70">{t("academyRequests.noRequests")}</p>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r._id}
                className="bg-white/5 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">{r.userName}</div>
                  <div className="text-sm text-white/70">
                    {r.age ? `Age: ${r.age}` : "Age: N/A"} | {r.position || "Position: N/A"}
                  </div>
                  {r.userEmail && (
                    <div className="text-sm text-white/70">{r.userEmail}</div>
                  )}
                  {r.message && (
                    <div className="text-sm text-white/50 italic">
                      {r.message}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {r.status === "pending" ? (
                    <>
                      <button
                        onClick={() => updateStatus(r._id, "approved")}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-xl text-sm"
                        aria-label={`Approve request from ${r.userName}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(r._id, "rejected")}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-xl text-sm"
                        aria-label={`Reject request from ${r.userName}`}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`px-3 py-1 rounded-xl text-sm capitalize ${
                          r.status === "approved"
                            ? "bg-green-600"
                            : r.status === "rejected"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {r.status}
                      </span>
                      {r.status === "rejected" && (
                        <button
                          onClick={() => deleteRequest(r._id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-xl text-sm"
                          aria-label={`Delete rejected request from ${r.userName}`}
                          title="Delete this rejected request"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} pages={pages} onPageChange={loadRequests} />
        </>
      )}
    </div>
  )
}
