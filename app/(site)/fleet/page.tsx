import { Suspense } from "react";
import FleetListing from "@/components/fleet/FleetListing";

function FleetLoading() {
  return (
    <main aria-busy="true" className="fleet-page">
      <div className="site-container">
        <header className="fleet-page__header">
          <p>THE EPICDRIVE FLEET</p>
          <h1>Find your perfect drive.</h1>
          <span>Loading the current vehicle catalogue…</span>
        </header>
      </div>
    </main>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<FleetLoading />}>
      <FleetListing />
    </Suspense>
  );
}
