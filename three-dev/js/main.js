import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadModels } from "./models.js";
import { setupEnvironment } from "./environment.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let grabbableGroup, nonGrabbableGroup;

init();

function init() {
  // Initialize the scene
  scene = new THREE.Scene();

  // Initialize the camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Initialize the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // VR Button
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;

  // Enable shadow map for renderer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Add Axis Helper
  const axesHelper = new THREE.AxesHelper(20);
  scene.add(axesHelper);

  // Create groups for grabbable and non-grabbable objects
  grabbableGroup = new THREE.Group();
  grabbableGroup.name = "Grabbable-Group";
  grabbableGroup.userData.grabbable = true;
  scene.add(grabbableGroup);

  nonGrabbableGroup = new THREE.Group();
  nonGrabbableGroup.name = "Non-Grabbable-Group";
  nonGrabbableGroup.userData.grabbable = false;
  scene.add(nonGrabbableGroup);

  // Load models
  loadModels(grabbableGroup, nonGrabbableGroup);

  // Set up environment (sky, lighting) with renderer passed as a parameter
  setupEnvironment(scene, renderer);

  // Add controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // Set camera position and orientation
  camera.position.set(25, 10, 15);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Initialize VR controllers
  initVR();

  // Set animation loop
  renderer.setAnimationLoop(function () {
    cleanIntersected();
    intersectObjects(controller1);
    controls.update();
    renderer.render(scene, camera);
  });
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function initVR() {
  // Controllers
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  controller1.addEventListener("squeezestart", onSqueezeStart);
  controller1.addEventListener("squeezeend", onSqueezeEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const line = new THREE.Line(geometry);
  line.name = "line";
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  raycaster = new THREE.Raycaster();

  // Load and add custom model to controllerGrip1 (left controller)
  const basePath = "assets/models/"; // Adjust the base path as needed
  const loader = new GLTFLoader().setPath(basePath);
  loader.load("gundy.glb", function (gltf) {
    const gundyModel = gltf.scene;
    gundyModel.scale.set(0.0005, 0.0005, 0.0005); // Adjust the scale as needed
    gundyModel.rotation.y = THREE.MathUtils.degToRad(180);
    gundyModel.rotation.x = THREE.MathUtils.degToRad(-36.5);
    gundyModel.position.set(0, 0.01, 0);
    controllerGrip1.add(gundyModel);
  });
}

function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];
    const object = intersection.object;
    object.material.emissive.b = 1;
    controller.attach(object);
    controller.userData.selected = object;
    console.log("Object selected:", object);
  } else {
    console.log("No intersections found");
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {
  const controller = event.target;

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected;
    object.material.emissive.b = 0;
    grabbableGroup.attach(object);
    controller.userData.selected = undefined;
    console.log("Object released:", object);
  }
}

function onSqueezeStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];
    const object = intersection.object;
    const pushForce = new THREE.Vector3(0, 0, -1).applyMatrix4(
      controller.matrixWorld
    );
    object.position.add(pushForce.multiplyScalar(10)); // Adjust the push strength as needed
    console.log("Object pushed:", object);
  } else {
    console.log("No intersections found");
  }
}

function onSqueezeEnd(event) {
  // You can add any additional logic for when the squeeze ends, if needed
}

function getIntersections(controller) {
  // Update the raycaster to use the controller's position and direction
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersections = raycaster.intersectObjects(
    grabbableGroup.children,
    true
  );

  return intersections;
}

function intersectObjects(controller) {
  if (controller.userData.targetRayMode === "screen") return;
  if (controller.userData.selected !== undefined) return;

  const line = controller.getObjectByName("line");
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];
    const object = intersection.object;
    object.material.emissive.r = 1;
    intersected.push(object);
    line.scale.z = intersection.distance;
  } else {
    line.scale.z = 5;
  }
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    object.material.emissive.r = 0;
  }
}
