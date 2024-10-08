var minAccuracy = 0.5;

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

let Outfit2Body,
  Outfit2LowerArm1,
  Outfit2LowerArm2,
  Outfit2Pants1,
  Outfit2Pants2,
  Outfit2Shoes1,
  Outfit2Shoes2,
  Outfit2UpperArm1,
  Outfit2UpperArm2;

let cupImg;

let scaleFactor = 0.3;
let isPlaying = false;

let currentPose = null;
let targetPose = null;

let currentPose2 = null;
let targetPose2 = null;
const lerpAmount = 0.5; // Adjust this value between 0 and 1 to control smoothing
let button;
let outfit = false;

let fadeAlpha = 0;

function preload() {
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

  Outfit2Body = loadImage("assets/Outfit2Body.png");
  Outfit2LowerArm1 = loadImage("assets/Outfit2LowerArm1.png");
  Outfit2LowerArm2 = loadImage("assets/Outfit2LowerArm2.png");
  Outfit2Pants1 = loadImage("assets/Outfit2Pants1.png");
  Outfit2Pants2 = loadImage("assets/Outfit2Pants2.png");
  Outfit2Shoes1 = loadImage("assets/Outfit2Shoes1.png");
  Outfit2Shoes2 = loadImage("assets/Outfit2Shoes2.png");
  Outfit2UpperArm1 = loadImage("assets/Outfit2UpperArm1.png");
  Outfit2UpperArm2 = loadImage("assets/Outfit2UpperArm2.png");

  cupImg = loadImage("assets/Cup.png");
}

function setup() {
  wh = windowHeight;
  ww = (wh * 16) / 9;
  createCanvas(ww, wh);

  webcam = createCapture(VIDEO);

  webcam.size(width, height);
  webcam.hide();
  background(255);

  // socket = io("http://192.168.68.66:3000");
  socket = io("http://localhost:3000");

  // Listen for 'skeletonData' events
  socket.on("skeletonData", (data) => {
    // Process the received skeleton data
    processSkeletonData(data);
  });

  var options = {
    detectionType: "single",
    flipHorizontal: false,
    maxPoseDetections: 2,
  };

  // posenet = ml5.poseNet(webcam, options);

  // this funny-looking bit of code tells PoseNet
  // what to do every time it finds a valid pose
  // posenet.on("pose", function (results) {
  //   gotPoses(results);
  // });

  button = createButton("Start");
  button.mousePressed(() => {
    playVideo();
  });
  button.position(10, 10);
  backgroundVideo.hide();
  image(
    backgroundVideo,
    0,
    0,
    backgroundVideo.width * (wh / backgroundVideo.height),
    wh
  );
  button.hide();
}

function processSkeletonData(data) {
  // console.log("Received skeleton data:", data);

  // Ensure we have data and it's in the expected format
  if (!data || !data.length) {
    console.error("Invalid skeleton data format");
    return;
  }

  // Process up to two skeletons
  for (let i = 0; i < Math.min(data.length, 2); i++) {
    if (!data[i] || !data[i].joints) {
      console.error(`Invalid skeleton data format for skeleton ${i}`);
      continue;
    }

    const joints = data[i].joints;
    let keypoints = [];

    const jointMapping = {
      3: 0, // HEAD to nose
      2: 1, // NECK to leftEye (approximation)
      2: 2, // NECK to rightEye (approximation)
      3: 3, // HEAD to leftEar (approximation)
      3: 4, // HEAD to rightEar (approximation)
      4: 5, // SHOULDERLEFT to leftShoulder
      8: 6, // SHOULDERRIGHT to rightShoulder
      5: 7, // ELBOWLEFT to leftElbow
      9: 8, // ELBOWRIGHT to rightElbow
      6: 9, // WRISTLEFT to leftWrist
      10: 10, // WRISTRIGHT to rightWrist
      12: 11, // HIPLEFT to leftHip
      16: 12, // HIPRIGHT to rightHip
      13: 13, // KNEELEFT to leftKnee
      17: 14, // KNEERIGHT to rightKnee
      14: 15, // ANKLELEFT to leftAnkle
      18: 16, // ANKLERIGHT to rightAnkle
    };

    for (let poseNetIndex = 0; poseNetIndex < 17; poseNetIndex++) {
      const kinectIndex = Object.keys(jointMapping).find(
        (key) => jointMapping[key] === poseNetIndex
      );

      if (kinectIndex !== undefined && joints[kinectIndex]) {
        const joint = joints[kinectIndex];
        keypoints.push({
          position: {
            x: (1 -joint.depthX) * width,
            y: joint.depthY * height,
          },
          score: joint.trackingState === 2 ? 1 : 0.5,
          part: getPoseNetPartName(poseNetIndex),
        });
      } else {
        keypoints.push({
          position: { x: 0, y: 0 },
          score: 0,
          part: getPoseNetPartName(poseNetIndex),
        });
      }
    }

    // Create a PoseNet-like structure
    let pose = {
      keypoints: keypoints,
      score: 1, // You might want to calculate this based on individual keypoint scores
    };

    // Update poses based on which skeleton we're processing
    if (i === 0) {
      targetPose = pose;
      if (!currentPose) {
        currentPose = JSON.parse(JSON.stringify(pose));
      } else {
        // Smooth transition between poses
        lerpPoses(currentPose, targetPose);
      }
    } else if (i === 1) {
      targetPose2 = pose;
      if (!currentPose2) {
        currentPose2 = JSON.parse(JSON.stringify(pose));
      } else {
        // Smooth transition between poses
        lerpPoses(currentPose2, targetPose2);
      }
    }
  }
}

