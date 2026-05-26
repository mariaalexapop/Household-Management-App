// Shared primitives used by both A and B designs.
// All React-only; read tokens via `t` prop (tokens.jsx TOK.A or TOK.B).

const Ic = {
  // simple lucide-style inline icons @ 18x18 stroke 1.75
  home: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>,
  check: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  plus: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  bell: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  search: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>,
  cal: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  car: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.4L19 11M5 11h14v6H5zM7 17v2M17 17v2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>,
  shield: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z"/></svg>,
  plug: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M9 2v4M15 2v4M7 6h10v6a5 5 0 0 1-10 0zM12 17v5"/></svg>,
  users: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 22c0-4 3-7 7-7s7 3 7 7M17 11a3 3 0 1 0 0-6M22 22c0-3-2-5-5-5"/></svg>,
  gear: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  spark: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>,
  chat: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.7 7l-5.3 1 1-4.7A8 8 0 1 1 21 12z"/></svg>,
  doc: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6"/></svg>,
  more: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>,
  filter: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>,
  chevD: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>,
  chevR: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>,
  chevL: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>,
  upload: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  trend: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>,
  clock: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  x: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  pin: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-5-7-12a7 7 0 0 1 14 0c0 7-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>,
};

function Avatar({ name, initials, color, size=28, t }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || t.primary, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: t.fontBody, fontSize: size*0.38, fontWeight: 600, letterSpacing: 0.2,
      flexShrink: 0,
    }} title={name}>{initials}</div>
  );
}

function Badge({ children, bg, fg, border, t, radius }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px',
      borderRadius: radius ?? 6,
      background: bg ?? t.surface2,
      color: fg ?? t.textMuted,
      border: border ? `1px solid ${border}` : 'none',
      fontFamily: t.fontBody, fontSize: 12, fontWeight: 500,
      lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Btn({ children, variant='primary', t, full, size='md', icon, style, onClick }) {
  const bases = {
    primary:    { bg: t.primary, fg: '#fff', border: 'transparent' },
    outline:    { bg: 'transparent', fg: t.text, border: t.borderStrong },
    ghost:      { bg: 'transparent', fg: t.primary, border: 'transparent' },
    destructive:{ bg: t.destructive, fg: '#fff', border: 'transparent' },
    soft:       { bg: t.surface2, fg: t.text, border: 'transparent' },
  };
  const s = bases[variant];
  const sizes = { sm: {px:10,py:5,fs:12,r:999}, md:{px:16,py:8,fs:13,r:999}, lg:{px:20,py:10,fs:14,r:999} };
  const sz = sizes[size];
  const r = variant==='outline' || variant==='soft' ? 8 : sz.r;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: `${sz.py}px ${sz.px}px`, borderRadius: r,
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      fontFamily: t.fontDisplay, fontSize: sz.fs, fontWeight: 600, letterSpacing: 0.01,
      width: full ? '100%' : 'auto', cursor: 'pointer',
      ...style,
    }}>{icon && <span style={{display:'flex'}}>{icon}</span>}{children}</button>
  );
}

// Placeholder for imagery / PDF thumbs
function Placeholder({ label, h=120, t, accent }) {
  const color = accent || t.borderStrong;
  return (
    <div style={{
      height: h, borderRadius: 8, overflow: 'hidden',
      background: `repeating-linear-gradient(45deg, ${t.surface2} 0 6px, ${t.surface} 6px 12px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px dashed ${color}`,
      color: t.textMuted, fontFamily: t.fontMono, fontSize: 11, letterSpacing: 0.5,
    }}>{label}</div>
  );
}

// Module chip — small icon tile used in nav and cards
function ModChip({ icon, color, bg, size=28, t, radius=8 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg, color: color,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>{icon}</div>
  );
}

// Screen shell — provides a fixed-size artboard background + optional padded area.
function Screen({ children, t, bg, pad=0, style }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg ?? t.surface,
      color: t.text,
      fontFamily: t.fontBody, fontSize: 13,
      overflow: 'hidden', position: 'relative',
      padding: pad,
      ...style,
    }}>{children}</div>
  );
}

