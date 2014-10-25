// when everything is ready, automatically start everything ?
var vid = document.getElementById('videoel');
var overlay = document.getElementById('overlay');
var overlayCC = overlay.getContext('2d');

/*********** Setup of video/webcam and checking for webGL support *********/

var videoReady        = false;
var imagesReady       = false;
var webGLContext      = {};
var webGLTestCanvas   = {};
var animationRequest  = {};
var positions         = {};
var ctrack            = {};
var fd                = {};
var wc1               = {};
var fd2               = {};
var wc2               = {};
var masks             = {};
var images            = {};
var currentMask       = {};
var newcanvas         = {};
var videocanvas       = {};
var maskcanvas        = {};
var imageCanvases     = {};
var extended_vertices = {};

function enablestart() {
  if (videoReady && imagesReady) {
    var startbutton = document.getElementById('startbutton');
    startbutton.value = "start";
    startbutton.disabled = null;
  }
}

$(window).load(function() {
    require([
              "/js/vendor/threejs/OrbitControls.js",
              "/js/vendor/clmtrackr/utils.js",
              "/js/vendor/clmtrackr/clmtrackr.min.js",
              "/js/vendor/clmtrackr/models/model_pca_20_svm.js",
              "/js/vendor/clmtrackr/face_deformer.js",
              "/js/vendor/clmtrackr/poisson_new.js"
            ], function() {
              imagesReady = true;

              // check whether browser supports webGL
              webGLTestCanvas = document.createElement('canvas');
              if (window.WebGLRenderingContext) {
                webGLContext = webGLTestCanvas.getContext('webgl') || webGLTestCanvas.getContext('experimental-webgl');
                if (!webGLContext || !webGLContext.getExtension('OES_texture_float')) {
                  webGLContext = null;
                }
              }
              if (webGLContext == null) {
                alert("Your browser does not seem to support WebGL. Unfortunately this face mask example depends on WebGL, so you'll have to try it in another browser. :(");
              }

              navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
              window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;


              // check for camerasupport
              if (navigator.getUserMedia) {
                // set up stream

                // chrome 19 shim
                var videoSelector = {video : true};
                if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
                  var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
                  if (chromeVersion < 20) {
                    videoSelector = "video";
                  }
                };

                navigator.getUserMedia(videoSelector, function( stream ) {
                  if (vid.mozCaptureStream) {
                    vid.mozSrcObject = stream;
                  } else {
                    vid.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                  }
                  vid.play();
                }, function() {
                  alert("There was some problem trying to fetch video from your webcam, this won't work.");
                });
              } else {
                alert("Your browser does not seem to support getUserMedia, this won't work.");
              }

              vid.addEventListener('canplay', function() {videoReady = true;enablestart();}, false);

              /*********** Code for face substitution *********/
              ctrack = new clm.tracker();
              ctrack.init(pModel);

              document.getElementById('selectmask').addEventListener('change', updateMask, false);

              fd = new faceDeformer();
              fd.init(document.getElementById('webgl'));
              wc1 = document.getElementById('webgl').getContext('webgl') || document.getElementById('webgl').getContext('experimental-webgl')
              wc1.clearColor(0,0,0,0);

              fd2 = new faceDeformer();
              fd2.init(document.getElementById('webgl2'));
              wc2 = document.getElementById('webgl2').getContext('webgl') || document.getElementById('webgl2').getContext('experimental-webgl')
              wc2.clearColor(0,0,0,0);

              masks = {
                "average" : [[26.416248681267973, 69.287261104729708], [24.481184011083002, 109.1589911732479], [29.947934496257105, 148.57677024306452], [40.60811914491601, 185.45355598250219], [58.738097832656997, 216.6373204614957], [81.913770252207783, 237.8126294428132], [109.98606755351314, 257.32753166261085], [146.73017889094805, 264.20702756677571], [176.39901111159972, 257.35535351543069], [205.55603543434725, 238.34973455076488], [230.2355979713912, 210.41080746713624], [246.42195156813636, 177.61588628182037], [256.27933737115922, 136.43585286772219], [257.59862842161016, 101.26962757170907], [254.73574762861881, 63.296736154716768], [231.99351427704215, 39.831219799322724], [211.74886735135794, 29.357561061634286], [185.76946624427666, 32.692120457915841], [164.22794828410485, 39.057255405015212], [46.913242738637145, 44.216922272932521], [67.285057768685547, 32.598869110365555], [94.508786161963428, 34.746232646423401], [114.82786184548833, 39.533999746268229], [65.935953298843103, 69.239210402794683], [84.787589310043472, 58.321913189471772], [107.1385272571674, 69.051184056088701], [84.265668561805413, 74.447322016970119], [86.02844527485162, 66.55652441349649], [215.49276321482714, 66.02198446506911], [194.41225043477402, 56.580567518322354], [173.10349613934835, 67.506651798297085], [193.89655333472706, 70.825843235112714], [194.97190332017632, 64.213669799586413], [140.21544525228168, 50.532541524375866], [115.12210668936649, 112.86816444161286], [106.91733219119472, 128.11159519340237], [116.15332322527513, 140.65598165170533], [143.55679637420633, 142.73810254422773], [167.66884888729888, 137.95626733353842], [177.01070972200523, 125.94118566337217], [167.72534960722709, 111.07005102224311], [141.09391638922847, 89.711267100602939], [125.01121871692496, 134.01776882451776], [158.83114482022663, 132.84441173561655], [98.530013119819074, 181.49830160240677], [114.57531577249451, 172.88988327185314], [130.69321885263625, 168.51487947819879], [140.91575863744487, 170.62230018050224], [150.99524791299294, 168.10359663640762], [166.86355823591094, 171.92886610080987], [186.52748819945225, 179.57395522560827], [172.54811810821857, 193.62104452332397], [161.34374255744575, 203.55652478332667], [143.04951921782722, 206.98995295806665], [122.71362572694508, 202.88542194975037], [109.36831831524565, 194.44995485842813], [121.30529318118789, 187.44959256875671], [141.15688782807084, 190.12567632986739], [161.94486681509784, 187.9983882494468], [161.78346166803792, 178.31913412814549], [141.60005262336557, 178.73596022750081], [121.19014424606702, 179.74550271876572], [142.06000674291235, 125.94776468631429], [74.161858259749053, 61.982126979168953], [99.563603953011338, 61.887044688264439], [97.202478466508737, 72.650836394381287], [74.199064214851546, 73.344884154018885], [204.65317864223729, 59.203268807746532], [180.45823699179422, 60.544222235843449], [183.20168844348697, 70.667846856664895], [204.99820389502713, 70.525790218266522]],
             };
              images = ["average"];
              currentMask = 0;

              // canvas for copying the warped face to
              newcanvas = document.createElement('CANVAS');
              newcanvas.width = vid.width;
              newcanvas.height = vid.height;
              // canvas for copying videoframes to
              videocanvas = document.createElement('CANVAS');
              videocanvas.width = vid.width;
              videocanvas.height = vid.height;
              // canvas for masking
              maskcanvas = document.createElement('CANVAS');
              maskcanvas.width = vid.width;
              maskcanvas.height = vid.height;
              // create canvases for all the faces
              imageCanvases = {};
              for (var i = 0;i < images.length;i++) {
                $("#"+images[i]).load(function(obj) {
                  var elementId = obj.target.id;

                  // copy the images to canvases
                  imagecanvas = document.createElement('CANVAS');
                  imagecanvas.width = obj.target.width;
                  imagecanvas.height = obj.target.height;
                  imagecanvas.getContext('2d').drawImage(obj.target,0,0);
                  imageCanvases[elementId] = imagecanvas;
                });
              }

              extended_vertices = [
                [0,71,72,0],
                [0,72,1,0],
                [1,72,73,1],
                [1,73,2,1],
                [2,73,74,2],
                [2,74,3,2],
                [3,74,75,3],
                [3,75,4,3],
                [4,75,76,4],
                [4,76,5,4],
                [5,76,77,5],
                [5,77,6,5],
                [6,77,78,6],
                [6,78,7,6],
                [7,78,79,7],
                [7,79,8,7],
                [8,79,80,8],
                [8,80,9,8],
                [9,80,81,9],
                [9,81,10,9],
                [10,81,82,10],
                [10,82,11,10],
                [11,82,83,11],
                [11,83,12,11],
                [12,83,84,12],
                [12,84,13,12],
                [13,84,85,13],
                [13,85,14,13],
                [14,85,86,14],
                [14,86,15,14],
                [15,86,87,15],
                [15,87,16,15],
                [16,87,88,16],
                [16,88,17,16],
                [17,88,89,17],
                [17,89,18,17],
                [18,89,90,18],
                [18,90,22,18],
                [22,90,21,22],
                [21,90,91,21],
                [21,20,91,21],
                [20,91,92,20],
                [20,92,19,20],
                [19,92,93,19],
                [19,93,71,19],
                [19,0,71,19],
                [44,61,56,44],
                [60,61,56,60],
                [60,56,57,60],
                [60,59,57,60],
                [58,59,57,58],
                [58,59,50,58]
              ];
            });
});

