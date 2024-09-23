var minAccuracy = 0.2;

var webcam; // webcam input
var posenet; // PoseNet model
var poses = []; // array with the pose's points

var noseIndex = 0; // index in the pose array where the nose is found

var px = null; // previous x/y positions (for drawing
var py = null; // lines with your nose!

let demoVideo;

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

let scaleFactor = 0;
let isPlaying = true;

function preload() {
  demoVideo = createVideo("assets/demo.mp4");
  imgBody = loadImage("assets/Body&Head.png");
  leftArm1 = loadImage("assets/Leftarm.png");
  rightArm1 = loadImage("assets/Rightarm.png");
  leftLeg1 = loadImage("assets/Leftleg.png");
  rightLeg1 = loadImage("assets/Rightleg.png");
  leftArm2 = loadImage("assets/Leftarm2.png");
  rightArm2 = loadImage("assets/Rightarm2.png");
  leftLeg2 = loadImage("assets/Leftleg2.png");
  rightLeg2 = loadImage("assets/Rightleg2.png");
}

function setup() {
  wh = windowHeight;
  ww = (wh * 16) / 9;
  createCanvas(ww, wh);

  // webcam = createCapture(VIDEO);
  webcam = demoVideo;
  demoVideo.volume(0);
  demoVideo.loop();

  // demoVideo.hide();

  webcam.size(width, height);
  webcam.hide();
  background(255);

  var options = { detectionType: "single", flipHorizontal: false };

  posenet = ml5.poseNet(webcam, options);

  // this funny-looking bit of code tells PoseNet
  // what to do every time it finds a valid pose
  posenet.on("pose", function (results) {
    poses = results;
  });

  let button;
  button = createButton("Start");
  button.mousePressed(() => {
    console.log("Pressed");
  });
  button.position(10, 10);
}

function gotPoses(results) {
  poses = results;
  console.log("Poses detected");
}

function setScaleFactor() {
  if (scaleFactor != 0) {
    return;
  }
  if (poses.length == 0) {
    return 1;
  }

  var keypoints = poses[0].pose.keypoints;
  var leftShoulder = keypoints[5].position;
  var rightShoulder = keypoints[6].position;
  scaleFactor =
    (1.1 *
      dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y)) /
    imgBody.width;
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
  push();
  // translate(width, 0);
  // scale(-1, 1);
  scale(ww / demoVideo.width, wh / demoVideo.height);

  image(demoVideo, 0, 0, width, height);
  // scale(-1, 1);
  // image(webcam, 0, 0, -width, height);
  pop();

  setScaleFactor();
  // show all thge pose's keypoints
  drawKeypoints();
  drawBodyCenter();
  drawBodyPart("leftArm");
  // drawBodyPart("rightArm");
  // drawBodyPart("leftLeg");
  // drawBodyPart("rightLeg");
  drawBodyPart("leftArm2");
  // drawBodyPart("rightArm2");
}

function getBodyCenter() {
  // get the body center by averaging the x and y coordinates of the keypoints: right shoulder, left shoulder, right hip, left hip
  var x = 0;
  var y = 0;

  if (poses.length == 0) {
    return { x: 0, y: 0 };
  }

  var keypoints = poses[0].pose.keypoints;
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

  return { x: x, y: y };
}

function drawBodyCenter() {
  var bodyCenter = getBodyCenter();
  fill("pink");
  stroke(255);
  ellipse(bodyCenter.x, bodyCenter.y, 10, 10);

  push();
  translate(bodyCenter.x, bodyCenter.y);
  scale(scaleFactor, scaleFactor);
  image(
    imgBody,
    -imgBody.width / 2,
    -imgBody.height / 2 - imgBody.height * 0.1,
    imgBody.width,
    imgBody.height
  );
  pop();
}

