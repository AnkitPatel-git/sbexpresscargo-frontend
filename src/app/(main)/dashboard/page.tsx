import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
};

export default function DashboardPage() {
    return (
        <div className="flex items-center justify-center h-full text-gray-400">
            Dashboard Content (Blank for now)
        </div>
    )
}
