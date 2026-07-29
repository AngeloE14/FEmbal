// ===== MÓDULO DE DOCUMENTO =====
// Estos tipos describen los datos que viajan entre el formulario, la vista previa
// y el PDF. Mantenerlos en un solo lugar evita que un campo eliminado siga
// apareciendo por accidente en otra parte de la pantalla.

export type EmbalmingType = 'Patológico' | 'Caso Legal' | 'Traslado';

export type ChemicalSolutionData = {
  formaldehydeConcentration: string;
  arterial: string;
  waterConditioner: string;
};

export type CertificateData = {
  funeralHome: string;
  procedureDate: string;
  procedureTime: string;
  deceasedName: string;
  deathCauses: string;
  deathCertificateFolio: string;
  doctorName: string;
  doctorLicense: string;
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


// Esta lista controla cuándo el formulario está completo. Quitamos el folio
// porque el equipo pidió eliminarlo del formulario y del documento final.
export const requiredManualCertificateFields: ManualCertificateField[] = [
  'funeralHome',
  'procedureDate',
  'procedureTime',
  'deceasedName',
  'deathCauses',
  'deathCertificateFolio',
  'doctorName',
  'doctorLicense',
  'injectionSite',
  'embalmingType',
  'transferRecommendations',
  'embalmerName',
  'embalmerLicense',
  'signatureDataUrl',
];


// Solo dejamos los químicos que deben verse. Los campos retirados se quitaron
// aquí para que no se rendericen ni se exporten al PDF.
export const chemicalSolutionFields: Array<keyof ChemicalSolutionData> = [
  'formaldehydeConcentration',
  'arterial',
  'waterConditioner',
];

export const emptyChemicalSolutionData: ChemicalSolutionData = {
  formaldehydeConcentration: '',
  arterial: '',
  waterConditioner: '',
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
    deathCertificateFolio: '',
    doctorName: '',
    doctorLicense: '',
    injectionSite: '',
    embalmingType: 'Patológico',
    transferRecommendations: '',
    embalmerName: '',
    embalmerLicense: '',
    signatureDataUrl: '',
  };
};