// Desktop sidebar used in dashboard + module pages.
function Sidebar({ t, active, onNav }) {
  const go = onNav || (()=>{});
  const sections = [
    { key: 'dash', label: 'Dashboard', icon: <Ic.home s={16}/>, color: t.primary },
    { key: 'calendar',  label: 'Calendar',   icon: <Ic.cal s={16}/>,  color: t.cal.dot, group: 'Modules' },
    { key: 'chores', label: 'Home Chores', icon: <Ic.check s={16}/>, color: t.chores.dot },
    { key: 'kids',   label: 'Kids Activities', icon: <Ic.users s={16}/>, color: t.kids.dot },
    { key: 'car',    label: 'Car Maintenance', icon: <Ic.car s={16}/>, color: t.car.dot },
    { key: 'insurance',    label: 'Insurance', icon: <Ic.shield s={16}/>, color: t.ins.dot },
    { key: 'electronics',   label: 'Electronics', icon: <Ic.plug s={16}/>, color: t.elec.dot },
    { key: 'chat',     label: 'Ask Kinship', icon: <Ic.spark s={16}/>, color: t.primary, group: 'AI' },
    { key: 'settings', label: 'Settings', icon: <Ic.gear s={16}/>, color: t.textMuted, group: 'Account' },
  ];
  return (
    <div style={{
      width: 232, height: '100%', flexShrink: 0,
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(12px)',
      borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px',
    }}>
      {/* Brand */}
      <div onClick={()=>go('dash')} style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor:'pointer' }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: t.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 14,
        }}>K</div>
        <div style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 17, letterSpacing: -0.3 }}>Kinship</div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sections.map((s, i) => (
          <React.Fragment key={s.key}>
            {s.group && (
              <div style={{
                padding: '14px 8px 6px', fontFamily: t.fontBody, fontSize: 10,
                fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
                color: t.textFaint,
              }}>{s.group}</div>
            )}
            <div onClick={()=>go(s.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: active === s.key ? t.primarySurface : 'transparent',
              color: active === s.key ? t.primary : t.textMuted,
              fontFamily: t.fontBody, fontSize: 13,
              fontWeight: active === s.key ? 600 : 400,
              cursor: 'pointer',
            }}>
              <span style={{ display: 'flex', color: active === s.key ? s.color : t.textFaint }}>{s.icon}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
              {s.key === 'chores' && <span style={{ fontSize: 11, color: t.textFaint }}>6</span>}
              {s.key === 'kids' && <span style={{ fontSize: 11, color: t.textFaint }}>5</span>}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Footer */}
      <div onClick={()=>go('settings')} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 8px', borderTop: `1px solid ${t.border}`, marginTop: 10,
        cursor:'pointer',
      }}>
        <Avatar initials="AH" color="#e05252" size={28} t={t} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Ava Harper</div>
          <div style={{ fontSize: 11, color: t.textFaint }}>ava@harper.fam</div>
        </div>
        <span style={{ color: t.textFaint }}><Ic.gear s={15}/></span>
      </div>
    </div>
  );
}

// Top bar used in dashboard + pages (search, bell, chatbot fab is floating).
function TopBar({ t, title, subtitle, cta, onNav, backTo, backLabel }) {
  const go = onNav || (()=>{});
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 24px',
      background: 'transparent',
    }}>
      <div style={{ flex: 1 }}>
        {backTo && (
          <div onClick={()=>go(backTo)} style={{
            display:'inline-flex', alignItems:'center', gap:4,
            fontFamily:t.fontBody, fontSize:12, color:t.textMuted, cursor:'pointer',
            marginBottom:4,
          }}><Ic.chevL s={12}/> {backLabel || 'Back'}</div>
        )}
        <div style={{
          fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 600,
          letterSpacing: -0.4,
          color: t.text, lineHeight: 1.1,
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textMuted, marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 999,
        background: t.surface2, color: t.textMuted,
        fontFamily: t.fontBody, fontSize: 12, minWidth: 180,
      }}>
        <Ic.search s={14}/><span style={{ color: t.textFaint }}>Ask Kinship or search…</span>
      </div>
      <div onClick={()=>go('notifications')} style={{ position:'relative', color: t.textMuted, cursor:'pointer' }}>
        <Ic.bell s={18}/>
        <div style={{ position:'absolute', top:-3, right:-4, width: 12, height: 12, borderRadius: 6, background: t.primary, color: '#fff', fontSize: 9, fontWeight: 700, display:'flex', alignItems:'center', justifyContent:'center' }}>3</div>
      </div>
      {cta}
    </div>
  );
}

// Floating AI assistant bubble — bottom right corner
function AiFab({ t, onClick, hint }) {
  return (
    <div style={{
      position: 'absolute', right: 20, bottom: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      pointerEvents:'none',
    }}>
      {hint !== false && (
        <div onClick={onClick} style={{
          background: t.canvas, borderRadius: 16,
          boxShadow: t.float, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: t.fontBody, fontSize: 12, color: t.textMuted,
          maxWidth: 230, cursor:'pointer', pointerEvents:'auto',
        }}>
          <Ic.spark s={14} /> <span>Ask about Aviva home renewal?</span>
        </div>
      )}
      <div onClick={onClick} style={{
        width: 52, height: 52, borderRadius: 26,
        background: t.primary, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: t.float, cursor:'pointer', pointerEvents:'auto',
      }}>
        <Ic.spark s={22}/>
      </div>
    </div>
  );
}

Object.assign(window, { Ic, Avatar, Badge, Btn, Placeholder, ModChip, Screen, Sidebar, TopBar, AiFab });
