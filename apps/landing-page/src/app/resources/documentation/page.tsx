import { DocumentationPage } from "@/features/resources/page/DocumentationPage";
import { pageMetadata } from "@/shared/seo/metadata";

export const metadata = pageMetadata({
  title: "Documentation",
  description: "Comprehensive platform documentation for admins and operators.",
  path: "/resources/documentation",
});

export default DocumentationPage;
