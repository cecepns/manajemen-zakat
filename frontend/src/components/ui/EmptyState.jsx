import { Inbox } from "lucide-react";

export const EmptyState = ({ title = "Tidak ada data", description = "" }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
    <Inbox className="h-12 w-12 mb-3" />
    <p className="font-medium text-gray-500">{title}</p>
    {description && <p className="text-sm mt-1">{description}</p>}
  </div>
);
