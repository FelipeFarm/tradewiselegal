/* TradeWise Legal — redesign mockup. No dependencies. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = window.matchMedia("(min-width: 1024px)");
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---- scroll reveal (siblings stagger) ---- */
  var reveals = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      var shown = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--rd", (shown++ * 90) + "ms");
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- header: shadow, hide on scroll down, progress bar, dock, steps ---- */
  var header = $(".header");
  var topbar = $(".topbar");
  var bar = $(".progress span");
  var dock = $(".dock");
  var cta = $(".cta");
  var stepLists = $$(".steps");
  var lastY = window.scrollY;
  var ticking = false;

  function setHeadH() {
    var h = header.getBoundingClientRect().bottom;
    doc.style.setProperty("--head-h", Math.max(h, header.offsetHeight) + "px");
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = doc.scrollHeight - vh;

    header.classList.toggle("is-stuck", y > topbar.offsetHeight);
    if (!body.classList.contains("menu-open")) {
      if (y > 500 && y > lastY + 4) { header.classList.add("is-hidden"); closeMega(); }
      else if (y < lastY - 4 || y <= 500) header.classList.remove("is-hidden");
    }
    lastY = y;

    bar.style.setProperty("--p", max > 0 ? Math.min(y / max, 1) : 0);

    if (dock) {
      var ctaTop = cta ? cta.getBoundingClientRect().top : Infinity;
      var on = y > 520 && ctaTop > vh * 0.75;
      dock.classList.toggle("is-on", on);
      dock.setAttribute("aria-hidden", on ? "false" : "true");
      $$("a", dock).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    }

    stepLists.forEach(function (steps) {
      var r = steps.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var p = (vh * 0.6 - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      steps.style.setProperty("--p", reduce ? 1 : p);
      $$(".step", steps).forEach(function (s) {
        s.classList.toggle("is-on", reduce || s.getBoundingClientRect().top < vh * 0.6);
      });
    });
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---- mobile menu ---- */
  var burger = $(".burger");
  var drawer = $(".drawer");
  function setMenu(open) {
    if (open) setHeadH();
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.setAttribute("aria-hidden", !open);
  }
  burger.addEventListener("click", function () { setMenu(!body.classList.contains("menu-open")); });
  $$("[data-close]", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); closeMega(); } });
  desktop.addEventListener("change", function () { setMenu(false); });

  /* ---- desktop packages dropdown ---- */
  var megaItem = $(".nav__item--has");
  var megaBtn = megaItem && $("button", megaItem);
  var megaTimer;
  function openMega() { clearTimeout(megaTimer); megaItem.classList.add("is-open"); megaBtn.setAttribute("aria-expanded", "true"); }
  function closeMega() { if (!megaItem) return; megaItem.classList.remove("is-open"); megaBtn.setAttribute("aria-expanded", "false"); }
  if (megaItem) {
    megaItem.addEventListener("mouseenter", openMega);
    megaItem.addEventListener("mouseleave", function () { megaTimer = setTimeout(closeMega, 160); });
    megaBtn.addEventListener("click", function () { megaItem.classList.contains("is-open") ? closeMega() : openMega(); });
    megaItem.addEventListener("focusout", function (e) { if (!megaItem.contains(e.relatedTarget)) closeMega(); });
    document.addEventListener("click", function (e) { if (!megaItem.contains(e.target)) closeMega(); });
  }

  /* ---- "what do you need help with" picker: tabs on desktop, accordion on mobile ---- */
  var tabs = $$(".picker__tab");
  function setTab(i, open) {
    tabs.forEach(function (t, n) {
      var on = n === i && open;
      t.classList.toggle("is-open", on);
      t.setAttribute("aria-expanded", on);
      t.nextElementSibling.classList.toggle("is-open", on);
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      var wasOpen = t.classList.contains("is-open");
      if (desktop.matches) { setTab(i, true); return; }
      setTab(i, !wasOpen);
      if (!wasOpen) {
        // keep the tapped heading in view once the previous panel has collapsed
        setTimeout(function () {
          var top = t.getBoundingClientRect().top;
          if (top < 0 || top > window.innerHeight * 0.5) {
            window.scrollTo({ top: window.scrollY + top - 16, behavior: reduce ? "auto" : "smooth" });
          }
        }, 520);
      }
    });
    t.addEventListener("mouseenter", function () { if (desktop.matches) setTab(i, true); });
  });
  // phones start with all five options visible; desktop always shows one
  if (!desktop.matches) setTab(-1, false);
  desktop.addEventListener("change", function (e) {
    if (e.matches && !$(".picker__tab.is-open")) setTab(0, true);
  });

  /* ---- FAQ accordion ---- */
  $$(".acc__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.parentElement;
      var open = !item.classList.contains("is-open");
      $$(".acc__item.is-open").forEach(function (o) {
        o.classList.remove("is-open");
        $(".acc__q", o).setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", open);
      q.setAttribute("aria-expanded", open);
    });
  });

  /* ---- packages carousel dots (mobile) ---- */
  var track = $(".pk");
  var dots = $$(".pk__dots i");
  if (track && dots.length) {
    var cards = $$(".pk__card", track);
    var raf;
    track.addEventListener("scroll", function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var mid = track.scrollLeft + track.clientWidth / 2;
        var best = 0, dist = Infinity;
        cards.forEach(function (c, i) {
          var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < dist) { dist = d; best = i; }
        });
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = cards.length - 1;
        dots.forEach(function (d, i) { d.classList.toggle("on", i === best); });
      });
    }, { passive: true });
  }

  /* ---- forms (mockup): once the browser has validated the fields, show the thank-you page.
     Nothing is sent anywhere yet: point each <form> at the real form handler before launch. ---- */
  $$("form[data-thanks]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = f.getAttribute("data-thanks");
    });
  });

  /* ---- a la carte: running count and total of ticked documents ---- */
  var tally = $(".tally");
  if (tally) {
    var picks = $$(".pick input");
    var picked = $(".alc__picked");
    var update = function () {
      var on = picks.filter(function (i) { return i.checked; });
      var sum = on.reduce(function (a, i) { return a + (+i.dataset.price || 0); }, 0);
      var label = on.length + (on.length === 1 ? " item" : " items");
      $(".tally__n", tally).textContent = label;
      $(".tally__sum", tally).textContent = "$" + sum.toLocaleString("en-US");
      tally.classList.toggle("is-on", on.length > 0);
      if (picked) {
        picked.textContent = on.length
          ? label + " selected, $" + sum.toLocaleString("en-US") + " total: " + on.map(function (i) { return i.value; }).join("; ")
          : picked.getAttribute("data-empty");
      }
    };
    picks.forEach(function (i) { i.addEventListener("change", update); });
    update();
    var send = $(".alc__send");
    if (send && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { tally.classList.toggle("is-off", es[0].isIntersecting); }, { threshold: 0.15 }).observe(send);
    }
  }

  /* ---- price count-up ---- */
  var prices = $$("[data-count]");
  if (!reduce && "IntersectionObserver" in window) {
    var fmt = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        pio.unobserve(e.target);
        var el = e.target, end = +el.dataset.count, start = end * 0.6, t0 = null, dur = 900;
        function step(t) {
          if (!t0) t0 = t;
          var k = Math.min((t - t0) / dur, 1);
          k = 1 - Math.pow(1 - k, 3);
          el.textContent = fmt(start + (end - start) * k);
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    prices.forEach(function (p) { pio.observe(p); });
  }
})();
