import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Service Map Master",
};

export default function ServiceMapMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
