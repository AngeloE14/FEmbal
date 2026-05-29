// ===== CERTIFICATE MODULE =====
// Estado editable del documento. La solución química no vive aquí:
// se deriva desde el contexto de la calculadora para evitar datos duplicados.

import { useCallback, useMemo, useState } from 'react';
import {
  createInitialCertificateData,
  type ManualCertificateData,
  type ManualCertificateField,
} from '../types';

export function useCertificateData() {
  const initialData = useMemo(() => createInitialCertificateData(), []);
  const [certificateData, setCertificateData] = useState<ManualCertificateData>(() => initialData);

  const updateField = useCallback(
    <Field extends ManualCertificateField>(field: Field, value: ManualCertificateData[Field]) => {
      setCertificateData((currentData) => {
        if (currentData[field] === value) {
          return currentData;
        }

        return {
          ...currentData,
          [field]: value,
        };
      });
    },
    [],
  );

  const resetCertificate = useCallback(() => {
    setCertificateData(createInitialCertificateData());
  }, []);

  return {
    certificateData,
    resetCertificate,
    updateField,
  };
}
