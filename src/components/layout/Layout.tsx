import Header from "./Header";
import FooterSection from "../home/FooterSection";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className={`flex-grow ${className}`}>
        {children}
      </main>
      <FooterSection />
    </div>
  );
};

export default Layout;
