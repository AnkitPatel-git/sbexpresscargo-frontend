import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customer Master",
};

export default function CustomerMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
