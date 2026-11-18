import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('career_videos')
export class CareerVideo {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'text' }) title: string;

  @Column({ type: 'text' }) topic: string;

  @Column({ name: 'duration_min', type: 'int' }) durationMin: number;

  @Column({ type: 'text', default: '' }) description: string;

  @Column({ name: 'video_url', type: 'text' }) videoUrl: string;
}

@Entity('guides')
export class Guide {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'text' }) title: string;

  @Column({ type: 'text' }) category: string;

  @Column({ name: 'read_min', type: 'int', default: 3 }) readMin: number;

  @Column({ type: 'text', default: '' }) summary: string;

  @Column({ type: 'text', default: '' }) body: string;
}

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'text' }) question: string;

  @Column({ type: 'text' }) answer: string;
}
