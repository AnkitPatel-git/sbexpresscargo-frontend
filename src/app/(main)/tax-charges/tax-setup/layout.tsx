import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Tax Setup | SB Express Cargo",
    description: "Manage Tax Setup",
}

export default function TaxSetupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
