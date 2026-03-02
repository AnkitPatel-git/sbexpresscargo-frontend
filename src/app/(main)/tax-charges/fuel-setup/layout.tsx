import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Fuel Setup | SB Express Cargo",
    description: "Manage Fuel Setup",
}

export default function FuelSetupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
