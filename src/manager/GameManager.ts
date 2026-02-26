import * as THREE from "three";
import gsap from "gsap";
import { FontLoader, Font } from "three/examples/jsm/loaders/FontLoader.js";
import fontSrc from "three/examples/fonts/helvetiker_bold.typeface.json?url";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import volumeManager from "./VolumeManager";
import { resolution } from "../module/Params";
import Snake from "../module/Snake";
import Rock from "../module/Rock";
import Tree from "../module/Tree";
import Candy from "../module/Candy";
import Entity from "../module/Entity";
import palettesManager, { PaletteConfig } from "./PalettesManager";
import { isMobile } from "../utils";

export default class GameManager {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  snake!: Snake;
  entities: Array<Rock | Tree> = [];
  candies: Array<Candy> = [];
  scoreEntity: Entity | null = null;
  font: Font | null = null;
  score = 0;
  isRunning: number | null = null;

  constructor(options: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
  }) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.controls = options.controls;
    this.init();
  }

  get palette(): PaletteConfig {
    return palettesManager.selectedPalette;
  }

  public init() {
    this.loadFont();
    this.createSnake();
    this.addCandy();
    this.addEntities();
    this.addTreesOutOfGrid();
    this.addRocksOutOfGrid();
    this.initPlane();
    this.initPlayer();
    this.applyPalette();
    palettesManager.addEventListener("change", this.applyPalette);
  }

  loadFont() {
    const loader = new FontLoader();
    console.log('fontSrc', fontSrc);
    loader.load(fontSrc, (loadedFont) => {
      this.font = loadedFont;
      this.printScore();
    });
  }

  createSnake() {
    const { scene, palette } = this;
    const snake = new Snake({
      scene,
      resolution,
      color: palette.snakeColor,
      mouthColor: palette.mouthColor,
    });
    this.snake = snake;

    snake.addEventListener("updated", () => {
      const { snake, entities, candies, scene } = this;

      if (
        snake.checkSelfCollision() ||
        snake.checkEntitiesCollision(entities)
      ) {
        snake.die();
        this.resetGame();
      }

      const headIndex = snake.indexes.at(-1);
      const candyIndex = candies.findIndex(
        (candy) => candy.getIndexByCoord() === headIndex
      );

      if (candyIndex >= 0) {
        const candy = candies[candyIndex];
        scene.remove(candy.mesh);
        candies.splice(candyIndex, 1);
        snake.body.head.data.candy = candy;
        this.addCandy();
        this.score += candy.points;
        this.printScore();
      }
    });
  }

  addCandy() {
    const { scene, candies, palette } = this;
    const candy = new Candy(resolution, palette.candyColor);
    const index = this.getFreeIndex();

    candy.mesh.position.x = index % resolution.x;
    candy.mesh.position.z = Math.floor(index / resolution.x);
    candies.push(candy);
    candy.in();
    scene.add(candy.mesh);
  }

  addEntities() {
    const { entities } = this;

    for (let i = 0; i < 20; i++) {
      this.addEntity();
    }

    entities.sort((a, b) => {
      const c = new THREE.Vector3(
        resolution.x / 2 - 0.5,
        0,
        resolution.y / 2 - 0.5
      );

      const distanceA = a.position.clone().sub(c).length();
      const distanceB = b.position.clone().sub(c).length();

      return distanceA - distanceB;
    });

    gsap.from(
      entities.map((entity) => entity.mesh.scale),
      {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: "elastic.out(1.5, 0.5)",
        stagger: {
          grid: [20, 20],
          amount: 0.7,
        },
      }
    );
  }

  addEntity() {
    const { scene, entities, palette } = this;
    const entity =
      Math.random() > 0.5
        ? new Rock(resolution, palette.rockColor)
        : new Tree(resolution, palette.treeColor);
    const index = this.getFreeIndex();

    entity.mesh.position.x = index % resolution.x;
    entity.mesh.position.z = Math.floor(index / resolution.x);
    entities.push(entity);
    scene.add(entity.mesh);
  }

  // add entities out of the grid
  addTreesOutOfGrid() {
    const { scene } = this;
    const treeData = [
      new THREE.Vector4(-5, 0, 10, 1),
      new THREE.Vector4(-6, 0, 15, 1.2),
      new THREE.Vector4(-5, 0, 16, 0.8),
      new THREE.Vector4(-10, 0, 4, 1.3),
      new THREE.Vector4(-5, 0, -3, 2),
      new THREE.Vector4(-4, 0, -4, 1.5),
      new THREE.Vector4(-2, 0, -15, 1),
      new THREE.Vector4(5, 0, -20, 1.2),
      new THREE.Vector4(24, 0, -12, 1.2),
      new THREE.Vector4(2, 0, -6, 1.2),
      new THREE.Vector4(3, 0, -7, 1.8),
      new THREE.Vector4(1, 0, -9, 1.0),
      new THREE.Vector4(15, 0, -8, 1.8),
      new THREE.Vector4(17, 0, -9, 1.1),
      new THREE.Vector4(18, 0, -7, 1.3),
      new THREE.Vector4(24, 0, -1, 1.3),
      new THREE.Vector4(26, 0, 0, 1.8),
      new THREE.Vector4(32, 0, 0, 1),
      new THREE.Vector4(28, 0, 6, 1.7),
      new THREE.Vector4(24, 0, 15, 1.1),
      new THREE.Vector4(16, 0, 23, 1.1),
      new THREE.Vector4(12, 0, 24, 0.9),
      new THREE.Vector4(-13, 0, -13, 0.7),
      new THREE.Vector4(35, 0, 10, 0.7),
    ];
    const tree = new Tree(resolution);

    treeData.forEach(({ x, y, z, w }) => {
      let clone = tree.mesh.clone();
      clone.position.set(x, y, z);
      clone.scale.setScalar(w);
      scene.add(clone);
    });
  }

  addRocksOutOfGrid() {
    const { scene } = this;
    const resX = resolution.x;
    const rockData = [
      [new THREE.Vector3(-7, -0.5, 2), new THREE.Vector4(2, 8, 3, 2.8)],
      [new THREE.Vector3(-3, -0.5, -10), new THREE.Vector4(3, 2, 2.5, 1.5)],
      [new THREE.Vector3(-5, -0.5, 3), new THREE.Vector4(1, 1.5, 2, 0.8)],
      [new THREE.Vector3(resX + 5, -0.5, 3), new THREE.Vector4(4, 1, 3, 1)],
      [new THREE.Vector3(resX + 4, -0.5, 2), new THREE.Vector4(2, 2, 1, 1)],
      [new THREE.Vector3(resX + 8, -0.5, 16), new THREE.Vector4(6, 2, 4, 4)],
      [
        new THREE.Vector3(resX + 6, -0.5, 13),
        new THREE.Vector4(3, 2, 2.5, 3.2),
      ],
      [new THREE.Vector3(resX + 5, -0.5, -8), new THREE.Vector4(1, 1, 1, 0)],
      [
        new THREE.Vector3(resX + 6, -0.5, -7),
        new THREE.Vector4(2, 4, 1.5, 0.5),
      ],
      [new THREE.Vector3(-5, -0.5, 14), new THREE.Vector4(1, 3, 2, 0)],
      [new THREE.Vector3(-4, -0.5, 15), new THREE.Vector4(0.8, 0.6, 0.7, 0)],
      [
        new THREE.Vector3(resX / 2 + 5, -0.5, 25),
        new THREE.Vector4(2.5, 0.8, 4, 2),
      ],
      [
        new THREE.Vector3(resX / 2 + 9, -0.5, 22),
        new THREE.Vector4(1.2, 2, 1.2, 1),
      ],
      [
        new THREE.Vector3(resX / 2 + 8, -0.5, 21.5),
        new THREE.Vector4(0.8, 1, 0.8, 2),
      ],
      // [new THREE.Vector3(0, -0.5, 0), new THREE.Vector4(1, 1, 1, 0)],
    ];

    rockData.forEach((rockItem) => {
      let clone = new Rock(resolution).mesh;
      const [position, detail] = rockItem;
      clone.position.copy(position);
      clone.scale.set(detail.x, detail.y, detail.z);
      clone.rotation.y = (<THREE.Vector4>detail).w;
      scene.add(clone);
    });
  }

  getFreeIndex() {
    const { candies, entities, snake } = this;
    let index;
    let candyIndexes = candies.map((candy) => candy.getIndexByCoord());
    let entityIndexes = entities.map((entity) => entity.getIndexByCoord());

    do {
      index = Math.floor(Math.random() * resolution.x * resolution.y);
    } while (
      snake.indexes.includes(index) ||
      candyIndexes.includes(index) ||
      entityIndexes.includes(index)
    );

    return index;
  }

  startGame() {
    const { snake } = this;
    if (!snake.isMoving) {
      this.isRunning = setInterval(() => {
        snake.update();
      }, 240);
    }
  }

  stopGame() {
    this.isRunning && clearInterval(this.isRunning);
    this.isRunning = null;
    // this.snake.stop()
  }

  resetGame() {
    this.stopGame();
    this.score = 0;

    let candy = this.candies.pop();
    while (candy) {
      this.scene.remove(candy.mesh);
      candy = this.candies.pop();
    }

    let entity = this.entities.pop();
    while (entity) {
      this.scene.remove(entity.mesh);
      entity = this.entities.pop();
    }

    this.addCandy();
    this.addEntities();
  }

  initPlane() {
    const manager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(manager);

    const wasd = textureLoader.load("/wasd.png");
    const arrows = textureLoader.load("/arrows.png");

    const wasdGeometry = new THREE.PlaneGeometry(3.5, 2);
    wasdGeometry.rotateX(-Math.PI * 0.5);

    const planeWasd = new THREE.Mesh(
      wasdGeometry,
      new THREE.MeshStandardMaterial({
        transparent: true,
        map: wasd,
        opacity: isMobile ? 0 : 0.5,
      })
    );

    const planeArrows = new THREE.Mesh(
      wasdGeometry,
      new THREE.MeshStandardMaterial({
        transparent: true,
        map: arrows,
        opacity: isMobile ? 0 : 0.5,
      })
    );

    planeArrows.position.set(8.7, 0, 21);
    planeWasd.position.set(13, 0, 21);

    this.scene.add(planeArrows, planeWasd);
  }

  initPlayer() {
    const btnPlay = document.getElementById("btn-play") as HTMLButtonElement;

    const finalPosition = isMobile
      ? new THREE.Vector3(
          resolution.x / 2 - 0.5,
          resolution.x + 15,
          resolution.y
        )
      : new THREE.Vector3(
          -8 + resolution.x / 2,
          resolution.x / 2 + 4,
          resolution.y + 6
        );

    const { camera, controls, scene } = this;
    const self = this;

    gsap.fromTo(
      btnPlay,
      { autoAlpha: 0, scale: 0, yPercent: -50, xPercent: -50 },
      {
        duration: 0.8,
        autoAlpha: 1,
        scale: 1,
        yPercent: -50,
        xPercent: -50,
        delay: 0.3,
        ease: `elastic.out(1.2, 0.7)`,
      }
    );

    btnPlay.addEventListener("click", function () {
      volumeManager.audioNode.play();

      gsap.to(camera.position, { ...finalPosition, duration: 2 });

      if (isMobile) {
        gsap.to(controls.target, {
          x: resolution.x / 2 - 0.5,
          y: 0,
          z: resolution.y / 2 - 0.5,
        });

        // gsap.to(mobileArrows, { autoAlpha: 0.3, duration: 1, delay: 0.5 })
      }
      gsap.to(scene.fog, { duration: 2, near: isMobile ? 30 : 20, far: 55 });

      gsap.to(this, {
        duration: 1,
        scale: 0,
        ease: `elastic.in(1.2, 0.7)`,
        onComplete: () => {
          this.style.visibility = "hidden";
        },
      });

      self.registerEventListener();
    });
  }

  registerEventListener() {
    const { snake } = this;

    if (isMobile) {
      //mobile
      const prevTouch = new THREE.Vector2();
      let middle = 1.55;
      let scale = 1;

      window.addEventListener("touchstart", (event) => {
        const touch = event.targetTouches[0];

        middle = THREE.MathUtils.clamp(middle, 1.45, 1.65);

        // console.log(event)
        let x, y;
        x = (2 * touch.clientX) / window.innerWidth - 1;
        y = (2 * touch.clientY) / window.innerHeight - middle;

        // if (Math.abs(x) < 0.15 && Math.abs(y) < 0.15) {
        // 	return
        // }

        if (!this.isRunning) {
          this.startGame();
        }

        if (x * scale > y) {
          if (x * scale < -y) {
            snake.setDirection("ArrowUp");
            scale = 3;
          } else {
            snake.setDirection("ArrowRight");
            middle += y;
            scale = 0.33;
          }
        } else {
          if (-x * scale > y) {
            snake.setDirection("ArrowLeft");
            middle += y;
            scale = 0.33;
          } else {
            snake.setDirection("ArrowDown");
            scale = 3;
          }
        }

        prevTouch.x = x;
        prevTouch.y = y;
      });
    } else {
      // keyboard
      window.addEventListener("keydown", (e) => {
        const keyCode = e.code;

        snake.setDirection(keyCode);

        if (keyCode === "Space") {
          e.preventDefault();
          !this.isRunning ? this.startGame() : this.stopGame();
        } else if (!this.isRunning) {
          this.startGame();
        }
      });
    }
  }

  printScore() {
    const { snake, scene, font, scoreEntity } = this;

    if (!font) {
      return;
    }

    if (!this.score) {
      this.score = 0;
    }

    if (scoreEntity) {
      scene.remove(scoreEntity.mesh);
      scoreEntity.mesh.geometry.dispose();
      scoreEntity.mesh.material.dispose();
    }

    const geometry = new TextGeometry(`${this.score}`, {
      font: font,
      size: 3,
      depth: 1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    geometry.center();

    if (isMobile) {
      geometry.rotateX(-Math.PI * 0.5);
    }

    const mesh = new THREE.Mesh(geometry, snake.body.head.data.mesh.material);

    mesh.position.x = resolution.x / 2 - 0.5;
    mesh.position.z = -4;
    mesh.position.y = 1.8;

    mesh.castShadow = true;

    this.scoreEntity = new Entity(mesh, resolution, { size: 0.8, number: 0.3 });
    this.scoreEntity.in();
    scene.add(this.scoreEntity.mesh);
  }

  applyPalette = () => {
    const { entities, candies, snake, palette } = this;
    const { rockColor, treeColor, candyColor, snakeColor, mouthColor } =
      palette;

    entities
      .find((entity) => entity instanceof Rock)
      ?.mesh.material.color.set(rockColor);
    entities
      .find((entity) => entity instanceof Tree)
      ?.mesh.material.color.set(treeColor);
    candies[0].mesh.material.color.set(candyColor);
    snake.body.head.data.mesh.material.color.set(snakeColor);
    snake.body.head.data.mesh.material.color.set(snakeColor);
    snake.mouthColor = mouthColor;
    snake.mouth.material.color.set(mouthColor);
  };
}
