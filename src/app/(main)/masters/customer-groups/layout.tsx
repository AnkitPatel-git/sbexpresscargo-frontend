import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Customer group",
}

export default function CustomerGroupMasterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
