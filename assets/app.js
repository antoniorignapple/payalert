/* =========================================================
   PayAlert v2 — app.js  (no-build, vanilla)
   Works in two modes:
     - REAL  : talks to /api/* + localStorage device id + Web Push
     - DEMO  : in-memory data, no network/localStorage (live preview)
   Toggle with: window.PAYALERT_DEMO = true
   ========================================================= */
(function () {
  "use strict";

  var DEMO = !!window.PAYALERT_DEMO;
  var VAPID_PUBLIC_KEY = window.PAYALERT_VAPID ||
    "BCHtq2xDB0GnAahvOEg4CMz3DV-5e8uf0Va57Qc5soe0nhEEI-XvIH0qIApAK7xS51zfFIjfP0N1yOnV259FZQ";

  /* ---------- tiny helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8; return v.toString(16);
    });
  }

  var MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  var MONTHS_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

  /* SVG icon set */
  var ICON = {
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
    chevL:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevR:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>',
    install:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m0 12-4-4m4 4 4-4"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>'
  };

  /* ---------- device id (FISSO e permanente) ----------
     Personale, mono-dispositivo: l'id e' bloccato a una costante.
     Cosi' resta SEMPRE lo stesso anche dopo disinstalla/reinstalla
     (iOS cancella il localStorage quando rimuovi la PWA dalla Home,
     quindi un id casuale si perderebbe: questo no). */
  var FIXED_DEVICE_ID = "872e2339-50dc-4f23-92ba-d2599c7b51ff";
  var deviceId;
  if (DEMO) { deviceId = "demo-device"; }
  else {
    deviceId = FIXED_DEVICE_ID;
    try { localStorage.setItem("payalert_device_id", FIXED_DEVICE_ID); } catch (e) {}
  }

  /* ---------- state ---------- */
  var now = new Date();
  var state = {
    year: now.getFullYear(),
    month: now.getMonth(),         // 0-11
    filter: "all",                 // all | due | paid
    payments: [],
    loading: true,
    pushOn: false
  };

  /* ---------- API layer ---------- */
  var DEMO_DATA = [];
  function seedDemo() {
    var y = state.year, m = state.month;
    function d(yr, mo, day) { return yr + "-" + String(mo + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0"); }
    DEMO_DATA = [
      { id: uuid(), title: "Affitto appartamento", due_date: d(y, m, 5), amount_cents: 95000, notes: "Bonifico IBAN", is_paid: true },
      { id: uuid(), title: "Bolletta Enel", due_date: d(y, m, Math.min(now.getDate(), 28)), amount_cents: 13480, notes: "Domiciliata", is_paid: false },
      { id: uuid(), title: "Netflix", due_date: d(y, m, 12), amount_cents: 1299, notes: "", is_paid: now.getDate() > 12 },
      { id: uuid(), title: "Assicurazione auto", due_date: d(y, m, 22), amount_cents: 41500, notes: "Rata semestrale", is_paid: false },
      { id: uuid(), title: "Rata mutuo", due_date: d(y, m, 28), amount_cents: 62000, notes: "", is_paid: false },
      { id: uuid(), title: "Palestra", due_date: d(y, m, 1), amount_cents: 4900, notes: "", is_paid: true },
      { id: uuid(), title: "Tassa rifiuti TARI", due_date: d(y, m + 1, 16), amount_cents: 18000, notes: "1ª rata", is_paid: false },
      { id: uuid(), title: "Spotify", due_date: d(y, m - 1 < 0 ? y - 1 + 0 : y, (m + 11) % 12, 9), amount_cents: 1099, notes: "", is_paid: true }
    ];
  }
  if (DEMO) seedDemo();

  function api(path, opts) {
    return fetch("/api" + path, opts).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Errore"); return j; });
    });
  }
  var DB = {
    list: function () {
      if (DEMO) return Promise.resolve(DEMO_DATA.slice());
      return api("/payments?device_id=" + encodeURIComponent(deviceId));
    },
    create: function (p) {
      if (DEMO) { var n = Object.assign({ id: uuid(), is_paid: false }, p); DEMO_DATA.push(n); return Promise.resolve(n); }
      return api("/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ device_id: deviceId }, p)) });
    },
    update: function (id, p) {
      if (DEMO) { var it = DEMO_DATA.find(function (x) { return x.id === id; }); if (it) Object.assign(it, p); return Promise.resolve(it); }
      return api("/payments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ id: id, device_id: deviceId }, p)) });
    },
    remove: function (id) {
      if (DEMO) { DEMO_DATA = DEMO_DATA.filter(function (x) { return x.id !== id; }); return Promise.resolve({ success: true }); }
      return api("/payments?id=" + encodeURIComponent(id) + "&device_id=" + encodeURIComponent(deviceId), { method: "DELETE" });
    }
  };

  /* ---------- date / money utils ---------- */
  function todayMid() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function parseDue(s) { return new Date(s + "T00:00:00"); }
  function daysUntil(s) { return Math.round((parseDue(s) - todayMid()) / 86400000); }
  function fmtMoney(cents) {
    if (cents == null || cents === "") return null;
    return (cents / 100).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function monthKey(y, m) { return y + "-" + String(m + 1).padStart(2, "0"); }
  function inMonth(p, y, m) { return (p.due_date || "").indexOf(monthKey(y, m)) === 0; }

  function statusOf(p) {
    if (p.is_paid) return { k: "done", t: "Pagato" };
    var d = daysUntil(p.due_date);
    if (d < 0) return { k: "overdue", t: d === -1 ? "Ieri" : "Scaduto " + (-d) + "g" };
    if (d === 0) return { k: "today", t: "Oggi" };
    if (d === 1) return { k: "soon", t: "Domani" };
    if (d <= 7) return { k: "soon", t: "Tra " + d + " giorni" };
    return { k: "future", t: "Tra " + d + " giorni" };
  }

  /* ===================================================
     RENDER
     =================================================== */
  function monthPayments() {
    var arr = state.payments.filter(function (p) { return inMonth(p, state.year, state.month); });
    arr.sort(function (a, b) {
      if (a.is_paid !== b.is_paid) return a.is_paid ? 1 : -1;
      return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
    });
    if (state.filter === "due") arr = arr.filter(function (p) { return !p.is_paid; });
    if (state.filter === "paid") arr = arr.filter(function (p) { return p.is_paid; });
    return arr;
  }

  function renderHeader() {
    $("#monthName").innerHTML = "<b>" + MONTHS[state.month] + "</b>";
    $("#monthSub").textContent = state.year + (state.year === now.getFullYear() && state.month === now.getMonth() ? " · Mese corrente" : "");
  }

  function renderSummary() {
    var all = state.payments.filter(function (p) { return inMonth(p, state.year, state.month); });
    var total = 0, paidSum = 0, dueCount = 0, paidCount = 0;
    all.forEach(function (p) {
      var c = p.amount_cents || 0; total += c;
      if (p.is_paid) { paidSum += c; paidCount++; } else dueCount++;
    });
    var dueSum = total - paidSum;
    $("#sumTotal").innerHTML = '<span class="cur">€</span>' + (fmtMoney(dueSum) || "0,00");
    $("#sumCount").textContent = all.length;
    $("#sumDue").textContent = dueCount;
    $("#sumPaid").textContent = paidCount;
    var pct = total > 0 ? Math.round((paidSum / total) * 100) : 0;
    $("#sumBar").style.width = pct + "%";
    $("#filtAllC").textContent = all.length;
    $("#filtDueC").textContent = dueCount;
    $("#filtPaidC").textContent = paidCount;
  }

  function paymentCard(p, idx) {
    var st = statusOf(p);
    var due = parseDue(p.due_date);
    var wrap = el("div", "card-wrap in");
    wrap.style.animationDelay = Math.min(idx * 35, 280) + "ms";
    wrap.innerHTML = '<div class="card-del">' + ICON.trash + 'Elimina</div>';

    var card = el("div", "card s-" + st.k + (p.is_paid ? " paid" : ""));
    card.dataset.id = p.id;
    var amt = fmtMoney(p.amount_cents);
    card.innerHTML =
      '<div class="daypill"><span class="d">' + String(due.getDate()).padStart(2, "0") + '</span><span class="m">' + MONTHS_SHORT[due.getMonth()] + '</span></div>' +
      '<div class="body">' +
        '<div class="title">' + escapeHtml(p.title) + '</div>' +
        '<div class="sub"><span class="status ' + st.k + '">' + st.t + '</span>' +
          (p.notes ? '<span class="note">' + escapeHtml(p.notes) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="right">' +
        (amt ? '<div class="amount"><span class="cur">€</span>' + amt + '</div>' : '<div class="amount none">—</div>') +
        '<div class="check' + (p.is_paid ? ' on' : '') + '">' + ICON.check + '</div>' +
      '</div>';

    // paid toggle
    $(".check", card).addEventListener("click", function (e) {
      e.stopPropagation(); togglePaid(p, card);
    });
    // tap → edit
    card.addEventListener("click", function () { if (!card._swiped) openSheet(p); });

    attachSwipe(card, wrap, p);
    wrap.appendChild(card);
    return wrap;
  }

  function renderList() {
    var list = $("#list"); list.innerHTML = "";
    if (state.loading) { for (var i = 0; i < 4; i++) list.appendChild(el("div", "skel")); return; }
    var items = monthPayments();
    if (!items.length) {
      var hasAny = state.payments.filter(function (p) { return inMonth(p, state.year, state.month); }).length;
      var e = el("div", "empty");
      e.innerHTML = '<div class="ico">' + ICON.inbox + '</div>' +
        '<h3>' + (hasAny ? "Nessun risultato" : "Mese libero") + '</h3>' +
        '<p>' + (hasAny ? "Nessun pagamento per questo filtro." : "Non hai pagamenti per " + MONTHS[state.month] + ".<br>Aggiungine uno per iniziare.") + '</p>' +
        (hasAny ? '' : '<span class="cta" id="emptyAdd">+ Aggiungi pagamento</span>');
      list.appendChild(e);
      var ea = $("#emptyAdd"); if (ea) ea.addEventListener("click", function () { openSheet(null); });
      return;
    }
    items.forEach(function (p, i) { list.appendChild(paymentCard(p, i)); });
  }

  function renderMonths() {
    var box = $("#months"); box.innerHTML = "";
    $("#yearLbl").textContent = state.year;
    for (var m = 0; m < 12; m++) {
      (function (m) {
        var cnt = state.payments.filter(function (p) { return inMonth(p, state.year, m); });
        var dueCnt = cnt.filter(function (p) { return !p.is_paid; }).length;
        var isCurrent = (state.year === now.getFullYear() && m === now.getMonth());
        var row = el("div", "mrow" + (m === state.month ? " active" : "") + (isCurrent ? " current" : ""));
        row.innerHTML = '<span class="mn">' + MONTHS[m] + '</span>' +
          (isCurrent ? '<span class="today-pip"></span>' : '') +
          (cnt.length ? '<span class="dot">' + (dueCnt || cnt.length) + '</span>' : '<span class="dot"></span>');
        row.addEventListener("click", function () { state.month = m; closeDrawer(); rerenderAll(); haptic(6); });
        box.appendChild(row);
      })(m);
    }
  }

  function rerenderAll() { renderHeader(); renderSummary(); renderList(); renderMonths(); }

  function escapeHtml(s) { return (s || "").replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  /* ===================================================
     ACTIONS
     =================================================== */
  function togglePaid(p, card) {
    var nv = !p.is_paid; p.is_paid = nv; haptic(10);
    var chk = $(".check", card); if (chk) chk.classList.toggle("on", nv);
    card.classList.toggle("paid", nv);
    DB.update(p.id, { is_paid: nv }).then(function () { renderSummary(); renderMonths(); if (state.filter !== "all") setTimeout(renderList, 220); })
      .catch(function (err) { p.is_paid = !nv; toast(err.message, "err"); renderList(); });
  }

  function removePayment(p, wrap) {
    wrap.style.transition = "height .3s, opacity .25s, margin .3s, transform .3s";
    var h = wrap.offsetHeight; wrap.style.height = h + "px"; void wrap.offsetHeight;
    wrap.style.height = "0px"; wrap.style.opacity = "0"; wrap.style.marginBottom = "0px";
    state.payments = state.payments.filter(function (x) { return x.id !== p.id; });
    DB.remove(p.id).then(function () { toast("Pagamento eliminato", "ok"); renderSummary(); renderMonths(); })
      .catch(function (err) { toast(err.message, "err"); load(); });
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 320);
  }

  /* ===================================================
     SWIPE-TO-DELETE on cards
     =================================================== */
  function attachSwipe(card, wrap, p) {
    var x0 = 0, y0 = 0, dx = 0, active = false, decided = false, horiz = false;
    var TH = -88; // reveal threshold
    card.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; active = true; decided = false; horiz = false;
      card.classList.add("dragging"); card._swiped = false;
    }, { passive: true });
    card.addEventListener("touchmove", function (e) {
      if (!active) return;
      var cx = e.touches[0].clientX, cy = e.touches[0].clientY;
      var ddx = cx - x0, ddy = cy - y0;
      if (!decided) { decided = true; horiz = Math.abs(ddx) > Math.abs(ddy) + 4; }
      if (!horiz) { active = false; card.classList.remove("dragging"); card.style.transform = ""; return; }
      dx = Math.min(0, ddx);
      if (dx < -8) card._swiped = true;
      card.style.transform = "translateX(" + dx + "px)";
    }, { passive: true });
    function end() {
      if (!active) return; active = false; card.classList.remove("dragging");
      if (dx <= TH) { card.style.transform = "translateX(-110%)"; haptic(14); setTimeout(function () { removePayment(p, wrap); }, 180); }
      else { card.style.transform = ""; }
      setTimeout(function () { card._swiped = false; }, 60);
    }
    card.addEventListener("touchend", end); card.addEventListener("touchcancel", end);
  }

  /* ===================================================
     DRAWER (swipe to open/close, follows finger)
     =================================================== */
  var drawer = null, scrim = null, drawerW = 290, drawerOpen = false;
  function setDrawerX(x) { drawer.style.transform = "translateX(" + x + "px)"; scrim.style.opacity = Math.max(0, (x + drawerW) / drawerW * 1).toFixed(3); }
  function openDrawer() { drawer.classList.add("anim", "open"); scrim.classList.add("show"); drawer.style.transform = ""; scrim.style.opacity = ""; drawerOpen = true; haptic(6); }
  function closeDrawer() { drawer.classList.add("anim"); drawer.classList.remove("open"); scrim.classList.remove("show"); drawer.style.transform = ""; scrim.style.opacity = ""; drawerOpen = false; }

  function initDrawerGestures() {
    drawer = $("#drawer"); scrim = $("#scrim");
    drawerW = drawer.offsetWidth || 290;

    var startX = 0, startY = 0, curX = 0, dragging = false, decided = false, horiz = false, baseOpen = false, t0 = 0;

    function onStart(e) {
      var t = e.touches[0]; startX = t.clientX; startY = t.clientY; decided = false; horiz = false; t0 = Date.now();
      baseOpen = drawerOpen;
      // open gesture only from left edge; close gesture anywhere when open
      if (!drawerOpen && startX > 26) return;
      dragging = true; drawer.classList.remove("anim");
    }
    function onMove(e) {
      if (!dragging) return;
      var t = e.touches[0]; var dx = t.clientX - startX, dy = t.clientY - startY;
      if (!decided) { decided = true; horiz = Math.abs(dx) > Math.abs(dy); if (!horiz) { dragging = false; return; } }
      var base = baseOpen ? 0 : -drawerW;
      curX = Math.max(-drawerW, Math.min(0, base + dx));
      setDrawerX(curX);
      if (e.cancelable) e.preventDefault();
    }
    function onEnd() {
      if (!dragging) return; dragging = false;
      drawer.classList.add("anim");
      var dt = Date.now() - t0; var base = baseOpen ? 0 : -drawerW; var moved = curX - base;
      var velOpen = moved > 0 && dt < 250 && moved > 30;
      var velClose = moved < 0 && dt < 250 && moved < -30;
      if (velOpen) return openDrawer();
      if (velClose) return closeDrawer();
      if (curX > -drawerW * 0.55) openDrawer(); else closeDrawer();
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);

    $("#hamb").addEventListener("click", function () { drawerOpen ? closeDrawer() : openDrawer(); });
    scrim.addEventListener("click", closeDrawer);
    $("#prevYear").addEventListener("click", function () { state.year--; renderMonths(); haptic(); });
    $("#nextYear").addEventListener("click", function () { state.year++; renderMonths(); haptic(); });
  }

  /* ===================================================
     SHEET (add / edit)
     =================================================== */
  var editing = null;
  function openSheet(p) {
    editing = p || null;
    $("#sheetTitle").innerHTML = p ? "Modifica <b>pagamento</b>" : "Nuovo <b>pagamento</b>";
    $("#fTitle").value = p ? p.title : "";
    $("#fAmount").value = p && p.amount_cents != null ? (p.amount_cents / 100).toFixed(2) : "";
    $("#fDate").value = p ? p.due_date : defaultDate();
    $("#fNotes").value = p && p.notes ? p.notes : "";
    $("#btnDelete").style.display = p ? "" : "none";
    $("#sheet").classList.add("anim", "open"); $("#sheet-scrim").classList.add("show");
    setTimeout(function () { if (!p) $("#fTitle").focus(); }, 320);
  }
  function closeSheet() { $("#sheet").classList.remove("open"); $("#sheet-scrim").classList.remove("show"); }
  function defaultDate() {
    // default to the 1st of the currently viewed month (or today if current month)
    if (state.year === now.getFullYear() && state.month === now.getMonth()) return isoToday();
    return monthKey(state.year, state.month) + "-01";
  }
  function isoToday() { var t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); }

  function saveSheet() {
    var title = $("#fTitle").value.trim();
    var date = $("#fDate").value;
    var amtRaw = $("#fAmount").value.trim().replace(",", ".");
    if (!title) { toast("Inserisci un titolo", "err"); $("#fTitle").focus(); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast("Inserisci una data valida", "err"); return; }
    var cents = null;
    if (amtRaw !== "") { var n = parseFloat(amtRaw); if (isNaN(n) || n < 0) { toast("Importo non valido", "err"); return; } cents = Math.round(n * 100); }
    var notes = $("#fNotes").value.trim() || null;
    var btn = $("#btnSave"); btn.disabled = true; var old = btn.innerHTML; btn.textContent = "Salvataggio…";

    var payload = { title: title, due_date: date, amount_cents: cents, notes: notes };
    var op = editing ? DB.update(editing.id, payload) : DB.create(payload);
    op.then(function (res) {
      if (editing) { Object.assign(editing, payload); }
      else { state.payments.push(res); }
      // jump to the month of the saved payment so the user sees it
      var d = parseDue(date); state.year = d.getFullYear(); state.month = d.getMonth();
      closeSheet(); rerenderAll(); haptic(12); toast(editing ? "Pagamento aggiornato" : "Pagamento aggiunto", "ok");
      editing = null;
    }).catch(function (err) { toast(err.message, "err"); })
      .then(function () { btn.disabled = false; btn.innerHTML = old; });
  }

  function deleteFromSheet() {
    if (!editing) return;
    var p = editing; closeSheet();
    var wrap = document.querySelector('.card[data-id="' + p.id + '"]');
    wrap = wrap ? wrap.parentNode : null;
    if (wrap) removePayment(p, wrap); else { state.payments = state.payments.filter(function (x) { return x.id !== p.id; }); DB.remove(p.id); rerenderAll(); toast("Pagamento eliminato", "ok"); }
    editing = null;
  }

  /* sheet swipe-down to close */
  function initSheetGestures() {
    var sheet = $("#sheet"), sy = 0, dy = 0, dr = false;
    var grab = $("#grab");
    function s(e) { sy = e.touches[0].clientY; dy = 0; dr = true; sheet.classList.remove("anim"); }
    function m(e) { if (!dr) return; dy = Math.max(0, e.touches[0].clientY - sy); sheet.style.transform = "translateY(" + dy + "px)"; }
    function en() { if (!dr) return; dr = false; sheet.classList.add("anim"); if (dy > 110) closeSheet(); sheet.style.transform = ""; }
    [grab, $("#sheetHead")].forEach(function (h) {
      h.addEventListener("touchstart", s, { passive: true }); h.addEventListener("touchmove", m, { passive: true }); h.addEventListener("touchend", en);
    });
    $("#sheet-scrim").addEventListener("click", closeSheet);
    $("#btnCancel").addEventListener("click", closeSheet);
    $("#btnSave").addEventListener("click", saveSheet);
    $("#btnDelete").addEventListener("click", deleteFromSheet);
    $("#fab").addEventListener("click", function () { openSheet(null); haptic(); });
  }

  /* ===================================================
     SETTINGS / NOTIFICATIONS
     =================================================== */
  function urlBase64ToUint8Array(b64) {
    var pad = "=".repeat((4 - (b64.length % 4)) % 4);
    var base = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    var raw = atob(base), arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  function notifSupported() { return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }

  function refreshPushUi() {
    var badge = $("#pushBadge"), btn = $("#pushBtn"), test = $("#testBtn");
    if (DEMO) { badge.className = "badge off"; badge.textContent = "Demo"; btn.textContent = "Attiva"; return; }
    if (!notifSupported()) { badge.className = "badge off"; badge.textContent = "N/D"; btn.style.display = "none"; return; }
    var granted = Notification.permission === "granted" && state.pushOn;
    badge.className = "badge " + (granted ? "on" : "off");
    badge.textContent = granted ? "Attive" : "Off";
    btn.textContent = granted ? "Riattiva" : "Attiva";
    test.style.display = granted ? "" : "none";
  }

  function enablePush() {
    if (DEMO) { toast("Anteprima: notifiche disponibili nell'app pubblicata", "ok"); return; }
    if (!notifSupported()) { toast("Notifiche non supportate qui", "err"); return; }
    Notification.requestPermission().then(function (perm) {
      if (perm !== "granted") { toast("Permesso notifiche negato", "err"); return; }
      navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.getSubscription().then(function (sub) {
          return sub || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
        });
      }).then(function (sub) {
        return api("/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ device_id: deviceId, subscription: sub }) });
      }).then(function () { state.pushOn = true; refreshPushUi(); toast("Notifiche attivate!", "ok"); haptic(12); })
        .catch(function (err) { toast("Errore attivazione: " + err.message, "err"); });
    });
  }
  function testPush() {
    if (DEMO) { toast("Test disponibile nell'app pubblicata", "ok"); return; }
    toast("Invio test…");
    // server route requires CRON_SECRET; expose a button only if you wire a public test.
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) {
        reg.showNotification("🔔 PayAlert", { body: "Le notifiche funzionano!", icon: "/icon-192.png", badge: "/icon-192.png", vibrate: [80, 40, 80] });
      });
    }
  }

  /* PWA install */
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredPrompt = e; var b = $("#installRow"); if (b) b.style.display = ""; });
  function doInstall() {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; $("#installRow").style.display = "none"; }); }
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream; }
  function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }

  function initSettings() {
    $("#pushBtn").addEventListener("click", enablePush);
    $("#testBtn").addEventListener("click", testPush);
    var ir = $("#installBtn"); if (ir) ir.addEventListener("click", doInstall);

    // open settings from drawer
    $("#settingsItem").addEventListener("click", openSettings);
    $("#pushItem").addEventListener("click", openSettings);
    $("#setClose").addEventListener("click", closeSettings);
    $("#set-scrim").addEventListener("click", closeSettings);

    // settings sheet swipe-down
    var ss = $("#setsheet"), sy = 0, dy = 0, dr = false;
    function s(e){ sy=e.touches[0].clientY; dy=0; dr=true; ss.classList.remove("anim"); }
    function m(e){ if(!dr) return; dy=Math.max(0,e.touches[0].clientY-sy); ss.style.transform="translateY("+dy+"px)"; }
    function en(){ if(!dr) return; dr=false; ss.classList.add("anim"); if(dy>110) closeSettings(); ss.style.transform=""; }
    [$("#setGrab"), $("#setHead")].forEach(function(h){ h.addEventListener("touchstart",s,{passive:true}); h.addEventListener("touchmove",m,{passive:true}); h.addEventListener("touchend",en); });

    // iOS hint when not installed
    if (isIOS() && !isStandalone()) { var h = $("#iosHint"); if (h) h.style.display = ""; }
    if (DEMO) { var v = $("#verLine"); if (v) v.textContent = "Anteprima live · Versione 2.0"; }
    // check existing subscription
    if (!DEMO && notifSupported() && navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); })
        .then(function (sub) { state.pushOn = !!sub && Notification.permission === "granted"; refreshPushUi(); }).catch(function () {});
    }
    refreshPushUi();
  }
  function openSettings(){ closeDrawer(); $("#setsheet").classList.add("anim","open"); $("#set-scrim").classList.add("show"); haptic(6); }
  function closeSettings(){ $("#setsheet").classList.remove("open"); $("#set-scrim").classList.remove("show"); }

  /* ---------- toast ---------- */
  var toastT;
  function toast(msg, kind) {
    var t = $("#toast"); t.className = ""; t.classList.add("show"); if (kind) t.classList.add(kind); t.textContent = msg;
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ---------- load ---------- */
  function load() {
    state.loading = true; renderList();
    DB.list().then(function (data) {
      state.payments = (data || []).map(function (p) { return { id: p.id, title: p.title, due_date: p.due_date, amount_cents: p.amount_cents, notes: p.notes, is_paid: !!p.is_paid }; });
      state.loading = false; rerenderAll();
    }).catch(function (err) { state.loading = false; renderList(); toast("Errore caricamento: " + err.message, "err"); });
  }

  /* ---------- filter tabs ---------- */
  function initFilters() {
    document.querySelectorAll(".filters .seg").forEach(function (seg) {
      seg.addEventListener("click", function () {
        document.querySelectorAll(".filters .seg").forEach(function (s) { s.classList.remove("on"); });
        seg.classList.add("on"); state.filter = seg.dataset.f; renderList(); haptic(5);
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initDrawerGestures(); initSheetGestures(); initFilters(); initSettings();
    rerenderAll();
    if (DEMO) { state.loading = false; rerenderAll(); }
    else { load(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  // expose for debugging
  window.PayAlert = { state: state, reload: load };
})();
