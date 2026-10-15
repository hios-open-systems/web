import type { Activity } from '@/lib/workbench/discovery';
import styles from './activityGraphic.module.css';

const paths: Record<Activity, string[]> = {
  development: ['M70 35L45 55 70 75M130 35L155 55 130 75M112 25L90 85', 'M185 35H250M185 55H225M185 75H240'],
  maker: [
    'M100 20H160V85H100ZM112 32H148V73H112Z',
    'M70 30H100M70 50H100M70 70H100M160 30H190V15H240M160 50H240M160 70H210V90H250M120 0V20M140 0V20M120 85V105M140 85V105',
  ],
  audio: [
    'M25 55H45L55 30 65 80 80 12 95 95 110 40 120 65 130 55H155L165 30 175 80 190 12 205 95 220 40 230 65 240 55H275',
  ],
  ai: [
    'M75 30L145 55 75 85M145 55L215 25M145 55L215 85M75 30V85M215 25V85',
    'M63 18H87V42H63ZM133 43H157V67H133ZM63 73H87V97H63ZM203 13H227V37H203ZM203 73H227V97H203Z',
  ],
  knowledge: ['M65 20H145V95H65ZM85 40H125M85 55H125M85 70H110', 'M155 30H225V85H155M170 45H210M170 60H195M55 10V85'],
  software: [
    'M50 20H250V90H50ZM50 38H250M65 55L77 65 65 75M90 75H120',
    'M65 29H68M77 29H80M89 29H92M180 55H230M180 65H215M180 75H225',
  ],
};

export function ActivityGraphic({ activity, className = '' }: { activity: Activity; className?: string }) {
  return (
    <svg className={`${styles.graphic} ${className}`} viewBox="0 0 300 110" fill="none" aria-hidden="true">
      <path
        className={styles.graphicGrid}
        d="M0 20H300M0 55H300M0 90H300M45 0V110M95 0V110M145 0V110M195 0V110M245 0V110"
      />
      {paths[activity].map((d, i) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth={i === 0 ? 2 : 1} />
      ))}
      <circle className={styles.graphicPoint} cx="270" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}
