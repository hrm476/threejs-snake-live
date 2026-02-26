import {
  Mesh,
  IcosahedronGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Object3DEventMap,
  Vector2,
} from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import gsap from "gsap";

export type EntityMesh = Mesh<
  SphereGeometry | RoundedBoxGeometry | TextGeometry | IcosahedronGeometry,
  MeshStandardMaterial,
  Object3DEventMap
>;

export default class Entity {
  mesh: EntityMesh;
  resolution: Vector2;
  option: { size: number; number: number };

  constructor(
    mesh: EntityMesh,
    resolution: Vector2,
    option = { size: 1.5, number: 0.5 }
  ) {
    this.mesh = mesh;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.resolution = resolution;
    this.option = option;
  }

  get position() {
    return this.mesh.position;
  }

  getIndexByCoord() {
    const { x } = this.resolution;
    return this.position.z * x + this.position.x;
  }

  in() {
    gsap.from(this.mesh.scale, {
      duration: 1,
      x: 0,
      y: 0,
      z: 0,
      ease: `elastic.out(${this.option.size}, ${this.option.number})`,
    });
  }

  out() {}
}