function getBodyPartPosition(part) {
  let result = {
    x: 0,
    y: 0,
    theta: 0,
    imgPoints: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
  };
  if (poses.length == 0) return result;

  if (part == "leftArm") {
    keypoints = [5, 7];
    result.imgPoints = {
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
    };
  }

  if (part == "leftArm2") {
    keypoints = [7, 9];
    result.imgPoints = {
      start: { x: 0.1, y: 0.65 },
      end: { x: 0.9, y: 0.65 },
    };
  }
  if (part == "rightArm") {
    keypoints = [6, 8];
    result.imgPoints = {
      start: { x: 0.1, y: 0.55 },
      end: { x: 1, y: 0.55 },
    };
  }
  if (part == "rightArm2") {
    keypoints = [8, 10];
    result.imgPoints = {
      start: { x: 0.1, y: 0.55 },
      end: { x: 1, y: 0.55 },
    };
  }

  if (part == "leftLeg") {
    keypoints = [11, 13];
    result.imgPoints = {
      start: { x: 0.1, y: 0.55 },
      end: { x: 1, y: 0.55 },
    };
  }

  if (part == "rightLeg") {
    keypoints = [12, 14];
    result.imgPoints = {
      start: { x: 0.1, y: 0.55 },
      end: { x: 1, y: 0.55 },
    };
  }

  result.x = poses[0].pose.keypoints[keypoints[0]].position.x;
  result.y = poses[0].pose.keypoints[keypoints[0]].position.y;
  result.theta = atan2(
    poses[0].pose.keypoints[keypoints[1]].position.y -
      poses[0].pose.keypoints[keypoints[0]].position.y,
    poses[0].pose.keypoints[keypoints[1]].position.x -
      poses[0].pose.keypoints[keypoints[0]].position.x
  );

  if (part == "leftArm2") {
    let theta = atan2(
      poses[0].pose.keypoints[7].position.y -
        poses[0].pose.keypoints[5].position.y,
      poses[0].pose.keypoints[7].position.x -
        poses[0].pose.keypoints[5].position.x
    );
    push();
    translate(poses[0].pose.keypoints[5].position.x, poses[0].pose.keypoints[5].position.y);
    line(0, 0, cos(theta) * leftArm1.width * scaleFactor, sin(theta) * leftArm1.height * scaleFactor);
    pop();
    result.x =
      poses[0].pose.keypoints[5].position.x +
      cos(theta) * leftArm1.width *scaleFactor;
    result.y =
      poses[0].pose.keypoints[5].position.y +
      sin(theta) * leftArm1.width * scaleFactor;
  }

  if (part == "rightArm2") {
  }

  return result;
}

function drawBodyPart(part) {
  var positionData = getBodyPartPosition(part);
  // console.log(positionData);
  fill("pink");
  stroke(255);
  let img;

  if (part == "leftArm") {
    img = leftArm1;
  }
  if (part == "rightArm") {
    img = rightArm1;
  }

  if (part == "leftArm2") {
    img = leftArm2;
  }
  if (part == "rightArm2") {
    img = rightArm2;
  }

  if (part == "leftLeg") {
    img = leftLeg1;
  }
  if (part == "rightLeg") {
    img = rightLeg1;
  }

  push();
  translate(positionData.x, positionData.y);
  fill("red");
  noStroke();
  ellipse(0, 0, 10, 10);
  scale(scaleFactor, scaleFactor);
  rotate(positionData.theta);

  translate(
    -img.width * positionData.imgPoints.start.x,
    -img.height * positionData.imgPoints.start.y
  );
  image(img, 0, 0, img.width, img.height);
  noFill();
  stroke("red");
  rect(0, 0, img.width, img.height);
  pop();
}

function drawKeypoints() {
  // if no poses were found, stop here
  if (poses.length == 0) {
    return;
  }

  // get the first pose in the array (PoseNet
  // can find multiple poses too!)
  var keypoints = poses[0].pose.keypoints;

  // go through each keypoint in that pose
  for (var i = 0; i < keypoints.length; i++) {
    var keypoint = keypoints[i];

    // if this point's accuracy score is high enough,
    // draw it as a circle and label it
    if (keypoint.score > minAccuracy) {
      var x = keypoint.position.x;
      var y = keypoint.position.y;

      fill(0);
      stroke(255);
      ellipse(x, y, 10, 10);

      fill(255, 0, 0);
      noStroke();
      var score = nf(keypoint.score, 0, 2);
      text(i + " (" + score + ")", x + 15, y + 15);
    }
  }
}

function drawCloth() {
  image(cloth, 0, 0);
}

function noseDraw() {
  if (poses.length == 0) {
    return;
  }

  // get the nose keypoint from the pose
  var keypoints = poses[0].pose.keypoints;
  var nose = keypoints[noseIndex];

  // if above the min accuracy, draw a line between
  // the current position and the previous
  if (nose.score > minAccuracy) {
    var x = nose.position.x;
    var y = nose.position.y;
    if (px != null && py != null) {
      stroke(0, 100);
      line(px, py, x, y);
    }
    px = x;
    py = y;
  }
}
