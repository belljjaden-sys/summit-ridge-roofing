/* ============================================================
   Summit Ridge Roofing — interactivity
   Loaded with `defer`, so the DOM is parsed when this runs.
   Progressive enhancement: the site is fully usable without it.
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lead form: confirmation in place of a real submit ---------- */
document.querySelectorAll("form[data-quote-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const done = form.querySelector("[data-done]");
    if (done) done.classList.remove("hidden");
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.textContent = "Request sent";
      button.disabled = true;
      button.classList.add("opacity-80");
    }
  });
});

/* ---------- Count-up for stat numbers ---------- */
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const format = (v) =>
    decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US");

  if (reduceMotion) {
    el.textContent = format(target);
    return;
  }

  const duration = 3000;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = format(target * eased);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = format(target);
  }
  requestAnimationFrame(tick);
}

/* ---------- Reveal on scroll + trigger counters ---------- */
const revealTargets = document.querySelectorAll(".reveal, .reveal-group");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach((c) => {
          if (!c.dataset.done) {
            c.dataset.done = "1";
            animateCount(c);
          }
        });
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  revealTargets.forEach((el) => io.observe(el));
} else {
  // No observer support: just show everything.
  revealTargets.forEach((el) => el.classList.add("is-visible"));
  document.querySelectorAll("[data-count]").forEach(animateCount);
}

/* ---------- Scroll-progress bar + header shadow ---------- */
const bar = document.getElementById("progress");
const header = document.querySelector("[data-header]");
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? doc.scrollTop / max : 0;
    if (bar) bar.style.transform = `scaleX(${ratio})`;
    if (header) header.classList.toggle("shadow-card", doc.scrollTop > 24);
    ticking = false;
  });
}
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- Service-area map (Leaflet + OpenStreetMap) ---------- */
const mapEl = document.getElementById("map");
if (mapEl && window.L) {
  const L = window.L;

  // Completed-project locations across Durham Region & the east GTA.
  const jobs = [
    { town: "Whitby",      job: "Full roof replacement",         at: [43.8975, -78.9429] },
    { town: "Ajax",        job: "Architectural shingle re-roof", at: [43.8509, -79.0204] },
    { town: "Pickering",   job: "Cape-style home replacement",   at: [43.8384, -79.0868] },
    { town: "Oshawa",      job: "Storm-damage repair",           at: [43.8971, -78.8658] },
    { town: "Uxbridge",    job: "Steep-slope re-roof",           at: [44.1090, -79.1205] },
    { town: "Markham",     job: "Eavestrough + roof repair",     at: [43.8561, -79.3370] },
    { town: "Scarborough", job: "Roof inspection + repair",      at: [43.7731, -79.2578] },
  ];

  const map = L.map(mapEl, {
    scrollWheelZoom: true,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Custom red teardrop pin.
  const redPin = L.divIcon({
    className: "srr-pin",
    html:
      '<svg viewBox="0 0 24 24" width="30" height="30" fill="#C8341E" stroke="#7a1f10" stroke-width="0.6">' +
      '<path d="M12 22s7-7.6 7-13A7 7 0 1 0 5 9c0 5.4 7 13 7 13z"/>' +
      '<circle cx="12" cy="9" r="2.6" fill="#fff" stroke="none"/></svg>',
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26],
  });

  const markers = jobs.map((j) =>
    L.marker(j.at, { icon: redPin, title: j.town })
      .bindPopup(
        '<strong>' + j.town + '</strong><br><span style="color:#6E6052">' + j.job + "</span>"
      )
      .addTo(map)
  );

  const bounds = L.featureGroup(markers).getBounds();

  // Frame all pins, then let the visitor pan/zoom freely. Re-fit once the real
  // container size is known (after fonts/Tailwind/layout settle) so tiles fill.
  const refit = () => {
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [40, 40] });
  };
  refit();
  setTimeout(refit, 300);
  window.addEventListener("load", refit);
  window.addEventListener("resize", () => map.invalidateSize());
}
