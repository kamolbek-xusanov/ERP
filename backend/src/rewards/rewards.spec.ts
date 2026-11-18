import { HomeworkStatus } from '../common/enums';
import { calcExam, calcLesson, calcLevel, splitExams } from './rewards.calc';

describe('rewards.calc', () => {
  it('gives attendance reward when video is fully watched and no teacher mark exists', () => {
    const r = calcLesson({ progress: 100 });
    expect(r.attended).toBe(true);
    expect(r.xp).toBe(20);
    expect(r.gems).toBe(10);
  });

  it('teacher mark overrides video progress', () => {
    expect(calcLesson({ explicit: false, progress: 100 }).attended).toBe(false);
    expect(calcLesson({ explicit: true, progress: 0 }).attended).toBe(true);
  });

  it('applies late penalty to the counted ball', () => {
    const r = calcLesson({ explicit: true, status: HomeworkStatus.DONE, grade: 85, late: true });
    expect(r.rawBall).toBe(85);
    expect(r.ball).toBe(75);
    expect(r.penalty).toBe(10);
    expect(r.ballXp).toBe(75);
    expect(r.ballGems).toBe(38);
    expect(r.xp).toBe(95);
    expect(r.gems).toBe(48);
  });

  it('never drops the counted ball below 1', () => {
    expect(calcLesson({ status: HomeworkStatus.DONE, grade: 5, late: true }).ball).toBe(1);
  });

  it('ignores grade unless status is DONE', () => {
    expect(calcLesson({ status: HomeworkStatus.PENDING, grade: 90 }).ball).toBeNull();
  });

  it('converts exam ball to xp and gems without penalty', () => {
    expect(calcExam(88)).toEqual({ ball: 88, xp: 88, gems: 44 });
    expect(calcExam(null)).toEqual({ ball: null, xp: 0, gems: 0 });
  });

  it('calculates level progress', () => {
    expect(calcLevel(0)).toMatchObject({ level: 1, levelPercent: 0, levelRemaining: 250 });
    expect(calcLevel(300)).toMatchObject({ level: 2, levelFrom: 250, levelTo: 500, levelPercent: 20, levelRemaining: 200 });
  });

  it('splits lessons into exam blocks', () => {
    const lessons = [
      { id: 'a', isExam: false },
      { id: 'b', isExam: false },
      { id: 'e1', isExam: true },
      { id: 'c', isExam: false },
    ];
    const { exams, since } = splitExams(lessons);
    expect(exams).toHaveLength(1);
    expect(exams[0].number).toBe(1);
    expect(exams[0].covered.map((l) => l.id)).toEqual(['a', 'b']);
    expect(since.map((l) => l.id)).toEqual(['c']);
  });
});
