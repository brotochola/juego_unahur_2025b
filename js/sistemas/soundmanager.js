class SoundManager {
  static sounds = new Map();
  static loadSounds(obj) {
    for (let key of Object.keys(obj)) {
      if (obj[key].srcs && Array.isArray(obj[key].srcs)) {
        for (let src of obj[key].srcs) {
          this.loadSound(key, src, obj[key].numOfCopies);
        }
      } else {
        this.loadSound(key, obj[key].src, obj[key].numOfCopies);
      }
    }
  }
  static loadSound(name, src, numOfCopies = 4) {
    let arr = [];
    for (let i = 0; i < 5; i++) {
      let audio = new Audio(src);
      audio.preservesPitch = false;
      arr.push(audio);
    }
    const prevAudios = this.sounds.get(name) || [];
    this.sounds.set(name, [...prevAudios, ...arr]);
  }

  static playSound(name, volume = 1, pitch = 1) {
    const sounds = this.sounds.get(name);
    if (!sounds) {
      return console.warn("Sound not found: " + name);
    }
    if (sounds) {
      let sound = shuffle(sounds).filter((sound) => sound.paused)[0];
      if (!sound) {
        sound = sounds[0];
      }
      sound.currentTime = 0;
      sound.volume = volume;
      sound.playbackRate = pitch;
      sound.play();
      return sound;
    }
  }
}
