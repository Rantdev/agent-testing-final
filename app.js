(function () {
  var cfg = window.APP_CONFIG || {};
  var checksEl = document.getElementById("checks");
  var agentsEl = document.getElementById("agents");
  var countEl = document.getElementById("channel-count");
  var agents = Array.isArray(cfg.agents) ? cfg.agents : [];
  var activeIndex = 0;
  var activeMount = null;
  var widgetReady = false;

  function isMissing(v) {
    return !v || String(v).indexOf("PASTE_") === 0;
  }

  function addCheck(label) {
    var li = document.createElement("li");
    li.className = "check pending";
    var dot = document.createElement("span");
    dot.className = "dot";
    dot.setAttribute("aria-hidden", "true");
    var lab = document.createElement("span");
    lab.className = "label";
    lab.textContent = label;
    var hint = document.createElement("span");
    hint.className = "hint";
    hint.textContent = "Checking…";
    li.append(dot, lab, hint);
    checksEl.appendChild(li);
    return function (state, text) {
      li.className = "check " + state;
      hint.textContent = text;
    };
  }

  function userId() {
    try {
      var id = sessionStorage.getItem("bench-user");
      if (!id) {
        id = "tester-" + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem("bench-user", id);
      }
      return id;
    } catch (e) {
      return "tester";
    }
  }

  function renderWorkspace() {
    agentsEl.textContent = "";
    if (!agents.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Add your agents to the agents array in config.js to get started.";
      agentsEl.appendChild(empty);
      countEl.textContent = "0 CHANNELS";
      return;
    }

    countEl.textContent = agents.length + (agents.length === 1 ? " CHANNEL" : " CHANNELS");
    var tabs = document.createElement("div");
    tabs.className = "agent-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Choose an agent channel");

    agents.forEach(function (agent, i) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "agent-tab" + (i === activeIndex ? " active" : "");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      tab.setAttribute("aria-controls", "agent-channel");
      var number = document.createElement("span");
      number.className = "tab-number";
      number.textContent = String(i + 1).padStart(2, "0");
      var name = document.createElement("span");
      name.className = "tab-name";
      name.textContent = agent.name || ("Agent " + (i + 1));
      var arrow = document.createElement("span");
      arrow.className = "tab-arrow";
      arrow.textContent = "↗";
      tab.append(number, name, arrow);
      tab.addEventListener("click", function () { selectAgent(i); });
      tabs.appendChild(tab);
    });
    agentsEl.appendChild(tabs);

    var panel = document.createElement("section");
    panel.className = "channel-panel";
    panel.id = "agent-channel";
    panel.setAttribute("role", "tabpanel");
    agentsEl.appendChild(panel);
    renderActivePanel();
  }

  function renderActivePanel() {
    var panel = document.getElementById("agent-channel");
    if (!panel) return;
    var agent = agents[activeIndex];
    if (!agent) return;
    panel.textContent = "";

    var panelTop = document.createElement("div");
    panelTop.className = "channel-top";
    var identity = document.createElement("div");
    identity.className = "agent-identity";
    var avatar = document.createElement("div");
    avatar.className = "agent-avatar avatar-" + (activeIndex % 4);
    avatar.textContent = String(activeIndex + 1).padStart(2, "0");
    var titleWrap = document.createElement("div");
    var kicker = document.createElement("div");
    kicker.className = "section-kicker";
    kicker.textContent = "ACTIVE CHANNEL";
    var title = document.createElement("h3");
    title.className = "channel-title";
    title.textContent = agent.name || ("Agent " + (activeIndex + 1));
    titleWrap.append(kicker, title);
    identity.append(avatar, titleWrap);
    var status = document.createElement("span");
    status.className = "ready-pill";
    status.innerHTML = '<span class="live-dot"></span> READY TO TEST';
    panelTop.append(identity, status);
    panel.appendChild(panelTop);

    var desc = document.createElement("p");
    desc.className = "channel-description";
    desc.textContent = agent.description || "Use this channel to test the agent's voice interaction.";
    panel.appendChild(desc);

    if (agent.languages && agent.languages.length) {
      var languages = document.createElement("div");
      languages.className = "language-row";
      var langLabel = document.createElement("span");
      langLabel.className = "language-label";
      langLabel.textContent = "LANGUAGES";
      languages.appendChild(langLabel);
      agent.languages.forEach(function (language) {
        var chip = document.createElement("span");
        chip.className = "language-chip";
        chip.textContent = language;
        languages.appendChild(chip);
      });
      panel.appendChild(languages);
    }

    var divider = document.createElement("div");
    divider.className = "panel-divider";
    panel.appendChild(divider);

    var callHead = document.createElement("div");
    callHead.className = "call-head";
    var callTitleWrap = document.createElement("div");
    var callTitle = document.createElement("h4");
    callTitle.textContent = "Conversation console";
    var callSub = document.createElement("p");
    callSub.textContent = "Launch the Sarvam call interface for this agent.";
    callTitleWrap.append(callTitle, callSub);
    var callIcon = document.createElement("span");
    callIcon.className = "call-icon";
    callIcon.textContent = "⌁";
    callHead.append(callTitleWrap, callIcon);
    panel.appendChild(callHead);

    var mount = document.createElement("div");
    mount.className = "mount";
    mount.id = "active-agent-mount";
    panel.appendChild(mount);
    activeMount = mount;

    var note = document.createElement("p");
    note.className = "channel-note";
    note.textContent = "Only this agent is mounted right now, so its launcher won't overlap with the other agent. End your current call before switching channels.";
    panel.appendChild(note);

    if (widgetReady) mountWidget(mount, agent);
    else showMessage(mount, "Loading Sarvam call interface…", false);
  }

  function selectAgent(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    // Remove the previous widget before mounting another. This avoids overlapping fixed-position launchers.
    widgetReady = widgetReady;
    renderWorkspace();
  }

  function showMessage(mount, text, isError) {
    mount.textContent = "";
    var p = document.createElement("p");
    p.className = "msg" + (isError ? " error" : "");
    p.textContent = text;
    mount.appendChild(p);
  }

  function mountWidget(mount, agent) {
    if (!agent || isMissing(agent.appId)) {
      showMessage(mount, "Add this agent's appId in config.js to enable its call interface.", true);
      return;
    }
    var w = document.createElement("sarvam-widget");
    w.setAttribute("app-id", agent.appId);
    w.setAttribute("org-id", agent.orgId || cfg.orgId);
    w.setAttribute("workspace-id", agent.workspaceId || cfg.workspaceId);
    w.setAttribute("user-id", userId());
    w.setAttribute("button-text", agent.buttonText || ("Talk to " + (agent.name || "agent")));
    w.setAttribute("interaction-type", agent.interactionType || "call");
    if (cfg.mode === "direct") {
      w.setAttribute("api-key", cfg.directApiKey || "");
    } else {
      w.setAttribute("session-endpoint", cfg.sessionEndpoint || "/api/sarvam/");
    }
    mount.textContent = "";
    mount.appendChild(w);
  }

  renderWorkspace();

  var cConfig = addCheck("Agent IDs filled in");
  var missing = [];
  if (isMissing(cfg.orgId)) missing.push("orgId");
  if (isMissing(cfg.workspaceId)) missing.push("workspaceId");
  agents.forEach(function (a, i) {
    if (isMissing(a.appId)) missing.push("agent " + (i + 1) + " appId");
  });
  if (missing.length) cConfig("fail", "Needs attention: set " + missing.join(", ") + " in config.js.");
  else cConfig("ok", "Passed.");

  var cBackend = addCheck(cfg.mode === "direct" ? "API key in page" : "Backend reachable");
  var cKey = cfg.mode === "direct" ? null : addCheck("API key set on server");
  if (cfg.mode === "direct") {
    if (isMissing(cfg.directApiKey)) cBackend("fail", "Set directApiKey in config.js, or switch mode to proxy.");
    else cBackend("warn", "Testing only: this key is visible in page source.");
  } else {
    fetch("/api/health")
      .then(function (r) { if (!r.ok) throw new Error("status " + r.status); return r.json(); })
      .then(function (data) {
        cBackend("ok", "Passed.");
        if (data.keyConfigured) cKey("ok", "Passed.");
        else cKey("fail", "Add SARVAM_API_KEY to .env.local, then restart the server.");
      })
      .catch(function () {
        cBackend("fail", "Backend not reachable. Start the project with node server.js.");
        cKey("warn", "Not checked because the backend did not respond.");
      });
  }

  var cScript = addCheck("Sarvam widget script loaded");
  var defined = customElements.whenDefined("sarvam-widget");
  var timeout = new Promise(function (_, reject) {
    setTimeout(function () { reject(new Error("timeout")); }, 8000);
  });
  Promise.race([defined, timeout]).then(function () {
    cScript("ok", "Passed.");
    widgetReady = true;
    renderActivePanel();
  }).catch(function () {
    cScript("fail", "Could not load the widget from unpkg.com. Check connection or ad blocker.");
    var mount = document.getElementById("active-agent-mount");
    if (mount) showMessage(mount, "The Sarvam widget could not load.", true);
  });
})();
