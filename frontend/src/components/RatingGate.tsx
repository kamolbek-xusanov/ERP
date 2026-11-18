import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAction } from '../hooks/useApi';
import { Button, FormError, Modal, Textarea } from './ui';

export const OPEN_RATING_EVENT = 'open-lesson-rating';

export function Stars({ value, onChange, size = 38 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="stars-input" role={onChange ? 'radiogroup' : 'img'} aria-label="Baho">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} yulduz`}
          className={`star-btn ${n <= value ? 'on' : ''}`}
          style={{ fontSize: size }}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/**
 * Uyga vazifa berilgan darsda o'quvchi darsni baholashi shart.
 * Vazifa bo'limi ko'rinishi bilan oyna avtomatik ochiladi (baholanmagan bo'lsa).
 */
export function RatingGate({ lessonId, assigned, rated }: { lessonId: string; assigned: boolean; rated: boolean }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const m = useAction((v: { stars: number; comment: string }) => api.put(`/student/lessons/${lessonId}/rating`, v), [`/student/lessons/${lessonId}`], () => setOpen(false));

  useEffect(() => {
    if (!assigned || rated || asked) return;
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setOpen(true);
      setAsked(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOpen(true);
          setAsked(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px 120px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [assigned, rated, asked]);

  useEffect(() => {
    const on = () => !rated && setOpen(true);
    window.addEventListener(OPEN_RATING_EVENT, on);
    return () => window.removeEventListener(OPEN_RATING_EVENT, on);
  }, [rated]);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" />
      {open && !rated && (
        <Modal title="Darsni baholang" onClose={() => setOpen(false)}>
          <p>Uyga vazifani topshirishdan oldin bugungi darsni baholang. Bu ustozga darsni yaxshilashga yordam beradi.</p>
          <Stars value={stars} onChange={setStars} />
          <div className="form" style={{ marginTop: 14 }}>
            <Textarea placeholder="Izoh (ixtiyoriy)" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
            <FormError error={m.error} />
            <div className="form-actions">
              <Button onClick={() => m.mutate({ stars, comment })} disabled={stars < 1} loading={m.isPending}>
                Baholash
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Keyinroq
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
