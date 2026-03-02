import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Bank Master",
}

export default function BankMasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
