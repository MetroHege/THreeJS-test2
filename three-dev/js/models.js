import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

export function loadModels(scene) {
  const photogrammetryLoader = new GLTFLoader();
  photogrammetryLoader.load("assets/models/kenkuli.glb", (gltf) => {
    const photogrammetryModel = gltf.scene;
    photogrammetryModel.scale.set(0.2, 0.2, 0.2);
    photogrammetryModel.position.set(0, 0, 5);
    scene.add(photogrammetryModel);
  });

  const barrelLoader = new GLTFLoader();
  barrelLoader.load("assets/models/barrel.glb", (gltf) => {
    const barrel = gltf.scene;
    barrel.scale.set(1, 1, 1);
    barrel.position.set(5, 1, 0);
    scene.add(barrel);
  });

  const externalModelLoader = new GLTFLoader();
  externalModelLoader.load("assets/models/bower_alcove_28_mb.glb", (gltf) => {
    const externalModel = gltf.scene;
    externalModel.scale.set(1, 1, 1);
    externalModel.position.set(0, 0, 0);
    scene.add(externalModel);
  });

  const material = new THREE.MeshStandardMaterial({ color: 0x808080 });

  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  cube.position.set(4, 6.5, 5);
  scene.add(cube);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    material
  );
  sphere.position.set(4, 7.4, 5);
  scene.add(sphere);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 32), material);
  cone.position.set(4, 8.1, 5);
  scene.add(cone);

  const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load("assets/textures/world.png"),
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.set(-10, 15, 10);
  earth.scale.set(2, 2, 2);
  scene.add(earth);
}
