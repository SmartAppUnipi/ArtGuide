<script>
  import { onMount } from "svelte";
	import { stores } from "@sapper/app";
	
  const { page } = stores();
	let { id } = $page.params;
	
	if (id == "latest") {
		const history = JSON.parse(localStorage.getItem("history")) || [];
    id = history.length ? history[history.length - 1] : undefined;
	}

  let response;
  onMount(() => {
    response = JSON.parse(localStorage.getItem(id));
  });
</script>

<svelte:head>
  <title>Result | ArtGuide</title>
</svelte:head>

<h1>Result</h1>
{#if response}
  {#each response.validation as item}
    <span id={item.sentenceId}>{item.text}</span>
  {/each}
{:else}
  <span>Sorry, no response</span>
{/if}
