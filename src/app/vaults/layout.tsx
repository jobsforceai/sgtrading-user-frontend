
import Header from '@/components/Header';

export default function VaultsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            {children}
        </>
    );
}
