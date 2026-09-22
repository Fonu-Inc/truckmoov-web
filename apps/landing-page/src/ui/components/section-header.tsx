type SectionHeaderProps = {
  headerTitle: string;
  header: string;
  description?: string;
};
export default function SectionHeader({
  headerTitle,
  header,
  description,
}: SectionHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="text-primary-100 text-sm font-medium uppercase">{headerTitle}</p>
      <h1 className="font-semibold text-[30px] capitalize w-full max-w-147.5">{header}</h1>
      {description && (
        <p className="text-[18px] text-[#4D4D4D] w-full max-w-138.5">{description}</p>
      )}
    </header>
  );
}
