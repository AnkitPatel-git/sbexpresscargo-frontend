import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Charge Master",
};

export default function ChargeMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
