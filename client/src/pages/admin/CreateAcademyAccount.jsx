// src/pages/admin/CreateAcademyAccount.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { api } from "../../api";

export default function CreateAcademyAccount() {
  const navigate = useNavigate();
  const [academies, setAcademies] = useState([]);
  const [form, setForm] = useState({
    academyId: "",
    email: "",
    password: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAcademies() {
      const data = await api("/api/academies");
      setAcademies(data);
    }
    loadAcademies();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    if (!form.academyId) {
      alert("Please select an academy.");
      setSaving(false);
      return;
    }

    try {
      const selectedAcademy = academyOptions.find(
        (opt) => opt.value === form.academyId
      );

      await api("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: "academy",
          academyId: form.academyId,
          academyName: selectedAcademy?.label
        })
      });

      alert("✅ Academy account created & linked!");
      navigate("/admin/academies");
    } catch (err) {
      console.error(err);
      alert("Failed to create academy account.");
    } finally {
      setSaving(false);
    }
  }

  // react-select needs options with value + label
  const academyOptions = academies.map((a) => ({
    value: a._id,
    label: a.name,
    nameAr: a.nameAr,
    locationDescription: a.locationDescription,
    logo: a.logo
  }));

  // custom rendering of dropdown options
  const formatOptionLabel = (option) => (
    <div className="flex items-center gap-3">
      {option.logo && (
        <img
          src={option.logo}
          alt={option.label}
          className="w-8 h-8 rounded object-cover border border-white/10"
        />
      )}
      <div className="flex flex-col">
        <span>{option.label}</span>
        {option.nameAr && (
          <span className="text-xs opacity-70">{option.nameAr}</span>
        )}
        {option.locationDescription && (
          <span className="text-xs opacity-50">{option.locationDescription}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-10 text-white">
      <h1 className="text-2xl font-bold mb-6">Create Academy Account</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Academy dropdown */}
        <div>
          <label className="block mb-2 font-medium">Select Academy</label>
          <Select
            options={academyOptions}
            formatOptionLabel={formatOptionLabel}
            value={
              academyOptions.find((opt) => opt.value === form.academyId) || null
            } // ✅ controlled
            onChange={(selected) =>
              setForm({ ...form, academyId: selected?.value || "" })
            }
            placeholder="Choose an academy..."
            className="text-black"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full p-2 rounded-lg bg-brand-800 border border-brand-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full p-2 rounded-lg bg-brand-800 border border-brand-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !form.academyId}
          className="w-full py-2 rounded-lg bg-accent-500 text-brand-900 font-semibold hover:bg-accent-600 transition disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
