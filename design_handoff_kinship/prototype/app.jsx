// Main prototype: hash-routed clickable flow with design-canvas overview.

const T = window.TOK.A;

// Route tree — lays out a canvas overview, then a prototype that fills the viewport.
const ROUTES = {
  'marketing':         (p) => <Marketing t={T} {...p}/>,
  'auth':              (p) => <Auth t={T} {...p}/>,
  'reset':             (p) => <Reset t={T} {...p}/>,
  'onboarding':        (p) => <Onboarding t={T} {...p}/>,
  'welcome':           (p) => <Welcome t={T} {...p}/>,
  'dash':              (p) => <DashA t={T} {...p}/>,
  'notifications':     (p) => <Notifications t={T} {...p}/>,
  'chores':            (p) => <Chores t={T} {...p}/>,
  'chores/new':        (p) => <AddTask t={T} {...p}/>,
  'kids':              (p) => <Kids t={T} {...p}/>,
  'kids/new':          (p) => <AddTask t={T} {...p}/>,
  'calendar':          (p) => <Calendar t={T} {...p}/>,
  'car':               (p) => <Car t={T} {...p}/>,
  'car/service':       (p) => <CarService t={T} {...p}/>,
  'insurance':         (p) => <Insurance t={T} {...p}/>,
  'insurance/policy':  (p) => <PolicyDetail t={T} {...p}/>,
  'electronics':       (p) => <Electronics t={T} {...p}/>,
  'chat':              (p) => <Chat t={T} {...p}/>,
  'settings':          (p) => <Settings t={T} {...p}/>,
  'invite':            (p) => <Invite t={T} {...p}/>,
  'mobile':            (p) => <MobileDash t={T} {...p}/>,
  'mobile/chores':     (p) => <MobileChores t={T} {...p}/>,
};

