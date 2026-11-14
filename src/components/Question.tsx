import { useI18n } from '../i18n';
import type { HealthAnswer } from '../types';
import { Segmented } from './Segmented';

export type Answer = HealthAnswer;

interface QuestionProps {
  number: number;
  text: string;
  value: Answer;
  onChange: (value: Answer) => void;
}

/** One health question with Yes / No / Not sure (SPEC 5.6). */
export function Question({ number, text, value, onChange }: QuestionProps) {
  const { t } = useI18n();
  return (
    <div className="oc-q">
      <p className="oc-q__text">{t('question.numbered', { number, text })}</p>
      <Segmented<Answer>
        label={t('question.answerLabel', { number })}
        options={[
          { value: 'yes', label: t('answer.yes') },
          { value: 'no', label: t('answer.no') },
          { value: 'notSure', label: t('answer.notSure') },
        ]}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
