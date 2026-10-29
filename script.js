(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']")) : [];
  var sections = navLinks.map(function (link) {
    return document.getElementById(link.getAttribute("href").slice(1));
  }).filter(Boolean);

  if ("IntersectionObserver" in window && sections.length && nav) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.removeAttribute("aria-current");
          if (link.getAttribute("href") === "#" + entry.target.id) link.setAttribute("aria-current", "true");
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    sections.forEach(function (section) { activeObserver.observe(section); });
  }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var terminal = document.getElementById("terminalText");
  if (terminal && !reduceMotion) {
    var commands = ["whoami", "building useful software", "bridging ops + engineering"];
    var commandIndex = 0;
    var charIndex = commands[0].length;
    var deleting = false;
    var timer;
    function typeCommand() {
      var current = commands[commandIndex];
      if (deleting) {
        charIndex = Math.max(0, charIndex - 1);
        terminal.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          commandIndex = (commandIndex + 1) % commands.length;
          timer = window.setTimeout(typeCommand, 250);
          return;
        }
        timer = window.setTimeout(typeCommand, 32);
      } else {
        current = commands[commandIndex];
        charIndex = Math.min(current.length, charIndex + 1);
        terminal.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          timer = window.setTimeout(typeCommand, 1750);
          return;
        }
        timer = window.setTimeout(typeCommand, 58);
      }
    }
    timer = window.setTimeout(function () {
      commandIndex = 1;
      charIndex = 0;
      deleting = false;
      typeCommand();
    }, 1400);
    window.addEventListener("pagehide", function () { window.clearTimeout(timer); }, { once: true });
  }

  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if (!reduceMotion) counters.forEach(function (el) { el.textContent = "0"; });
  function countUp(el) {
    var target = Number(el.getAttribute("data-count"));
    if (!Number.isFinite(target) || target < 0) return;
    if (reduceMotion) { el.textContent = String(target); return; }
    var start = 0;
    var duration = 850;
    var startTime = 0;
    function frame(now) {
      if (!startTime) startTime = now;
      var progress = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(start + (target - start) * eased));
      if (progress < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  var revealTargets = Array.prototype.slice.call(document.querySelectorAll(
    "main > section:not(.hero) .section-head, main > section:not(.hero) article, .kpi, .status-panel"
  ));
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });
  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("reveal-ready");
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.hasAttribute("data-count")) countUp(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
    counters.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }


  // Lightweight ambient light streams. One canvas, capped DPR, paused in hidden tabs.
  var signalCanvas = document.getElementById("signalCanvas");
  var signalContext = signalCanvas && signalCanvas.getContext ? signalCanvas.getContext("2d", { alpha: true }) : null;
  if (signalCanvas && signalContext && !reduceMotion) {
    var streamWidth = 0, streamHeight = 0, streamDpr = 1, streamFrame = 0, streamRaf = 0, streamResizeTimer = 0;
    var signalStreams = [
      { color: "255,106,36", level: .24, phase: .3, amplitude: 20, speed: .00075 },
      { color: "71,186,255", level: .49, phase: 2.2, amplitude: 27, speed: .00058 },
      { color: "255,211,78", level: .74, phase: 4.1, amplitude: 16, speed: .00065 }
    ];
    function resizeSignalCanvas() {
      streamDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      streamWidth = Math.max(1, window.innerWidth);
      streamHeight = Math.max(1, window.innerHeight);
      signalCanvas.width = Math.round(streamWidth * streamDpr);
      signalCanvas.height = Math.round(streamHeight * streamDpr);
      signalCanvas.style.width = streamWidth + "px";
      signalCanvas.style.height = streamHeight + "px";
      signalContext.setTransform(streamDpr, 0, 0, streamDpr, 0, 0);
    }
    function drawSignalStreams() {
      streamFrame += 1;
      signalContext.clearRect(0, 0, streamWidth, streamHeight);
      signalStreams.forEach(function (stream, index) {
        signalContext.beginPath();
        for (var x = -16; x <= streamWidth + 16; x += 14) {
          var y = streamHeight * stream.level
            + Math.sin(x * .004 + streamFrame * stream.speed + stream.phase) * stream.amplitude
            + Math.sin(x * .0018 - streamFrame * stream.speed * 1.5 + stream.phase) * stream.amplitude * .42;
          if (x === -16) signalContext.moveTo(x, y); else signalContext.lineTo(x, y);
        }
        signalContext.strokeStyle = "rgba(" + stream.color + "," + (index === 0 ? .2 : .14) + ")";
        signalContext.lineWidth = index === 0 ? 1.5 : 1.1;
        signalContext.shadowColor = "rgba(" + stream.color + ",.42)";
        signalContext.shadowBlur = 9;
        signalContext.stroke();
      });
      signalContext.shadowBlur = 0;
      streamRaf = window.requestAnimationFrame(drawSignalStreams);
    }
    function startSignalStreams() {
      if (!streamRaf && !document.hidden) streamRaf = window.requestAnimationFrame(drawSignalStreams);
    }
    function stopSignalStreams() {
      if (streamRaf) window.cancelAnimationFrame(streamRaf);
      streamRaf = 0;
    }
    resizeSignalCanvas();
    window.addEventListener("resize", function () {
      window.clearTimeout(streamResizeTimer);
      streamResizeTimer = window.setTimeout(resizeSignalCanvas, 120);
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopSignalStreams(); else startSignalStreams();
    });
    startSignalStreams();
  }

  var pointerFine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (pointerFine && !reduceMotion) {
    var rafPending = false;
    document.body.classList.add("has-cursor-glow");
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    document.addEventListener("pointermove", function (event) {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(function () {
        document.body.style.setProperty("--pointer-x", event.clientX + "px");
        document.body.style.setProperty("--pointer-y", event.clientY + "px");
        rafPending = false;
      });
    }, { passive: true });
  }

  if (pointerFine && !reduceMotion) {
    Array.prototype.slice.call(document.querySelectorAll(".project-card, .ops-focus, .ops-route")).forEach(function (card) {
      card.classList.add("tilt-card");
      card.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-y * 1.3).toFixed(2) + "deg) rotateY(" + (x * 1.3).toFixed(2) + "deg)";
      }, { passive: true });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }
})();