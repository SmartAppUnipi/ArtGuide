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
  <a href="history/{item}">{item}</a>
{:else}
  <span>History is empty. The scanned artworks will appear here.</span>
{/each}