function updateMask(el) {
  currentMask = parseInt(el.target.value, 10);
  var positions = ctrack.getCurrentPosition(vid);
  if (positions) {
    switchMasks(positions);
  }
}

function startVideo() {
  // start video
  vid.play();
  // start tracking
  ctrack.start(vid);
  // start drawing face grid
  drawGridLoop();
}

function drawGridLoop() {
  // get position of face
  positions = ctrack.getCurrentPosition(vid);

  overlayCC.clearRect(0, 0, 500, 375);
  if (positions) {
    // draw current grid
    ctrack.draw(overlay);
  }
  // check whether mask has converged
  var pn = ctrack.getConvergence();
  if (pn < 0.4) {
    switchMasks(positions);
  } else {
    requestAnimFrame(drawGridLoop);
  }
}

function switchMasks(pos) {
  videocanvas.getContext('2d').drawImage(vid,0,0,videocanvas.width,videocanvas.height);

  // we need to extend the positions with new estimated points in order to get pixels immediately outside mask
  var newMaskPos = masks[images[currentMask]].slice(0);
  var newFacePos = pos.slice(0);
  var extInd = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,22,21,20,19];
  var newp;
  for (var i = 0;i < 23;i++) {
    newp = [];
    newp[0] = (newMaskPos[extInd[i]][0]*1.3) - (newMaskPos[62][0]*0.3);// short for ((newMaskPos[extInd[i]][0]-newMaskPos[62][0])*1.1)+newMaskPos[62][0]
    newp[1] = (newMaskPos[extInd[i]][1]*1.3) - (newMaskPos[62][1]*0.3);
    newMaskPos.push(newp);
    newp = [];
    newp[0] = (newFacePos[extInd[i]][0]*1.3) - (newFacePos[62][0]*0.3);
    newp[1] = (newFacePos[extInd[i]][1]*1.3) - (newFacePos[62][1]*0.3);
    newFacePos.push(newp);
  }
  // also need to make new vertices incorporating area outside mask
  var newVertices = pModel.path.vertices.concat(extended_vertices);

  // deform the mask we want to use to face form
  fd2.load(imageCanvases[images[currentMask]], newMaskPos, pModel, newVertices);
  fd2.draw(newFacePos);
  // and copy onto new canvas
  newcanvas.getContext('2d').drawImage(document.getElementById('webgl2'),0,0);

  // create masking
  var tempcoords = positions.slice(0,18);
  tempcoords.push(positions[21]);
  tempcoords.push(positions[20]);
  tempcoords.push(positions[19]);
  createMasking(maskcanvas, tempcoords);

  /*document.body.appendChild(newcanvas);
  document.body.appendChild(videocanvas);
  document.body.appendChild(maskcanvas);
  debugger;*/

  // do poisson blending
  Poisson.load(newcanvas, videocanvas, maskcanvas, function() {
    var result = Poisson.blend(30, 0, 0);
    // render to canvas
    newcanvas.getContext('2d').putImageData(result, 0, 0);
    // get mask

    var maskname = Object.keys(masks)[currentMask];
    fd.load(newcanvas, pos, pModel);
    requestAnimFrame(drawMaskLoop);
  });
}

function drawMaskLoop() {
  // get position of face
  positions = ctrack.getCurrentPosition();

  /*for (var i = 0;i < positions.length;i++) {
    positions[i][1] += 1;
  }*/

  overlayCC.clearRect(0, 0, 400, 300);
  if (positions) {
    // draw mask on top of face
    fd.draw(positions);
  }
  animationRequest = requestAnimFrame(drawMaskLoop);
}

function createMasking(canvas, modelpoints) {
  // fill canvas with black
  var cc = canvas.getContext('2d');
  cc.fillStyle="#000000";
  cc.fillRect(0,0,canvas.width, canvas.height);
  cc.beginPath();
  cc.moveTo(modelpoints[0][0], modelpoints[0][1]);
  for (var i = 1;i < modelpoints.length;i++) {
    cc.lineTo(modelpoints[i][0], modelpoints[i][1]);
  }
  cc.lineTo(modelpoints[0][0], modelpoints[0][1]);
  cc.closePath();
  cc.fillStyle="#ffffff";
  cc.fill();
}
