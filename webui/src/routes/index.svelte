<script>
  import { goto } from "@sapper/app";
  import Camera from "../components/Camera.svelte";
  import Progress from "../components/Progress.svelte";
  import { init } from "./settings.svelte";

  init();

  let isLoading = false;

  function post(b64image) {
    const body = {
      userProfile: {
        id: parseInt(localStorage.getItem("userId")),
        language: localStorage.getItem("userLanguage"),
        tastes: localStorage.getItem("userTastes")
          ? localStorage
              .getItem("userTastes")
              .replace(", ", ",")
              .split(",")
          : [],
        expertiseLevel: parseInt(localStorage.getItem("userExpertiseLevel"))
      },
      image: b64image
    };

    const endpoint = new URL(localStorage.getItem("endpoint"));
    const classificationApiUrl = `${endpoint.protocol}//ia.${endpoint.hostname}/upload`;

    return fetch(classificationApiUrl, {
      method: "POST",
      cache: "no-cache",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json());
  }

  function handleSubmit(data) {
    isLoading = true;
    document.getElementById("container").style.display = "block";
    post(data.detail)
      .then(response => {
        // append the responseId to the responses array
        const history = JSON.parse(localStorage.getItem("history")) || [];
        history.push(response.requestId);
        localStorage.setItem("history", JSON.stringify(history));
        // push the response in the local storage
        localStorage.setItem(response.requestId, JSON.stringify(response));
        // navigate to the latest response
        goto("history/latest");
      })
      .catch(ex => console.error(ex));
  }
</script>

<style>
  #container {
    display: none;
  }
</style>

<svelte:head>
  <title>ArtGuide</title>
</svelte:head>

<Camera on:data={handleSubmit} />
<div id="container">
  Uploading... It could take a while, even one or two minutes.
  <br />
  We swear it's worth it.
  <br />
  Oh, really, who are we kidding! Just wait please.
  <br />
  <br />
  {#if isLoading}
    <Progress />
  {/if}
</div>
