import { Check } from "lucide-react";
import SectionContainer from "./section-container";
import SectionContainerTwo from "./section-container-two";
import StalkholderHeader from "./stalkholder-header";

export type ProductData = {
 titleIcon: string;
 title: string;
 description: string;
 capabilities: Array<string>;
 fit: string;
}

type ProductLayoutProps = {
 data: ProductData;
}

export default function ProductLayout({ data }: ProductLayoutProps) {
 return (
  <section className="bg-black">
   <SectionContainerTwo
    rootClassName="py-16"
    containerClassName="text-background"
   >
    <p className="font-medium text-sm">Product Feature</p>
    <section className="flex items-center gap-4">
     <div className="bg-primary-400 p-4 w-fit rounded-[20px]">
      <img src={data.titleIcon} alt={data.title} />
     </div>
     <h1 className="font-bold text-[60px]">{data.title}</h1>
    </section>
    <p className="w-full max-w-[538px] text-base">{data.description}</p>
   </SectionContainerTwo>
   <SectionContainer
    rootClassName="bg-background rounded-tl-[50px] rounded-tr-[50px] border-b border-border"
    containerClassName="space-y-10"
   >
    <StalkholderHeader
     headerTitle="Feature capabilities"
     header="Feature built to simplify, automate, and scale modern logistics operations."
    />
    <section className="grid grid-cols-2 gap-4">
     {data.capabilities.map((ability) => (
      <article key={ability} className="flex items-center gap-6 rounded-[18px] border border-border-100 bg-background px-8 py-5">
       <Check className="size-7 shrink-0 text-primary" strokeWidth={2.5} />
       <p className="text-base font-medium">{ability}</p>
      </article>
     ))}
    </section>
   </SectionContainer>
   <SectionContainer
    rootClassName="bg-background"
   >
    <article className="rounded-[25px] border border-border-100 px-8 py-7 bg-[#FAFAFA]">
     <h2 className="mb-[10px] text-[18px] font-medium">How it fits in your operations</h2>
     <p className="text-base">{data.fit}</p>
    </article>
   </SectionContainer>
  </section>
 )
}
