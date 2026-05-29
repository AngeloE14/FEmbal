// ===== CERTIFICATE MODULE =====
// Tipos de dominio del certificado. Los campos químicos existen en el PDF final,
// pero se hidratan desde la calculadora para no duplicar cálculos ni estados.

export type EmbalmingType = 'Patológico' | 'Caso Legal' | 'Traslado';

export type ChemicalSolutionData = {
  formaldehydeConcentration: string;
  arterial: string;
  vascularConditioner: string;
  humectant: string;
  jaundiceChemical: string;
  waterConditioner: string;
};

export type CertificateData = {
  funeralHome: string;
  procedureDate: string;
  procedureTime: string;
  deceasedName: string;
  deathCauses: string;
  doctorName: string;
  doctorLicense: string;
  deathCertificateFolio: string;
  injectionSite: string;
  embalmingType: EmbalmingType;
  transferRecommendations: string;
  embalmerName: string;
  embalmerLicense: string;
  signatureDataUrl: string;
} & ChemicalSolutionData;

export type ManualCertificateData = Omit<CertificateData, keyof ChemicalSolutionData>;

export type ManualCertificateField = keyof ManualCertificateData;
export type CertificateField = keyof CertificateData;

export const embalmingTypes: EmbalmingType[] = ['Patológico', 'Caso Legal', 'Traslado'];

export const chemicalSolutionFields: Array<keyof ChemicalSolutionData> = [
  'formaldehydeConcentration',
  'arterial',
  'vascularConditioner',
  'humectant',
  'jaundiceChemical',
  'waterConditioner',
];

export const emptyChemicalSolutionData: ChemicalSolutionData = {
  formaldehydeConcentration: 'Calcula una solución arterial para sincronizar este campo.',
  arterial: 'Calcula una solución arterial para sincronizar este campo.',
  vascularConditioner: 'Sin dato calculado en el sistema actual.',
  humectant: 'Sin dato calculado en el sistema actual.',
  jaundiceChemical: 'Sin indicación automática del cálculo actual.',
  waterConditioner: 'Calcula una solución arterial para sincronizar este campo.',
};

export const createInitialCertificateData = (): ManualCertificateData => {
  const now = new Date();
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const localTime = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join(':');

  return {
    funeralHome: '',
    procedureDate: localDate,
    procedureTime: localTime,
    deceasedName: '',
    deathCauses: '',
    doctorName: '',
    doctorLicense: '',
    deathCertificateFolio: '',
    injectionSite: '',
    embalmingType: 'Patológico',
    transferRecommendations: '',
    embalmerName: '',
    embalmerLicense: '',
    signatureDataUrl: '',
  };
};
