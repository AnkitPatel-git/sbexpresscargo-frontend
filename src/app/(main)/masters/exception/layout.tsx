import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Exception Master",
};

export default function ExceptionMasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
