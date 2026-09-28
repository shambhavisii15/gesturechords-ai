const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Screen Resolution Fix
canvasElement.width = 1280;
canvasElement.height = 720;

// Sound Synth Setup (Tone.js)
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

// MediaPipe Hands Tracker Initialize
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Sound play flag to avoid overlap noise
let isPlaying = false;

hands.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      // 1. Haath ke saare dots draw karo
      for (let point of landmarks) {
        let x = point.x * canvasElement.width;
        let y = point.y * canvasElement.height;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
        canvasCtx.fillStyle = "#00FF00";
        canvasCtx.fill();
      }

      // 2. Thumb (Point 4) aur Index Finger (Point 8) ka distance
      let thumb = landmarks[4];
      let index = landmarks[8];
      let distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);

      // 3. Gesture detect logic
      if (distance < 0.05) {
        if (!isPlaying) {
          Tone.start();
          synth.triggerAttackRelease(["E4", "G#4", "B4"], "8n"); // E Major Chord
          isPlaying = true;
        }
      } else {
        isPlaying = false;
      }
    }
  }
  canvasCtx.restore();
});

// Camera Start
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720
});
camera.start();