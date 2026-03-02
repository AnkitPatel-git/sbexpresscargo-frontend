import { Metadata } from "next"

export const metadata: Metadata = {
    title: "State Master",
}

export default function StateMasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
