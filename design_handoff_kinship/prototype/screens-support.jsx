// New supporting screens: Notifications, Invite, AddTask, PolicyDetail, CarService, Reset, Welcome.

function Notifications({ t, onNav }) {
  const go = onNav || (()=>{});
  const items = [
    { c:t.ins, icon:<Ic.shield s={14}/>, title:'Aviva home insurance renews in 73 days', time:'Today', action:'Review', to:'insurance/policy', unread:true },
    { c:t.chores, icon:<Ic.check s={14}/>, title:'Noah completed "Water the houseplants"', time:'2h ago', unread:true },
    { c:t.car, icon:<Ic.car s={14}/>, title:'Ford Focus MOT due Jun 14 — 54 days', time:'Yesterday', action:'Book', to:'car', unread:true },
    { c:t.kids, icon:<Ic.users s={14}/>, title:'Iris dentist moved to Thu 3:40pm', time:'Yesterday' },
    { c:t.elec, icon:<Ic.plug s={14}/>, title:'Samsung dishwasher warranty expires in 11 days', time:'2 days ago', action:'View', to:'electronics' },
    { c:t.ins, icon:<Ic.shield s={14}/>, title:'Direct Line DD collected £38.40', time:'3 days ago' },
    { c:t.chores, icon:<Ic.check s={14}/>, title:'Ava added 3 new recurring chores', time:'Last week' },
  ];
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="dash" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Notifications" subtitle="Everything Kinship has noticed for you"
                  cta={<Btn t={t} variant="outline" size="sm">Mark all read</Btn>}
                  onNav={go} backTo="dash" backLabel="Dashboard"/>
          <div style={{ flex:1, padding:'8px 24px 24px', overflow:'auto' }}>
            <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, overflow:'hidden' }}>
              {items.map((n,i)=>(
                <div key={i} onClick={()=>n.to && go(n.to)} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderTop:i===0?'none':`1px solid ${t.border}`, background: n.unread?t.primarySurface+'40':'transparent', cursor: n.to?'pointer':'default' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:n.c.light, color:n.c.dark, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{n.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:t.fontBody, fontSize:13, color:t.text, fontWeight: n.unread?600:500 }}>{n.title}</div>
                    <div style={{ fontFamily:t.fontBody, fontSize:11, color:t.textFaint, marginTop:2 }}>{n.time}</div>
                  </div>
                  {n.unread && <div style={{ width:8, height:8, borderRadius:4, background:t.primary }}/>}
                  {n.action && <Btn t={t} size="sm" variant="outline">{n.action}</Btn>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function Invite({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="settings" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Invite to household" onNav={go} backTo="settings" backLabel="Settings"/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'flex', justifyContent:'center', alignItems:'flex-start', overflow:'auto' }}>
            <div style={{ width:560, background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:32 }}>
              <div style={{ fontFamily:t.fontDisplay, fontSize:22, fontWeight:600, letterSpacing:-0.4 }}>Invite someone to the Harper household</div>
              <div style={{ fontFamily:t.fontBody, fontSize:13, color:t.textMuted, marginTop:6 }}>They'll see the modules you've given them access to, and can be reassigned chores.</div>
              <div style={{ marginTop:22 }}>
                <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Email address</div>
                <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface, color:t.textFaint }}>name@example.com</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14 }}>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Role</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface }}>Parent <div style={{ flex:1 }}/><Ic.chevD s={12}/></div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Permissions</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface }}>Full access <div style={{ flex:1 }}/><Ic.chevD s={12}/></div>
                </div>
              </div>
              <div style={{ marginTop:22 }}>
                <div style={{ fontSize:12, color:t.textMuted, marginBottom:10, fontWeight:500 }}>Modules they can see</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    {n:'Home Chores', c:t.chores, on:true},
                    {n:'Kids Activities', c:t.kids, on:true},
                    {n:'Car Maintenance', c:t.car, on:true},
                    {n:'Insurance', c:t.ins, on:false},
                    {n:'Electronics', c:t.elec, on:true},
                  ].map(m=>(
                    <div key={m.n} style={{ padding:'10px 12px', borderRadius:10, background:m.c.light, color:m.c.dark, display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ flex:1, fontFamily:t.fontDisplay, fontSize:13, fontWeight:600 }}>{m.n}</span>
                      <div style={{ width:26, height:15, borderRadius:8, background: m.on?m.c.dark:t.border, position:'relative' }}>
                        <div style={{ position:'absolute', top:2, left: m.on?13:2, width:11, height:11, borderRadius:6, background:'#fff' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:22, padding:12, background:t.primarySurface, borderRadius:10, fontSize:12, color:t.text, display:'flex', gap:8 }}>
                <Ic.spark s={14}/> <span>Or share the household link — <span style={{ fontFamily:t.fontMono, color:t.primary }}>kinship.app/join/8Hx42P</span></span>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:24 }}>
                <Btn t={t} variant="ghost" size="lg" onClick={()=>go('settings')}>Cancel</Btn>
                <div style={{ flex:1 }}/>
                <Btn t={t} variant="outline" size="lg">Copy link</Btn>
                <Btn t={t} size="lg" onClick={()=>go('settings')}>Send invite</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function AddTask({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="chores" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="New task" onNav={go} backTo="chores" backLabel="Home Chores"/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16, overflow:'auto' }}>
            <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:24 }}>
              <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Task</div>
              <div style={{ height:48, borderRadius:10, border:`1px solid ${t.primary}`, boxShadow:`0 0 0 3px ${t.primarySurface}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:15, fontWeight:500, color:t.text, background:t.canvas }}>Change the bathroom towels</div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:18 }}>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Area</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface, gap:8 }}><div style={{ width:8, height:8, borderRadius:4, background:t.chores.dot }}/>Home <div style={{ flex:1 }}/><Ic.chevD s={12}/></div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Priority</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface }}>Normal <div style={{ flex:1 }}/><Ic.chevD s={12}/></div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Assign to</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface, gap:8 }}><Avatar initials="AH" color="#e05252" size={22} t={t}/> Ava <div style={{ flex:1 }}/><Ic.chevD s={12}/></div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Due</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface, gap:8 }}><Ic.cal s={14}/> Sun, Apr 26 · 9:00</div>
                </div>
              </div>

              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Repeat</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Never','Daily','Weekly','Every 2 weeks','Monthly','Custom…'].map((r,i)=>(
                    <div key={r} style={{ padding:'7px 12px', borderRadius:999, background: i===2?t.primarySurface:t.surface2, color: i===2?t.primary:t.textMuted, fontSize:12, fontWeight: i===2?600:400, border: i===2?`1px solid ${t.primary}`:'none', cursor:'pointer' }}>{r}</div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Notes (optional)</div>
                <div style={{ minHeight:80, borderRadius:10, border:`1px solid ${t.border}`, padding:'10px 14px', fontSize:13, background:t.surface, color:t.textFaint }}>Add any detail — e.g. "use the linen cupboard on landing"</div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:24 }}>
                <Btn t={t} variant="ghost" size="lg" onClick={()=>go('chores')}>Cancel</Btn>
                <div style={{ flex:1 }}/>
                <Btn t={t} variant="outline" size="lg">Save & add another</Btn>
                <Btn t={t} size="lg" onClick={()=>go('chores')}>Save task</Btn>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:t.primarySurface, borderRadius:t.radiusLg, padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, color:t.primary, fontFamily:t.fontDisplay, fontWeight:600, fontSize:13 }}><Ic.spark s={14}/> Ask Kinship</div>
                <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.text, marginTop:10, lineHeight:1.5 }}>
                  Create recurring weekly tasks for <b>bedroom, bathroom and kitchen linen</b> — alternating assignees?
                </div>
                <Btn t={t} size="sm" style={{ marginTop:10 }}>Draft 3 tasks</Btn>
              </div>

              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:16 }}>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:13 }}>Preview</div>
                <div style={{ marginTop:12, padding:10, borderRadius:10, background:t.surface2, display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${t.borderStrong}` }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>Change the bathroom towels</div>
                    <div style={{ fontSize:11, color:t.textMuted, marginTop:2 }}>Sun, Apr 26 · Home · ↻ weekly</div>
                  </div>
                  <Avatar initials="AH" color="#e05252" size={22} t={t}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function PolicyDetail({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="insurance" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Home insurance — Aviva" subtitle="Policy 8842-HH-2025 · Expires 3 Jul 2026"
                  cta={<div style={{ display:'flex', gap:8 }}><Btn t={t} variant="outline" size="sm">Download PDF</Btn><Btn t={t} size="sm" onClick={()=>go('chat')}>Ask about this</Btn></div>}
                  onNav={go} backTo="insurance" backLabel="Insurance"/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, overflow:'hidden' }}>
            <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${t.border}`, display:'flex', alignItems:'center', gap:8 }}>
                <Badge t={t} bg={t.ins.light} fg={t.ins.dark}>Aviva Home Policy 2025.pdf</Badge>
                <div style={{ flex:1 }}/>
                <span style={{ fontSize:11, color:t.textFaint }}>Page 3 of 14</span>
              </div>
              <div style={{ flex:1, padding:24, background:t.surface2, overflow:'auto' }}>
                <div style={{ background:'#fff', padding:'32px 36px', borderRadius:6, boxShadow:'0 2px 10px rgba(0,0,0,.08)', fontFamily:t.fontBody, fontSize:11, lineHeight:1.6, color:'#333' }}>
                  <div style={{ fontFamily:t.fontDisplay, fontSize:16, fontWeight:700, color:'#7a0e4d', marginBottom:12 }}>3. Your Cover — Buildings & Contents</div>
                  <p><b>Buildings sum insured:</b> £350,000. Standard perils include fire, flood, storm damage, subsidence (subject to the excess in section 3.4), theft and malicious damage.</p>
                  <p style={{ marginTop:10 }}><b>Contents sum insured:</b> £60,000, on a new-for-old basis. Single-article limit £2,000 unless specified under section 4.</p>
                  <div style={{ background:'#fff6d6', padding:10, borderLeft:'3px solid #d4a017', marginTop:14, borderRadius:2 }}>
                    <b>Renewal:</b> Policy renews on <b>3 July 2026</b>. We'll issue your renewal invitation 28 days before expiry. To renew, confirm your details and pay by the due date.
                  </div>
                  <p style={{ marginTop:12 }}><b>Excess:</b> standard £150; subsidence £1,000; accidental damage £100. See section 3.4 for full table.</p>
                  <p style={{ marginTop:10 }}><b>Optional cover in force:</b> accidental damage (£0 — not selected), personal possessions away from home (£0 — not selected), home emergency (£5.40/mo).</p>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12, overflow:'auto' }}>
              <div style={{ background:t.warnSurface, borderRadius:t.radiusLg, padding:16, border:`1px solid ${t.warn}33` }}>
                <div style={{ fontFamily:t.fontDisplay, fontSize:14, fontWeight:600, color:t.warn, display:'flex', alignItems:'center', gap:6 }}>⚠ Renewal in 73 days</div>
                <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.text, marginTop:8, lineHeight:1.5 }}>Aviva's renewal invitation will arrive around 5 June. Compare quotes before then to keep negotiating power.</div>
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <Btn t={t} size="sm" onClick={()=>go('chores')}>Add 4 renewal tasks</Btn>
                  <Btn t={t} variant="outline" size="sm">Snooze</Btn>
                </div>
              </div>

              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:16 }}>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:13 }}>Key facts</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12 }}>
                  {[
                    ['Insurer','Aviva'],['Policy #','8842-HH-2025'],
                    ['Premium','£42.80/mo'],['Billing','Monthly DD'],
                    ['Buildings','£350,000'],['Contents','£60,000'],
                    ['Excess (std)','£150'],['Excess (subs.)','£1,000'],
                    ['Renewal','3 Jul 2026'],['Started','3 Jul 2025'],
                  ].map(([l,v])=>(
                    <div key={l}><div style={{ fontSize:10, color:t.textFaint, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase' }}>{l}</div><div style={{ fontSize:13, fontWeight:600, color:t.text, marginTop:2 }}>{v}</div></div>
                  ))}
                </div>
              </div>

              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:16 }}>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:13 }}>If you need to claim</div>
                {[
                  'Call Aviva claims: 0800 015 1498 (24h)',
                  'Have your policy number to hand: 8842-HH-2025',
                  'Photograph damage before any repairs',
                  'For emergencies (burst pipe, etc.) use home emergency line: 0800 051 0457',
                ].map((step,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, padding:'7px 0', borderTop:i===0?'none':`1px solid ${t.border}`, fontSize:12 }}>
                    <div style={{ width:18, height:18, borderRadius:9, background:t.primarySurface, color:t.primary, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</div>
                    <div style={{ flex:1 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function CarService({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="car" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Log a service" subtitle="Ford Focus · AB15 XYZ" onNav={go} backTo="car" backLabel="Car Maintenance"/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'flex', justifyContent:'center', overflow:'auto' }}>
            <div style={{ width:640, background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:32 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Type</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {['MOT','Full service','Interim','Tyres','Repair'].map((r,i)=>(
                      <div key={r} style={{ padding:'7px 12px', borderRadius:999, background: i===1?t.car.light:t.surface2, color: i===1?t.car.dark:t.textMuted, fontSize:12, fontWeight: i===1?600:400, border: i===1?`1px solid ${t.car.dot}`:'none' }}>{r}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Date</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface, gap:8 }}><Ic.cal s={14}/> Fri, 14 Mar 2026</div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Garage</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface }}>Halfords Autocentre, Reading</div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Mileage at service</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface }}>42,118 mi</div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Cost</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface }}>£245.00</div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Next service due</div>
                  <div style={{ height:42, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.surface, gap:8 }}><Ic.cal s={14}/> Mar 2027 · or +10,000 mi</div>
                </div>
              </div>

              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Work done</div>
                <div style={{ minHeight:80, borderRadius:10, border:`1px solid ${t.border}`, padding:'10px 14px', fontSize:13, background:t.surface, color:t.text, lineHeight:1.5 }}>
                  Oil & filter change. Brake pads replaced (front). Air filter replaced. All fluids topped up. Advisory: rear tyres approaching minimum tread within 6 months.
                </div>
              </div>

              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:12, color:t.textMuted, marginBottom:6, fontWeight:500 }}>Attach invoice</div>
                <div style={{ border:`2px dashed ${t.borderStrong}`, borderRadius:10, padding:'20px 16px', display:'flex', alignItems:'center', gap:12, background:t.surface }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:t.primarySurface, color:t.primary, display:'flex', alignItems:'center', justifyContent:'center' }}><Ic.upload s={18}/></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>Halfords-invoice-Mar14.pdf</div>
                    <div style={{ fontSize:11, color:t.textFaint, marginTop:2 }}>248 KB · uploaded just now</div>
                  </div>
                  <Badge t={t} bg={t.successSurface} fg={t.success}>✓ Attached</Badge>
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:24 }}>
                <Btn t={t} variant="ghost" size="lg" onClick={()=>go('car')}>Cancel</Btn>
                <div style={{ flex:1 }}/>
                <Btn t={t} size="lg" onClick={()=>go('car')}>Save service record</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function Reset({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', padding:40 }}>
        <div style={{ width:380, background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:36 }}>
          <div onClick={()=>go('auth')} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div style={{ width:24, height:24, borderRadius:6, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:t.fontDisplay, fontWeight:700, fontSize:12 }}>K</div>
            <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:15 }}>Kinship</div>
          </div>
          <div style={{ fontFamily:t.fontDisplay, fontSize:24, fontWeight:600, letterSpacing:-0.5, marginTop:24 }}>Reset your password</div>
          <div style={{ fontFamily:t.fontBody, fontSize:13, color:t.textMuted, marginTop:6, lineHeight:1.5 }}>Enter the email you use for Kinship and we'll send you a link to set a new password.</div>
          <div style={{ marginTop:22 }}>
            <div style={{ fontSize:12, color:t.textMuted, marginBottom:6 }}>Email</div>
            <div style={{ height:42, borderRadius:10, border:`1px solid ${t.primary}`, boxShadow:`0 0 0 3px ${t.primarySurface}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.canvas }}>ava@harper.fam</div>
          </div>
          <div style={{ marginTop:18 }}><Btn t={t} full size="lg" onClick={()=>go('auth')}>Send reset link</Btn></div>
          <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:t.textMuted }}>Remembered it? <span onClick={()=>go('auth')} style={{ color:t.primary, fontWeight:600, cursor:'pointer' }}>Back to sign in</span></div>
        </div>
      </div>
    </Screen>
  );
}

