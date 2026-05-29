import SectionContainer from "./section-container";
import SectionContainerTwo from "./section-container-two";
import StalkholderHeader from "./stalkholder-header";
import { Check } from "lucide-react";

export type Roles = "Operations Manager" | "Finance Officer" | "Viewer" | "Dispatcher" | "Maintenance Supervisor" | "Driver" | "Analyst";

const ROLE_ICONS: Record<Roles, string> = {
 "Operations Manager": "/roles/operations-manager.svg",
 "Finance Officer": "/roles/finance-officer.svg",
 Viewer: "/roles/viewer.svg",
 Dispatcher: "/roles/dispatcher.svg",
 "Maintenance Supervisor": "/roles/maintenance-supervisor.svg",
 Driver: "/roles/driver.svg",
 Analyst: "/roles/analyst.svg",
};

export type StalkholderData = {
 titleIcon: string;
 title: string;
 description: string;
 definition: string;
 responsibilities: Array<string>;
 permissions: Array<string>;
 limitations: Array<string>;
 roles: Array<Roles>;
}

type StalkholderLayoutProps = {
 data: StalkholderData;
}

export default function StalkholderLayout({ data }: StalkholderLayoutProps) {
 return (
  <section className="bg-black">
   <SectionContainerTwo
    containerClassName="text-background"
   >
    <p className="font-medium text-sm">STAKEHOLDER</p>
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
     headerTitle="Role definition"
     header={`Who is an ${data.title}?`}
    />
    <p className="text-xl font-normal mt-10">{data.definition}</p>
   </SectionContainer>
   <SectionContainer
    rootClassName="bg-background border-b border-border"
    containerClassName="space-y-10"
   >
    <StalkholderHeader
     headerTitle="Key responsibilities"
     header="What this role is accountable for day-to-day."
    />
    <section className="grid grid-cols-3 gap-4">
     {data.responsibilities.map((reponsibility, index) => (
      <article key={reponsibility} className="flex items-center gap-8 p-4 border border-border-100 bg-foreground-100 rounded-[25px]">
       <p className="font-medium text-2xl py-4 px-6 rounded-[12px] bg-primary-500">{index + 1}</p>
       <p className="font-medium text-base">{reponsibility}</p>
      </article>
     ))}
    </section>
   </SectionContainer>
   <SectionContainer rootClassName="bg-[#fafafa] border-b border-border" containerClassName="space-y-10"
   >
    <StalkholderHeader
     headerTitle="Role permissions"
     header="Permissions granted to this role within the tenant workspace."
    />
    <section className="grid grid-cols-2 gap-4">
     {data.permissions.map((permission) => (
      <article key={permission} className="flex items-center gap-6 rounded-[18px] border border-border-100 bg-background px-8 py-5">
       <Check className="size-7 shrink-0 text-primary" strokeWidth={2.5} />
       <p className="text-base font-medium">{permission}</p>
      </article>
     ))}
    </section>
   </SectionContainer>
   <SectionContainer
    rootClassName="bg-background border-b border-border"
    containerClassName="space-y-10"
   >
    <StalkholderHeader
     headerTitle="Role Limitations"
     header="Actions outside this role's authority."
    />
    <section className="grid grid-cols-2 gap-4">
     {data.limitations.map((limitation) => (
      <article key={limitation} className="flex items-center gap-6 rounded-[18px] border border-border-100 px-8 py-5">
       <img src="/stalkholders/x.svg" alt="" className="size-5 shrink-0" aria-hidden="true" />
       <p className="text-sm font-medium">{limitation}</p>
      </article>
     ))}
    </section>
   </SectionContainer>
   <SectionContainer
    rootClassName="bg-background"
    containerClassName="space-y-10"
   >
    <StalkholderHeader
     headerTitle="Enterprise Roles"
     header="Roles this stakeholder can Invite into their workspace."
    />
    <section className="grid grid-cols-4 gap-4">
     {data.roles.map((role) => {
      const roleIcon = ROLE_ICONS[role];

      return (
       <article key={role} className="flex items-center gap-4 rounded-[20px] border border-border-100 p-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-[16px] bg-primary-500">
         <img src={roleIcon} alt="" className="size-7" aria-hidden="true" />
        </div>
        <p className="text-base font-medium">{role}</p>
       </article>
      );
     })}
    </section>
   </SectionContainer>
  </section>
 )
}
