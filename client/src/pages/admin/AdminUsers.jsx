import React, { useEffect, useState } from "react";
import { api } from "../../api";
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx";
import { Plus, Trash2, Shield, Building, User as UserIcon } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminUsers() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await api("/api/users");
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(t("common.failedToLoad") + " " + t("admin.users").toLowerCase() + ". " + t("common.tryAgain"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function removeUser(id) {
    if (!window.confirm(t("common.confirmDelete") + " " + t("common.user") + "?")) return;
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      alert(t("common.failedToDelete") + " " + t("common.user") + ".");
    }
  }

  // Filter users by role
  const admins = users.filter(user => user.role === "admin");
  const academies = users.filter(user => user.role === "academy");
  const regularUsers = users.filter(user => user.role === "user");

  const UserCard = ({ user }) => (
    <div key={user._id} className="rounded-2xl p-5 bg-brand-900/50 border border-white/10 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xl font-bold">{user.name}</div>
          <div className="text-sm opacity-80">{user.email}</div>
          <div className="text-xs opacity-60 mt-1 capitalize">{user.role}</div>
          {user.academyName && (
            <div className="text-xs opacity-60 mt-1">Academy: {user.academyName}</div>
          )}
        </div>
        <button onClick={() => removeUser(user._id)} className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm flex items-center gap-1">
          <Trash2 size={14} /> {t("common.delete")}
        </button>
      </div>
    </div>
  );

  const UserSection = ({ title, users, icon: Icon, emptyMessage }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={24} className="text-blue-400" />
        <h3 className="text-2xl font-bold">{title} ({users.length})</h3>
      </div>
      {users.length === 0 ? (
        <div className="text-gray-400 italic p-4 bg-brand-900/30 rounded-xl">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-white">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
        <h2 className="text-3xl font-extrabold">{t("admin.panel")} • {t("admin.usersManagement")}</h2>
        <button
          onClick={() => {/* Logic to add user */}}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-brand-900 font-semibold shadow"
        >
          <Plus size={16} />
          {t("admin.addUser")}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 text-red-400 p-6 rounded-xl">
          {error}
          <button onClick={loadUsers} className="ml-4 px-3 py-1 bg-red-500 text-white rounded-xl">
            {t("common.retry")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={6} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <UserSection
            title={t("admin.administrators")}
            users={admins}
            icon={Shield}
            emptyMessage={t("admin.noAdmins")}
          />
          
          <UserSection
            title={t("admin.academyAccounts")}
            users={academies}
            icon={Building}
            emptyMessage={t("admin.noAcademies")}
          />
          
          <UserSection
            title={t("admin.regularUsers")}
            users={regularUsers}
            icon={UserIcon}
            emptyMessage={t("admin.noUsers")}
          />
        </div>
      )}
    </div>
  );
}
