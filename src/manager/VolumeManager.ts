import gsap from "gsap";

class VolumeManager {
  volumeNode = document.getElementById("btn-volume") as HTMLButtonElement;
  audioNode = document.getElementById("audio") as HTMLAudioElement;
  initialVolume = 0.5;

  static instance: VolumeManager | null = null;
  static getInstance() {
    if (!VolumeManager.instance) {
      VolumeManager.instance = new VolumeManager();
    }
    return VolumeManager.instance;
  }

  constructor() {
    this.init();
  }

  get storageVolume() {
    return localStorage.getItem("volume") || "on";
  }

  set storageVolume(value: string) {
    localStorage.setItem("volume", value);
  }

  public init() {
    const { audioNode, volumeNode, storageVolume } = this;

    this.initialVolume = audioNode.volume;

    if (storageVolume === "off") {
      this.muteVolume();
    } else {
      this.unmuteVolume();
    }

    volumeNode.addEventListener("click", () => {
      if (audioNode.volume === 0) {
        this.unmuteVolume();
      } else {
        this.muteVolume();
      }
    });
  }

  private muteVolume() {
    const { audioNode, volumeNode } = this;

    this.storageVolume = "off";
    gsap.to(audioNode, { volume: 0, duration: 1 });
    volumeNode.querySelector(":first-child")!.classList.remove("animate-ping");
    volumeNode.classList.add("volume-off");
  }

  private unmuteVolume() {
    const { audioNode, volumeNode } = this;

    this.storageVolume = "on";
    volumeNode.querySelector(":first-child")!.classList.add("animate-ping");
    volumeNode.classList.remove("volume-off");
    gsap.to(audioNode, { volume: this.initialVolume, duration: 1 });
  }
}

export default VolumeManager.getInstance();
