import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Role } from '../common/enums';
import { Roles } from '../common/security';
import { URL_RE } from '../common/utils';
import { CareerVideo, Faq, Guide } from '../database/entities';

export class CareerVideoDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @IsNotEmpty() topic: string;
  @IsInt() @Min(1) @Max(600) durationMin: number;
  @IsOptional() @IsString() description?: string;
  @Matches(URL_RE, { message: "Havola http:// yoki https:// bilan boshlansin." }) url: string;
}

export class GuideDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @IsNotEmpty() category: string;
  @IsInt() @Min(1) @Max(120) readMin: number;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() body?: string;
}

export class FaqDto {
  @IsString() @MinLength(3) question: string;
  @IsString() @MinLength(3) answer: string;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(CareerVideo) private readonly videos: Repository<CareerVideo>,
    @InjectRepository(Guide) private readonly guides: Repository<Guide>,
    @InjectRepository(Faq) private readonly faqs: Repository<Faq>,
  ) {}

  async careerVideos() {
    const rows = await this.videos.find({ order: { title: 'ASC' } });
    return rows.map((v) => ({
      id: v.id,
      title: v.title,
      topic: v.topic,
      durationMin: v.durationMin,
      description: v.description,
      url: v.videoUrl,
    }));
  }

  listGuides() {
    return this.guides.find({ order: { category: 'ASC', title: 'ASC' } });
  }

  listFaqs() {
    return this.faqs.find({ order: { question: 'ASC' } });
  }

  createVideo(dto: CareerVideoDto) {
    return this.videos.save(
      this.videos.create({
        title: dto.title,
        topic: dto.topic,
        durationMin: dto.durationMin,
        description: dto.description ?? '',
        videoUrl: dto.url,
      }),
    );
  }

  createGuide(dto: GuideDto) {
    return this.guides.save(
      this.guides.create({
        title: dto.title,
        category: dto.category,
        readMin: dto.readMin,
        summary: dto.summary ?? '',
        body: dto.body ?? '',
      }),
    );
  }

  createFaq(dto: FaqDto) {
    return this.faqs.save(this.faqs.create(dto));
  }

  async remove(kind: 'videos' | 'guides' | 'faqs', id: string) {
    await this[kind].delete({ id });
  }
}

@ApiTags('content')
@ApiBearerAuth()
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('career-videos')
  careerVideos() {
    return this.content.careerVideos();
  }

  @Get('guides')
  guides() {
    return this.content.listGuides();
  }

  @Get('faqs')
  faqs() {
    return this.content.listFaqs();
  }
}

@ApiTags('admin-content')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Post('career-videos')
  createVideo(@Body() dto: CareerVideoDto) {
    return this.content.createVideo(dto);
  }

  @Post('guides')
  createGuide(@Body() dto: GuideDto) {
    return this.content.createGuide(dto);
  }

  @Post('faqs')
  createFaq(@Body() dto: FaqDto) {
    return this.content.createFaq(dto);
  }

  @Delete('career-videos/:id')
  @HttpCode(204)
  async removeVideo(@Param('id', ParseUUIDPipe) id: string) {
    await this.content.remove('videos', id);
  }

  @Delete('guides/:id')
  @HttpCode(204)
  async removeGuide(@Param('id', ParseUUIDPipe) id: string) {
    await this.content.remove('guides', id);
  }

  @Delete('faqs/:id')
  @HttpCode(204)
  async removeFaq(@Param('id', ParseUUIDPipe) id: string) {
    await this.content.remove('faqs', id);
  }
}

@Module({
  controllers: [ContentController, AdminContentController],
  providers: [ContentService],
})
export class ContentModule {}
