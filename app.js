/* ===== LOADOUT app ===== */
(function () {
  "use strict";
  var DATA = window.LOADOUT_DATA || { tools: [], categories: [] };
  var TOOLS = DATA.tools;
  var PAGE = 24;

  // ---- saved state (localStorage, guarded — fine on a self-hosted site) ----
  var saved = new Set();
  try {
    var raw = localStorage.getItem("loadout.saved");
    if (raw) JSON.parse(raw).forEach(function (n) { saved.add(n); });
  } catch (e) {}
  function persist() {
    try { localStorage.setItem("loadout.saved", JSON.stringify([].concat.apply([], [Array.from(saved)]))); } catch (e) {}
  }

  // ---- state ----
  var state = { q: "", category: "", rarity: "", price: "", sort: "rank", savedOnly: false, shown: PAGE };

  // ---- helpers ----
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return "" + n;
  }
  var PALETTE = ["#7c5cff","#22d3ee","#34d399","#f6a723","#f472b6","#60a5fa","#f87171","#a78bfa","#2dd4bf","#fb923c"];
  function iconColor(name) {
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    var a = PALETTE[h % PALETTE.length], b = PALETTE[(h >> 3) % PALETTE.length];
    return "linear-gradient(135deg," + a + "," + b + ")";
  }
  function monogram(name) {
    var clean = name.replace(/[^A-Za-z0-9 ].*$/, "").trim() || name;
    var parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  }
  function daysLabel(d) {
    if (d < 30) return d + "d ago";
    if (d < 365) return Math.round(d / 30) + "mo ago";
    return (d / 365).toFixed(1) + "y ago";
  }
  function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML;}

  // ---- filtering + sorting ----
  function filtered() {
    var q = state.q.trim().toLowerCase();
    var out = TOOLS.filter(function (t) {
      if (state.category && t.category !== state.category) return false;
      if (state.rarity && t.rarity !== state.rarity) return false;
      if (state.price && t.pricing !== state.price) return false;
      if (state.savedOnly && !saved.has(t.name)) return false;
      if (q) {
        var hay = (t.name + " " + t.category + " " + t.blurb + " " + (t.kw || "")).toLowerCase();
        var tokens = q.split(/\s+/);
        for (var k = 0; k < tokens.length; k++) {
          if (tokens[k] && hay.indexOf(tokens[k]) === -1) return false;
        }
      }
      return true;
    });
    var s = state.sort;
    out.sort(function (a, b) {
      if (s === "rating") return b.rating - a.rating || b.saves - a.saves;
      if (s === "saves") return b.saves - a.saves;
      if (s === "new") return a.daysAgo - b.daysAgo;
      if (s === "az") return a.name.localeCompare(b.name);
      return a.rank - b.rank; // top ranked
    });
    return out;
  }

  // ---- render tool card ----
  function cardHTML(t) {
    var on = saved.has(t.name);
    return '' +
      '<article class="card rc-' + t.rarity + (t.rarity === "Legendary" ? " leg" : "") + '" data-name="' + esc(t.name) + '" tabindex="0">' +
        '<span class="rarity-tag tag-' + t.rarity + '">' + t.rarity + '</span>' +
        '<div class="card-top">' +
          '<div class="tool-icon" style="background:' + iconColor(t.name) + '">' + monogram(t.name) + '</div>' +
          '<div class="card-heads">' +
            '<h3 class="tool-name" title="' + esc(t.name) + '">' + esc(t.name) + '</h3>' +
            '<div class="tool-cat"><span>' + t.icon + '</span>' + esc(t.category) + '</div>' +
          '</div>' +
          '<span class="rank-badge">#' + t.rank + '</span>' +
        '</div>' +
        '<p class="tool-blurb">' + esc(t.blurb) + '</p>' +
        '<div class="card-foot">' +
          '<span class="stat star">★ ' + t.rating.toFixed(1) + '</span>' +
          '<span class="stat">🔖 ' + fmt(t.saves) + '</span>' +
          '<span class="price-pill price-' + t.pricing.replace(/ /g, "") + '">' + t.pricing + '</span>' +
          '<button class="equip-btn' + (on ? " on" : "") + '" data-equip="' + esc(t.name) + '">' + (on ? "✓ Equipped" : "+ Equip") + '</button>' +
        '</div>' +
      '</article>';
  }

  function render() {
    var list = filtered();
    var grid = $("#toolGrid");
    var slice = list.slice(0, state.shown);
    grid.innerHTML = slice.map(cardHTML).join("");
    $("#resultCount").textContent = list.length + (list.length === 1 ? " tool" : " tools");
    $("#emptyState").hidden = list.length !== 0;
    $("#loadMore").hidden = state.shown >= list.length;
    $("#navSavedCount").textContent = saved.size;
    $("#savedToggle").setAttribute("aria-pressed", state.savedOnly ? "true" : "false");
  }

  // ---- category chips ----
  function buildChips() {
    var row = $("#categoryChips");
    var chips = ['<button class="chip active" data-cat="">🎒 All loot</button>'];
    DATA.categories.forEach(function (c) {
      chips.push('<button class="chip" data-cat="' + esc(c.name) + '"><span class="ic">' + c.icon + '</span>' + esc(c.name) + '</button>');
    });
    row.innerHTML = chips.join("");
  }
  function syncChips() {
    $$("#categoryChips .chip").forEach(function (ch) {
      ch.classList.toggle("active", ch.getAttribute("data-cat") === state.category);
    });
  }

  // ---- category overview ----
  function buildCatGrid() {
    $("#catGrid").innerHTML = DATA.categories.map(function (c) {
      return '<button class="cat-card" data-cat="' + esc(c.name) + '">' +
        '<div class="cat-ic">' + c.icon + '</div>' +
        '<div class="cat-name">' + esc(c.name) + '</div>' +
        '<div class="cat-desc">' + esc(c.descriptor) + '</div>' +
        '<div class="cat-count">' + c.count + ' tools →</div>' +
      '</button>';
    }).join("");
  }

  // ---- popular suggestions ----
  function buildSuggests() {
    var picks = ["write emails", "image generation", "voice cloning", "Cursor", "meeting notes", "presentations"];
    var wrap = $("#heroSuggests");
    picks.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = p;
      b.addEventListener("click", function () { setSearch(p); });
      wrap.appendChild(b);
    });
  }

  // ---- drawer ----
  function openDrawer(name) {
    var t = TOOLS.filter(function (x) { return x.name === name; })[0];
    if (!t) return;
    var on = saved.has(t.name);
    $("#drawerContent").innerHTML = '' +
      '<div class="d-hero">' +
        '<div class="d-icon" style="background:' + iconColor(t.name) + '">' + monogram(t.name) + '</div>' +
        '<div><h2 class="d-name">' + esc(t.name) + '</h2><div class="d-cat">' + t.icon + ' ' + esc(t.category) + ' · Rank #' + t.rank + '</div></div>' +
      '</div>' +
      '<span class="d-rarity tag-' + t.rarity + '">' + t.rarity + '</span>' +
      '<p class="d-blurb">' + esc(t.blurb) + '</p>' +
      '<div class="d-stats">' +
        '<div class="d-stat"><b>★ ' + t.rating.toFixed(1) + '</b><span>Rating</span></div>' +
        '<div class="d-stat"><b>' + fmt(t.saves) + '</b><span>Saves</span></div>' +
        '<div class="d-stat"><b>' + fmt(t.upvotes) + '</b><span>Upvotes</span></div>' +
        '<div class="d-stat"><b>' + t.pricing + '</b><span>Pricing · added ' + daysLabel(t.daysAgo) + '</span></div>' +
      '</div>' +
      '<div class="d-actions">' +
        '<a class="btn btn-primary" href="' + t.url + '" target="_blank" rel="noopener">Visit tool ↗</a>' +
        '<button class="btn btn-ghost" id="drawerEquip">' + (on ? "✓ Equipped" : "+ Equip to loadout") + '</button>' +
      '</div>';
    $("#drawerBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
    $("#drawerEquip").addEventListener("click", function () {
      toggleSave(t.name); openDrawer(t.name);
    });
  }
  function closeDrawer() {
    $("#drawerBackdrop").hidden = true;
    document.body.style.overflow = "";
  }

  // ---- actions ----
  function toggleSave(name) {
    if (saved.has(name)) saved.delete(name); else saved.add(name);
    persist(); render();
  }
  function setSearch(q) {
    state.q = q; state.shown = PAGE;
    $("#heroSearch").value = q;
    render();
    document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
  }
  function setCategory(cat) {
    state.category = cat; state.shown = PAGE; syncChips(); render();
    document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
  }

  // ---- wire up ----
  function init() {
    buildChips(); buildCatGrid(); buildSuggests();
    $("#heroCount").textContent = TOOLS.length;
    $("#year").textContent = new Date().getFullYear();
    render();

    // search
    var searchInput = $("#heroSearch");
    var t;
    searchInput.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { state.q = searchInput.value; state.shown = PAGE; render(); }, 120);
    });
    $("#heroSearchForm").addEventListener("submit", function (e) {
      e.preventDefault(); state.q = searchInput.value; state.shown = PAGE; render();
      document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
    });

    // filters
    $("#rarityFilter").addEventListener("change", function (e) { state.rarity = e.target.value; state.shown = PAGE; render(); });
    $("#priceFilter").addEventListener("change", function (e) { state.price = e.target.value; state.shown = PAGE; render(); });
    $("#sortBy").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
    $("#savedToggle").addEventListener("click", function () { state.savedOnly = !state.savedOnly; state.shown = PAGE; render(); });
    $("#loadMore").addEventListener("click", function () { state.shown += PAGE; render(); });
    $("#clearFilters").addEventListener("click", function () {
      state = { q: "", category: "", rarity: "", price: "", sort: "rank", savedOnly: false, shown: PAGE };
      searchInput.value = ""; $("#rarityFilter").value = ""; $("#priceFilter").value = ""; $("#sortBy").value = "rank";
      syncChips(); render();
    });

    // delegation: chips, cat cards, equip, card open
    document.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-cat]");
      if (chip) { setCategory(chip.getAttribute("data-cat")); return; }
      var equip = e.target.closest("[data-equip]");
      if (equip) { e.stopPropagation(); toggleSave(equip.getAttribute("data-equip")); return; }
      var card = e.target.closest(".card");
      if (card) { openDrawer(card.getAttribute("data-name")); return; }
    });
    // keyboard open for cards
    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var card = e.target.closest && e.target.closest(".card");
        if (card) openDrawer(card.getAttribute("data-name"));
      }
      if (e.key === "Escape") closeDrawer();
    });

    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#drawerBackdrop").addEventListener("click", function (e) { if (e.target === $("#drawerBackdrop")) closeDrawer(); });
    $("#myLoadoutLink").addEventListener("click", function (e) {
      e.preventDefault(); state.savedOnly = true; state.shown = PAGE; render();
      document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
    });
    $("#newsletterForm").addEventListener("submit", function (e) {
      e.preventDefault(); e.target.querySelector("input").value = ""; e.target.querySelector("button").textContent = "✓ You're in the guild";
    });
    $("#submitBtn").addEventListener("click", function () {
      alert("Tool submissions open soon. This is a demo build of LOADOUT.");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
