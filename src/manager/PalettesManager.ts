import gsap from "gsap";
import { EventDispatcher } from "three";

export interface PaletteConfig {
  groundColor: number;
  fogColor: number;
  rockColor: number;
  treeColor: number;
  candyColor: number;
  snakeColor: number;
  mouthColor: number;
}

export type PalettesColorType = "green" | "orange" | "lilac";

interface PalettesManagerEventMap {
  change: {};
}

class PalettesManager extends EventDispatcher<PalettesManagerEventMap> {
  selectors = document.querySelectorAll(
    "[data-color]"
  ) as NodeListOf<HTMLLIElement>;
  paletteName: PalettesColorType = "green";

  static config: Record<PalettesColorType, PaletteConfig> = {
    green: {
      groundColor: 0x56f854,
      fogColor: 0x39c09f,
      rockColor: 0xebebeb, //0x7a95ff,
      treeColor: 0x639541, //0x1d5846,
      candyColor: 0x1d5846, //0x614bdd,
      snakeColor: 0x1d5846, //0xff470a,
      mouthColor: 0x39c09f,
    },
    orange: {
      groundColor: 0xd68a4c,
      fogColor: 0xffac38,
      rockColor: 0xacacac,
      treeColor: 0xa2d109,
      candyColor: 0x614bdd,
      snakeColor: 0xff470a,
      mouthColor: 0x614bdd,
    },
    lilac: {
      groundColor: 0xd199ff,
      fogColor: 0xb04ce6,
      rockColor: 0xebebeb,
      treeColor: 0x53d0c1,
      candyColor: 0x9900ff,
      snakeColor: 0xff2ed2,
      mouthColor: 0x614bdd,
    },
  };
  static instance: PalettesManager | null = null;
  static getInstance() {
    if (!PalettesManager.instance) {
      PalettesManager.instance = new PalettesManager();
    }
    return PalettesManager.instance;
  }

  constructor() {
    super();
    this.init();
  }

  get selectedPalette(): PaletteConfig {
    return PalettesManager.config[this.paletteName];
  }

  init() {
    const btnPlay = document.getElementById("btn-play") as HTMLButtonElement;
    this.paletteName =
      (localStorage.getItem("paletteName") as PalettesColorType) || "green";

    gsap.to(btnPlay, {
      opacity: 1,
      delay: 0.3,
      onComplete: () => {
        gsap.to(this.selectors, {
          duration: 1,
          x: 0,
          autoAlpha: 1,
          ease: `elastic.out(1.2, 0.9)`,
          stagger: {
            amount: 0.2,
          },
        });
      },
    });

    this.selectors.forEach((selector) =>
      selector.addEventListener("click", (event: any) => {
        const target = event.target as HTMLElement;
        const paletteName = target.dataset.color as PalettesColorType;

        this.storagePalette(paletteName);
        this.selectedPalette &&
          this.dispatchEvent({ type: "change" });
      })
    );
  }

  private storagePalette(paletteName: PalettesColorType): PaletteConfig | null {
    const palette = PalettesManager.config[paletteName];

    if (!palette) {
      return null;
    }

    this.paletteName = paletteName;
    localStorage.setItem("paletteName", paletteName);
    return palette;
  }
}

export default PalettesManager.getInstance();