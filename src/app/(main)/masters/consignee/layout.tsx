import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Consignee Master",
};

export default function ConsigneeMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
