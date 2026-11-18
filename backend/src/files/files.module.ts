import { Global, Module } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { UPLOAD_DIR } from '../config/rules';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

mkdirSync(UPLOAD_DIR, { recursive: true });

@Global()
@Module({
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
