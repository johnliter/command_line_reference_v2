(async function () {
  const $cards = document.getElementById("cards");
  const $count = document.getElementById("resultCount");
  const $search = document.getElementById("searchInput");
  const $os = document.getElementById("osFilter");
  const $tagBar = document.getElementById("tagBar");
  const $clear = document.getElementById("clearFilters");

  if (!$cards) return; // only run on tools page

  let raw = null;
  let activeTag = null;

  const state = {
    q: "",
    os: "all",
  };

  function norm(str) {
    return (str || "").toString().trim().toLowerCase();
  }

  function itemMatches(item) {
    const q = norm(state.q);
    const os = state.os;

    if (os !== "all") {
      const itemOS = (item.os || []).map(norm);
      if (!itemOS.includes(os)) return false;
    }

    if (activeTag) {
      const tags = (item.tags || []).map(norm);
      if (!tags.includes(norm(activeTag))) return false;
    }

    if (!q) return true;

    const hay = [
      item.name,
      item.desc,
      item.url,
      ...(item.tags || []),
      ...(item.commands || []),
    ]
      .map(norm)
      .join(" ");

    return hay.includes(q);
  }

  function buildAllTags(data) {
    const set = new Set();
    data.sections.forEach((sec) => {
      sec.items.forEach((it) => (it.tags || []).forEach((t) => set.add(t)));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function renderTagBar(allTags) {
    $tagBar.innerHTML = "";
    allTags.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag" + (activeTag === t ? " is-active" : "");
      btn.textContent = t;

      btn.addEventListener("click", () => {
        activeTag = activeTag === t ? null : t;
        renderTagBar(allTags);
        render();
      });

      $tagBar.appendChild(btn);
    });
  }

  function toolCard(item) {
    const wrap = document.createElement("article");
    wrap.className = "tool";

    const top = document.createElement("div");
    top.className = "tool__top";

    const left = document.createElement("div");

    const name = document.createElement("h3");
    name.className = "tool__name";
    name.textContent = item.name || "Untitled";

    const desc = document.createElement("p");
    desc.className = "tool__desc";
    desc.textContent = item.desc || "";

    left.appendChild(name);
    left.appendChild(desc);

    const right = document.createElement("div");
    const a = document.createElement("a");
    a.className = "link";
    a.href = item.url || "#";
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "Open";
    right.appendChild(a);

    top.appendChild(left);
    top.appendChild(right);

    const meta = document.createElement("div");
    meta.className = "tool__meta";

    (item.os || []).forEach((os) => {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = os;
      meta.appendChild(pill);
    });

    (item.tags || []).forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = "#" + tag;
      meta.appendChild(pill);
    });

    wrap.appendChild(top);
    wrap.appendChild(meta);

    const cmds = item.commands || [];
    if (cmds.length) {
      const code = document.createElement("div");
      code.className = "code";

      const bar = document.createElement("div");
      bar.className = "code__bar";

      const label = document.createElement("span");
      label.className = "muted small";
      label.textContent = "Snippets";

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn btn--ghost";
      copy.textContent = "Copy";

      const text = cmds.join("\n");
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = "Copied";
          setTimeout(() => (copy.textContent = "Copy"), 900);
        } catch {
          copy.textContent = "Failed";
          setTimeout(() => (copy.textContent = "Copy"), 900);
        }
      });

      bar.appendChild(label);
      bar.appendChild(copy);

      const pre = document.createElement("pre");
      pre.textContent = text;

      code.appendChild(bar);
      code.appendChild(pre);

      wrap.appendChild(code);
    }

    return wrap;
  }

  function render() {
    const sections = [];
    let total = 0;

    raw.sections.forEach((sec) => {
      const matched = sec.items.filter(itemMatches);
      if (!matched.length) return;

      sections.push({ title: sec.title, items: matched });
      total += matched.length;
    });

    $cards.innerHTML = "";

    if (!total) {
      $count.textContent = "0 results";
      const empty = document.createElement("div");
      empty.className = "card";
      empty.innerHTML = `
        <h2>No matches</h2>
        <p class="muted">Try a different search, OS filter, or clear the tag filter.</p>
      `;
      $cards.appendChild(empty);
      return;
    }

    $count.textContent = `${total} result${total === 1 ? "" : "s"}`
      + (activeTag ? ` • tag: ${activeTag}` : "");

    sections.forEach((sec) => {
      // section header as a card
      const head = document.createElement("div");
      head.className = "card";
      head.innerHTML = `<h2>${sec.title}</h2><p class="muted small">${sec.items.length} item(s)</p>`;
      $cards.appendChild(head);

      sec.items.forEach((item) => $cards.appendChild(toolCard(item)));
    });
  }

  async function load() {
    const res = await fetch("./data/tools.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load tools.json");
    raw = await res.json();

    const tags = buildAllTags(raw);
    renderTagBar(tags);
    render();
  }

  function wire() {
    $search.addEventListener("input", (e) => {
      state.q = e.target.value;
      render();
    });

    $os.addEventListener("change", (e) => {
      state.os = e.target.value;
      render();
    });

    $clear.addEventListener("click", () => {
      state.q = "";
      state.os = "all";
      activeTag = null;
      $search.value = "";
      $os.value = "all";
      renderTagBar(buildAllTags(raw));
      render();
    });
  }

  try {
    await load();
    wire();
  } catch (err) {
    $cards.innerHTML = `<div class="card"><h2>Error</h2><p class="muted">${err.message}</p></div>`;
    $count.textContent = "Error loading data";
  }
})();