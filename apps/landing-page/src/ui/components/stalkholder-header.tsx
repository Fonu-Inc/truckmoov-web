type StalkholderHeaderProps = {
 headerTitle: string;
 header: string;
}
export default function StalkholderHeader({ headerTitle, header }: StalkholderHeaderProps) {
 return (
  <header>
   <p className="text-primary-100 text-sm font-medium uppercase">{headerTitle}</p>
   <h1 className="font-semibold text-[30px] capitalize w-full max-w-[590px]">{header}</h1>
  </header>
 )
}
