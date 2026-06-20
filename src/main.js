import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.js';
import BootScene    from './scenes/BootScene.js';
import TitleScene   from './scenes/TitleScene.js';
import WorldScene   from './scenes/WorldScene.js';
import BattleScene  from './scenes/BattleScene.js';
import DialogScene  from './scenes/DialogScene.js';
import ChapterEndScene from './scenes/ChapterEndScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0a0a18',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, WorldScene, BattleScene, DialogScene, ChapterEndScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
};

new Phaser.Game(config);
