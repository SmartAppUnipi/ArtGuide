<script>
  import { onMount } from "svelte";

  let history = [];
  onMount(() => {
    history = JSON.parse(localStorage.getItem("history")) || [];
  });
</script>

<svelte:head>
  <title>History | ArtGuide</title>
</svelte:head>

<h1>History</h1>
{#each history as item}
  <div>
    <a href="history/{item}">{item}</a>
  </div>
{:else}
  <span>History is empty. The scanned artworks will appear here.</span>
{/each}
