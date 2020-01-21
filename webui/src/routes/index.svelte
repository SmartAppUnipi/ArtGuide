<script>
  import Camera from "../components/Camera.svelte";

  function post(b64image) {
    const endpoint = localStorage.getItem("endpoint");

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

    return fetch(endpoint, {
      method: "POST",
      cache: "no-cache",
      headers: {
				"Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json());
  }

  function handleSubmit(data) {
    console.log("Uploading...");
    const container = document.getElementById("container");

    post(data.detail)
      .then(response => {
        console.log(response);
        container.innerText = response.tailoredText;
        container.style.background = "none";
      })
      .catch(ex => console.error(ex));
  }
</script>

<style>

</style>

<svelte:head>
  <title>ArtGuide</title>
</svelte:head>
<Camera on:data={handleSubmit} />
<div id="container" />
