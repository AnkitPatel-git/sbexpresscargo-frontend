import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Area Master",
};

export default function AreaMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
