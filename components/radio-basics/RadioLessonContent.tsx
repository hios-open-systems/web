'use client';

import type { RadioPageId } from '@/config/radio-course';
import { ConceptLesson } from './ConceptLesson';
import { OhmSection } from './TheorySections';
import { ConnectionLesson } from './ConnectionsSection';
import { PowerSection, MeasurementSection } from './PowerSection';
import { LaboratorySection } from './LaboratorySection';
import { PracticeSection } from './PracticeSection';
import { RadioGlossary } from './RadioGlossary';
import { SignalLesson } from './SignalLesson';
import { LessonSources } from './LessonResources';
import { RadioBands } from './RadioBands';

export function RadioLessonContent({ page }: { page: RadioPageId }) {
  switch (page) {
    case 'voltage':
    case 'current':
    case 'resistance':
      return <ConceptLesson concept={page} />;
    case 'ohm':
      return <OhmSection showTitle={false} />;
    case 'series':
    case 'parallel':
      return <ConnectionLesson mode={page} />;
    case 'power':
      return <><ConceptLesson concept="power" /><PowerSection showTitle={false} /></>;
    case 'measurement':
      return <MeasurementSection />;
    case 'laboratory':
      return <LaboratorySection />;
    case 'bands':
      return <RadioBands />;
    case 'practice':
      return <PracticeSection showTitle={false} />;
    case 'waves':
    case 'propagation':
    case 'morse':
      return <SignalLesson topic={page} />;
    case 'glossary':
      return <RadioGlossary showTitle={false} />;
    case 'sources':
      return <LessonSources />;
  }
}
