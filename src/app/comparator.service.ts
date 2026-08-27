import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ComparatorService {
  private readonly endpoint = 'https://conciliador-api-71259703343.us-central1.run.app/conciliar';

  public compareData(bancoFile: File, ventasFile: File, omitirPrimeraFila: boolean): Promise<Response> {
    const formData = new FormData();
    formData.append('banco', bancoFile);
    formData.append('ventas', ventasFile);
    formData.append('omitir_primera_fila', String(omitirPrimeraFila));
    return fetch(this.endpoint, { method: 'POST', body: formData });
  }
}