function Welcome({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', padding:40 }}>
        <div style={{ width:560, textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:20, background:t.primary, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}><Ic.spark s={36}/></div>
          <div style={{ fontFamily:t.fontDisplay, fontSize:36, fontWeight:600, letterSpacing:-0.8, marginTop:24 }}>You're all set, Ava.</div>
          <div style={{ fontFamily:t.fontBody, fontSize:15, color:t.textMuted, marginTop:12, lineHeight:1.5, maxWidth:440, margin:'12px auto 0' }}>
            The Harper household is live. 4 modules are turned on, and Noah has an invite waiting in his inbox.
          </div>
          <div style={{ marginTop:32, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, textAlign:'left' }}>
            {[
              {n:'Add your first chore', c:t.chores, to:'chores/new'},
              {n:'Upload a policy PDF', c:t.ins, to:'insurance/policy'},
              {n:'Log a car service', c:t.car, to:'car/service'},
            ].map(step=>(
              <div key={step.n} onClick={()=>go(step.to)} style={{ padding:14, borderRadius:12, background:step.c.light, color:step.c.dark, cursor:'pointer' }}>
                <div style={{ fontFamily:t.fontDisplay, fontSize:13, fontWeight:600 }}>{step.n}</div>
                <div style={{ fontSize:11, marginTop:4, opacity:0.8 }}>Get started →</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:32 }}><Btn t={t} size="lg" onClick={()=>go('dash')}>Take me to the dashboard</Btn></div>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { Notifications, Invite, AddTask, PolicyDetail, CarService, Reset, Welcome });
