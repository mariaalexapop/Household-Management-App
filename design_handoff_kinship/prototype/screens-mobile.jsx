// Mobile screens — A-only.
function Phone({ children, t }) {
  return (
    <div style={{ width:'100%', height:'100%', background:'#000', padding:0, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:t.surface, borderRadius:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ height:32, padding:'8px 20px', display:'flex', alignItems:'center', background:t.canvas, fontFamily:t.fontBody, fontSize:11, fontWeight:600, color:t.text }}>
          <div style={{ flex:1 }}>9:41</div>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <span>●●●</span><span>📶</span><span>🔋</span>
          </div>
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>{children}</div>
      </div>
    </div>
  );
}

function MobileTab({ t, icon, label, active, color, onClick }) {
  return (
    <div onClick={onClick} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 0', color: active?(color||t.primary):t.textFaint, cursor:'pointer' }}>
      <span style={{ display:'flex' }}>{icon}</span>
      <div style={{ fontFamily:t.fontBody, fontSize:9.5, fontWeight: active?600:400 }}>{label}</div>
    </div>
  );
}

function MobileDash({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Phone t={t}>
      <div style={{ padding:'14px 18px 10px', background:t.canvas }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar initials="AH" color="#e05252" size={30} t={t}/>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:t.fontBody, fontSize:11, color:t.textFaint }}>The Harpers</div>
            <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:15 }}>Hi Ava</div>
          </div>
          <span onClick={()=>go('notifications')} style={{ color:t.textMuted, cursor:'pointer' }}><Ic.bell s={18}/></span>
        </div>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 14px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ background:t.primary, borderRadius:14, padding:14, color:'#fff' }}>
          <div style={{ fontSize:11, opacity:0.8, fontFamily:t.fontBody, fontWeight:500 }}>Today · Tue 21 Apr</div>
          <div style={{ fontFamily:t.fontDisplay, fontSize:20, fontWeight:600, marginTop:4 }}>3 things on deck</div>
          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
            <Badge t={t} bg="rgba(255,255,255,.2)" fg="#fff">● Recycling 6pm</Badge>
            <Badge t={t} bg="rgba(255,255,255,.2)" fg="#fff">● Finn pickup</Badge>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            {n:'Chores', c:t.chores, i:<Ic.check s={15}/>, m:'3 today', k:'chores'},
            {n:'Kids', c:t.kids, i:<Ic.users s={15}/>, m:'2 today', k:'kids'},
            {n:'Car', c:t.car, i:<Ic.car s={15}/>, m:'MOT Jun 14', k:'car'},
            {n:'Insurance', c:t.ins, i:<Ic.shield s={15}/>, m:'4 policies', k:'insurance'},
          ].map((m,i)=>(
            <div key={i} onClick={()=>go(m.k)} style={{ background:m.c.light, color:m.c.dark, padding:10, borderRadius:12, cursor:'pointer' }}>
              {m.i}
              <div style={{ fontFamily:t.fontDisplay, fontSize:13, fontWeight:600, marginTop:6 }}>{m.n}</div>
              <div style={{ fontFamily:t.fontBody, fontSize:10, opacity:0.8, marginTop:1 }}>{m.m}</div>
            </div>
          ))}
        </div>
        <div style={{ background:t.canvas, borderRadius:12, padding:'10px 12px', boxShadow:t.ring }}>
          <div style={{ fontFamily:t.fontDisplay, fontSize:12, fontWeight:600, marginBottom:6 }}>Up next</div>
          {d.chores.slice(0,3).map((c,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderTop: i===0?'none':`1px solid ${t.border}` }}>
              <div style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${t.borderStrong}` }}/>
              <div style={{ flex:1, fontSize:11, fontWeight:500 }}>{c.title}</div>
              <div style={{ fontSize:10, color:t.textFaint }}>{c.due.split(',')[0]}</div>
            </div>
          ))}
        </div>
        <div onClick={()=>go('chat')} style={{ background:t.primarySurface, borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <div style={{ width:26, height:26, borderRadius:13, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><Ic.spark s={13}/></div>
          <div style={{ flex:1, fontSize:11, color:t.text }}><b>Aviva home</b> renews in 73 days. Add 4 tasks?</div>
        </div>
      </div>
      <div style={{ display:'flex', borderTop:`1px solid ${t.border}`, background:t.canvas, paddingBottom:6 }}>
        <MobileTab t={t} icon={<Ic.home s={17}/>} label="Home" active color={t.primary}/>
        <MobileTab t={t} icon={<Ic.cal s={17}/>} label="Calendar" onClick={()=>go('calendar')}/>
        <MobileTab t={t} icon={<Ic.spark s={17}/>} label="Ask" onClick={()=>go('chat')}/>
        <MobileTab t={t} icon={<Ic.users s={17}/>} label="Family" onClick={()=>go('kids')}/>
        <MobileTab t={t} icon={<Ic.gear s={17}/>} label="More" onClick={()=>go('settings')}/>
      </div>
    </Phone>
  );
}

function MobileChores({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Phone t={t}>
      <div style={{ padding:'12px 18px', background:t.canvas, display:'flex', alignItems:'center', gap:10 }}>
        <span onClick={()=>go('dash')} style={{ color:t.text, cursor:'pointer' }}><Ic.chevL/></span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:16 }}>Home Chores</div>
          <div style={{ fontFamily:t.fontBody, fontSize:10, color:t.textFaint }}>6 this week · 4 recurring</div>
        </div>
        <div onClick={()=>go('chores/new')} style={{ width:30, height:30, borderRadius:15, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><Ic.plus s={16}/></div>
      </div>
      <div style={{ display:'flex', gap:6, padding:'8px 14px', overflowX:'auto' }}>
        {['All','To do','Doing','Done'].map((s,i)=>(
          <div key={s} style={{ padding:'4px 10px', borderRadius:999, background: i===1?t.primarySurface:t.surface2, color: i===1?t.primary:t.textMuted, fontSize:11, fontWeight: i===1?600:400, whiteSpace:'nowrap' }}>{s}</div>
        ))}
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 14px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {d.chores.map((c,i)=>{
          const done = c.status==='done';
          return (
            <div key={i} style={{ background:t.canvas, borderRadius:12, boxShadow:t.ring, padding:'10px 12px', display:'flex', alignItems:'center', gap:10, opacity: done?0.55:1 }}>
              <div style={{ width:18, height:18, borderRadius:4, background: done?t.primary:'transparent', border: done?'none':`1.5px solid ${t.borderStrong}`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{done && <Ic.check s={11}/>}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:t.fontDisplay, fontSize:13, fontWeight:600, textDecoration: done?'line-through':'none' }}>{c.title}</div>
                <div style={{ fontFamily:t.fontBody, fontSize:10, color:t.textMuted, marginTop:2 }}>{c.due} · {c.area}</div>
              </div>
              <Avatar initials={c.assignee==='Ava'?'AH':'NH'} color={c.assignee==='Ava'?'#e05252':'#5b76fe'} size={22} t={t}/>
            </div>
          );
        })}
      </div>
    </Phone>
  );
}

Object.assign(window, { Phone, MobileTab, MobileDash, MobileChores });
