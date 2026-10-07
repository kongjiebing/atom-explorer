import { NavLink, Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/energy", label: "城市能源", code: "02" },
  { to: "/map", label: "核电站地图", code: "03" },
  { to: "/plant", label: "反应堆", code: "04" },
  { to: "/experiment", label: "实验台", code: "05" },
  { to: "/tutor", label: "AI 导师", code: "07" },
];

export default function Layout({ children }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-lg text-accent shadow-glow transition group-hover:bg-accent/20">
              ⚛
            </span>
            <div className="leading-tight">
              <div className="font-mono text-sm font-bold tracking-tight text-ink">
                Atom Explorer
              </div>
              <div className="text-[10px] text-muted">AI核能探索空间</div>
            </div>
          </Link>

          {!isLanding && (
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:bg-surface2 hover:text-ink"
                    }`
                  }
                >
                  <span className="mr-1.5 font-mono text-[10px] opacity-60">
                    {item.code}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {!isLanding && (
            <Link to="/map" className="btn-ghost text-sm">
              核电站地图
            </Link>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer disclaimer */}
      <footer className="border-t border-line bg-bg/60 px-5 py-4">
        <div className="mx-auto max-w-7xl text-center text-xs text-muted">
          本平台为科普教育用途，所有数据为教育示意值，非真实核电工程参数 · Atom Explorer
        </div>
      </footer>
    </div>
  );
}
