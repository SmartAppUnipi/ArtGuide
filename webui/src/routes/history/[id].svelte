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

  function updateLikeButtonsUI(like, sentenceId) {
    if (like) {
      document.getElementById("like-" + sentenceId).src =
        "like-colored.png";
      document.getElementById("dislike-" + sentenceId).src =
        "dislike.png";
    } else {
      document.getElementById("dislike-" + sentenceId).src =
        "dislike-colored.png";
      document.getElementById("like-" + sentenceId).src = "like.png";
    }
  }

  function submitValidation(sentence, like) {
    updateLikeButtonsUI(like, sentence.sentenceId);

    const endpoint = new URL(localStorage.getItem("endpoint"));
    const validationApiUrl = `${endpoint.protocol}//${endpoint.hostname}:3000/validation`;

    console.log(response, sentence, like);

    return fetch(validationApiUrl, {
      method: "POST",
      cache: "no-cache",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: {
        requestId: response.requestId,
        sentenceId: sentence.sentenceId,
        validation: like ? 1 : -1
      }
    }).then(() => {
      console.log("Done");
    });
  }
</script>

<style>
  .sentence {
    text-align-last: center;
  }

  img {
    cursor: pointer;
  }
</style>

<svelte:head>
  <title>Result | ArtGuide</title>
</svelte:head>

{#if response}
  <h1>
    {#if response.knownInstance}
      {response.knownInstance.wikipediaPageTitle}
    {:else}Result{/if}
  </h1>
  {#each response.validation as item}
    {#if item.text.length > 20}
      <span
        id={item.sentenceId}
        class="sentence"
        contenteditable="true"
        bind:innerHTML={item.text} />

      <div style="text-align: center">
        <img
          src="like.png"
          height="30px"
          alt="Like"
          id="like-{item.sentenceId}"
          on:click={submitValidation(item, true)} />
        <img
          src="dislike.png"
          height="30px"
          alt="Dislike"
          id="dislike-{item.sentenceId}"
          on:click={submitValidation(item, false)} />
      </div>

      <div style="height: 10px" />
    {:else}
      <span class="sentence-short">{item.text}</span>
    {/if}
  {/each}
{:else}
  <span>Sorry, no response</span>
{/if}
