export function PanelSection({ title, hint, children }) {
  return (
    <section className="control-section">
      <div className="section-title">
        <h3>{title}</h3>
        {hint && <span>{hint}</span>}
      </div>
      {children}
    </section>
  );
}
