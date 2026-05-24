import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";

const links = [
  { href: "#solutions", label: "الحلول" },
  { href: "#engine", label: "المحرك" },
  { href: "#impact", label: "الأثر" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="landing-nav">
      <div className="landing-container landing-nav-inner">
        <a href="#top">
          <Logo />
        </a>

        <div className="landing-nav-links">
          {links.map(l => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="landing-nav-actions">
          <Link to="/login/provider" className="landing-btn landing-btn-outline nav-provider">
            دخول مزود الخدمة
          </Link>
          <Link to="/login/citizen" className="landing-btn landing-btn-primary">
            دخول المواطن
          </Link>
          <button
            type="button"
            className="landing-nav-toggle"
            aria-label="القائمة"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <div className={`landing-nav-mobile ${open ? "open" : ""}`}>
        {links.map(l => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <Link to="/login/provider" onClick={() => setOpen(false)}>
          دخول مزود الخدمة
        </Link>
        <Link to="/login/citizen" onClick={() => setOpen(false)}>
          دخول المواطن
        </Link>
      </div>
    </nav>
  );
}
