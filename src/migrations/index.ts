import * as migration_20260906_120415_initial from './20260906_120415_initial';

export const migrations = [
  {
    up: migration_20260906_120415_initial.up,
    down: migration_20260906_120415_initial.down,
    name: '20260906_120415_initial'
  },
];
