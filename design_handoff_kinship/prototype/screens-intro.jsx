// Marketing, Auth, Onboarding — A-only, clickable.

function Marketing({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.canvas}>
      <div style={{ display:'flex', alignItems:'center', padding:'18px 40px', borderBottom:`1px solid ${t.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:t.fontDisplay, fontWeight:700, fontSize:15 }}>K</div>
          <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:18 }}>Kinship</div>
        </div>
        <div style={{ flex:1, display:'flex', gap:28, justifyContent:'center', fontFamily:t.fontBody, fontSize:13, color:t.textMuted }}>
          <span>Product</span><span>Modules</span><span>AI assistant</span><span>Pricing</span><span>Privacy</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn t={t} variant="ghost" size="sm" onClick={()=>go('auth')}>Sign in</Btn>
          <Btn t={t} size="sm" onClick={()=>go('auth')}>Get started</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:40, padding:'56px 64px 40px' }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:999, background:t.primarySurface, color:t.primary, fontSize:12, fontWeight:600, fontFamily:t.fontBody }}>
            <Ic.spark s={12}/> Your household, one place
          </div>
          <div style={{ fontFamily:t.fontDisplay, fontSize:56, fontWeight:600, letterSpacing:-1.4, lineHeight:1.05, marginTop:20, color:t.text }}>
            The family command<br/>centre, with a brain.
          </div>
          <div style={{ fontFamily:t.fontBody, fontSize:16, color:t.textMuted, marginTop:18, maxWidth:440, lineHeight:1.5 }}>
            Track chores, cars, insurance, warranties and kids' activities in one home.
            Upload a policy PDF — Kinship reads it, answers your questions, and turns the
            steps into tasks.
          </div>
          <div style={{ display:'flex', gap:10, marginTop:28 }}>
            <Btn t={t} size="lg" onClick={()=>go('auth')}>Start your household</Btn>
            <Btn t={t} variant="outline" size="lg">See how it works</Btn>
          </div>
          <div style={{ display:'flex', gap:16, marginTop:20, fontFamily:t.fontBody, fontSize:12, color:t.textFaint }}>
            <span>✓ GDPR · EU data</span><span>✓ Free for one household</span><span>✓ Web, iOS soon</span>
          </div>
        </div>

        <div style={{ position:'relative', height:420 }}>
          <div style={{ position:'absolute', left:30, top:20, right:0, background:t.canvas, borderRadius:16, boxShadow:t.ring, padding:16, transform:'rotate(-2deg)' }}>
            <div style={{ fontFamily:t.fontDisplay, fontSize:13, fontWeight:600, marginBottom:10 }}>This week</div>
            {[
              {c:t.chores.dot, l:'Take out recycling · 6pm'},
              {c:t.kids.dot, l:'Iris swimming · 4:30pm'},
              {c:t.car.dot, l:'Ford Focus MOT · Jun 14'},
              {c:t.ins.dot, l:'Aviva home renewal · Jul 3'},
            ].map((r,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:i<3?`1px solid ${t.border}`:'none' }}>
                <div style={{ width:8, height:8, borderRadius:4, background:r.c }}/>
                <div style={{ fontSize:12, color:t.text }}>{r.l}</div>
              </div>
            ))}
          </div>
          <div style={{ position:'absolute', right:0, bottom:0, width:300, background:t.canvas, borderRadius:16, boxShadow:t.float, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:22, height:22, borderRadius:11, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><Ic.spark s={12}/></div>
              <div style={{ fontFamily:t.fontDisplay, fontSize:13, fontWeight:600 }}>Kinship AI</div>
            </div>
            <div style={{ background:t.surface2, padding:'8px 10px', borderRadius:10, fontSize:12, color:t.text, marginBottom:8 }}>What do I need to do to renew home insurance?</div>
            <div style={{ background:t.primarySurface, padding:'10px 12px', borderRadius:10, fontSize:12, color:t.text, lineHeight:1.5 }}>
              From your Aviva PDF — 4 steps. Want me to add them to <b>Home Chores</b>?
              <div style={{ marginTop:10, display:'flex', gap:6 }}>
                <Btn t={t} size="sm">Add tasks</Btn>
                <Btn t={t} variant="outline" size="sm">Preview</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, padding:'8px 64px 24px' }}>
        {[
          {c:t.chores, n:'Chores', d:'Recurring, fair, done'},
          {c:t.kids,   n:'Kids', d:'Who takes them where'},
          {c:t.car,    n:'Car',  d:'MOT, tax, service'},
          {c:t.ins,    n:'Insurance', d:'Policies & renewals'},
          {c:t.elec,   n:'Electronics', d:'Warranties & manuals'},
        ].map((m,i)=>(
          <div key={i} style={{ padding:14, borderRadius:12, background:m.c.light, color:m.c.dark }}>
            <div style={{ fontFamily:t.fontDisplay, fontSize:14, fontWeight:600 }}>{m.n}</div>
            <div style={{ fontFamily:t.fontBody, fontSize:11, opacity:0.85, marginTop:2 }}>{m.d}</div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function Auth({ t, onNav }) {
  const go = onNav || (()=>{});
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', height:'100%' }}>
        <div style={{ background:t.primary, color:'#fff', padding:'40px 36px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
          <div onClick={()=>go('marketing')} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div style={{ width:26, height:26, borderRadius:8, background:'#fff', color:t.primary, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontFamily:t.fontDisplay }}>K</div>
            <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:17 }}>Kinship</div>
          </div>
          <div>
            <div style={{ fontFamily:t.fontDisplay, fontSize:30, fontWeight:600, letterSpacing:-0.8, lineHeight:1.1 }}>
              Welcome back to<br/>your household.
            </div>
            <div style={{ fontFamily:t.fontBody, fontSize:13, opacity:0.8, marginTop:12, maxWidth:260 }}>
              Chores, cars, insurance, kids — everything waiting where you left it.
            </div>
          </div>
          <div style={{ position:'absolute', bottom:-60, left:-40, width:220, height:220, borderRadius:'50%', background:t.kids.light, opacity:0.5 }}/>
          <div style={{ position:'absolute', top:120, right:-80, width:180, height:180, borderRadius:'50%', background:t.chores.light, opacity:0.35 }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
          <div style={{ width:'100%', maxWidth:320 }}>
            <div style={{ fontFamily:t.fontDisplay, fontSize:26, fontWeight:600, letterSpacing:-0.5 }}>Sign in</div>
            <div style={{ fontFamily:t.fontBody, fontSize:13, color:t.textMuted, marginTop:4, marginBottom:22 }}>to your Kinship account</div>

            <Btn t={t} variant="outline" full size="lg" onClick={()=>go('dash')} icon={<svg width={14} height={14} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.6-.2-2.4H12v4.5h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.7 3.2-8z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6L15.6 18c-1 .7-2.2 1.1-3.6 1.1-2.8 0-5.1-1.9-5.9-4.4H2.4v2.8C4.3 20.9 7.9 23 12 23z"/><path fill="#FBBC05" d="M6.1 14.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.9H2.4A11 11 0 0 0 1 12.6c0 1.7.4 3.3 1.4 4.7l3.7-2.7z"/><path fill="#EA4335" d="M12 6.1c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.3 2.9 14.8 2 12 2 7.9 2 4.3 4.1 2.4 7.4l3.7 2.8C6.9 7.9 9.2 6.1 12 6.1z"/></svg>}>Continue with Google</Btn>

            <div style={{ display:'flex', alignItems:'center', gap:8, margin:'20px 0', color:t.textFaint, fontSize:11 }}>
              <div style={{ flex:1, height:1, background:t.border }}/>or<div style={{ flex:1, height:1, background:t.border }}/>
            </div>

            <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textMuted, marginBottom:6 }}>Email</div>
            <div style={{ height:40, borderRadius:8, border:`1px solid ${t.border}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.canvas }}>ava@harper.fam</div>

            <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textMuted, marginTop:14, marginBottom:6, display:'flex' }}>Password <span style={{ flex:1 }}/><span style={{ color:t.primary, cursor:'pointer' }} onClick={()=>go('reset')}>Forgot?</span></div>
            <div style={{ height:40, borderRadius:8, border:`1px solid ${t.primary}`, boxShadow:`0 0 0 3px ${t.primarySurface}`, padding:'0 14px', display:'flex', alignItems:'center', fontSize:13, background:t.canvas, color:t.textFaint, letterSpacing:2 }}>••••••••••</div>

            <div style={{ marginTop:20 }}><Btn t={t} full size="lg" onClick={()=>go('dash')}>Sign in</Btn></div>

            <div style={{ textAlign:'center', marginTop:18, fontFamily:t.fontBody, fontSize:12, color:t.textMuted }}>
              New to Kinship? <span style={{ color:t.primary, fontWeight:600, cursor:'pointer' }} onClick={()=>go('onboarding')}>Create account</span>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function Onboarding({ t, onNav }) {
  const go = onNav || (()=>{});
  const steps = ['Household', 'Type', 'Modules', 'Members'];
  return (
    <Screen t={t} bg={t.surface}>
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:24, padding:24, height:'100%' }}>
        <div style={{ background:t.canvas, borderRadius:16, boxShadow:t.ring, padding:20, display:'flex', flexDirection:'column' }}>
          <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:16, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:22, height:22, borderRadius:6, background:t.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>K</div>
            Kinship
          </div>
          {steps.map((s,i)=>{
            const state = i < 2 ? 'done' : i === 2 ? 'active' : 'pending';
            const color = state === 'done' ? t.success : state === 'active' ? t.primary : t.textFaint;
            return (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', fontFamily:t.fontBody, fontSize:13, color:state==='active'?t.text:t.textMuted, fontWeight: state==='active'?600:400 }}>
                <div style={{ width:22, height:22, borderRadius:11, background: state==='done'?t.successSurface: state==='active'?t.primarySurface: t.surface2, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>
                  {state==='done' ? <Ic.check s={12}/> : i+1}
                </div>
                {s}
              </div>
            );
          })}
          <div style={{ flex:1 }}/>
          <div style={{ fontFamily:t.fontBody, fontSize:11, color:t.textFaint }}>Step 3 of 4</div>
        </div>

        <div style={{ background:t.canvas, borderRadius:t.radiusHero, boxShadow:t.ring, padding:48, display:'flex', flexDirection:'column' }}>
          <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textFaint, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase' }}>Step 3 of 4</div>
          <div style={{ fontFamily:t.fontDisplay, fontSize:30, fontWeight:600, letterSpacing:-0.6, marginTop:8 }}>Which modules do you need?</div>
          <div style={{ fontFamily:t.fontBody, fontSize:14, color:t.textMuted, marginTop:6, maxWidth:420 }}>
            Pick what your household actually tracks — you can add or remove any of these later from settings.
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:24 }}>
            {[
              { n:'Home Chores', d:'Tasks, recurring chores, reminders', c:t.chores, icon:<Ic.check s={18}/>, on:true },
              { n:'Kids Activities', d:'Schedules, school, sport, medical', c:t.kids, icon:<Ic.users s={18}/>, on:true },
              { n:'Car Maintenance', d:'MOT, tax, service, history', c:t.car, icon:<Ic.car s={18}/>, on:true },
              { n:'Insurance', d:'Policies, renewals, premium schedule', c:t.ins, icon:<Ic.shield s={18}/>, on:true },
              { n:'Electronics', d:'Warranties, manuals, expiry dates', c:t.elec, icon:<Ic.plug s={18}/>, on:false },
            ].map(m=>(
              <div key={m.n} style={{
                display:'flex', alignItems:'flex-start', gap:12,
                padding:'14px 14px', borderRadius:12,
                background: m.on ? t.primarySurface : t.canvas,
                boxShadow: m.on ? `0 0 0 2px ${t.primary}` : t.ring,
                cursor:'pointer',
              }}>
                <ModChip icon={m.icon} color={m.c.dark} bg={m.c.light} t={t}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:t.fontDisplay, fontWeight:600, fontSize:14 }}>{m.n}</div>
                  <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textMuted, marginTop:2 }}>{m.d}</div>
                </div>
                <div style={{
                  width:18, height:18, borderRadius:4,
                  background: m.on ? t.primary : 'transparent',
                  border: m.on ? 'none' : `1px solid ${t.borderStrong}`,
                  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, marginTop:2,
                }}>{m.on && <Ic.check s={12}/>}</div>
              </div>
            ))}
          </div>

          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            <Btn t={t} variant="ghost" size="lg" onClick={()=>go('auth')}>Back</Btn>
            <div style={{ flex:1 }}/>
            <div style={{ fontFamily:t.fontBody, fontSize:12, color:t.textFaint, alignSelf:'center' }}>4 modules selected</div>
            <Btn t={t} size="lg" onClick={()=>go('welcome')}>Continue</Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { Marketing, Auth, Onboarding });
