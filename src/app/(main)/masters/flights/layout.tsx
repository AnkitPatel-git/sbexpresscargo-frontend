import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Flight Master",
}

export default function FlightMasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
