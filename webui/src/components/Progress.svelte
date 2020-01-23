<style>
  .meter {
    height: 5px;
    position: relative;
    background: #f3efe6;
    overflow: hidden;
  }

  .meter span {
    display: block;
    height: 100%;
  }

  .progress {
    background-color: #e4c465;
    animation: progressBar 120s ease-out;
    animation-fill-mode: both;
  }

  @keyframes progressBar {
    0% {
      width: 0;
    }
    100% {
      width: 100%;
    }
  }
</style>

<div class="meter">
  <span class="progress" />
</div>
