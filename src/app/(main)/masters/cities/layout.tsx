import { Metadata } from "next"

export const metadata: Metadata = {
    title: "City Master",
}

export default function CityMasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
