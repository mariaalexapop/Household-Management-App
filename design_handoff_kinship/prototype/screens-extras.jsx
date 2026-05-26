// Chat, Settings — A-only, clickable.

function Chat({ t, onNav }) {
  const go = onNav || (()=>{});
  const msgs = [
    { who:'me', text:"What do I need to do to renew our home insurance?" },
    { who:'ai', text:"From the Aviva policy you uploaded in March — renewal is 3 July 2026 (73 days). Here are the 4 steps the document lists:",
      steps:[
        'Review current cover level (currently £60k contents, £350k buildings).',
        'Compare quotes from at least 2 other insurers by 12 June.',
        "Decide on Aviva's offered renewal premium by 26 June.",
        'Update direct debit details if renewing.',
      ]},
    { who:'me', text:'Turn those into tasks please' },
    { who:'ai', text:"Added to Home Chores, assigned to you, first one due 12 June. Want me to put a reminder in the household calendar too?", actions:['Yes, add to calendar','No thanks']},
  ];
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="chat" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Kinship AI" subtitle="Reads your household's documents · privately" onNav={go}/>
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, padding:'8px 24px 24px', overflow:'hidden' }}>
            <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${t.border}`, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:26, height:26, borderRadius:13, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><Ic.spark s={14}/></div>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:14 }}>Chat</div>
                <div style={{ flex:1 }}/>
                <Badge t={t} bg={t.successSurface} fg={t.success}>● 6 docs indexed</Badge>
              </div>
              <div style={{ flex:1, padding:'18px 18px 0', overflow:'auto', display:'flex', flexDirection:'column', gap:12 }}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{ alignSelf: m.who==='me'?'flex-end':'flex-start', maxWidth:'78%' }}>
                    <div style={{
                      background: m.who==='me'?t.primary:t.surface2,
                      color: m.who==='me'?'#fff':t.text,
                      padding:'10px 14px', borderRadius:14,
                      fontFamily:t.fontBody, fontSize:13, lineHeight:1.5,
                    }}>{m.text}</div>
                    {m.steps && (
                      <div style={{ marginTop:8, background:t.canvas, borderRadius:12, border:`1px solid ${t.border}`, padding:10 }}>
                        {m.steps.map((s,j)=>(
                          <div key={j} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom: j<m.steps.length-1?`1px solid ${t.border}`:'none', fontSize:12 }}>
                            <div style={{ width:18, height:18, borderRadius:4, background:t.primarySurface, color:t.primary, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{j+1}</div>
                            <div style={{ flex:1, color:t.text }}>{s}</div>
                          </div>
                        ))}
                        <div style={{ display:'flex', gap:6, marginTop:10 }}>
                          <Btn t={t} size="sm" onClick={()=>go('chores')}>Add all to Chores</Btn>
                          <Btn t={t} size="sm" variant="outline">Edit first</Btn>
                        </div>
                      </div>
                    )}
                    {m.actions && (
                      <div style={{ marginTop:8, display:'flex', gap:6 }}>
                        {m.actions.map((a,j)=><Btn key={j} t={t} size="sm" variant={j===0?'primary':'outline'} onClick={()=>go('calendar')}>{a}</Btn>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding:14, borderTop:`1px solid ${t.border}`, display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ flex:1, height:40, borderRadius:10, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, color:t.textFaint, background:t.surface }}>Ask about any policy, warranty or activity…</div>
                <div style={{ width:40, height:40, borderRadius:10, background:t.surface2, color:t.textMuted, display:'flex', alignItems:'center', justifyContent:'center' }}>📎</div>
                <div style={{ width:40, height:40, borderRadius:10, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>↑</div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12, overflow:'hidden' }}>
              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:16 }}>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:13 }}>Sources used</div>
                <div style={{ fontFamily:t.fontBody, fontSize:11, color:t.textFaint, marginTop:2 }}>What I read to answer this</div>
                <div style={{ marginTop:12 }}>
                  {[
                    {n:'Aviva Home Policy 2025.pdf', p:'p.3–5', m:'renewal, excess, cover'},
                    {n:'Aviva renewal letter.pdf', p:'p.1', m:'offered premium'},
                  ].map((s,i)=>(
                    <div key={i} onClick={()=>go('insurance/policy')} style={{ display:'flex', gap:10, padding:'10px 0', borderTop: i===0?'none':`1px solid ${t.border}`, cursor:'pointer' }}>
                      <div style={{ width:30, height:36, background:t.ins.light, color:t.ins.dark, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>PDF</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>{s.n}</div>
                        <div style={{ fontSize:11, color:t.textMuted, marginTop:1 }}>{s.p} · {s.m}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:16, flex:1 }}>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:13 }}>Try asking</div>
                {[
                  'When does Finn\'s dental check renew?',
                  'Is the dishwasher still under warranty?',
                  'Am I covered for accidental damage?',
                  'What\'s the total we pay in insurance a month?',
                ].map((q,i)=>(
                  <div key={i} style={{ marginTop:8, padding:'8px 10px', background:t.primarySurface, borderRadius:8, fontSize:12, color:t.text, cursor:'pointer' }}>{q}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function Settings({ t, onNav }) {
  const go = onNav || (()=>{});
  const d = DEMO;
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'flex', height:'100%' }}>
        <Sidebar t={t} active="settings" onNav={go}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <TopBar t={t} title="Settings" subtitle="Household, members & modules" onNav={go}/>
          <div style={{ flex:1, padding:'8px 24px 24px', display:'grid', gridTemplateColumns:'200px 1fr', gap:16, overflow:'hidden' }}>
            <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:12, height:'fit-content' }}>
              {['Household','Members','Modules','Notifications','Integrations','Data & Privacy','Billing'].map((s,i)=>(
                <div key={s} style={{ padding:'8px 10px', borderRadius:8, background: i===1?t.primarySurface:'transparent', color: i===1?t.primary:t.textMuted, fontSize:13, fontWeight: i===1?600:400, cursor:'pointer' }}>{s}</div>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16, overflow:'auto' }}>
              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:20 }}>
                <div style={{ display:'flex', alignItems:'baseline' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:16 }}>Members</div>
                    <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textMuted, marginTop:2 }}>Who's in the Harper household</div>
                  </div>
                  <Btn t={t} size="sm" variant="outline" onClick={()=>go('invite')}>+ Invite</Btn>
                </div>
                <div style={{ marginTop:16 }}>
                  {[...d.members, ...d.kids].map((m,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderTop: i===0?'none':`1px solid ${t.border}` }}>
                      <Avatar initials={m.initials} color={m.color} size={36} t={t}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:14 }}>{m.name}</div>
                        <div style={{ fontFamily:t.fontBody, fontSize:11, color:t.textMuted }}>{m.role}{m.age?` · ${m.age}`:''}</div>
                      </div>
                      <Badge t={t} bg={t.surface2} fg={t.textMuted}>{m.perm}</Badge>
                      <span style={{ color:t.textFaint }}><Ic.more s={16}/></span>
                    </div>
                  ))}
                  <div onClick={()=>go('invite')} style={{ padding:12, marginTop:8, border:`1px dashed ${t.borderStrong}`, borderRadius:10, color:t.textMuted, fontSize:12, textAlign:'center', cursor:'pointer' }}>+ Invite member</div>
                </div>
              </div>
              <div style={{ background:t.canvas, borderRadius:t.radiusLg, boxShadow:t.ring, padding:20 }}>
                <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:16 }}>Modules</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
                  {[
                    {n:'Home Chores', on:true, c:t.chores},
                    {n:'Kids Activities', on:true, c:t.kids},
                    {n:'Car Maintenance', on:true, c:t.car},
                    {n:'Insurance', on:true, c:t.ins},
                    {n:'Electronics', on:false, c:t.elec},
                  ].map(m=>(
                    <div key={m.n} style={{ padding:'10px 12px', borderRadius:10, background:m.c.light, color:m.c.dark, display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:13, flex:1 }}>{m.n}</span>
                      <div style={{ width:28, height:16, borderRadius:8, background: m.on?m.c.dark:t.border, position:'relative' }}>
                        <div style={{ position:'absolute', top:2, left: m.on?14:2, width:12, height:12, borderRadius:6, background:'#fff' }}/>
                      </div>
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

Object.assign(window, { Chat, Settings });
