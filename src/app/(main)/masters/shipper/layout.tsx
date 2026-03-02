import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shipper Master",
};

export default function ShipperMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