// Helper function to get PoseNet part names (same as before)
function getPoseNetPartName(index) {
  const partNames = [
    "nose",
    "leftEye",
    "rightEye",
    "leftEar",
    "rightEar",
    "leftShoulder",
    "rightShoulder",
    "leftElbow",
    "rightElbow",
    "leftWrist",
    "rightWrist",
    "leftHip",
    "rightHip",
    "leftKnee",
    "rightKnee",
    "leftAnkle",
    "rightAnkle",
  ];
  return partNames[index];
}

function playVideo() {
  backgroundVideo.muted = true;
  backgroundVideo.play();
  isPlaying = true;
  // backgroundVideo.speed(10);
  setTimeout(() => {
    outfit = true;
  }, 3000);
  button.hide();
}

function gotPoses(results) {
  if (results.length > 0) {
    targetPose = results[0].pose;
    if (!currentPose) {
      currentPose = JSON.parse(JSON.stringify(targetPose));
    }
    if (
      results.length > 1 &&
      abs(getBodyCenter(results[0].pose).x - getBodyCenter(results[1].pose).x) >
        100
    ) {
      targetPose2 = results[1].pose;
      if (!currentPose2) {
        currentPose2 = JSON.parse(JSON.stringify(targetPose2));
      }
    }
  }
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
  pop();
  // console.log("currentPose", currentPose);
  // console.log("targetPose", targetPose);
  if (currentPose && targetPose) {
    push();
    scale(-1, 1);
    translate(-width + width/3, 0);
    translate(0, 150);
    scale(0.8);
    drawBody(currentPose);
    if (outfit) {
      tint(255, fadeAlpha);
      fadeAlpha += 10;
      drawOutfit1(currentPose);
      noTint();
    }
    pop();
  }
  if (currentPose2 && targetPose2) {
    push();
    scale(-1, 1);
    translate(-width, 0);
    translate(0, 150);
    scale(0.8);
    drawBody(currentPose2);
    if (outfit) {
      tint(255, fadeAlpha);
      fadeAlpha += 10;
      drawOutfit2(currentPose2); // You might want to use a different outfit for the second person
      noTint();
    }
    pop();
  }
}

function keyPressed() {
  if (keyCode === 32) {
    // 32 is the keyCode for the space bar
    // Your code here - this will run when space is pressed
    console.log("Space bar pressed!");
    // For example, you could toggle video play/pause:
    if (isPlaying) {
      console.log("is playing");
      backgroundVideo.pause();
      isPlaying = false;
    } else {
      console.log("is not playing");
      backgroundVideo.play();
      isPlaying = true;
    }
  }
  if (keyCode === 13) {
    playVideo();
  }
}

