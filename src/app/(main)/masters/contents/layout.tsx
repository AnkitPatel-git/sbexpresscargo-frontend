import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Content Master",
}

export default function ContentMasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
