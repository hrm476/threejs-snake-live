import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { resolution } from "./module/Params";
import palettesManager, { PaletteConfig } from "./manager/PalettesManager";
import GameManager from "./manager/GameManager";
import { isMobile } from "./utils";

const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export class SnakeLive {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  plane!: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  >;
  gameManager: GameManager;

  constructor() {
    this.initScene();
    this.initGridHelper();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initGround();
    this.initLights();
    this.gameManager = new GameManager({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls,
    });
    this.applyPalette();
    this.startRender();
    window.addEventListener("resize", this.handleResize);
    palettesManager.addEventListener("change", this.applyPalette);
    this.handleResize();
  }

  get palette(): PaletteConfig {
    return palettesManager.selectedPalette;
  }

  initScene() {
    const scene = new THREE.Scene();
    const { fogColor } = this.palette;

    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.Fog(fogColor, 5, 40);
    this.scene = scene;
  }

  initGridHelper() {
    const gridHelper = new THREE.GridHelper(
      resolution.x,
      resolution.y,
      0xffffff,
      0xffffff
    );
    gridHelper.position.set(
      resolution.x / 2 - 0.5,
      -0.49,
      resolution.y / 2 - 0.5
    );
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = isMobile ? 0.75 : 0.3;

    const axesHelper = new THREE.AxesHelper(20);
    this.scene.add(axesHelper);

    this.scene.add(gridHelper);
  }

  initCamera() {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    const initialPosition = new THREE.Vector3(
      resolution.x / 2 + 5,
      4,
      resolution.y / 2 + 4
    );
    camera.position.copy(initialPosition);
    this.camera = camera;
  }

  initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      logarithmicDepthBuffer: true, // 是否使用对数深度缓存。如果要在单个场景中处理巨大的比例差异，就有必要使用
    });
    document.body.appendChild(renderer.domElement);

    renderer.toneMapping = THREE.ACESFilmicToneMapping; // 设置色调映射算法为 ACES Filmic 色调映射算法，用于调整颜色的显示效果。
    renderer.toneMappingExposure = 1.2; // 设置色调映射的曝光度为 1.2，影响最终渲染结果的亮度和对比度。
    renderer.shadowMap.enabled = true; // 启用阴影映射，用于渲染场景中的阴影效果。
    renderer.shadowMap.type = THREE.VSMShadowMap;
    this.renderer = renderer;
  }

  initControls() {
    const { camera, renderer } = this;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.target.set(
      resolution.x / 2 - 2,
      0,
      resolution.y / 2 + (isMobile ? 0 : 2)
    );
    this.controls = controls;
  }

  initGround() {
    const planeGeometry = new THREE.PlaneGeometry(
      resolution.x * 50,
      resolution.y * 50
    );
    planeGeometry.rotateX(-Math.PI * 0.5);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: this.palette.groundColor,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.x = resolution.x / 2 - 0.5;
    plane.position.z = resolution.y / 2 - 0.5;
    plane.position.y = -0.5;
    plane.receiveShadow = true;

    this.scene.add(plane);
    this.plane = plane;
  }

  initLights() {
    // 环境光会均匀的照亮场景中的所有物体。环境光不能用来投射阴影，因为它没有方向。
    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);

    dirLight.position.set(20, 20, 18);
    dirLight.target.position.set(resolution.x / 2, 0, resolution.y / 2);
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.radius = 7;
    dirLight.shadow.blurSamples = 20;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.castShadow = true;

    this.scene.add(dirLight, ambLight);
  }

  applyPalette = () => {
    const { scene, plane, palette, gameManager } = this;
    const btnPlayImg = document.getElementById(
      "btn-play-img"
    ) as HTMLImageElement;

    plane.material.color.set(palette.groundColor);
    scene.fog?.color.set(palette.fogColor);
    (<THREE.Color>scene.background)!.set(palette.fogColor);
    gameManager.applyPalette();
    btnPlayImg.src = assetUrl(
      `imgs/btn-play-bg-${palettesManager.paletteName}.png`
    );
  };

  startRender() {
    const { scene, camera, renderer, controls } = this;

    function tic() {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(tic);
    }

    requestAnimationFrame(tic);
  }

  handleResize = () => {
    const { camera, renderer } = this;
    const { innerWidth, innerHeight, devicePixelRatio } = window;

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  };
}

new SnakeLive();
