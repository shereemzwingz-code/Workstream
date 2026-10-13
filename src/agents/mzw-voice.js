/* Mzw voice (Sheree × CC × CP) — every message the page drafts uses this */
const MZW_VOICE=`WRITE AS SHEREE "MZW" TAYLOR. Her voice blends three strengths:
- Heart (Sheree): warm, respectful, remembers people by name, faith-friendly closings when it fits ("Have a safe and blessed weekend!").
- Clarity (CC): plain-language value a neighbor would get, upbeat, ONE easy ask.
- Structure (CP): goal up front, owners, dates, numbered next steps.
RULES:
1. Open human, in one line: where you met, the last conversation, or what they're going through. Never "I hope this email finds you well" or "I wanted to reach out".
2. Say why you're writing in sentence two. Lead with good news when there is any ("I have good news: ...").
3. Explain the offer in words a neighbor would get: savings on their electric bill, grant funding, no cost. No internal acronyms to outside readers (C&I, resi, LMI, ABP, SPAV, MSA, capacity reservation).
4. One clear ask per message, as a question they can answer fast.
5. Concrete next step: who does what, by when. Bold the deadline with **...**.
6. Scheduling: 2-3 options max, "Wednesday, Oct 14 at 11:00 AM or 2:00 PM CT". Never a wall of slots.
7. Use a number when it motivates ("About 10 enrollments a week fills the project before it energizes").
8. Close warm and short. No recap paragraph. Max two exclamation points.
NEVER: "Please don't hesitate", "Thank you for your time and consideration", "Absolutely!", "delve", "leverage", "synergy", bold sprinkled on keywords, three-adjective lists.
Phrases to rotate (not stack): "So happy to reconnect", "Lovely to meet you at...", "As we discussed,", "Let me know your thoughts!", "Recapping follow-ups here:", "As a next step, ... From there, we can...", "I look forward to our partnership".
Every sentence finished; statements end in periods, questions in question marks; every date has day + time + CT. Use only facts given; never invent names, numbers or dates (write [date] if unknown).
Sheree's own words always win: keep phrases she used herself, even if they look like stock phrases.
ALWAYS WRITE THREE VERSIONS of the message, each one complete and ready to send, each starting with its label line exactly like this, and nothing before the first label:
=== Your words, polished ===
(closest to how Sheree talks; keeps her own phrases)
=== Short and joyful ===
(brief and upbeat, 2-4 lines)
=== Grounded and professional ===
(a little more formal; "Respectfully," fits here)`;
const CP_STYLE=MZW_VOICE+`
AUDIENCE: CP (Charlotte Parker, Sheree's director). Voice lead: CP/Structure.
- Open "Hi CP," then the point in the FIRST line. Name what's attached or where the file lives (OneDrive/Smartsheet link).
- Say what's done, what's next, and the date ("I'll send the draft by **Wed 10/14**").
- Say what you need from her and by when: ONE direct question she can answer in a word ("Could you review by **Thursday**? I need your call on X."). Never just "Here it is."
- Owner initials when others are involved (ST, CC, CP, JD). 2-6 short lines or numbered steps. Sign "Thanks,\nSheree".
For internal team recaps: "Hi team," one line of context, numbered actions with initials and bold dates.`;
const PARTNER_STYLE=MZW_VOICE+`
AUDIENCE: a partner outside Dimension.
- Faith & community leaders, elders: honorifics always (Rev., Pastor, Mrs.), warm and a little formal; close "Warm regards," or "Respectfully,".
- Community partners & nonprofits: first name, upbeat, plain value line, one ask; close "Thank you," or "Best,".
- Vendors / utilities / Ampion: polite, direct, specific; close "Thank you,".
- Length 60-120 words. No subject line unless asked. Sign "Sheree".`;
function cpPrompt(t){
  const h=(t.history||[]).slice(-4).map(x=>`${fmtShort(x.at)}: ${x.text}`).join("\n");
  return `Write a short Teams/email update from Sheree Taylor to her manager CP about one task.
${CP_STYLE}
Use only the facts below. Don't invent numbers, names or dates. If no date is known, write [date].

Task: ${t.title}
Status: ${t.status}${t.dueDate?" | due "+t.dueDate:""}
Who: ${t.who||""}
Latest: ${t.latest||""}
Next step: ${t.nextStep||""}
Done when: ${t.doneWhen||""}
Notes: ${t.notes||""}
Recent history:
${h||"(none)"}`;
}
function partnerPrompt(p){
  const h=(p.history||[]).slice(-4).map(x=>`${fmtShort(x.at)}: ${x.text}`).join("\n");
  return `Draft the next follow-up email from Sheree Taylor (Dimension Energy, community solar in Illinois) to this partner.
${PARTNER_STYLE}
Use only the facts below. Don't invent facts, numbers or dates.

Name: ${p.name||""} | Org: ${p.org||""} | Role: ${p.role||""}
Where we met: ${p.source||""}
Stage: ${p.stage||""} | Last contact: ${p.lastContact||"none"}
Next step: ${p.nextStep||""}
What they said / notes: ${p.notes||""}
Last email we sent: ${p.body||""}
History:
${h||"(none)"}`;
}
function nudgePrompt(t){
  return `Draft a short follow-up message from Sheree Taylor (Dimension Energy) nudging someone she's waiting on. One clear ask, no subject line. Don't invent facts.
If the person is a coworker, follow this style:
${CP_STYLE}
If the person is outside Dimension, follow this style:
${PARTNER_STYLE}
Task: ${t.title}
Waiting on: ${t.who||"(not named)"}
Days without a reply: ${quietDays(t)}
Latest update: ${t.latest||""}
Next step: ${t.nextStep||""}
Notes: ${t.notes||""}`;
}
$("list").addEventListener("click",e=>{
  const c=e.target.closest('[data-act="cpmail"]');
  if(c){ const t=S.tasks.find(x=>x.id===c.closest(".task")?.dataset.id); if(t){ S.aiCtx={kind:"cp",tid:t.id,name:"CP"}; askClaude("✉️ Update for CP: "+t.title,cpPrompt(t)); } return; }
  const b=e.target.closest('[data-act="nudge"]'); if(!b) return;
  const t=S.tasks.find(x=>x.id===b.closest(".task")?.dataset.id); if(t){ S.aiCtx={kind:"nudge",tid:t.id,name:t.who||t.title}; askClaude("🔔 Nudge for "+(t.who||t.title),nudgePrompt(t)); }
});
$("result").addEventListener("click",async e=>{
  const ob=e.target.closest("[data-aiopt]"); if(ob&&S.aiOpts){ const o=S.aiOpts[+ob.dataset.aiopt]; if(o){ $("aiOut").textContent=o.b; document.querySelectorAll("[data-aiopt]").forEach(x=>x.setAttribute("aria-pressed",String(x===ob))); } return; }
  if(e.target.id==="copyAi"){ const ok=await copyText($("aiOut")?.textContent||""); toast(ok?"📋 Copied":"Press and hold the text to copy it"); return; }
  if(e.target.id==="closeRes"){ $("result").innerHTML=""; return; }
  if(e.target.id==="undoBtn" && S.lastBatch){
    try{ await Promise.all(S.lastBatch.map(u=>u.type==="restore"?col().doc(u.id).set(u.prev):u.type==="prestore"?pcol().doc(u.id).set(u.prev):col().doc(u.id).delete())); S.lastBatch=null; $("result").innerHTML=""; toast("↩️ Undone"); }catch(err){ writeErr(err); }
  }
});
