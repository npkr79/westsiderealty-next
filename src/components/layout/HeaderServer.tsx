import { getNavMarkets } from "@/lib/nav/getNavMarkets";
import Header from "./Header";

export default async function HeaderServer() {
  const navMarkets = await getNavMarkets();
  return <Header navMarkets={navMarkets} />;
}
