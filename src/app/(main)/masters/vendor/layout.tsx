import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Vendor Master",
};

export default function VendorMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
