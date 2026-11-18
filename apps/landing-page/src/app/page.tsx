import { HomePage } from "@/features/home/page/HomePage";
import { pageMetadata } from "@/shared/seo/metadata";
import { DEFAULT_DESCRIPTION } from "@/shared/seo/site";

export const metadata = pageMetadata({
  title: "FleetPro Enterprise | Modern fleet management built for Africa",
  description: DEFAULT_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default HomePage;
