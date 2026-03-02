import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Industry Master",
}

export default function IndustryMasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
