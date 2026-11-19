import type { ComponentType } from 'react';
import { ChapterA } from './chapters/ChapterA';
import { ChapterA2 } from './chapters/ChapterA2';
import { ChapterB } from './chapters/ChapterB';
import { ChapterB2 } from './chapters/ChapterB2';
import { ChapterC } from './chapters/ChapterC';
import { ChapterC2 } from './chapters/ChapterC2';
import { ChapterD } from './chapters/ChapterD';
import { ChapterD2 } from './chapters/ChapterD2';
import { ChapterMorse } from './chapters/ChapterMorse';
import { ChapterPractice } from './chapters/ChapterPractice';

/** Componentes que forman el cuerpo de cada capítulo, en orden. Los usan la web y la versión impresa. */
export const CHAPTER_BODIES: Record<string, ComponentType[]> = {
  'a-electricidad': [ChapterA, ChapterA2],
  'b-modulacion-equipos': [ChapterB, ChapterB2],
  'c-antenas-propagacion': [ChapterC, ChapterC2],
  'd-reglamento': [ChapterD, ChapterD2],
  morse: [ChapterMorse],
  practica: [ChapterPractice],
};
