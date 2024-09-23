var minAccuracy = 0.2;

var webcam; // webcam input
var posenet; // PoseNet model
var poses = []; // array with the pose's points

var noseIndex = 0; // index in the pose array where the nose is found

var px = null; // previous x/y positions (for drawing
var py = null; // lines with your nose!

let demoVideo;
let backgroundVideo;

let ww, wh;

let imgBody,
  leftArm1,
  rightArm1,
  leftLeg1,
  rightLeg1,
  leftArm2,
  rightArm2,
  leftLeg2,
  rightLeg2;

let Outfit1Body,
  Outfit1LowerArm1,
  Outfit1LowerArm2,
  Outfit1Pants1,
  Outfit1Pants2,
  Outfit1Pants3,
  Outfit1Pants4,
  Outfit1Shoes1,
  Outfit1Shoes2,
  Outfit1UpperArm1,
  Outfit1UpperArm2;

let scaleFactor = 0.3;
let isPlaying = true;

let currentPose = null;
let targetPose = null;
const lerpAmount = 0.2; // Adjust this value between 0 and 1 to control smoothing

function preload() {
  //   demoVideo = createVideo("assets/demo.mp4");
  backgroundVideo = createVideo("assets/bg.mp4");
  imgBody = loadImage("assets/Body&Head.png");
  leftArm1 = loadImage("assets/Leftarm.png");
  rightArm1 = loadImage("assets/Rightarm.png");
  leftLeg1 = loadImage("assets/Leftleg.png");
  rightLeg1 = loadImage("assets/Rightleg.png");
  leftArm2 = loadImage("assets/Leftarm2.png");
  rightArm2 = loadImage("assets/Rightarm2.png");
  leftLeg2 = loadImage("assets/Leftleg2.png");
  rightLeg2 = loadImage("assets/Rightleg2.png");
  Outfit1Body = loadImage("assets/Outfit1Body.png");
  Outfit1LowerArm1 = loadImage("assets/Outfit1LowerArm1.png");
  Outfit1LowerArm2 = loadImage("assets/Outfit1LowerArm2.png");
  Outfit1Pants1 = loadImage("assets/Outfit1Pants1.png");
  Outfit1Pants2 = loadImage("assets/Outfit1Pants2.png");
  Outfit1Pants3 = loadImage("assets/Outfit1Pants3.png");
  Outfit1Pants4 = loadImage("assets/Outfit1Pants4.png");
  Outfit1Shoes1 = loadImage("assets/Outfit1Shoes1.png");
  Outfit1Shoes2 = loadImage("assets/Outfit1Shoes2.png");
  Outfit1UpperArm1 = loadImage("assets/Outfit1UpperArm1.png");
  Outfit1UpperArm2 = loadImage("assets/Outfit1UpperArm2.png");
}

function setup() {
  //   wh = windowHeight;
  //   ww = (wh * 16) / 9;
  ww = windowWidth;
  wh = windowHeight;
  createCanvas(ww, wh);

  webcam = createCapture(VIDEO);
  //   webcam = demoVideo;
  //   demoVideo.volume(0);
  //   demoVideo.loop();

  //   demoVideo.hide();

  webcam.size(width, height);
  webcam.hide();
  background(255);

  var options = { detectionType: "single", flipHorizontal: true };

  posenet = ml5.poseNet(webcam, options);

  // this funny-looking bit of code tells PoseNet
  // what to do every time it finds a valid pose
  posenet.on("pose", function (results) {
    gotPoses(results);
  });

  let button;
  button = createButton("Start");
  button.mousePressed(() => {
    console.log("Pressed");
  });
  button.position(10, 10);

  backgroundVideo.hide();
  backgroundVideo.loop();
}

function gotPoses(results) {
  if (results.length > 0) {
    targetPose = results[0].pose;
    if (!currentPose) {
      currentPose = JSON.parse(JSON.stringify(targetPose));
    }
  }
}

