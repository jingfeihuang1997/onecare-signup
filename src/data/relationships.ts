import type { StringKey } from '../i18n';
import type { RelationshipId } from '../types';

/** Options of "Your relationship to [name]". "other" opens a free-text field (SPEC 10.1, item 8). */
export const RELATIONSHIPS: readonly { id: RelationshipId; label: StringKey }[] = [
  { id: 'child', label: 'relationship.child' },
  { id: 'spouse', label: 'relationship.spouse' },
  { id: 'parent', label: 'relationship.parent' },
  { id: 'guardian', label: 'relationship.guardian' },
  { id: 'other', label: 'relationship.other' },
];
