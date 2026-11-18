import type { Metadata } from "next";
import { NotFoundPage } from "@/features/not-found/page/NotFoundPage";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: true,
  },
};

export default NotFoundPage;
