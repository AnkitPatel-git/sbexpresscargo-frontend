import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Country Master",
};

export default function CountryMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
