import { Component, inject, signal } from '@angular/core';
import { ComparatorService } from './comparator.service';

@Component({ imports: [], selector: 'app-root', styleUrl: './app.scss', templateUrl: './app.html' })
export class App {
  private readonly comparatorService = inject(ComparatorService);
  protected readonly bancoFile = signal<File | undefined>(undefined);
  protected readonly ventasFile = signal<File | undefined>(undefined);
  protected readonly omitirPrimeraFila = signal(true);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | undefined>(undefined);

  protected onBancoSelected(event: Event): void { this.bancoFile.set(this.selectedFile(event)); }
  protected onVentasSelected(event: Event): void { this.ventasFile.set(this.selectedFile(event)); }
  protected setOmitirPrimeraFila(event: Event): void {
    this.omitirPrimeraFila.set((event.target as HTMLInputElement).checked);
  }

  protected async comparar(): Promise<void> {
    const banco = this.bancoFile();
    const ventas = this.ventasFile();
    if (!banco || !ventas) {
      this.errorMessage.set('Selecciona ambos archivos antes de continuar.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(undefined);
    try {
      const response = await this.comparatorService.compareData(banco, ventas, this.omitirPrimeraFila());
      if (!response.ok) throw new Error(await this.getErrorMessage(response));

      const contentType = response.headers.get('content-type') ?? '';
      const isExcel = contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        || contentType.includes('application/octet-stream');
      if (!isExcel) throw new Error('El servidor no devolvió un archivo Excel válido.');

      const downloadUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'resultado.xlsx';
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No fue posible generar el archivo de conciliación.');
    } finally {
      this.loading.set(false);
    }
  }

  private selectedFile(event: Event): File | undefined {
    return (event.target as HTMLInputElement).files?.[0];
  }

  private async getErrorMessage(response: Response): Promise<string> {
    if ((response.headers.get('content-type') ?? '').includes('application/json')) {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
      if (Array.isArray(body.detail)) {
        return body.detail.map((item) => typeof item === 'object' && item && 'msg' in item ? String(item.msg) : String(item)).join(' ');
      }
    }
    return `El servidor respondió con el código ${response.status}.`;
  }
}
