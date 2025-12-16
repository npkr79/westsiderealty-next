import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PropertyDetailsPage from "./PropertyDetailsPage";
import MicroMarketPage from "./MicroMarketPage";
import { microMarketPagesService } from "@/services/microMarketPagesService";

export default function PropertyRouter() {
  const { slug } = useParams<{ slug: string }>();
  const [isMicroMarket, setIsMicroMarket] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkMicroMarket = async () => {
      try {
        console.log("PropertyRouter: Checking slug:", slug);
        
        if (slug) {
          // Always check database first - no pattern matching
          console.log("PropertyRouter: Checking database for micro-market page...");
          const microMarketPage = await microMarketPagesService.getMicroMarketPageBySlug(slug);
          
          if (microMarketPage) {
            console.log("PropertyRouter: Micro-market page found:", microMarketPage.micro_market_name);
            setIsMicroMarket(true);
          } else {
            console.log("PropertyRouter: Not a micro-market page, treating as property page");
            setIsMicroMarket(false);
          }
        } else {
          setIsMicroMarket(false);
        }
      } catch (error) {
        console.error("PropertyRouter: Error checking micro-market:", error);
        setIsMicroMarket(false);
      }
    };
    
    checkMicroMarket();
  }, [slug]);
  
  if (isMicroMarket === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isMicroMarket) {
    return <MicroMarketPage />;
  }
  
  return <PropertyDetailsPage />;
}
