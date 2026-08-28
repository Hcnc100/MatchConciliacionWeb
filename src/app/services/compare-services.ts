import { Injectable } from '@angular/core';

export interface ConciliationProgress {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  stage: string;
  message: string;
  error?: string;
  events_url: string;
  result_url?: string;
}

@Injectable({ providedIn: 'root' })
export class CompareServices {
  private readonly baseUrl =
    'https://api.conciliacion.ricardopajarocoatl.com';

  async compareData(
    bancoFile: File,
    ventasFile: File,
    omitirPrimeraFila: boolean,
    onProgress: (state: ConciliationProgress) => void,
  ): Promise<Blob> {
    const job = await this.createJob(bancoFile, ventasFile, omitirPrimeraFila);
    onProgress(job);
    const completedJob = await this.watchJob(job, onProgress);
    if (!completedJob.result_url) {
      throw new Error('El resultado no está disponible para descarga.');
    }

    const response = await fetch(`${this.baseUrl}${completedJob.result_url}`);
    if (!response.ok) throw new Error(await this.getErrorMessage(response));
    return response.blob();
  }

  private async createJob(
    bancoFile: File,
    ventasFile: File,
    omitirPrimeraFila: boolean,
  ): Promise<ConciliationProgress> {
    const formData = new FormData();
    formData.append('banco', bancoFile);
    formData.append('ventas', ventasFile);
    formData.append('omitir_primera_fila', String(omitirPrimeraFila));

    const response = await fetch(`${this.baseUrl}/conciliaciones`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(await this.getErrorMessage(response));
    return response.json() as Promise<ConciliationProgress>;
  }

  private watchJob(
    job: ConciliationProgress,
    onProgress: (state: ConciliationProgress) => void,
  ): Promise<ConciliationProgress> {
    return new Promise((resolve, reject) => {
      const source = new EventSource(`${this.baseUrl}${job.events_url}`);
      let finished = false;

      source.addEventListener('progreso', (event) => {
        const state = JSON.parse((event as MessageEvent<string>).data) as ConciliationProgress;
        onProgress(state);
        if (state.status === 'completed') {
          finished = true;
          source.close();
          resolve(state);
        } else if (state.status === 'failed') {
          finished = true;
          source.close();
          reject(new Error(state.error || state.message));
        }
      });

      source.onerror = () => {
        if (finished) return;
        source.close();
        this.pollJob(job.id, onProgress).then(resolve).catch(reject);
      };
    });
  }

  private async pollJob(
    jobId: string,
    onProgress: (state: ConciliationProgress) => void,
  ): Promise<ConciliationProgress> {
    while (true) {
      const response = await fetch(`${this.baseUrl}/conciliaciones/${jobId}`);
      if (!response.ok) throw new Error(await this.getErrorMessage(response));
      const state = await response.json() as ConciliationProgress;
      onProgress(state);
      if (state.status === 'completed') return state;
      if (state.status === 'failed') throw new Error(state.error || state.message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async getErrorMessage(response: Response): Promise<string> {
    if ((response.headers.get('content-type') ?? '').includes('application/json')) {
      const body = await response.json() as { detail?: unknown };
      if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
    }
    return `El servidor respondió con el código ${response.status}.`;
  }
}
