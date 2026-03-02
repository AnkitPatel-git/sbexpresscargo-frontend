import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Product Master",
};

export default function ProductMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
