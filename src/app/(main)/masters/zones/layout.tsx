import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Zone Master",
};

export default function ZoneLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
