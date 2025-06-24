  // Create the loading screen HTML
  document.write(`
    <style>

      :root {
          --grid-color: rgba(255, 255, 255, 0.35);
          --grid-size: 64px;
          --grid-blur: 0px;
      }

      .grid {
          position: absolute; bottom: -15%; left: 0; margin-left: -50%; width: 200%; height: 100%; z-index: 1;
          background-position-y: 0px;
          background-image: repeating-linear-gradient(90deg, var(--grid-color, black) 0%, transparent calc(1px + var(--grid-blur, 0px)), transparent var(--grid-size), var(--grid-color, black) calc(var(--grid-size) + 1px + var(--grid-blur, 0px))), repeating-linear-gradient(180deg, var(--grid-color, black) 0%, transparent calc(1px + var(--grid-blur, 0px)), transparent var(--grid-size), var(--grid-color, black) calc(var(--grid-size) + 1px + var(--grid-blur, 0px)));
          transform: perspective(50vh) rotateX(60deg) translateZ(10px);
          animation: moving-grid 8s infinite linear;
          
      }

      @keyframes moving-grid{
        0%{ transform:perspective(50vh) rotateX(60deg) translateZ(10px) translateY(-var(--grid-size)); }
        100%{ transform:perspective(50vh) rotateX(60deg) translateZ(10px) translateY(var(--grid-size)); }
      }

      .rolling-backdrop{
          background: linear-gradient(to bottom, #010310 0, #000000 24%, #212121 45%, #252525 51%, #000000 65%, #000000 27% ) fixed;
          background-size: 100% 100vh;
          overflow: hidden;
          position: absolute;
          left: 0;
          top: 0;
          width: 100vw;
          height: var(--background-height, 100vh);
          z-index: 0;
          pointer-events: none;
      }


      #loading-screen {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: transparent;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 999;
        pointer-events: none;
        color: white;
        font-family: sans-serif;
        transition: opacity 1s ease-in-out;
        opacity: 1;
        overflow: hidden;
      }

      #loading-screen .loading-text {
        font-size: 0.8rem;
        letter-spacing: 8px;
        line-height: 2rem;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 5px;
        border-radius: 4px;
        z-index: 9;
        width: 316px;
        position: absolute;
        bottom: 4%;
        right: 50%;
        text-align: center;
        margin-right: -158px;
      } 

      #loading-screen .loading-logo {
        font-size: 10px;
        padding-left: 5px;
        letter-spacing:4px;
        line-height: 2rem;
        background-color: rgba(0, 0, 0, 0.05);
        z-index: 9;
        width: 100px;
        position: fixed;
        top: 50%;
        right: 50%;
        text-align: center;
        margin-right: -50px;
        text-shadow: 1px 1px 3px #fff;
        color: #000;
        border: 2px dashed rgba(0, 0, 0, 0.05);
      } 

      .cube {
        position: relative;
        width: 164px;
        height: 164px;
        transform-style: preserve-3d;
        animation: spin 20s infinite linear;
        z-index: 2;
      }

      .face {
        position: absolute;
        width: 164px;
        height: 164px;
        opacity: 0.95;
        border: 24px dashed rgba(255, 255, 255, 0.25);
        animation: borderSwell 2.5s infinite alternate ease-in-out;
        /* background-color: transparent !important; */
      }

      @keyframes borderSwell {
        0%   { border-width: 18px }
        100%   { border-width: 36px }
      }

      .front  { background: #ffb816; transform: rotateY(  0deg) translateZ(82px); }
      .back   { background: #92278f; transform: rotateY(180deg) translateZ(82px); }
      .left   { background: #019390; transform: rotateY(-90deg) translateZ(82px); }
      .right  { background: #dc0864; transform: rotateY( 90deg) translateZ(82px); }
      .top    { background: #0079c2; transform: rotateX( 90deg) translateZ(82px); }
      .bottom { background: #f57b20; transform: rotateX(-90deg) translateZ(82px); }

      @keyframes spin {
        from { transform: rotateX(0deg) rotateY(0deg); }
        to   { transform: rotateX(360deg) rotateY(360deg); }
      }


    </style>

    <div id="loading-screen">
      <div class="cube">
        <div class="face front"></div>
        <div class="face back"></div>
        <div class="face left"></div>
        <div class="face right"></div>
        <div class="face top"></div>
        <div class="face bottom"></div>
      </div>
      <span class="loading-logo">[XRS]</span>
      <span class="loading-text">LOADING EXPERIENCE... PLEASE WAIT</span>
      <div class="rolling-backdrop">
        <div class="grid"></div>
      </div>
    </div>
`);

// Add fade in/out methods for the loading screen
window.fadeInLoadingScreen = function(durationMs = 1000) {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;
  loadingScreen.style.transition = `opacity ${durationMs}ms ease-in-out`;
  loadingScreen.style.opacity = '1';
  loadingScreen.style.display = 'flex';
};

window.fadeOutLoadingScreen = function(durationMs = 750) {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;
  loadingScreen.style.transition = `opacity ${durationMs}ms ease-in-out`;
  loadingScreen.style.opacity = '0';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, durationMs);
};