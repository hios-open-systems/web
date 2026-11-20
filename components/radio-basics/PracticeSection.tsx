'use client';

import { useState } from 'react';
import { Alert, Button, Radio } from 'antd';
import { useTranslations } from 'next-intl';
import styles from './radioBasics.module.css';

const questions = [
  { id: 'q1', correct: 'a' }, { id: 'q2', correct: 'b' },
  { id: 'q3', correct: 'c' }, { id: 'q4', correct: 'a' },
] as const;
type QuestionId = typeof questions[number]['id'];

function QuizQuestion({ id, correct, answer, onAnswer }: {
  id: QuestionId; correct: string; answer?: string; onAnswer: (answer: string) => void;
}) {
  const t = useTranslations('RadioBasics.quiz');
  return (
    <fieldset className={styles.question}>
      <legend>{t(`${id}.question`)}</legend>
      <Radio.Group value={answer} onChange={(event) => onAnswer(event.target.value)} className={styles.answers}>
        {(['a', 'b', 'c'] as const).map((option) => <Radio key={option} value={option}>{t(`${id}.${option}`)}</Radio>)}
      </Radio.Group>
      <div aria-live="polite" aria-atomic="true">
        {answer ? (
          <Alert showIcon type={answer === correct ? 'success' : 'info'}
            message={t(answer === correct ? 'correct' : 'retry')} description={t(`${id}.explanation`)} />
        ) : null}
      </div>
    </fieldset>
  );
}

export function PracticeSection() {
  const t = useTranslations('RadioBasics.quiz');
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, string>>>({});
  const correct = questions.filter((question) => answers[question.id] === question.correct).length;
  return (
    <section id="practice" className={styles.section} aria-labelledby="practice-title">
      <h2 id="practice-title">{t('title')}</h2>
      <p>{t('intro')}</p>
      {questions.map((question) => (
        <QuizQuestion key={question.id} {...question} answer={answers[question.id]}
          onAnswer={(answer) => setAnswers((current) => ({ ...current, [question.id]: answer }))} />
      ))}
      <div className={styles.quizFooter}>
        <p role="status">{t('score', { correct, total: questions.length })}</p>
        <Button onClick={() => setAnswers({})} disabled={Object.keys(answers).length === 0}>{t('reset')}</Button>
      </div>
    </section>
  );
}
