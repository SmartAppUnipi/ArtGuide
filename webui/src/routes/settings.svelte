<script>
  import { writable } from "svelte/store";

  // get settings from local storage
  const userId = writable(localStorage.getItem("userId") || 42);
  const userLanguage = writable(localStorage.getItem("userLanguage") || "en");
  const userTastes = writable(localStorage.getItem("userTastes") || "");
  const userExpertiseLevel = writable(
    localStorage.getItem("userExpertiseLevel") || 2
  );
  const endpoint = writable(
    localStorage.getItem("endpoint") ||
      `http://${window.location.hostname}:2345/upload`
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
  <option value="en" selected>English</option>
  <option value="it">Italian</option>
</select>
<br />
Expertise level:
<select bind:value={$userExpertiseLevel}>
  <option value="1">Child</option>
  <option value="2" selected>Novice</option>
  <option value="3">Knowledgeable</option>
  <option value="4">Expert</option>
</select>
<br />
Tastes:
<input type="text" bind:value={$userTastes} value="history" />
<br />
Endpoint:
<input
  type="text"
  bind:value={$endpoint}
  value="http://localhost:2345/upload" />
