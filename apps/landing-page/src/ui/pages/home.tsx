import {
  ArrowRight,
  BarChart3,
  Blocks,
  BrainCircuit,
  CloudSun,
  Cpu,
  MapPinned,
  Navigation,
  ShieldCheck,
  Sprout,
  Webhook,
} from "lucide-react";
import { Link } from "react-router";
import { appLinks } from "@/lib/app-links";
import GetStartedDialog from "../components/get-started/get-started-dialog";
import SectionContainer from "../components/section-container";
import SectionHeader from "../components/section-header";
import { Button } from "../shadcn/button";

const HOME_FEATURES = [
  "10+ GPS Device Brands",
  "WhatsApp Integration",
  "AI Load Matching",
  "Real-time Analytics",
];

const STAKEHOLDER_CARDS = appLinks.find(link => link.title === "Stakeholders")?.children ?? [];
const PRODUCT_CARDS = appLinks.find(link => link.title === "Products")?.children ?? [];
const INTELLIGENCE_CARDS = [
  {
    title: "Predictive routing",
    description: "AI Adaptive ETAs that learn from traffic, driver behaviour and historical corridors.",
    icon: MapPinned,
  },
  {
    title: "Smart dispatch",
    description: "Recommends the best-fit driver, vehicle and trip sequence in real time.",
    icon: BrainCircuit,
  },
  {
    title: "Operational forecasting",
    description: "Forecast demand, capacity and SLA risk before it impacts customers.",
    icon: CloudSun,
  },
  {
    title: "Anomaly detection",
    description: "Surface fuel theft, route deviation and idling anomalies automatically.",
    icon: Sprout,
  },
];
const INTEGRATION_CARDS = [
  {
    title: "APIs & Webhooks",
    description: "Connect FleetPro to your ERP, WMS or finance systems.",
    icon: Webhook,
  },
  {
    title: "GPS providers",
    description: "Bring your own GPS hardware or use FleetPro-issued IoT devices.",
    icon: Navigation,
  },
  {
    title: "IoT telematics",
    description: "Plug into MTN-managed IoT SIMs and certified sensor platforms.",
    icon: Cpu,
  },
  {
    title: "Enterprise tooling",
    description: "Single sign-on, audit log streaming and identity provider integrations.",
    icon: Blocks,
  },
  {
    title: "Analytics platforms",
    description: "Stream operational data into Snowflake, BigQuery and S3.",
    icon: BarChart3,
  },
  {
    title: "Compliance systems",
    description: "Export KYC and audit trails for regulators and partners.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <section className="bg-black">
      <SectionContainer
        rootClassName="bg-[url('/home-section.jpg')] bg-cover bg-center bg-no-repeat flex py-16"
        containerClassName="flex flex-col justify-center flex-1 space-y-5"
      >
        <h1 className="font-bold text-[60px] text-white w-full max-w-[583px]">Modern Fleet Management Built for Africa</h1>
        <p className="text-[18px] text-[#FFFFFFCC] w-full max-w-[538px]">FleetPro Enterprise helps organisations manage fleets, optimise logistics, monitor live operations, automate dispatch, and scale intelligently across regions and stakeholders.</p>
        <div className="flex items-center gap-4">
          <GetStartedDialog>
            <Button>
              Get Started
              <ArrowRight />
            </Button>
          </GetStartedDialog>
          <Button
            asChild
            variant="outline"
          >
            <Link to="#">
              Explore Features
            </Link>
          </Button>
        </div>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2 text-sm text-white">
          {HOME_FEATURES.map(feature => (
            <li
              key={feature}
              className="flex items-center gap-2"
            >
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </SectionContainer>
      <SectionContainer
        rootClassName="rounded-tl-[50px] rounded-tr-[50px] bg-background border-b border-border-100"
        containerClassName="space-y-10"
      >
        <SectionHeader
          headerTitle="Stalkholders"
          header="Designed for every stakeholder in the logistics ecosystem"
          description="Built to connect every hand in the logistics chain, so nothing gets lost between planning, movement, and delivery"
        />
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STAKEHOLDER_CARDS.map((stakeholder) => {
            const Icon = stakeholder.icon;
            return (
              <Link
                key={stakeholder.title}
                to={stakeholder.href}
                className="flex items-center gap-4 rounded-[20px] border border-border-100 bg-background p-5"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-[12px] bg-primary-500">
                  <Icon
                    className="size-6"
                    strokeWidth={1.8}
                  />
                </span>
                <div className="space-y-1">
                  <p className="text-base font-medium">{stakeholder.title}</p>
                  <p className="text-xs flex items-center gap-1.5 font-medium text-primary-100">
                    Explore more
                    <ArrowRight className="size-3" />
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      </SectionContainer>
      <SectionContainer
        rootClassName="bg-background border-b border-border-100"
        containerClassName="space-y-10"
      >
        <SectionHeader
          headerTitle="Product features"
          header="Everything your fleet needs, in one console."
          description="From the depot to the destination, operations, telematics, dispatch, billing and compliance built for enterprise logistics."
        />
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCT_CARDS.map((product) => {
            const Icon = product.icon;

            return (
              <Link
                key={product.title}
                to={product.href}
                className="flex min-h-[205px] flex-col rounded-[22px] border border-border-100 bg-background p-7 space-y-3"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-primary-500">
                  <Icon
                    className="size-6"
                    strokeWidth={1.8}
                  />
                </span>
                <h3 className="text-base font-medium">{product.title}</h3>
                <p className="max-w-[350px] text-xs leading-6 text-[#4D4D4D]">{product.description}</p>
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary-100">
                  Explore more
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            );
          })}
        </section>
      </SectionContainer>
      <SectionContainer
        rootClassName="bg-background border-b border-border-100"
        containerClassName="space-y-10"
      >
        <section className="rounded-[100px] bg-[url('/grid-bg.png')] bg-cover bg-center bg-no-repeat py-16 px-20 bg-foreground text-background">
          <h1 className="font-semibold text-[40px] w-full max-w-[840px] capitalize">How Businesses and operations  Think using fleet Pro</h1>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            {INTELLIGENCE_CARDS.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="space-y-5"
                >
                  <Icon
                    className="size-12 text-primary"
                    strokeWidth={2.2}
                  />
                  <div className="space-y-3">
                    <h3 className="text-[22px] font-semibold leading-tight text-white">{card.title}</h3>
                    <p className="max-w-[245px] text-[15px] leading-6 text-[#FFFFFFCC]">{card.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </SectionContainer>
      <SectionContainer
        rootClassName="bg-background border-b border-border-100"
        containerClassName="space-y-10"
      >
        <SectionHeader
          headerTitle="Industry usecases"
          header="Built for every industry that moves goods."
        />
      </SectionContainer>
      <SectionContainer
        rootClassName="bg-background border-b border-border-100"
        containerClassName="space-y-10"
      >
        <SectionHeader
          headerTitle="INTEGRATIONS & ECOSYSTEM"
          header="How Fleet Pro fits into your operational ecosystem."
        />
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {INTEGRATION_CARDS.map((integration) => {
            const Icon = integration.icon;

            return (
              <article
                key={integration.title}
                className="flex min-h-[185px] flex-col rounded-[22px] border border-border-100 bg-background p-8 space-y-3"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-primary-500">
                  <Icon
                    className="size-6"
                    strokeWidth={1.8}
                  />
                </span>
                <h3 className="text-base font-medium">{integration.title}</h3>
                <p className="max-w-[360px] text-xs text-[#4D4D4D]">{integration.description}</p>
              </article>
            );
          })}
        </section>
      </SectionContainer>
      <SectionContainer
        rootClassName="bg-background border-b border-border-100"
        containerClassName="space-y-10"
      >
        <SectionHeader
          headerTitle="SUBSCRIPTION"
          header="Get started by choosing the right plan."
          description="Selecting a plan based on the billing model you want, Either Prepaid or postpaid."
        />
      </SectionContainer>
      <SectionContainer
        rootClassName="bg-background border-b border-border-100"
        containerClassName="space-y-10"
      >
        <SectionHeader
          headerTitle="FAQ"
          header="everything you need to know about Fleet pro"
        />
      </SectionContainer>
    </section>
  );
}
