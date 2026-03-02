import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Client Rate Master",
};

export default function ClientRateMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