function mousePressed() {
  if (isPlaying) {
    demoVideo.pause();
  } else {
    demoVideo.play();
  }
  isPlaying = !isPlaying;
}

function draw() {
  clear();
  push();
  image(
    backgroundVideo,
    0,
    0,
    backgroundVideo.width * (wh / backgroundVideo.height),
    wh
  );
  // translate(width, 0);
  // scale(-1, 1);
  //   scale(ww / demoVideo.width, wh / demoVideo.height);

  //   image(demoVideo, 0, 0, width, height);
  //   scale(-1, 1);
  //   image(webcam, 0, 0, -width, height);
  pop();

  if (currentPose && targetPose) {
    push();
    lerpPoses();
    // drawKeypoints();

    push();
    translate(0, -10);
    scale(0.8);
    drawBody();
    drawOutfit1();
    pop();
    pop();
  }
}

function getBodyCenter() {
  // get the body center by averaging the x and y coordinates of the keypoints: right shoulder, left shoulder, right hip, left hip
  var x = 0;
  var y = 0;
  if (!currentPose) {
    return { x: 0, y: 0 };
  }

  var keypoints = currentPose.keypoints;
  x =
    (keypoints[5].position.x +
      keypoints[6].position.x +
      keypoints[11].position.x +
      keypoints[12].position.x) /
    4;
  y =
    (keypoints[5].position.y +
      keypoints[6].position.y +
      keypoints[11].position.y +
      keypoints[12].position.y) /
    4;

  return {
    x: (x + keypoints[0].position.x) / 2,
    y: (y + keypoints[0].position.y) / 2,
  };
}

function drawBody() {
  var bodyCenter = getBodyCenter();
  // Draw the body
  push();
  translate(
    bodyCenter.x - (scaleFactor * imgBody.width) / 2,
    bodyCenter.y - (scaleFactor * imgBody.height) / 2
  );
  image(
    imgBody,
    0,
    0,
    scaleFactor * imgBody.width,
    scaleFactor * imgBody.height
  );
  pop();

  // Draw the left arm1
  push();
  translate(bodyCenter.x + 30, bodyCenter.y - 50);
  let angle = atan2(
    currentPose.keypoints[7].position.y - currentPose.keypoints[5].position.y,
    currentPose.keypoints[7].position.x - currentPose.keypoints[5].position.x
  );
  rotate(angle);
  image(
    leftArm1,
    0,
    (-scaleFactor * leftArm1.height) / 2,
    scaleFactor * leftArm1.width,
    scaleFactor * leftArm1.height
  );

  //   Draw the left arm2
  translate(scaleFactor * leftArm1.width - 10, -5);
  angle = atan2(
    currentPose.keypoints[9].position.y - currentPose.keypoints[7].position.y,
    currentPose.keypoints[9].position.x - currentPose.keypoints[7].position.x
  );
  rotate(angle);
  image(
    leftArm2,
    0,
    (-scaleFactor * leftArm2.height) / 2,
    scaleFactor * leftArm2.width,
    scaleFactor * leftArm2.height
  );
  pop();

  // Draw the right arm1
  push();
  translate(bodyCenter.x - 30, bodyCenter.y - 45);
  angle = atan2(
    currentPose.keypoints[8].position.y - currentPose.keypoints[6].position.y,
    currentPose.keypoints[8].position.x - currentPose.keypoints[6].position.x
  );
  rotate(angle);
  image(
    rightArm1,
    0,
    (-scaleFactor * rightArm1.height) / 2,
    scaleFactor * rightArm1.width,
    scaleFactor * rightArm1.height
  );

  // Draw the right arm2
  translate(scaleFactor * rightArm1.width - 10, -20);
  angle = atan2(
    currentPose.keypoints[10].position.y - currentPose.keypoints[8].position.y,
    currentPose.keypoints[10].position.x - currentPose.keypoints[8].position.x
  );
  rotate(angle + PI);
  image(
    rightArm2,
    0,
    (-scaleFactor * rightArm2.height) / 2,
    scaleFactor * rightArm2.width,
    scaleFactor * rightArm2.height
  );
  pop();

  // Draw the left leg1
  push();
  translate(bodyCenter.x + 35, bodyCenter.y + 130);
  angle = atan2(
    currentPose.keypoints[13].position.y - currentPose.keypoints[11].position.y,
    currentPose.keypoints[13].position.x - currentPose.keypoints[11].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    leftLeg1,
    (-scaleFactor * leftLeg1.width) / 2,
    0,
    scaleFactor * leftLeg1.width,
    scaleFactor * leftLeg1.height
  );

  // Draw the left leg2
  translate(-5, scaleFactor * leftLeg1.height - 10);
  angle = atan2(
    currentPose.keypoints[15].position.y - currentPose.keypoints[13].position.y,
    currentPose.keypoints[15].position.x - currentPose.keypoints[13].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    leftLeg2,
    0,
    0,
    scaleFactor * leftLeg2.width,
    scaleFactor * leftLeg2.height
  );
  pop();

  // Draw the right leg1
  push();
  translate(bodyCenter.x - 30, bodyCenter.y + 130);
  angle = atan2(
    currentPose.keypoints[14].position.y - currentPose.keypoints[12].position.y,
    currentPose.keypoints[14].position.x - currentPose.keypoints[12].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    rightLeg1,
    (-scaleFactor * rightLeg1.width) / 2,
    0,
    scaleFactor * rightLeg1.width,
    scaleFactor * rightLeg1.height
  );

  // Draw the right leg2
  translate(-5, scaleFactor * rightLeg1.height - 10);
  angle = atan2(
    currentPose.keypoints[16].position.y - currentPose.keypoints[14].position.y,
    currentPose.keypoints[16].position.x - currentPose.keypoints[14].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    rightLeg2,
    (-scaleFactor * rightLeg2.width) / 2,
    0,
    scaleFactor * rightLeg2.width,
    scaleFactor * rightLeg2.height
  );
  pop();
}

