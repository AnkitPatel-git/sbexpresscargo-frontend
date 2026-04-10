import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Courier Master",
};

export default function CourierMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