function getBodyCenter(poseData) {
  // get the body center by averaging the x and y coordinates of the keypoints: right shoulder, left shoulder, right hip, left hip
  var x = 0;
  var y = 0;
  if (!poseData) {
    return { x: 0, y: 0 };
  }

  var keypoints = poseData.keypoints;
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

function drawBody(poseData) {
  var bodyCenter = getBodyCenter(poseData);
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
    poseData.keypoints[7].position.y - poseData.keypoints[5].position.y,
    poseData.keypoints[7].position.x - poseData.keypoints[5].position.x
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
  rotate(-angle);
  angle = atan2(
    poseData.keypoints[9].position.y - poseData.keypoints[7].position.y,
    poseData.keypoints[9].position.x - poseData.keypoints[7].position.x
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
    poseData.keypoints[8].position.y - poseData.keypoints[6].position.y,
    poseData.keypoints[8].position.x - poseData.keypoints[6].position.x
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
  rotate(-angle);
  angle = atan2(
    poseData.keypoints[10].position.y - poseData.keypoints[8].position.y,
    poseData.keypoints[10].position.x - poseData.keypoints[8].position.x
  );
  rotate(angle);
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
    poseData.keypoints[13].position.y - poseData.keypoints[11].position.y,
    poseData.keypoints[13].position.x - poseData.keypoints[11].position.x
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
    poseData.keypoints[15].position.y - poseData.keypoints[13].position.y,
    poseData.keypoints[15].position.x - poseData.keypoints[13].position.x
  );
  rotate(angle - 0.5 * PI);
  if (!outfit) {
    image(
      leftLeg2,
      0,
      0,
      scaleFactor * leftLeg2.width,
      scaleFactor * leftLeg2.height
    );
  }

  pop();

  // Draw the right leg1
  push();
  translate(bodyCenter.x - 30, bodyCenter.y + 130);
  angle = atan2(
    poseData.keypoints[14].position.y - poseData.keypoints[12].position.y,
    poseData.keypoints[14].position.x - poseData.keypoints[12].position.x
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
    poseData.keypoints[16].position.y - poseData.keypoints[14].position.y,
    poseData.keypoints[16].position.x - poseData.keypoints[14].position.x
  );
  rotate(angle - 0.5 * PI);
  if (!outfit) {
    image(
      rightLeg2,
      (-scaleFactor * rightLeg2.width) / 2,
      0,
      scaleFactor * rightLeg2.width,
      scaleFactor * rightLeg2.height
    );
  }
  pop();
}

function drawOutfit1(poseData) {
  var bodyCenter = getBodyCenter(poseData);

  // Draw the left arm1
  push();
  translate(bodyCenter.x + 50, bodyCenter.y - 70);
  scale(1.1);
  let angle = atan2(
    poseData.keypoints[7].position.y - poseData.keypoints[5].position.y,
    poseData.keypoints[7].position.x - poseData.keypoints[5].position.x
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
  rotate(-angle);
  angle = atan2(
    poseData.keypoints[9].position.y - poseData.keypoints[7].position.y,
    poseData.keypoints[9].position.x - poseData.keypoints[7].position.x
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
    poseData.keypoints[8].position.y - poseData.keypoints[6].position.y,
    poseData.keypoints[8].position.x - poseData.keypoints[6].position.x
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
  rotate(-angle);
  angle = atan2(
    poseData.keypoints[10].position.y - poseData.keypoints[8].position.y,
    poseData.keypoints[10].position.x - poseData.keypoints[8].position.x
  );
  rotate(angle);
  image(
    Outfit1LowerArm1,
    -50,
    (-scaleFactor * Outfit1LowerArm1.height) / 2,
    scaleFactor * Outfit1LowerArm1.width,
    scaleFactor * Outfit1LowerArm1.height
  );
  translate(180, -20);
  rotate(PI);
  image(
    cupImg,
    -10,
    -30,
    scaleFactor * cupImg.width,
    scaleFactor * cupImg.height
  );
  pop();

  // Draw the left leg1
  push();
  translate(bodyCenter.x + 50, bodyCenter.y + 120);
  angle = atan2(
    poseData.keypoints[13].position.y - poseData.keypoints[11].position.y,
    poseData.keypoints[13].position.x - poseData.keypoints[11].position.x
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
    poseData.keypoints[15].position.y - poseData.keypoints[13].position.y,
    poseData.keypoints[15].position.x - poseData.keypoints[13].position.x
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
    poseData.keypoints[14].position.y - poseData.keypoints[12].position.y,
    poseData.keypoints[14].position.x - poseData.keypoints[12].position.x
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
    poseData.keypoints[16].position.y - poseData.keypoints[14].position.y,
    poseData.keypoints[16].position.x - poseData.keypoints[14].position.x
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

function drawOutfit2(poseData) {
  var bodyCenter = getBodyCenter(poseData);

  // Draw the left arm1
  push();
  translate(bodyCenter.x + 50, bodyCenter.y - 50);
  scale(1.1);
  let angle = atan2(
    poseData.keypoints[7].position.y - poseData.keypoints[5].position.y,
    poseData.keypoints[7].position.x - poseData.keypoints[5].position.x
  );
  rotate(angle);
  image(
    Outfit2UpperArm2,
    10,
    (-scaleFactor * Outfit2UpperArm2.height) / 2,
    scaleFactor * Outfit2UpperArm2.width,
    scaleFactor * Outfit2UpperArm2.height
  );
  //   Draw the left arm2
  translate(scaleFactor * Outfit2UpperArm2.width + 20, 0);
  rotate(-angle);
  angle = atan2(
    poseData.keypoints[9].position.y - poseData.keypoints[7].position.y,
    poseData.keypoints[9].position.x - poseData.keypoints[7].position.x
  );
  rotate(angle);

  image(
    Outfit2LowerArm2,
    -50,
    (-scaleFactor * Outfit2LowerArm2.height) / 2,
    scaleFactor * Outfit2LowerArm2.width,
    scaleFactor * Outfit2LowerArm2.height
  );
  pop();

  // Draw the right arm1
  push();
  translate(bodyCenter.x - 30, bodyCenter.y - 50);
  angle = atan2(
    poseData.keypoints[8].position.y - poseData.keypoints[6].position.y,
    poseData.keypoints[8].position.x - poseData.keypoints[6].position.x
  );
  rotate(angle);
  image(
    Outfit2UpperArm1,
    10,
    (-scaleFactor * Outfit2UpperArm1.height) / 2,
    scaleFactor * Outfit2UpperArm1.width,
    scaleFactor * Outfit2UpperArm1.height
  );

  // Draw the right arm2
  translate(scaleFactor * rightArm1.width - 10, -20);
  ellipse(0, 0, 30, 30);
  rotate(-angle);
  angle = atan2(
    poseData.keypoints[10].position.y - poseData.keypoints[8].position.y,
    poseData.keypoints[10].position.x - poseData.keypoints[8].position.x
  );
  rotate(angle);
  image(
    Outfit2LowerArm1,
    -50,
    (-scaleFactor * Outfit2LowerArm1.height) / 2,
    scaleFactor * Outfit2LowerArm1.width,
    scaleFactor * Outfit2LowerArm1.height
  );
  translate(180, -20);
  rotate(PI);
  image(
    cupImg,
    -10,
    -50,
    scaleFactor * cupImg.width,
    scaleFactor * cupImg.height
  );
  pop();

  // Draw the left leg1
  push();
  translate(bodyCenter.x + 30, bodyCenter.y + 150);
  angle = atan2(
    poseData.keypoints[13].position.y - poseData.keypoints[11].position.y,
    poseData.keypoints[13].position.x - poseData.keypoints[11].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    Outfit2Pants2,
    -50,
    (-scaleFactor * Outfit2Pants2.width) / 2,
    scaleFactor * Outfit2Pants2.width,
    scaleFactor * Outfit2Pants2.height
  );

  // Draw the left leg2
  translate(-15, scaleFactor * leftLeg1.height - 30);
  angle = atan2(
    poseData.keypoints[15].position.y - poseData.keypoints[13].position.y,
    poseData.keypoints[15].position.x - poseData.keypoints[13].position.x
  );
  rotate(angle - 0.5 * PI + 0.1);
  image(
    Outfit2Shoes2,
    0,
    -20,
    scaleFactor * Outfit2Shoes2.width,
    scaleFactor * Outfit2Shoes2.height
  );

  pop();

  // Draw the right leg1
  push();
  translate(bodyCenter.x - 60, bodyCenter.y + 100);
  angle = atan2(
    poseData.keypoints[14].position.y - poseData.keypoints[12].position.y,
    poseData.keypoints[14].position.x - poseData.keypoints[12].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    Outfit2Pants1,
    -50,
    -20,
    scaleFactor * Outfit2Pants1.width,
    scaleFactor * Outfit2Pants1.height
  );

  // Draw the right leg2
  translate(-30, scaleFactor * rightLeg1.height);
  angle = atan2(
    poseData.keypoints[16].position.y - poseData.keypoints[14].position.y,
    poseData.keypoints[16].position.x - poseData.keypoints[14].position.x
  );
  rotate(angle - 0.5 * PI);
  image(
    Outfit2Shoes1,
    0,
    -20,
    scaleFactor * Outfit2Shoes1.width,
    scaleFactor * Outfit2Shoes1.height
  );
  pop();

  // Draw the clothes
  push();
  translate(
    bodyCenter.x - (scaleFactor * imgBody.width) / 2,
    bodyCenter.y - (scaleFactor * imgBody.height) / 2
  );
  translate(-22, 70);
  image(
    Outfit2Body,
    0,
    0,
    scaleFactor * Outfit2Body.width,
    scaleFactor * Outfit2Body.height
  );
  pop();
}

function lerpPoses(currentPoseData, targetPoseData) {
  for (let i = 0; i < currentPoseData.keypoints.length; i++) {
    let current = currentPoseData.keypoints[i].position;
    let target = targetPoseData.keypoints[i].position;

    current.x = lerp(current.x, target.x, lerpAmount);
    current.y = lerp(current.y, target.y, lerpAmount);

    // Also lerp the score if you're using it
    currentPoseData.keypoints[i].score = lerp(
      currentPoseData.keypoints[i].score,
      targetPoseData.keypoints[i].score,
      lerpAmount
    );
  }
}

function drawKeypoints(currentPoseData) {
  // if no poses were found, stop here
  if (!currentPoseData) {
    return;
  }

  // go through each keypoint in the pose
  for (let i = 0; i < currentPoseData.keypoints.length; i++) {
    let keypoint = currentPoseData.keypoints[i];

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
