(function () {
  "use strict";

  var data = window.__BRAND__ || {};

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- small content enrichments from manifest ---------- */
  function mountYear() {
    var el = $("[data-year]");
    if (el && data.year) el.textContent = data.year;
  }

  /* ---------- nav: transparent -> solid on scroll ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var on = function () {
      if (scrollY > 60) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /* ---------- smooth anchor scrolling (native, no Lenis) ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  function initRevealMasks() {
    var els = $$("[data-reveal-mask]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      $$("[data-reveal-mask]:not(.is-revealed)").forEach(function (el) { el.classList.add("is-revealed"); });
    }, 6000);
  }

  /* ---------- split text (chars / words), preserves <br> ---------- */
  function splitChars(el) {
    el.setAttribute("aria-label", el.textContent.trim());
    var html = Array.prototype.map.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        return node.textContent.split("").map(function (ch) {
          return ch === " " ? " " : '<span class="split-char" aria-hidden="true">' + escHTML(ch) + "</span>";
        }).join("");
      }
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        var inner = node.textContent.split("").map(function (ch) {
          return ch === " " ? " " : '<span class="split-char" aria-hidden="true">' + escHTML(ch) + "</span>";
        }).join("");
        return "<" + tag + ">" + inner + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return $$(".split-char", el);
  }

  function splitWords(el) {
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    var wrap = function (text) {
      return text.split(/(\s+)/).map(function (w) {
        return /^\s+$/.test(w) ? w : '<span class="split-word" aria-hidden="true">' + escHTML(w) + "</span>";
      }).join("");
    };
    var html = Array.prototype.map.call(el.childNodes, function (node) {
      if (node.nodeType === 3) return wrap(node.textContent);
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        return "<" + tag + ">" + wrap(node.textContent) + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return $$(".split-word", el);
  }

  function initSplitText() {
    var targets = $$("[data-split]");
    if (!targets.length) return;

    targets.forEach(function (el) {
      if (el.classList.contains("reveal")) el.classList.remove("reveal");
      var mode = el.dataset.split;
      var parts = mode === "chars" ? splitChars(el) : splitWords(el);

      if (!window.gsap || !window.ScrollTrigger) {
        parts.forEach(function (p) { p.style.opacity = 1; });
        return;
      }
      gsap.set(parts, { y: mode === "chars" ? 26 : 22, opacity: 0 });
      gsap.to(parts, {
        y: 0, opacity: 1,
        duration: mode === "chars" ? 0.8 : 0.9,
        stagger: mode === "chars" ? 0.02 : 0.045,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });
  }

  /* ---------- mouse-reactive mesh gradient background ---------- */
  function initMeshGradient() {
    if (!fineHover) return; // touch devices: keep the static gradient, skip the loop
    var mx = 50, my = 50, tx = 50, ty = 50;
    document.addEventListener("mousemove", function (e) {
      tx = (e.clientX / innerWidth) * 100;
      ty = (e.clientY / innerHeight) * 100;
    }, { passive: true });

    function frame() {
      mx += (tx - mx) * 0.055;
      my += (ty - my) * 0.055;
      document.documentElement.style.setProperty("--mx", mx.toFixed(2) + "%");
      document.documentElement.style.setProperty("--my", my.toFixed(2) + "%");
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.dataset.magneticStrength || "0.3");
      var inner = document.createElement("span");
      inner.className = "magnetic-inner";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add("has-magnetic");

      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * strength;
        ty = (e.clientY - r.top - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        inner.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------- subtle tilt on gallery photos ---------- */
  function initTilt() {
    if (!fineHover) return;
    $$(".has-tilt").forEach(function (card) {
      var MAX = 6;
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------- hero entrance (first-screen wow) ---------- */
  function initHeroEntrance() {
    if (!window.gsap) return;
    gsap.set(".hero-figure", { opacity: 0, y: 24 });
    gsap.to(".hero-figure", { opacity: 1, y: 0, duration: 1.1, delay: 0.15, ease: "expo.out" });
  }

  function boot() {
    safe(mountYear, "mountYear");
    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initRevealMasks, "initRevealMasks");
    safe(initMeshGradient, "initMeshGradient");
    safe(initMagnetic, "initMagnetic");
    safe(initTilt, "initTilt");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initSplitText, "initSplitText");
      safe(initHeroEntrance, "initHeroEntrance");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
