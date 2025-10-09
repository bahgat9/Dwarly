  import React, { useEffect, useState } from 'react';
  import { api } from '../api';

  export default function AdminRequests({ session }){
    const [list,setList]=useState([])
    async function load(){ 
      try {
        const data = await api('/api/playerRequests/admin')
        setList(data)
      } catch (error) {
        console.error('Failed to load requests:', error)
        alert('Failed to load requests')
      }
    }
    useEffect(()=>{ load() },[])

    async function approve(id){
      try {
        console.log('Admin approving request:', id)
        const res = await api(`/api/playerRequests/admin/${id}`, { 
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' })
        })
        alert(`Request approved successfully`)
        load()
      } catch (error) {
        console.error('Failed to approve request:', error)
        alert('Failed to approve request')
      }
    }

    async function reject(id){
      try {
        console.log('Admin rejecting request:', id)
        const res = await api(`/api/playerRequests/admin/${id}`, { 
          method: 'PATCH',
          body: JSON.stringify({ status: 'rejected' })
        })
        alert(`Request rejected successfully`)
        load()
      } catch (error) {
      console.error('Failed to reject request:', error)
      alert('Failed to reject request')
    }
  }

  async function deleteRequest(id){
    if (!window.confirm('Are you sure you want to delete this request?')) return
    try {
      console.log('Admin deleting request:', id)
      await api(`/api/playerRequests/admin/${id}`, { method: 'DELETE' })
      alert('Request deleted successfully')
      load()
    } catch (error) {
      console.error('Failed to delete request:', error)
      alert('Failed to delete request')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Player Requests</h1>
      <div className="space-y-3">
        {list.map(r=>(
          <div key={r._id} className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <div className="font-semibold text-white">
              {r.user?.name || 'Unknown User'} → {r.academy?.name || 'Unknown Academy'}
              <span className="text-sm opacity-60 ml-2">({r.status})</span>
            </div>
            <div className="text-sm text-white/60">
              {r.user?.email} • {r.user?.phone || 'No phone'}
            </div>
            {r.message && <div className="text-sm opacity-70 mt-2">{r.message}</div>}
            <div className="text-xs text-white/40 mt-2">
              Created: {new Date(r.createdAt).toLocaleDateString()}
            </div>
            <div className="mt-3 flex gap-2">
              {r.status==='pending' && <>
                <button onClick={()=>approve(r._id)} className="px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700">Approve</button>
                <button onClick={()=>reject(r._id)} className="px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">Reject</button>
              </>}
              <button onClick={()=>deleteRequest(r._id)} className="px-3 py-2 rounded-xl bg-gray-600 text-white hover:bg-gray-700">Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-center py-8 text-white/60">
            No player requests found
          </div>
        )}
      </div>
    </div>
  )
}
