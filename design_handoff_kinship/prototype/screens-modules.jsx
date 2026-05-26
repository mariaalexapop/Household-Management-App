// Car, Insurance, Electronics — A-only, clickable.

function Car({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="car" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Car Maintenance" subtitle="2 vehicles · 1 item due soon"
                  cta={<Btn t={t} onClick={()=>go('car/service')}>+ Log Service</Btn>} onNav={go}/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, overflow:'auto' }}>
            {d.cars.map((car,i)=>(
              <div key={i} style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:10, background:t.car.light, color:t.car.dark }}>
                  <Ic.car s={18}/>
                  <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:15 }}>{car.name}</div>
                  <div style={{ flex:1 }}/>
                  <div style={{ fontFamily:t.fontBody, fontSize:11, opacity:0.8 }}>{car.reg}</div>
                </div>
                <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, borderBottom:`1px solid ${t.border}` }}>
                  {[
                    {l:'Mileage', v:`${car.mileage.toLocaleString()} mi`},
                    {l:'MOT due', v:car.mot, hot:car.hotMot},
                    {l:'Tax due', v:car.tax},
                  ].map((s,j)=>(
                    <div key={j} style={{ padding:'8px 10px', borderRadius:8, background: s.hot?t.warnSurface:t.surface2 }}>
                      <div style={{ fontSize:10, color:t.textFaint, letterSpacing:0.6, textTransform:'uppercase', fontWeight:600 }}>{s.l}</div>
                      <div style={{ fontFamily:t.fontDisplay, fontSize:14, fontWeight:600, color: s.hot?t.warn:t.text, marginTop:2 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'10px 16px 4px', fontFamily:t.fontDisplay, fontSize:12, fontWeight:600, color:t.textMuted, display:'flex', alignItems:'center' }}>
                  <span>Service history</span>
                  <div style={{ flex:1 }}/>
                  {i===0 && <span onClick={()=>go('car/service')} style={{ fontSize:11, color:t.primary, fontWeight:600, cursor:'pointer' }}>+ Log</span>}
                </div>
                <div style={{ padding:'0 16px 14px' }}>
                  {car.history.map((h,j)=>(
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom: j<car.history.length-1?`1px solid ${t.border}`:'none' }}>
                      <div style={{ width:6, height:6, borderRadius:3, background:t.car.dot }}/>
                      <div style={{ fontSize:12, fontWeight:500, flex:1 }}>{h.what}</div>
                      <div style={{ fontSize:11, color:t.textFaint }}>{h.when}</div>
                      <div style={{ fontSize:11, color:t.textMuted, width:60, textAlign:'right' }}>{h.cost}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AiFab t={t} onClick={()=>go('chat')}/>
    </Screen>
  );
}

function Insurance({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="insurance" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Insurance" subtitle="4 policies · 1 renewal in 73 days"
                  cta={<div style={{ display:'flex', gap:8 }}><Btn t={t} variant="outline" onClick={()=>go('insurance/policy')}>↑ Upload PDF</Btn><Btn t={t} onClick={()=>go('insurance/policy')}>+ Add Policy</Btn></div>} onNav={go}/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'flex', flexDirection:'column', gap:12, overflow:'auto' }}>
            {d.policies.map((p,i)=>(
              <div key={i} onClick={()=>go('insurance/policy')} style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:'14px 16px', display:'flex', alignItems:'center', gap:16, cursor:'pointer' }}>
                <div style={{ width:44, height:44, borderRadius:10, background:t.ins.light, color:t.ins.dark, display:'flex', alignItems:'center', justifyContent:'center' }}><Ic.shield s={22}/></div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:15 }}>{p.type}</div>
                    <Badge t={t} bg={t.surface2} fg={t.textMuted}>{p.insurer}</Badge>
                    {p.soon && <Badge t={t} bg={t.warnSurface} fg={t.warn}>Renewal in 73 days</Badge>}
                  </div>
                  <div style={{ fontFamily:t.fontBody, fontSize:11, color:t.textMuted, marginTop:4 }}>Policy {p.num} · Expires {p.expiry}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:15 }}>{p.premium}</div>
                  <div style={{ fontFamily:t.fontBody, fontSize:10, color:t.textFaint }}>{p.billing}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Badge t={t} border={t.border} fg={t.text}>📄 PDF</Badge>
                  <span style={{ color:t.textFaint }}><Ic.more s={16}/></span>
                </div>
              </div>
            ))}

            <div style={{ background:t.primarySurface, borderRadius:t.radiusLg, border:`2px dashed ${t.primary}`, padding:20, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:t.canvas, color:t.primary, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:t.ring }}><Ic.spark s={20}/></div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:t.fontDisplay, fontSize:14, fontWeight:600, color:t.text }}>Drop a policy PDF here</div>
                <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textMuted, marginTop:2 }}>Kinship extracts your cover, renewal, excess and claim steps — then lets you ask questions.</div>
              </div>
              <Btn t={t} size="sm" onClick={()=>go('insurance/policy')}>Choose file</Btn>
            </div>
          </div>
        </div>
      </div>
      <AiFab t={t} onClick={()=>go('chat')}/>
    </Screen>
  );
}

function Electronics({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="electronics" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Electronics" subtitle={`${d.electronics.length} items · 2 warranties expiring`}
                  cta={<Btn t={t}>+ Add Item</Btn>} onNav={go}/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, overflow:'auto', alignContent:'start' }}>
            {d.electronics.map((e,i)=>(
              <div key={i} style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:t.elec.light, color:t.elec.dark, display:'flex', alignItems:'center', justifyContent:'center' }}><Ic.plug s={18}/></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:14 }}>{e.name}</div>
                    <div style={{ fontFamily:t.fontBody, fontSize:11, color:t.textMuted, marginTop:1 }}>{e.brand} · {e.room}</div>
                  </div>
                  {e.status==='expiring' && <Badge t={t} bg={t.warnSurface} fg={t.warn}>Expiring</Badge>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12, fontSize:11 }}>
                  <div><div style={{ color:t.textFaint }}>Warranty until</div><div style={{ color: e.status==='expiring'?t.warn:t.text, fontWeight:600, marginTop:2 }}>{e.warranty}</div></div>
                  <div><div style={{ color:t.textFaint }}>Receipt</div><div style={{ color:t.text, fontWeight:600, marginTop:2 }}>{e.receipt}</div></div>
                </div>
                <div style={{ display:'flex', gap:6, marginTop:10 }}>
                  <Badge t={t} border={t.border} fg={t.textMuted}>📄 Manual</Badge>
                  <Badge t={t} border={t.border} fg={t.textMuted}>🧾 Receipt</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AiFab t={t} onClick={()=>go('chat')}/>
    </Screen>
  );
}

Object.assign(window, { Car, Insurance, Electronics });
