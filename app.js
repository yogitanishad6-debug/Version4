/* CareerSim — Sky Blue Edition */

const FAMILIES = [
  {id:"health", name:"Healthcare", mentor:"Dr. Aria"},
  {id:"tech", name:"Engineering & Tech", mentor:"Rian"},
  {id:"design", name:"Design & Creativity", mentor:"Zoya"},
  {id:"biz", name:"Business & Management", mentor:"Maya"},
  {id:"edu", name:"Education & Social", mentor:"Arjun"}
];

const MISSIONS = {
  health:[
    {id:'h1', title:'Triage a simple case', type:'scenario', steps:[
      {q:'A child has fever & stomachache. What do you do first?',
       opts:['Give rest','Ask more symptoms','Ignore'],
       correct:1, effects:{empathy:1,analysis:1}},
      {q:'Explain a simple care tip to a parent (1–2 lines):',
       opts:null, effects:{communication:2}}
    ]}
  ],

  tech:[
    {id:'t1', title:'Find the bug', type:'mini', steps:[
      {q:'A loop breaks at the last index. What will you check?',
       opts:['Index limit','Color value','Mood of computer'],
       correct:0, effects:{analysis:2}}
    ]}
  ],

  design:[
    {id:'d1', title:'Design a classroom tool', type:'task', steps:[
      {q:'Pick need: Storage / Writing / Play',
       opts:['Storage','Writing','Play'], correct:0,
       effects:{creativity:2}},
      {q:'Describe the design in one line:',
       opts:null, effects:{creativity:1}}
    ]}
  ]
};

const DEFAULT_SKILLS = {creativity:0,communication:0,analysis:0,empathy:0};
let state = { user:null, family:null, skills:{...DEFAULT_SKILLS}, badges:[], reflections:[], userAvatar:null };

const $ = id => document.getElementById(id);
const save = ()=> localStorage.setItem("careerSim_sky", JSON.stringify(state));
const load = ()=> { const s = localStorage.getItem("careerSim_sky"); if(s) state = JSON.parse(s); };

function init(){
  load();
  renderAvatars();
  renderFamilies();

  $("startBtn").onclick = start;
  $("quickDemo").onclick = quickDemo;
  $("closeModal").onclick = ()=> toggleModal(false);
  $("export").onclick = exportJSON;
  $("reset").onclick = resetAll;
  $("saveReflection").onclick = saveReflection;

  if(state.user) enterGame();
}

/* ---------- Onboard ---------- */

function renderAvatars(){
  const c = $("avatars"); c.innerHTML="";
  for(let i=1;i<=6;i++){
    const a=document.createElement("div");
    a.className="avatar";
    a.textContent="A"+i;
    a.onclick=()=>{
      document.querySelectorAll(".avatar").forEach(x=>x.classList.remove("selected"));
      a.classList.add("selected");
      state.userAvatar="A"+i; save();
    };
    if(state.userAvatar==="A"+i) a.classList.add("selected");
    c.appendChild(a);
  }
}

function renderFamilies(){
  const c = $("families"); c.innerHTML="";
  FAMILIES.forEach(f=>{
    const el=document.createElement("div");
    el.className="choice";
    el.textContent=f.name;
    el.onclick=()=>{
      document.querySelectorAll(".choice").forEach(x=>x.classList.remove("active"));
      el.classList.add("active");
      state.family=f.id; save();
      renderCity(); renderMissions();
      $("mentorText").textContent=`${f.mentor}: Ready with missions.`;
    };
    if(state.family===f.id) el.classList.add("active");
    c.appendChild(el);
  });
}

function start(){
  const name=$("name").value.trim();
  const birth=parseInt($("birth").value,10);
  if(!name || !birth || birth>2016){ alert("Enter valid name + birth year"); return; }
  if(!state.family){ alert("Pick a career family"); return; }
  state.user={name,birth};
  save(); enterGame();
}

function quickDemo(){
  state={user:{name:"Demo", birth:2010}, family:"tech", skills:{...DEFAULT_SKILLS}, badges:[], reflections:[], userAvatar:"A1"};
  save(); enterGame();
}

/* ---------- Game Screen ---------- */

function enterGame(){
  $("onboard").classList.add("hidden");
  $("game").classList.remove("hidden");

  $("userTag").textContent = `${state.user.name} • ${state.family}`;
  renderProfile();
  renderCity();
  renderMissions();
  updateFit();
}

function renderProfile(){
  $("profileName").textContent=state.user.name;
  $("profileMeta").textContent=`Born ${state.user.birth}`;
  $("avatarLarge").textContent=state.userAvatar || "A";

  const sk=$("skills"); sk.innerHTML="";
  Object.entries(state.skills).forEach(([k,v])=>{
    const div=document.createElement("div");
    div.className="skillItem";
    div.innerHTML=`
      <strong>${k}</strong>
      <div class="skillBar"><div class="skillFill" id="fill-${k}" style="width:${v*10}%"></div></div>
    `;
    sk.appendChild(div);
  });

  const bd=$("badges"); bd.innerHTML="";
  state.badges.forEach(b=>{
    const tag=document.createElement("div");
    tag.className="badge";
    tag.textContent=b;
    bd.appendChild(tag);
  });
}

