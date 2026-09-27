(() => {
  if (window.lucide) window.lucide.createIcons();

  const navigation = document.querySelector(".disciplines");
  const tabs = [...navigation.querySelectorAll(".discipline")];
  const panels = tabs.map((tab) =>
    document.querySelector(tab.getAttribute("href")),
  );
  const panelNames = panels.map((panel) => panel.id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let selected = 0;

  navigation.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
  });

  function activate(index, { updateUrl = false, focus = false } = {}) {
    selected = index;
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[tabIndex].hidden = !active;
    });
    if (updateUrl) history.pushState(null, "", `#${panels[index].id}`);
    if (focus) tabs[index].focus({ preventScroll: true });
  }

  function readHash() {
    const index = panelNames.indexOf(location.hash.slice(1));
    if (index !== -1) activate(index);
    else if (["", "#projects", "#expertise"].includes(location.hash))
      activate(0);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      activate(index, { updateUrl: true });
      // Keep the selected panel visible when switching from lower on the page.
      const bar = navigation.parentElement;
      if (window.scrollY > bar.offsetTop + bar.offsetHeight) {
        bar.scrollIntoView({
          behavior: reducedMotion.matches ? "instant" : "smooth",
          block: "start",
        });
      }
    });
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (selected + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (selected - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (event.key === " ") next = index;
      if (next === undefined) return;
      event.preventDefault();
      activate(next, { updateUrl: true, focus: true });
    });
  });
  activate(Math.max(0, panelNames.indexOf(location.hash.slice(1))));
  window.addEventListener("hashchange", readHash);
  window.addEventListener("popstate", readHash);

  const dialog = document.querySelector(".photo-dialog");
  const dialogImage = dialog.querySelector("img");
  const caption = dialog.querySelector("figcaption");
  let photoOpener;
  document.querySelectorAll("[data-photo]").forEach((button) => {
    button.title = button.getAttribute("aria-label");
    button.addEventListener("click", () => {
      photoOpener = button;
      dialogImage.src = button.dataset.photo;
      dialogImage.alt = button.querySelector("img").alt;
      caption.textContent = button.dataset.caption;
      dialog.showModal();
      document.body.classList.add("photo-open");
    });
  });
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("photo-open");
    photoOpener?.focus({ preventScroll: true });
  });
})();