function useHash() {
  const [h, setH] = React.useState(() => (location.hash||'').replace(/^#/, '') || '');
  React.useEffect(()=>{
    const fn = () => setH((location.hash||'').replace(/^#/, ''));
    window.addEventListener('hashchange', fn);
    return ()=>window.removeEventListener('hashchange', fn);
  },[]);
  const nav = React.useCallback((r)=>{ location.hash = r; }, []);
  return [h, nav];
}

// Canvas overview (index) — thumbnails of every screen
function Overview({ onNav }) {
  const items = [
    { id:'marketing',        label:'Marketing landing', group:'Public' },
    { id:'auth',             label:'Sign in', group:'Public' },
    { id:'reset',            label:'Reset password', group:'Public' },
    { id:'onboarding',       label:'Onboarding', group:'Public' },
    { id:'welcome',          label:"You're all set", group:'Public' },

    { id:'dash',             label:'Dashboard', group:'Main app' },
    { id:'notifications',    label:'Notifications', group:'Main app' },
    { id:'calendar',         label:'Calendar', group:'Main app' },
    { id:'chat',             label:'Ask Kinship', group:'Main app' },

    { id:'chores',           label:'Home Chores', group:'Modules' },
    { id:'chores/new',       label:'New task', group:'Modules' },
    { id:'kids',             label:'Kids Activities', group:'Modules' },
    { id:'car',              label:'Car Maintenance', group:'Modules' },
    { id:'car/service',      label:'Log service', group:'Modules' },
    { id:'insurance',        label:'Insurance', group:'Modules' },
    { id:'insurance/policy', label:'Policy detail', group:'Modules' },
    { id:'electronics',      label:'Electronics', group:'Modules' },

    { id:'settings',         label:'Settings', group:'Account' },
    { id:'invite',           label:'Invite member', group:'Account' },

    { id:'mobile',           label:'Mobile dash', group:'Mobile' },
    { id:'mobile/chores',    label:'Mobile chores', group:'Mobile' },
  ];
  const groups = [...new Set(items.map(i=>i.group))];
  return (
    <DesignCanvas>
      <DCSection id="intro" title="Kinship — clickable prototype" subtitle="Every screen below is live. Click any artboard to focus it; use the Sidebar, top-bar bell, or any link inside a screen to navigate. The hash in the URL reflects where you are — share or bookmark deep links.">
        <DCPostIt color="#fff0b3" x={0} y={0} rotate={-2}>
          <b>How to use.</b> Click any thumbnail to open that screen full-viewport. Inside a screen, everything clickable is wired — the sidebar, the AI bubble, "See all", card rows, the bell.
        </DCPostIt>
        <DCPostIt color="#d4f5c3" x={0} y={0} rotate={1.5}>
          <b>Single direction.</b> Moved forward with Direction A (Space Grotesk + Noto, bright pastels, 12px rounded cards). Direction B parked.
        </DCPostIt>
        <DCPostIt color="#ffd8f4" x={0} y={0} rotate={-1}>
          <b>Household.</b> The Harpers of Manchester — Ava + Noah, Iris (9), Finn (6). One Ford, one VW, four policies, five appliances.
        </DCPostIt>
        <DCPostIt color="#c3faf5" x={0} y={0} rotate={2}>
          <b>New screens.</b> Notifications, Invite, New task, Log service, Policy detail, Reset password, Welcome — plus mobile tabs.
        </DCPostIt>
      </DCSection>

      {groups.map(g=>(
        <DCSection key={g} id={g.toLowerCase().replace(/\s+/g,'-')} title={g} subtitle="">
          {items.filter(i=>i.group===g).map(it=>(
            <DCArtboard key={it.id} id={it.id} label={it.label}
                        width={it.group==='Mobile'?390:1440}
                        height={it.group==='Mobile'?780:900}>
              <div style={{ position:'relative', width:'100%', height:'100%' }}>
                {ROUTES[it.id]({ onNav })}
                <div onClick={()=>onNav(it.id)} style={{ position:'absolute', inset:0, cursor:'pointer' }}/>
              </div>
            </DCArtboard>
          ))}
        </DCSection>
      ))}
    </DesignCanvas>
  );
}

// Live prototype frame — single screen at scaled viewport with a back-to-overview chip.
function Proto({ route, onNav }) {
  const render = ROUTES[route];
  const isMobile = route.startsWith('mobile');
  const W = isMobile ? 390 : 1440;
  const H = isMobile ? 780 : 900;

  const [scale, setScale] = React.useState(1);
  React.useEffect(()=>{
    const fit = ()=>{
      const w = window.innerWidth;
      const h = window.innerHeight - 44; // top bar
      const s = Math.min(w / W, h / H, 1);
      setScale(s);
    };
    fit();
    window.addEventListener('resize', fit);
    return ()=>window.removeEventListener('resize', fit);
  }, [W, H]);

  return (
    <div style={{ position:'fixed', inset:0, background:'#111', display:'flex', flexDirection:'column' }}>
      <div style={{ height:44, flexShrink:0, background:T.canvas, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', padding:'0 16px', gap:12 }}>
        <div onClick={()=>onNav('')} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <div style={{ width:22, height:22, borderRadius:6, background:T.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontDisplay, fontWeight:700, fontSize:12 }}>K</div>
          <div style={{ fontFamily:T.fontDisplay, fontWeight:600, fontSize:14 }}>Kinship prototype</div>
        </div>
        <div style={{ fontFamily:T.fontMono, fontSize:11, color:T.textFaint, padding:'3px 8px', background:T.surface2, borderRadius:4 }}>/{route}</div>
        <div style={{ flex:1 }}/>
        <div onClick={()=>onNav('')} style={{ padding:'5px 12px', borderRadius:999, border:`1px solid ${T.border}`, fontFamily:T.fontBody, fontSize:12, fontWeight:600, color:T.text, cursor:'pointer' }}>← Back to overview</div>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <div style={{
          width: W, height: H,
          transform:`scale(${scale})`, transformOrigin:'center',
          boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
          borderRadius: isMobile ? 32 : 0,
          overflow:'hidden',
          background: T.surface,
        }}>
          {render ? render({ onNav }) : <div style={{ padding:40 }}>Route not found: {route}</div>}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [route, nav] = useHash();
  if (!route) return <Overview onNav={nav}/>;
  if (!ROUTES[route]) return <Overview onNav={nav}/>;
  return <Proto route={route} onNav={nav}/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
