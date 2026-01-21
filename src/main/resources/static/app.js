const API_BASE = "http://localhost:8081/api";

const el = (id) => document.getElementById(id);

let ticketsCache = [];
let selectedTicketId = null;
const modal = document.getElementById("modal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancel = document.getElementById("btnCancel");
const btnNewTicket = document.getElementById("btnNewTicket");

async function apiHealth() {
  try {
    const r = await fetch(`${API_BASE}/tickets`);
    if (!r.ok) throw new Error("bad");
    el("apiStatus").textContent = "API: OK";
    el("apiStatus").style.borderColor = "rgba(34,197,94,0.35)";
    el("apiStatus").style.background = "rgba(34,197,94,0.14)";
  } catch {
    el("apiStatus").textContent = "API: OFF";
    el("apiStatus").style.borderColor = "rgba(239,68,68,0.35)";
    el("apiStatus").style.background = "rgba(239,68,68,0.14)";
  }
}

function badgeStatus(status){
  const map = {
    OPEN: { label: "OPEN", cls: "blue" },
    IN_PROGRESS: { label: "IN PROGRESS", cls: "blue" },
    DONE: { label: "DONE", cls: "green" }
  };
  return map[status] || { label: status, cls: "" };
}

function badgePriority(p){
  const map = {
    LOW: { label: "LOW", cls: "" },
    MEDIUM: { label: "MEDIUM", cls: "blue" },
    HIGH: { label: "HIGH", cls: "red" }
  };
  return map[p] || { label: p, cls: "" };
}

function fmtDate(iso){
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

function renderTickets(list){
  const wrap = el("tickets");
  wrap.innerHTML = "";

  if (!list.length){
    wrap.innerHTML = `<div class="empty">
      <div class="empty-icon">📭</div>
      <div class="empty-title">No hay tickets</div>
      <div class="empty-sub">Crea uno con “Nuevo ticket”.</div>
    </div>`;
    return;
  }

  for (const t of list){
    const st = badgeStatus(t.status);
    const pr = badgePriority(t.priority);

    const card = document.createElement("div");
    card.className = "ticket" + (t.id === selectedTicketId ? " active" : "");
    card.innerHTML = `
      <div class="badge-row">
        <span class="badge ${st.cls}">${st.label}</span>
        <span class="badge ${pr.cls}">${pr.label}</span>
        <span class="badge">${(t.category || "General").toUpperCase()}</span>
      </div>
      <div class="ticket-top">
        <div>
          <div class="ticket-title">${escapeHtml(t.title || "Sin título")}</div>
          <div class="ticket-meta">#${t.id} · ${fmtDate(t.createdAt)}</div>
        </div>
      </div>
    `;
    card.addEventListener("click", () => selectTicket(t.id));
    wrap.appendChild(card);
  }
}

function getFilters(){
  const status = el("filterStatus").value.trim();
  const priority = el("filterPriority").value.trim();
  const search = el("search").value.trim().toLowerCase();
  return { status, priority, search };
}

function applyFilters(){
  const { status, priority, search } = getFilters();

  const filtered = ticketsCache.filter(t => {
    if (status && t.status !== status) return false;
    if (priority && t.priority !== priority) return false;
    if (search && !(t.title || "").toLowerCase().includes(search)) return false;
    return true;
  });

  renderTickets(filtered);
}

async function fetchTickets(){
  const r = await fetch(`${API_BASE}/tickets`);
  if (!r.ok) throw new Error("No se pudieron cargar tickets");
  ticketsCache = await r.json();
  ticketsCache.sort((a,b) => (b.id ?? 0) - (a.id ?? 0));
  applyFilters();
}

async function fetchTicket(id){
  const r = await fetch(`${API_BASE}/tickets/${id}`);
  if (!r.ok) throw new Error("No se pudo cargar el ticket");
  return await r.json();
}

async function fetchComments(id){
  const r = await fetch(`${API_BASE}/tickets/${id}/comments`);
  if (!r.ok) return []; 
  return await r.json();
}

async function createTicket(payload){
  const r = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  if (!r.ok){
    const txt = await r.text();
    throw new Error(txt || "Error creando ticket");
  }
  return await r.json();
}

async function updateStatus(id, status){
  const r = await fetch(`${API_BASE}/tickets/${id}/status`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ status })
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}

async function addComment(id, payload){
  const r = await fetch(`${API_BASE}/tickets/${id}/comments`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  if (!r.ok){
    const txt = await r.text();
    throw new Error(txt || "Error creando comentario");
  }
  return await r.json();
}

async function selectTicket(id){
  selectedTicketId = id;
  applyFilters();

  el("detailEmpty").classList.add("hidden");
  el("detail").classList.remove("hidden");

  const t = await fetchTicket(id);
  const comments = await fetchComments(id);

  // badges
  const st = badgeStatus(t.status);
  const pr = badgePriority(t.priority);
  el("detailBadges").innerHTML = `
    <span class="badge ${st.cls}">${st.label}</span>
    <span class="badge ${pr.cls}">${pr.label}</span>
    <span class="badge">${(t.category || "General").toUpperCase()}</span>
    <span class="badge">#${t.id}</span>
  `;

  el("detailTitle").textContent = t.title || "Sin título";
  el("detailMeta").textContent = `Creado: ${fmtDate(t.createdAt)} · Última actualización: ${fmtDate(t.updatedAt)}`;
  el("detailDesc").textContent = t.description || "";

  el("editStatus").value = t.status || "OPEN";
  el("editPriority").value = t.priority || "MEDIUM";

  renderComments(comments);
}

function renderComments(list){
  const wrap = el("comments");
  wrap.innerHTML = "";
  el("commentCount").textContent = String(list.length);

  if (!list.length){
    wrap.innerHTML = `<div class="muted">Aún no hay comentarios.</div>`;
    return;
  }

  // orden por fecha asc
  list.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  for (const c of list){
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <div class="comment-top">
        <span>Comentario</span>
        <span>${fmtDate(c.createdAt)}</span>
      </div>
      <div class="comment-msg">${escapeHtml(c.message || "")}</div>
    `;
    wrap.appendChild(div);
  }
}

function openModal(){
  el("modal").classList.remove("hidden");
  modal.classList.remove("hidden");
}
function closeModal(){
  el("modal").classList.add("hidden");
  el("toast").classList.add("hidden");
  el("ticketForm").reset();
   modal.classList.add("hidden");
}

function showToast(msg){
  const t = el("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// EVENTS
el("btnNewTicket").addEventListener("click", openModal);
el("btnCloseModal").addEventListener("click", closeModal);
el("btnCancel").addEventListener("click", closeModal);

el("modal").addEventListener("click", (e) => {
  if (e.target === el("modal")) closeModal();
});

el("filterStatus").addEventListener("change", applyFilters);
el("filterPriority").addEventListener("change", applyFilters);
el("search").addEventListener("input", applyFilters);

el("ticketForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  const payload = {
    title: fd.get("title"),
    description: fd.get("description"),
    category: fd.get("category"),
    priority: fd.get("priority")
  };

  try{
    const created = await createTicket(payload);
    closeModal();
    await fetchTickets();
    await selectTicket(created.id);
  }catch(err){
    showToast(err.message || "Error creando ticket");
  }
});

el("btnSaveTicket").addEventListener("click", async () => {
    console.log("CLICK GUARDAR", selectedTicketId);

    if (!selectedTicketId) return;

    try{
      const status = el("editStatus").value;
      console.log("STATUS A ENVIAR:", status);

      await updateStatus(selectedTicketId, status);

      await fetchTickets();
      await selectTicket(selectedTicketId);
    }catch(err){
      console.error(err);
      alert(err.message || "Error actualizando ticket");
    }
});

el("commentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedTicketId) return;

  const msg = el("commentMessage").value.trim();
  if (!msg) return;

  try{
    await addComment(selectedTicketId, { message: msg });
    el("commentMessage").value = "";
    // recargar comments
    const comments = await fetchComments(selectedTicketId);
    renderComments(comments);
  }catch(err){
    alert(err.message || "Error creando comentario");
  }
});

// INIT
(async function init(){
  await apiHealth();
  try{
    await fetchTickets();
  }catch(err){
    
    el("tickets").innerHTML = `<div class="empty">
      <div class="empty-icon">⚠️</div>
      <div class="empty-title">No se pudo conectar a la API</div>
      <div class="empty-sub">Revisa que Spring esté corriendo en :8081 y que existan endpoints /api/tickets.</div>
    </div>`;
  }
})();

