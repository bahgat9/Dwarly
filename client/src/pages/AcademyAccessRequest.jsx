import React, { useState } from 'react';
import { api } from '../api';
import LocationPicker from '../components/LocationPicker.jsx';

export default function AcademyAccessRequest(){
  const [form,setForm]=useState({ academyName:'', contactName:'', email:'', phone:'', notes:'', location:null, offersGirls:true, offersBoys:true, subscriptionPrice:0, trainingTimes:[] })
  const [status,setStatus]=useState('')
  const [loading,setLoading]=useState(false)

  function setLocation(loc){ setForm(f=>({ ...f, location: loc })) }
  function addTime(){ setForm(f=>({ ...f, trainingTimes:[...f.trainingTimes,{ day:'', time:'' }] })) }
  function updateTime(i,k,v){ setForm(f=>{ const t=[...f.trainingTimes]; t[i]={...t[i],[k]:v}; return {...f,trainingTimes:t};}) }

  async function submit(){
    try {
      setLoading(true)
      setStatus('Submitting...')
      
      // Prepare the academy data for creation
      const academyData = {
        name: form.academyName,
        nameAr: form.academyName, // Use same name for Arabic
        locationDescription: form.notes,
        locationGeo: form.location ? JSON.stringify(form.location) : null,
        phone: form.phone,
        rating: 0,
        verified: false,
        offersGirls: form.offersGirls,
        offersBoys: form.offersBoys,
        subscriptionPrice: form.subscriptionPrice,
        ages: [], // Will be set by admin later
        trainingTimes: JSON.stringify(form.trainingTimes)
      }
      
      await api('/api/academies', { method:'POST', body: JSON.stringify(academyData) })
      setStatus('Academy request submitted! We will review and contact you once approved.')
    } catch (error) {
      console.error('Submit error:', error)
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        setStatus('Only administrators can create new academies. Please contact support.')
      } else {
        setStatus('Failed to create academy request. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white/10 rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">Create New Academy</h1>
        <p className="text-white/70 text-sm">Submit your academy information for review and approval.</p>
      </div>
      
      <div className="bg-white/10 rounded-2xl p-6 shadow space-y-4">
        <input 
          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none" 
          placeholder="Academy name" 
          value={form.academyName} 
          onChange={e=>setForm({...form,academyName:e.target.value})}
        />
        <div className="grid grid-cols-2 gap-3">
          <input 
            className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none" 
            placeholder="Contact name" 
            value={form.contactName} 
            onChange={e=>setForm({...form,contactName:e.target.value})}
          />
          <input 
            className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none" 
            placeholder="Email" 
            value={form.email} 
            onChange={e=>setForm({...form,email:e.target.value})}
          />
        </div>
        <input 
          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none" 
          placeholder="Phone" 
          value={form.phone} 
          onChange={e=>setForm({...form,phone:e.target.value})}
        />
        <textarea 
          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none resize-none" 
          placeholder="Notes" 
          rows={3}
          value={form.notes} 
          onChange={e=>setForm({...form,notes:e.target.value})}
        />
        <div>
          <div className="font-semibold mb-2 text-white">Select location</div>
          <LocationPicker onChange={setLocation} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-white">
            <input 
              type="checkbox" 
              checked={form.offersGirls} 
              onChange={e=>setForm({...form,offersGirls:e.target.checked})}
              className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
            />
            Girls
          </label>
          <label className="flex items-center gap-2 text-white">
            <input 
              type="checkbox" 
              checked={form.offersBoys} 
              onChange={e=>setForm({...form,offersBoys:e.target.checked})}
              className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
            />
            Boys
          </label>
        </div>
        <input 
          type="number" 
          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none" 
          placeholder="Subscription price (per month)" 
          value={form.subscriptionPrice} 
          onChange={e=>setForm({...form,subscriptionPrice:Number(e.target.value)})}
        />
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-white">Training times</div>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors" 
              onClick={addTime}
            >
              Add time
            </button>
          </div>
          {form.trainingTimes.map((t,i)=>(
            <div key={i} className="grid grid-cols-2 gap-3">
              <input 
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none" 
                placeholder="Day e.g. Mon/Wed" 
                value={t.day} 
                onChange={e=>updateTime(i,'day',e.target.value)}
              />
              <input 
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-blue-500 focus:outline-none" 
                placeholder="Time e.g. 5-7pm" 
                value={t.time} 
                onChange={e=>updateTime(i,'time',e.target.value)}
              />
            </div>
          ))}
        </div>
        <button 
          onClick={submit} 
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Academy Request'}
        </button>
        {status && (
          <div className={`text-center p-3 rounded-xl ${
            status.includes('Failed') || status.includes('Only administrators') ? 'text-red-400 bg-red-500/20' : 'text-green-400 bg-green-500/20'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}
