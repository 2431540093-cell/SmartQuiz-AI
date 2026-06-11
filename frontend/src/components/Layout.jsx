import Sidebar from "./Sidebar";

export default function Layout({ title, children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        {title && (
          <div className="page-header">
            <h1>{title}</h1>
          </div>
        )}
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
