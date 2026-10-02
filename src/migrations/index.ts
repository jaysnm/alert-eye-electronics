import * as migration_20260906_120415_initial from './20260906_120415_initial';
import * as migration_20261002_191941_add_media_s3_prefix from './20261002_191941_add_media_s3_prefix';

export const migrations = [
  {
    up: migration_20260906_120415_initial.up,
    down: migration_20260906_120415_initial.down,
    name: '20260906_120415_initial',
  },
  {
    up: migration_20261002_191941_add_media_s3_prefix.up,
    down: migration_20261002_191941_add_media_s3_prefix.down,
    name: '20261002_191941_add_media_s3_prefix'
  },
];
