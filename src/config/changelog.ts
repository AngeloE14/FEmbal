export interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 'install-pwa',
    title: 'Instalar como app',
    description: 'Ahora puedes instalar ESAMS en tu pantalla de inicio como una app nativa.',
    icon: '📲',
  },
  {
    id: 'update-toast',
    title: 'Notificación de actualizaciones',
    description: 'Te avisamos cuando haya una nueva versión disponible para recargar.',
    icon: '🔄',
  },
];
