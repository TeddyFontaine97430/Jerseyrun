import type { Metadata } from "next";
import { ConceptTabs } from "@/components/ConceptTabs";
import { getSiteContentMap } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Le concept — Jersey Run",
};

export default async function ConceptPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const defaultTab = params.tab === "inscription" ? "inscription" : "concept";
  const content = await getSiteContentMap();

  return (
    <div className="container-page py-16">
      <div className="mb-4 text-center" id="inscription-club">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Comment ça marche
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
          Le concept Jersey Run
        </h1>
      </div>
      <ConceptTabs
        defaultTab={defaultTab}
        intro={{
          p1: content["concept.intro1"],
          p2: content["concept.intro2"],
          p3: content["concept.intro3"],
        }}
      />
    </div>
  );
}
