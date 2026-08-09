export function PanelSection({ title, hint, action, children }) {
  return (
    <section className="control-section">
      <div className="section-title">
        <div className="section-title__copy">
          <h3>{title}</h3>
          {hint && <span>{hint}</span>}
        </div>
        {action && <div className="section-title__action">{action}</div>}
      </div>
      {children}
    </section>
  );
}
