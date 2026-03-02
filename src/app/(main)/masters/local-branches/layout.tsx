import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Local Branch Master",
};

export default function LocalBranchMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
