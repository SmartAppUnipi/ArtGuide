<script context="module">
export function init() {
    // get settings from local storage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      localStorage.setItem("userId", Math.round(Math.random() * 100000, 0) + 1);
      localStorage.setItem("userLanguage", "en");
      localStorage.setItem("userTastes", "style");
      localStorage.setItem("userExpertiseLevel", "2");
      const location = new URL(window.location.href);
      localStorage.setItem(
        "endpoint",
        `${location.protocol}//${location.hostname}`
      );
      console.log("Settings initialized.")
    }
  }
</script>

<script>
  import { writable } from "svelte/store";
  init();

  // get settings from local storage
  const userId = writable(
    localStorage.getItem("userId") || Math.round(Math.random() * 100000, 0)
  );
  const userLanguage = writable(localStorage.getItem("userLanguage") || "en");
  const userTastes = writable(localStorage.getItem("userTastes") || "style");
  const userExpertiseLevel = writable(
    localStorage.getItem("userExpertiseLevel") || "2"
  );
  const location = new URL(window.location.href);
  const endpoint = writable(
    localStorage.getItem("endpoint") ||
      `${location.protocol}//${location.hostname}`
  );

  // update whenever them changes
  userId.subscribe(val => localStorage.setItem("userId", val));
  userLanguage.subscribe(val => localStorage.setItem("userLanguage", val));
  userTastes.subscribe(val => localStorage.setItem("userTastes", val));
  userExpertiseLevel.subscribe(val =>
    localStorage.setItem("userExpertiseLevel", val)
  );
  endpoint.subscribe(val => localStorage.setItem("endpoint", val));
</script>

<svelte:head>
  <title>Settings | ArtGuide</title>
</svelte:head>

<h1>Settings</h1>
Username:
<input type="number" bind:value={$userId} />
<br />
Language:
<select bind:value={$userLanguage}>
  <option value="en">English</option>
  <option value="it">Italian</option>
</select>
<br />
Expertise level:
<select bind:value={$userExpertiseLevel}>
  <option value="1">Child</option>
  <option value="2">Novice</option>
  <option value="3">Knowledgeable</option>
  <option value="4">Expert</option>
</select>
<br />
Tastes:
<input type="text" bind:value={$userTastes} />
<br />
Endpoint:
<input type="text" bind:value={$endpoint} />
