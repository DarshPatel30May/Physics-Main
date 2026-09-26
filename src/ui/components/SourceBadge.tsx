import type { FormulaSource } from '../../engine/types';
import { SOURCE_LABELS } from '../../engine/types';

const CLS: Record<FormulaSource, string> = {
  NESA_FORMULA_SHEET: 'sheet',
  SYLLABUS: 'derived',
  DERIVED: 'derived',
  HSC_EXAM_APPLICATION: 'derived',
  YEAR11_PREREQUISITE: 'y11',
  EXTENSION: 'ext',
};
const SHORT: Record<FormulaSource, string> = {
  NESA_FORMULA_SHEET: 'Formula sheet',
  SYLLABUS: 'Syllabus',
  DERIVED: 'Derived',
  HSC_EXAM_APPLICATION: 'HSC application',
  YEAR11_PREREQUISITE: 'Year 11',
  EXTENSION: 'Extension',
};

export function SourceBadge({ source }: { source: FormulaSource }) {
  return <span className={`badge ${CLS[source]}`} title={SOURCE_LABELS[source]}>{SHORT[source]}</span>;
}
