// Dashboard — hero screen. Module cards with "See all →" links.
// Recent activity removed — now lives under Notifications.

function DashA({ t, onNav }) {
  const d = DEMO;
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="dash" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          <TopBar t={t} title="Good afternoon, Ava" subtitle="5 things on the household's radar today"
                  cta={<Btn t={t} onClick={()=>go('chores/new')}>+ Quick add</Btn>}
                  onNav={go}/>

          <div style={{ flex:1, overflow:'auto', padding:'8px 24px 24px', display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16 }}>
            {/* LEFT column */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* hero strip — this week */}
              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', padding:'14px 18px', borderBottom:`1px solid ${t.border}` }}>
                  <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:14 }}>This week</div>
                  <div style={{ flex:1 }}/>
                  <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textFaint, marginRight:12 }}>Apr 21 – 27</div>
                  <SeeAll t={t} onClick={()=>go('calendar')}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)' }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i)=>{
                    const dots = [
                      [t.chores.dot, t.kids.dot], [t.kids.dot], [t.chores.dot, t.kids.dot],
                      [t.chores.dot, t.ins.dot], [], [t.kids.dot, t.kids.dot], [t.chores.dot],
                    ][i];
                    const today = i === 0;
                    return (
                      <div key={day} style={{ padding:'12px 10px', borderRight: i<6 ? `1px solid ${t.border}` : 'none' }}>
                        <div style={{ fontFamily:t.fontBody, fontSize:10, fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', color:t.textFaint }}>{day}</div>
                        <div style={{ fontFamily:t.fontDisplay, fontSize:20, fontWeight:600, color: today ? t.primary : t.text, marginTop:2 }}>{21+i}</div>
                        <div style={{ display:'flex', gap:3, marginTop:6, minHeight:8 }}>
                          {dots.map((c,j)=><div key={j} style={{ width:6, height:6, borderRadius:3, background:c }}/>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* module cards grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <ModuleCardA t={t} color={t.chores} icon={<Ic.check s={16}/>} title="Home Chores"
                             meta="3 due this week" onSeeAll={()=>go('chores')}>
                  {[
                    {n:'Take out the recycling', m:'Today · 6pm', who:'NH', wc:'#5b76fe'},
                    {n:'Water the houseplants', m:'Tomorrow', who:'AH', wc:'#e05252'},
                    {n:'Hoover the stairs', m:'Wed', who:'NH', wc:'#5b76fe'},
                  ].map((r,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop: i===0?'none':`1px solid ${t.border}` }}>
                      <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${t.borderStrong}`, flexShrink:0 }}/>
                      <div style={{ flex:1, fontSize:12, color:t.text, fontWeight:500 }}>{r.n}</div>
                      <div style={{ fontSize:11, color:t.textFaint }}>{r.m}</div>
                      <Avatar initials={r.who} color={r.wc} size={20} t={t}/>
                    </div>
                  ))}
                </ModuleCardA>

                <ModuleCardA t={t} color={t.kids} icon={<Ic.users s={16}/>} title="Kids Activities"
                             meta="Iris & Finn · 5 this week" onSeeAll={()=>go('kids')}>
                  {d.activities.slice(0,3).map((a,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderTop: i===0?'none':`1px solid ${t.border}` }}>
                      <div style={{ width:8, height:8, borderRadius:4, background: a.cat==='sport'?t.car.dot:a.cat==='school'?t.chores.dot:a.cat==='medical'?t.kids.dot:a.cat==='social'?t.elec.dot:t.cal.dot, marginTop:4 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, color:t.text, fontWeight:500 }}>{a.title.split(' · ')[0]}</div>
                        <div style={{ fontSize:10.5, color:t.textFaint, marginTop:1 }}>{a.child} · {a.date}</div>
                      </div>
                    </div>
                  ))}
                </ModuleCardA>

                <ModuleCardA t={t} color={t.car} icon={<Ic.car s={16}/>} title="Car Maintenance"
                             meta="Ford Focus · 42,118 mi" onSeeAll={()=>go('car')}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, paddingTop:4 }}>
                    {[
                      {l:'MOT', d:'Jun 14', hot:true},
                      {l:'Tax',  d:'Sep 01'},
                      {l:'Service', d:'Nov 02'},
                    ].map((r,i)=>(
                      <div key={i} style={{ padding:'8px 10px', borderRadius:8, background: r.hot? t.warnSurface : t.surface2 }}>
                        <div style={{ fontSize:10, color:t.textFaint, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600 }}>{r.l}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:r.hot?t.warn:t.text, fontFamily:t.fontDisplay }}>{r.d}</div>
                      </div>
                    ))}
                  </div>
                </ModuleCardA>

                <ModuleCardA t={t} color={t.ins} icon={<Ic.shield s={16}/>} title="Insurance"
                             meta="4 policies" onSeeAll={()=>go('insurance')}>
                  {d.policies.slice(0,3).map((p,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderTop: i===0?'none':`1px solid ${t.border}`, cursor:'pointer' }}
                         onClick={()=>go('insurance/policy')}>
                      <div style={{ fontSize:12, fontWeight:600, color:t.text, minWidth:52 }}>{p.type.split(' ')[0]}</div>
                      <div style={{ fontSize:11, color:t.textMuted, flex:1 }}>{p.insurer}</div>
                      <div style={{ fontSize:11, color:t.textFaint }}>{p.expiry.split(', ')[0]}</div>
                    </div>
                  ))}
                </ModuleCardA>
              </div>
            </div>

            {/* RIGHT column */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Ask Kinship pinned */}
              <div style={{ background:t.primarySurface, borderRadius:t.radiusLg, padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:t.fontDisplay, fontSize:13, fontWeight:600, color:t.primary }}>
                  <Ic.spark s={14}/> Ask Kinship
                </div>
                <div style={{ fontFamily:t.fontDisplay, fontSize:17, fontWeight:600, color:t.text, marginTop:10, lineHeight:1.25 }}>
                  Aviva home insurance renews in 73 days.
                </div>
                <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textMuted, marginTop:8, lineHeight:1.5 }}>
                  I read the policy. Want me to add the 4 renewal steps to <b>Home Chores</b> so you don't miss it?
                </div>
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <Btn t={t} size="sm" onClick={()=>go('chores')}>Add tasks</Btn>
                  <Btn t={t} variant="outline" size="sm" onClick={()=>go('chat')}>Preview steps</Btn>
                </div>
              </div>

              {/* Electronics warranty watch */}
              <ModuleCardA t={t} color={t.elec} icon={<Ic.plug s={16}/>} title="Electronics"
                           meta="4 items · 2 expiring" onSeeAll={()=>go('electronics')} compact>
                {d.electronics.slice(0,4).map((e,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderTop: i===0?'none':`1px solid ${t.border}` }}>
                    <div style={{ fontSize:12, fontWeight:500, color:t.text, flex:1 }}>{e.name}</div>
                    {e.status==='expiring'
                      ? <Badge t={t} bg={t.warnSurface} fg={t.warn}>{e.warranty}</Badge>
                      : <span style={{ fontSize:11, color:t.textFaint }}>{e.warranty}</span>}
                  </div>
                ))}
              </ModuleCardA>

              {/* Upcoming across modules — compact */}
              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', padding:'10px 14px', background:t.surface2 }}>
                  <div style={{ fontFamily:t.fontDisplay, fontSize:13, fontWeight:600, flex:1 }}>Coming up</div>
                  <SeeAll t={t} onClick={()=>go('calendar')}/>
                </div>
                <div style={{ padding:'6px 14px 10px' }}>
                  {[
                    {d:'May 8',  mod:t.ins,    title:'Travel insurance expires'},
                    {d:'Jun 14', mod:t.car,    title:'Ford Focus MOT'},
                    {d:'Jul 3',  mod:t.ins,    title:'Aviva home renews'},
                    {d:'Nov 2',  mod:t.car,    title:'Ford Focus service'},
                  ].map((r,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderTop: i===0?'none':`1px solid ${t.border}` }}>
                      <div style={{ width:6, height:6, borderRadius:3, background:r.mod.dot }}/>
                      <div style={{ fontSize:11.5, color:t.text, flex:1, fontWeight:500 }}>{r.title}</div>
                      <div style={{ fontSize:11, color:t.textFaint }}>{r.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AiFab t={t} onClick={()=>go('chat')}/>
    </Screen>
  );
}

function SeeAll({ t, onClick }) {
  return (
    <a onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:3,
      fontFamily:t.fontBody, fontSize:11.5, fontWeight:600,
      color:t.primary, cursor:'pointer', textDecoration:'none',
    }}>See all <Ic.chevR s={11}/></a>
  );
}

function ModuleCardA({ t, color, icon, title, meta, children, compact, onSeeAll }) {
  return (
    <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ background:color.light, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, color:color.dark }}>
        <span style={{ display:'flex' }}>{icon}</span>
        <span style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:13 }}>{title}</span>
        <div style={{ flex:1 }}/>
        <span style={{ fontFamily:t.fontBody, fontSize:11, fontWeight:500, opacity:0.8 }}>{meta}</span>
        {onSeeAll && <span onClick={onSeeAll} style={{
          marginLeft: 10,
          display:'inline-flex', alignItems:'center', gap:3,
          fontFamily:t.fontBody, fontSize:11, fontWeight:600,
          color: color.dark, cursor:'pointer', opacity:0.85,
          paddingLeft: 10, borderLeft: `1px solid ${color.dark}22`,
        }}>See all <Ic.chevR s={10}/></span>}
      </div>
      <div style={{ padding:'10px 14px', flex:1 }}>{children}</div>
    </div>
  );
}

Object.assign(window, { DashA, ModuleCardA, SeeAll });
