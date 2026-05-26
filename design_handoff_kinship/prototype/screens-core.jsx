// Chores, Kids, Calendar — A-only, clickable.

function Chores({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="chores" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          <TopBar t={t} title="Home Chores" subtitle="6 tasks this week · 4 recurring"
                  cta={<Btn t={t} onClick={()=>go('chores/new')}>+ Add Task</Btn>} onNav={go}/>

          <div style={{ flex:1, overflow:'hidden', padding:'8px 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:t.surface2, borderRadius:12, padding:10, display:'flex', gap:8, alignItems:'center' }}>
              {['All','To do','In progress','Done'].map((s,i)=>(
                <div key={s} style={{ padding:'5px 12px', borderRadius:999, background: i===1?t.primarySurface:t.canvas, color: i===1?t.primary:t.textMuted, border: i===1?`1px solid ${t.primary}`:`1px solid ${t.border}`, fontSize:12, fontWeight: i===1?600:400, cursor:'pointer' }}>{s}</div>
              ))}
              <div style={{ width:1, height:18, background:t.border }}/>
              <div style={{ padding:'5px 12px', borderRadius:8, background:t.canvas, border:`1px solid ${t.border}`, fontSize:12, color:t.textMuted, display:'flex', gap:6, alignItems:'center' }}>Area: All <Ic.chevD s={11}/></div>
              <div style={{ padding:'5px 12px', borderRadius:8, background:t.canvas, border:`1px solid ${t.border}`, fontSize:12, color:t.textMuted, display:'flex', gap:6, alignItems:'center' }}>Assignee: Anyone <Ic.chevD s={11}/></div>
              <div style={{ flex:1 }}/>
              <div style={{ fontSize:11, color:t.textFaint }}>Hide done</div>
              <div style={{ width:28, height:16, borderRadius:8, background:t.primary, position:'relative' }}>
                <div style={{ position:'absolute', top:2, left:14, width:12, height:12, borderRadius:6, background:'#fff' }}/>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, overflow:'auto' }}>
              {d.chores.map((c,i)=>{
                const done = c.status==='done';
                return (
                  <div key={i} style={{ background:t.canvas, borderRadius:12, boxShadow:t.ring, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, opacity: done?0.6:1, cursor:'pointer' }}>
                    <div style={{ width:20, height:20, borderRadius:5, background: done?t.primary:'transparent', border: done?'none':`1.5px solid ${t.borderStrong}`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{done && <Ic.check s={12}/>}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:t.fontDisplay, fontSize:14, fontWeight:600, color:t.text, textDecoration: done?'line-through':'none' }}>{c.title}</div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                        <Badge t={t} bg={t.chores.light} fg={t.chores.dark}>{c.area}</Badge>
                        <span style={{ fontSize:11, color:t.textMuted }}>{c.due}</span>
                        {c.recur && <span style={{ fontSize:11, color:t.textFaint, display:'inline-flex', alignItems:'center', gap:3 }}>↻ weekly</span>}
                      </div>
                    </div>
                    {c.status==='progress' && <Badge t={t} bg={t.primarySurface} fg={t.primary}>In progress</Badge>}
                    {c.status==='todo' && <Badge t={t} border={t.border} fg={t.text}>To do</Badge>}
                    {done && <Badge t={t} bg={t.successSurface} fg={t.success}>Done</Badge>}
                    <Avatar initials={c.assignee==='Ava'?'AH':'NH'} color={c.assignee==='Ava'?'#e05252':'#5b76fe'} size={26} t={t}/>
                    <span style={{ color:t.textFaint }}><Ic.more s={16}/></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <AiFab t={t} onClick={()=>go('chat')}/>
    </Screen>
  );
}

function Kids({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="kids" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          <TopBar t={t} title="Kids Activities" subtitle="Iris (9) · Finn (6) — 5 this week"
                  cta={<Btn t={t} onClick={()=>go('kids/new')}>+ Add Activity</Btn>} onNav={go}/>
          <div style={{ padding:'8px 24px 24px', flex:1, display:'flex', flexDirection:'column', gap:12, overflow:'hidden' }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {['All', 'Iris', 'Finn'].map((n,i)=>(
                <div key={n} style={{ padding:'6px 14px', borderRadius:999, background: i===0?t.kids.light:'transparent', color: i===0?t.kids.dark:t.textMuted, fontSize:13, fontWeight: i===0?600:400, cursor:'pointer' }}>{n}</div>
              ))}
              <div style={{ padding:'6px 12px', borderRadius:999, border:`1px dashed ${t.borderStrong}`, color:t.textFaint, fontSize:12, display:'flex', alignItems:'center', gap:4 }}><Ic.plus s={12}/> Add child</div>
              <div style={{ flex:1 }}/>
              <div style={{ padding:3, borderRadius:999, background:t.surface2, display:'flex', gap:2 }}>
                <div style={{ padding:'5px 12px', borderRadius:999, background:t.canvas, boxShadow:t.ring, fontSize:12, fontWeight:600 }}>List</div>
                <div onClick={()=>go('calendar')} style={{ padding:'5px 12px', borderRadius:999, color:t.textMuted, fontSize:12, cursor:'pointer' }}>Calendar</div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, overflow:'auto' }}>
              {d.activities.map((a,i)=>{
                const catColor = { school:t.chores, medical:t.kids, sport:t.car, hobby:t.cal, social:t.elec }[a.cat] || t.chores;
                return (
                  <div key={i} style={{ background:t.canvas, borderRadius:12, boxShadow:t.ring, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                    <div style={{ width:14, height:14, borderRadius:7, background:catColor.dot, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:t.fontDisplay, fontSize:14, fontWeight:600, color:t.text }}>{a.title}</div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                        <Badge t={t} bg={catColor.light} fg={catColor.dark}>{a.cat}</Badge>
                        <span style={{ fontSize:11, color:t.textMuted }}>{a.date}</span>
                        <span style={{ fontSize:11, color:t.textFaint }}>· {a.loc}</span>
                      </div>
                    </div>
                    <Badge t={t} bg={t.kids.light} fg={t.kids.dark}>{a.child}</Badge>
                    <Avatar initials={a.parent==='Ava'?'AH':'NH'} color={a.parent==='Ava'?'#e05252':'#5b76fe'} size={24} t={t}/>
                    <span style={{ color:t.textFaint }}><Ic.more s={16}/></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <AiFab t={t} onClick={()=>go('chat')}/>
    </Screen>
  );
}

function Calendar({ t, onNav }) {
  const go = onNav || (()=>{});
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const evs = {
    2: [{c:t.chores,l:'Recycling'}, {c:t.kids,l:'Iris swim'}],
    3: [{c:t.kids,l:'Finn pickup'}],
    4: [{c:t.chores,l:'Hoover stairs'}, {c:t.kids,l:'Dentist'}],
    5: [{c:t.chores,l:'Bins · black'}, {c:t.ins,l:'Direct Line DD'}],
    7: [{c:t.kids,l:'Theo party'}, {c:t.kids,l:'Violin'}],
    8: [{c:t.chores,l:'Bedsheets'}],
    14:[{c:t.ins,l:'Travel expires'}],
    23:[{c:t.car,l:'MOT due'}],
  };
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="calendar" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Calendar" subtitle="Everything on your household's radar"
                  cta={<div style={{ display:'flex', gap:8 }}><Btn t={t} variant="outline" size="sm">Today</Btn><Btn t={t} size="sm" onClick={()=>go('chores/new')}>+ Event</Btn></div>} onNav={go}/>
          <div style={{ flex:1, padding:'8px 24px 24px' }}>
            <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:20, height:'100%', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
                <span style={{ color:t.textFaint, cursor:'pointer' }}><Ic.chevL/></span>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:18, margin:'0 14px' }}>April 2026</div>
                <span style={{ color:t.textFaint, cursor:'pointer' }}><Ic.chevR/></span>
                <div style={{ flex:1 }}/>
                <div style={{ padding:3, borderRadius:999, background:t.surface2, display:'flex' }}>
                  <div style={{ padding:'5px 12px', borderRadius:999, background:t.canvas, boxShadow:t.ring, fontSize:12, fontWeight:600 }}>Month</div>
                  <div style={{ padding:'5px 12px', borderRadius:999, color:t.textMuted, fontSize:12 }}>Week</div>
                </div>
                <div style={{ marginLeft:16, display:'flex', gap:12, fontSize:11, color:t.textMuted }}>
                  {[['Chores',t.chores.dot],['Kids',t.kids.dot],['Car',t.car.dot],['Ins.',t.ins.dot],['Elec.',t.elec.dot]].map(([n,c])=>(
                    <div key={n} style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:8, height:8, borderRadius:4, background:c }}/>{n}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
                {days.map(d=><div key={d} style={{ fontSize:10, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:t.textFaint, padding:'4px 6px' }}>{d}</div>)}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:4, flex:1 }}>
                {Array.from({length:35}).map((_,i)=>{
                  const dayNum = i - 1;
                  const today = dayNum === 20;
                  const outOfMonth = dayNum < 1 || dayNum > 30;
                  const ev = evs[i] || [];
                  return (
                    <div key={i} style={{ background: today?t.primarySurface:t.surface, borderRadius:8, padding:6, minHeight:0, display:'flex', flexDirection:'column', gap:2 }}>
                      <div style={{ fontFamily:t.fontDisplay, fontSize:12, fontWeight: today?700:500, color: today?t.primary: outOfMonth?t.textFaint:t.text }}>{outOfMonth?'':dayNum}</div>
                      {ev.slice(0,2).map((e,j)=>(
                        <div key={j} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:e.c.dark, background:e.c.light, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          <div style={{ width:5, height:5, borderRadius:3, background:e.c.dot, flexShrink:0 }}/>{e.l}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AiFab t={t} onClick={()=>go('chat')}/>
    </Screen>
  );
}

Object.assign(window, { Chores, Kids, Calendar });
