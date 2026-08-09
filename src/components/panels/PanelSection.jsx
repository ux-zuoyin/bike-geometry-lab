export function PanelSection({ title, hint, action, className = "", children }) {
  return (
    <section className={`control-section${className ? ` ${className}` : ""}`}>
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
