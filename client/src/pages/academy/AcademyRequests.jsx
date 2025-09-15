import React, { useEffect, useState } from "react"
import { api } from "../../api"
import Pagination from "../../components/Pagination"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"
import { useLanguage } from "../../context/LanguageContext"
import { useRealtimeData, useRealtimeStatus } from "../../hooks/useRealtimeData.js"
import { useRealtime } from "../../context/RealtimeContext.jsx"
import { motion } from "framer-motion"

export default function AcademyRequests({ session }) {
  const { t } = useLanguage()
  const { showSuccess, showInfo, showError } = useRealtime()
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  // Real-time data for requests
  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
    refresh: refreshRequests,
    hasChanges: requestsChanged
  } = useRealtimeStatus(`/api/playerRequests/academy/${session.academyId}?page=${page}&limit=5`, {
    interval: 2000, // Poll every 2 seconds for academy requests
    dependencies: [page]
  })

  const requests = requestsData?.items || []

  // Update pages when requests data changes
  useEffect(() => {
    if (requestsData) {
      setPages(requestsData.pages || 1)
      setPage(requestsData.page || 1)
    }
  }, [requestsData])

  // Show notifications when new requests arrive
  useEffect(() => {
    if (requestsChanged && requests.length > 0) {
      const newRequests = requests.filter(r => r.status === "pending")
      if (newRequests.length > 0) {
        showInfo(`📥 ${newRequests.length} new request(s) received`)
      }
    }
  }, [requestsChanged, requests, showInfo])

  async function loadRequests(p = 1) {
    setPage(p)
  }

  async function updateStatus(id, status) {
    try {
      if (
        status === "rejected" &&
        !window.confirm("Are you sure you want to reject this request?")
      ) {
        return
      }

      await api(`/api/playerRequests/academy/${session.academyId}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })

      // Show success notification
      const request = requests.find(r => r._id === id)
      if (request) {
        showSuccess(`✅ Request from ${request.userName} ${status}`)
      }

      // Refresh data to get latest state
      refreshRequests()
    } catch (err) {
      console.error("Failed to update request:", err)
      showError("⚠️ Failed to update request")
    }
  }

  async function deleteRequest(id) {
    try {
      await api(`/api/playerRequests/academy/${session.academyId}/${id}`, {
        method: "DELETE",
      })
      
      showSuccess("🗑️ Request deleted successfully")
      refreshRequests()
    } catch (err) {
      console.error("Failed to delete request:", err)
      showError("⚠️ Failed to delete request")
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📥 {t("academyRequests.title")}</h1>
        {requestsChanged && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-3 h-3 bg-green-400 rounded-full"
            title="Data updated"
          />
        )}
      </div>

      {requestsLoading ? (
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
