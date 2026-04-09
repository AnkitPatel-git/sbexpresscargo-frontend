import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Rate Master",
};

export default function ClientRateMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
