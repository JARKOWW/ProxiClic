/** Grades des aidants, attribués selon le nombre d'interventions effectuées. */
export const GRADES = [
  { min: 0, name: 'Nouvel aidant', icon: '🌱', description: 'Vient de rejoindre Proxi’Tech' },
  { min: 1, name: 'Voisin serviable', icon: '🤝', description: 'Dès la 1re intervention effectuée' },
  { min: 3, name: 'Aidant confirmé', icon: '⭐', description: 'À partir de 3 interventions' },
  { min: 5, name: 'Expert du quartier', icon: '🏅', description: 'À partir de 5 interventions' },
  { min: 10, name: 'Ange gardien du numérique', icon: '🏆', description: 'À partir de 10 interventions' },
] as const;

export type Grade = (typeof GRADES)[number];

export function gradeFor(completed: number): Grade {
  return [...GRADES].reverse().find((grade) => completed >= grade.min) ?? GRADES[0];
}

/** Grade suivant et nombre d'interventions restantes, ou null au sommet. */
export function nextGrade(completed: number): { grade: Grade; remaining: number } | null {
  const grade = GRADES.find((g) => g.min > completed);
  return grade ? { grade, remaining: grade.min - completed } : null;
}
