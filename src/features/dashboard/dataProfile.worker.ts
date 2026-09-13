/// <reference lib="webworker" />

import type { DataRecord, DetectedColumn } from '../../domain/types';
import { buildDataProfile } from './dataProfile';

interface DataProfileWorkerRequest {
  records: DataRecord[];
  columns: DetectedColumn[];
}

/**
 * Este archivo es un ayudante que trabaja detrás de la escena.
 *
 * El navegador ejecuta el Web Worker en un hilo separado. Así, cuando el Excel
 * tiene muchas filas, contar vacíos y valores únicos no congela los botones ni
 * el desplazamiento de la página principal.
 */
self.onmessage = (event: MessageEvent<DataProfileWorkerRequest>) => {
  const { records, columns } = event.data;
  self.postMessage(buildDataProfile(records, columns));
};

export {};
