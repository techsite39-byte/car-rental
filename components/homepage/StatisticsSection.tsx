import "./statistics-section.css";

const STATISTICS = [
  { value: "6", label: "Cars in Fleet" },
  { value: "2", label: "Seven-seat vehicles" },
  { value: "4", label: "Vehicle categories" },
  { value: "Madurai", label: "Service location" },
] as const;

export function StatisticsSection() {
  return (
    <section aria-labelledby="statistics-heading" className="home-statistics">
      <div className="home-statistics__inner">
        <h2 className="home-statistics__heading" id="statistics-heading">
          EPICDRIVE Fleet at a Glance
        </h2>
        <div className="home-statistics__grid">
          {STATISTICS.map((statistic) => (
            <article className="home-statistics__card" key={statistic.label}>
              <span className="home-statistics__value">{statistic.value}</span>
              <p className="home-statistics__label">{statistic.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
