// The only file you need to edit.
// Values come from Sarvam: open an agent -> Deploy -> Deploy with Code -> Embed.
// The embed configurator fills in app-id, org-id and workspace-id for you.

window.APP_CONFIG = {
  // "proxy"  = the API key stays on the server (use this on Vercel).
  // "direct" = the key is placed in the page. For a quick local test only.
  mode: "proxy",

  // Only used when mode is "direct". Never commit or deploy a real key here.
  directApiKey: "",

  // Where the widget asks for a session when mode is "proxy".
  sessionEndpoint: "/api/sarvam/",

  // Shared by both agents. Each agent can override them with its own orgId / workspaceId.
  orgId: "01a1644b-8672-7cdd-9295-86fa16be4cdc",
  workspaceId: "01a1644b-8677-7183-9165-ffb73d6ffd8e",

  agents: [
    {
      name: "Personal loan agent",
      description: "it's a loan recovery agent",
      languages: ["English", "Hindi"],
      appId: "Personal-Lo-4fc9a03f-0d40",
      buttonText: "Talk to agent one",
      interactionType: "call"
    },
    {
      name: "Car insurance agent",
      description: "renewal the policy",
      languages: ["English", "Hindi"],
      appId: "Car-Insuran-9a34ad58-122b",
      buttonText: "Talk to agent two",
      interactionType: "call"
    }
  ]
};
