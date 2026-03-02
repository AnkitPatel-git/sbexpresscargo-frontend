import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Service Center Master",
}

export default function ServiceCenterMasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
