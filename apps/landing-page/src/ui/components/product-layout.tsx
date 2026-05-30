import SectionContainerTwo from "./section-container-two";

export type ProductData = {
 titleIcon: string;
 title: string;
 description: string;
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
  </section>
 )
}
