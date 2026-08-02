export function PanelHeader({ title, action, onClick }) {
  return (
    <div className="panelHead">
      <h3>{title}</h3>
      {action && <button onClick={onClick}>{action}</button>}
    </div>
  );
}