function drawOutfit1() {
  var bodyCenter = getBodyCenter();

  // Draw the left arm1
  push();
  translate(bodyCenter.x + 50, bodyCenter.y - 70);
  scale(1.1);
  let angle = atan2(
    currentPose.keypoints[7].position.y - currentPose.keypoints[5].position.y,
    currentPose.keypoints[7].position.x - currentPose.keypoints[5].position.x
  );
  rotate(angle);
  image(
    Outfit1UpperArm2,
    10,
    (-scaleFactor * Outfit1UpperArm2.height) / 2,
    scaleFactor * Outfit1UpperArm2.width,
    scaleFactor * Outfit1UpperArm2.height
  );
  //   Draw the left arm2
  translate(scaleFactor * leftArm1.width - 20, 0);
  angle = atan2(
    currentPose.keypoints[9].position.y - currentPose.keypoints[7].position.y,
    currentPose.keypoints[9].position.x - currentPose.keypoints[7].position.x
  );
  rotate(angle);

  image(
    Outfit1LowerArm2,
    -50,
    (-scaleFactor * Outfit1LowerArm2.height) / 2,
    scaleFactor * Outfit1LowerArm2.width,
    scaleFactor * Outfit1LowerArm2.height
  );
  pop();

  // Draw the right arm1
  push();
  translate(bodyCenter.x - 40, bodyCenter.y - 60);
  angle = atan2(
    currentPose.keypoints[8].position.y - currentPose.keypoints[6].position.y,
    currentPose.keypoints[8].position.x - currentPose.keypoints[6].position.x
  );
  rotate(angle);
  image(
    Outfit1UpperArm1,
    10,
    (-scaleFactor * Outfit1UpperArm1.height) / 2,
    scaleFactor * Outfit1UpperArm1.width,
    scaleFactor * Outfit1UpperArm1.height
  );

  // Draw the right arm2
  translate(scaleFactor * rightArm1.width - 10, -20);
  angle = atan2(
    currentPose.keypoints[10].position.y - currentPose.keypoints[8].position.y,
    currentPose.keypoints[10].position.x - currentPose.keypoints[8].position.x
  );
  rotate(angle + PI);
  image(
    Outfit1LowerArm1,
    -50,
    (-scaleFactor * Outfit1LowerArm1.height) / 2,
    scaleFactor * Outfit1LowerArm1.width,
    scaleFactor * Outfit1LowerArm1.height
  );
  pop();

  // Draw the left leg1
  push();
  translate(bodyCenter.x + 50, bodyCenter.y + 120);
  angle = atan2(
    currentPose.keypoints[13].position.y - currentPose.keypoints[11].position.y,
    currentPose.keypoints[13].position.x - currentPose.keypoints[11].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    Outfit1Pants2,
    -50,
    (-scaleFactor * Outfit1Pants2.width) / 2,
    scaleFactor * Outfit1Pants2.width,
    scaleFactor * Outfit1Pants2.height
  );

  // Draw the left leg2
  translate(-45, scaleFactor * leftLeg1.height - 30);
  angle = atan2(
    currentPose.keypoints[15].position.y - currentPose.keypoints[13].position.y,
    currentPose.keypoints[15].position.x - currentPose.keypoints[13].position.x
  );
  rotate(angle - 0.5 * PI + 0.1);
  image(
    Outfit1Pants4,
    0,
    -20,
    scaleFactor * Outfit1Pants4.width,
    scaleFactor * Outfit1Pants4.height
  );

  pop();

  // Draw the right leg1
  push();
  translate(bodyCenter.x - 50, bodyCenter.y + 100);
  angle = atan2(
    currentPose.keypoints[14].position.y - currentPose.keypoints[12].position.y,
    currentPose.keypoints[14].position.x - currentPose.keypoints[12].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    Outfit1Pants1,
    -50,
    -20,
    scaleFactor * Outfit1Pants1.width,
    scaleFactor * Outfit1Pants1.height
  );

  // Draw the right leg2
  translate(-60, scaleFactor * rightLeg1.height);
  angle = atan2(
    currentPose.keypoints[16].position.y - currentPose.keypoints[14].position.y,
    currentPose.keypoints[16].position.x - currentPose.keypoints[14].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    Outfit1Pants3,
    0,
    -20,
    scaleFactor * Outfit1Pants3.width,
    scaleFactor * Outfit1Pants3.height
  );
  pop();

  // Draw the clothes
  push();
  translate(
    bodyCenter.x - (scaleFactor * imgBody.width) / 2,
    bodyCenter.y - (scaleFactor * imgBody.height) / 2
  );
  translate(-40, 10);
  image(
    Outfit1Body,
    0,
    0,
    scaleFactor * Outfit1Body.width,
    scaleFactor * Outfit1Body.height
  );
  pop();
}

function lerpPoses() {
  for (let i = 0; i < currentPose.keypoints.length; i++) {
    let current = currentPose.keypoints[i].position;
    let target = targetPose.keypoints[i].position;

    current.x = lerp(current.x, target.x, lerpAmount);
    current.y = lerp(current.y, target.y, lerpAmount);

    // Also lerp the score if you're using it
    currentPose.keypoints[i].score = lerp(
      currentPose.keypoints[i].score,
      targetPose.keypoints[i].score,
      lerpAmount
    );
  }
}

function drawKeypoints() {
  // if no poses were found, stop here
  if (!currentPose) {
    return;
  }

  // go through each keypoint in the pose
  for (let i = 0; i < currentPose.keypoints.length; i++) {
    let keypoint = currentPose.keypoints[i];

    // if this point's accuracy score is high enough,
    // draw it as a circle and label it
    if (keypoint.score > minAccuracy) {
      let x = keypoint.position.x;
      let y = keypoint.position.y;

      fill(0);
      stroke(255);
      ellipse(x, y, 10, 10);

      fill(255, 0, 0);
      noStroke();
      let score = nf(keypoint.score, 0, 2);
      text(i + " (" + score + ")", x + 15, y + 15);
    }
  }
}