function renderCity(){
  const city=$("city"); city.innerHTML="";
  FAMILIES.forEach(f=>{
    const b=document.createElement("div");
    b.className="building";
    b.innerHTML=`${f.name.split(" ")[0]}`;
    if(f.id===state.family) b.classList.add("active");

    b.onclick=()=>{
      state.family=f.id;
      save();
      renderCity();
      renderMissions();
      updateFit();
      $("mentorText").textContent=`${f.mentor}: Missions ready.`;
    };
    city.appendChild(b);
  });
}

function renderMissions(){
  const list=$("missionList"); list.innerHTML="";
  const pool=MISSIONS[state.family] || [];

  pool.forEach(m=>{
    const card=document.createElement("div");
    card.className="missionCard";
    card.innerHTML=`
      <div><strong>${m.title}</strong><div class="meta">${m.type}</div></div>
      <button class="btn primary" data-id="${m.id}">Start</button>
    `;
    list.appendChild(card);

    card.querySelector("button").onclick=()=>startMission(m);
  });
}

/* ---------- Mission Modal ---------- */

function startMission(m){
  let step=0;
  const steps=m.steps;

  const renderStep=()=>{
    if(step>=steps.length){
      toggleModal(true, `
        <h3>Mission Complete 🎉</h3>
        <p>You finished <strong>${m.title}</strong>.</p>
        <button id="closeOk" class="btn primary">Close</button>
      `);
      $("closeOk").onclick=()=>{
        toggleModal(false);
        if(!state.badges.includes(m.title)) state.badges.push(m.title);
        save(); renderProfile(); updateFit();
      };
      return;
    }

    const s=steps[step];
    let html=`<h3>${m.title}</h3><p>${s.q}</p>`;

    if(s.opts){
      html += s.opts.map((o,i)=>`<button class="btn secondary opt" data-i="${i}" style="margin:6px">${o}</button>`).join('');
    } else {
      html += `
        <textarea id="resp" placeholder="Write 1–2 lines"></textarea>
        <button id="sendText" class="btn primary" style="margin-top:10px">Submit</button>
      `;
    }

    toggleModal(true, html);

    document.querySelectorAll(".opt").forEach(btn=>{
      btn.onclick=()=>{
        const chosen=parseInt(btn.dataset.i,10);
        const mult = chosen===s.correct ? 1 : 0.6;
        applyEffects(s.effects,mult);
        step++; save(); renderProfile(); updateFit(); renderStep();
      };
    });

    const send=$("sendText");
    if(send){
      send.onclick=()=>{
        applyEffects(s.effects,1);
        step++; save(); renderProfile(); updateFit(); renderStep();
      };
    }
  };

  renderStep();
}

/* ---------- Effects ---------- */

function applyEffects(effects, mult){
  Object.entries(effects).forEach(([k,v])=>{
    state.skills[k] = (state.skills[k] || 0) + Math.round(v*mult);
  });

  // skill-based badges
  if(state.skills.analysis>=3 && !state.badges.includes("Analytical")) state.badges.push("Analytical");
  if(state.skills.creativity>=3 && !state.badges.includes("Creative")) state.badges.push("Creative");
  if(state.skills.empathy>=3 && !state.badges.includes("Caring")) state.badges.push("Caring");

  save();
}

/* ---------- Fit Score ---------- */

function updateFit(){
  const w={
    health:{empathy:0.5,analysis:0.3,communication:0.2},
    tech:{analysis:0.6,creativity:0.2,communication:0.2},
    design:{creativity:0.6,communication:0.2,analysis:0.2},
    biz:{communication:0.4,analysis:0.4,creativity:0.2},
    edu:{communication:0.4,empathy:0.4,analysis:0.2}
  }[state.family] || {};

  let score=0;
  Object.entries(w).forEach(([k,wk])=>{
    score += (state.skills[k]||0)*wk;
  });

  $("fitScore").textContent = Math.min(100, Math.round(score*8)) + "%";

  // update skill bars
  Object.keys(state.skills).forEach(k=>{
    const el=$("fill-"+k);
    if(el) el.style.width=(state.skills[k]*10)+"%";
  });
}

/* ---------- Other ---------- */

function toggleModal(show,html=""){
  const modal=$("modal");
  if(show){
    $("modalContent").innerHTML=html;
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
    $("modalContent").innerHTML="";
  }
}

function exportJSON(){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(
    [JSON.stringify(state,null,2)],
    {type:"application/json"}
  ));
  a.download=`${state.user?.name || "profile"}-careerSim.json`;
  a.click();
}

function resetAll(){
  if(confirm("Reset everything?")){
    localStorage.removeItem("careerSim_sky");
    location.reload();
  }
}

function saveReflection(){
  const t=$("reflection").value.trim();
  if(!t) return alert("Write something!");
  state.reflections.push({text:t, date:new Date().toISOString()});
  save(); $("reflection").value=""; alert("Saved!");
}

init();
