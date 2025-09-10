import { CalendarDays, MapPin } from "lucide-react";

export default function MatchCard({ match }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 space-y-3 border border-gray-100">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CalendarDays className="w-4 h-4" />{" "}
        {new Date(match.date).toLocaleDateString()} {match.time}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" /> {match.location?.description}
      </div>
      <p className="text-gray-800 text-sm">{match.ageGroup}</p>
    </div>
  );
}
