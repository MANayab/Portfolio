(function () {
  "use strict";
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var progress = document.createElement("div");
  progress.className = "motion-progress";
  progress.setAttribute("aria-hidden", "true");
  if (!reduced) document.body.appendChild(progress);

  var nav = document.getElementById("siteNav");
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var sections = links.map(function (link) { return document.getElementById(link.getAttribute("href").slice(1)); }).filter(Boolean);
  var revealSelector = "main > section:not(.hero) .section-head, .experience-item, .progress-step, .project-card, .expertise-item, .language-chip, .travel-place, .education-item, .focus-lane";
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(revealSelector));
  revealItems.forEach(function (item, index) {
    item.classList.add("motion-reveal");
    if (index % 4) item.setAttribute("data-motion-order", String(index % 4));
  });

  if (!reduced && "IntersectionObserver" in window) {
    root.classList.add("motion-ready");
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("motion-visible", "is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -24px 0px" });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("motion-visible"); });
  }

  var framePending = false;
  function updateScrollUI() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var amount = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress.isConnected) progress.style.transform = "scaleX(" + amount + ")";
    framePending = false;
  }
  window.addEventListener("scroll", function () {
    if (!framePending) { framePending = true; window.requestAnimationFrame(updateScrollUI); }
  }, { passive: true });
  window.addEventListener("resize", updateScrollUI, { passive: true });
  updateScrollUI();

  if ("IntersectionObserver" in window && sections.length && nav) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          if (link.getAttribute("href") === "#" + entry.target.id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -65% 0px", threshold: 0 });
    sections.forEach(function (section) { activeObserver.observe(section); });
  }

  var timeline = document.querySelector("#experience .experience-list");
  if (timeline && !reduced && "IntersectionObserver" in window) {
    timeline.classList.add("motion-timeline-active");
    var timelineSection = document.getElementById("experience");
    function updateTimeline() {
      if (!timelineSection) return;
      var rect = timelineSection.getBoundingClientRect();
      var span = Math.max(1, rect.height - window.innerHeight * 0.35);
      var progressValue = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - rect.top) / span));
      timeline.style.setProperty("--timeline-progress", progressValue.toFixed(3));
    }
    window.addEventListener("scroll", updateTimeline, { passive: true });
    window.addEventListener("resize", updateTimeline, { passive: true });
    updateTimeline();
  }

  if (finePointer && !reduced) {
    Array.prototype.slice.call(document.querySelectorAll(".btn-primary, .btn-ghost")).forEach(function (button) {
      button.classList.add("motion-button");
      button.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var rect = button.getBoundingClientRect();
        var dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        var dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
        button.style.transform = "translate3d(" + (dx * 3).toFixed(1) + "px," + (dy * 2).toFixed(1) + "px,0)";
      }, { passive: true });
      button.addEventListener("pointerleave", function () { button.style.transform = ""; });
    });
  }

  var project = document.getElementById("projects");
  if (project && !reduced && "IntersectionObserver" in window) {
    var demoObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        project.classList.add("motion-demo-active");
        observer.unobserve(project);
      });
    }, { threshold: 0.25 });
    demoObserver.observe(project);
  }
})();
