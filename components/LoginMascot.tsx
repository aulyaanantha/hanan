export default function LoginMascot() {
  return <div className="login-mascot" aria-hidden="true">
    <svg viewBox="0 0 160 120" fill="none" className="login-mascot-drawing">
      <ellipse cx="80" cy="110" rx="48" ry="5" fill="var(--primary)" opacity=".1" />
      <circle cx="42" cy="29" r="19" className="login-buddy-fur" />
      <circle cx="118" cy="29" r="19" className="login-buddy-fur" />
      <circle cx="42" cy="29" r="10" className="login-buddy-soft" />
      <circle cx="118" cy="29" r="10" className="login-buddy-soft" />
      <path d="M38 90C38 69 122 69 122 90V105H38V90Z" className="login-buddy-fur" />
      <rect x="27" y="22" width="106" height="78" rx="36" className="login-buddy-fur" />
      <ellipse cx="80" cy="77" rx="22" ry="16" fill="var(--surface)" />
      <g className="login-buddy-eyes" fill="var(--foreground)"><ellipse cx="58" cy="59" rx="4" ry="5" /><ellipse cx="102" cy="59" rx="4" ry="5" /></g>
      <g className="login-buddy-blush" fill="var(--primary)" opacity=".2"><ellipse cx="44" cy="72" rx="9" ry="5" /><ellipse cx="116" cy="72" rx="9" ry="5" /></g>
      <path d="M75 73Q80 69 85 73Q85 78 80 80Q75 78 75 73Z" fill="var(--primary)" />
      <path d="M80 80V83M80 83Q74 88 71 83M80 83Q86 88 89 83" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 96C64 89 54 100 80 112C106 100 96 89 88 96L80 103L72 96Z" fill="var(--primary)" opacity=".8" />
      <g className="login-buddy-paw login-buddy-paw-left"><rect x="36" y="86" width="30" height="27" rx="13" className="login-buddy-paw-fill" /><path d="M43 93V98M50 91V97M57 93V98" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity=".35" /></g>
      <g className="login-buddy-paw login-buddy-paw-right"><rect x="94" y="86" width="30" height="27" rx="13" className="login-buddy-paw-fill" /><path d="M101 93V98M108 91V97M115 93V98" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity=".35" /></g>
    </svg>
  </div>;
}
