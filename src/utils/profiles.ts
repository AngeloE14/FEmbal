import type { ChemicalOption, PresetButton } from './constants';

export const CHEMICAL_OPTIONS: ChemicalOption[] = [
  { value: '20', label: 'Arterial index 20' },
  { value: '27', label: 'Arterial index 27' },
  { value: '30', label: 'Arterial index 30' },
  { value: '32', label: 'Arterial index 32' },
];

export const PRESET_BUTTONS: PresetButton[] = [
  {
    key: 'baja',
    label: '🟢 Baja 0.1~1.99%',
    min: 0.1,
    max: 1.99,
    set: 0.1,
  },
  {
    key: 'media',
    label: '🟡 Media 2.0~3.99%',
    min: 2,
    max: 3.99,
    set: 2,
  },
  {
    key: 'fuerte',
    label: '🔴 Fuerte +4.0%',
    min: 4,
    set: 4,
  },
];
