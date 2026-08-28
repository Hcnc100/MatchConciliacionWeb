import { Component } from '@angular/core';
import { CompareServices } from '../../services/compare-services';
import { signal } from '@angular/core';

@Component({
  selector: 'app-compare-component',
  imports: [],
  templateUrl: './compare-component.html',
  styleUrl: './compare-component.css',
})
export class CompareComponent {
  bancoFile = signal<File | undefined>(undefined);
  ventasFile = signal<File | undefined>(undefined);
  omitirPrimeraFila = signal(true);
  loading = signal(false);
  progress = signal(0);
  progressMessage = signal('Preparando archivos');
  errorMessage = signal<string | undefined>(undefined);
  completed = signal(false);

  constructor(
    private readonly compareService: CompareServices
  ) { }

  onBancoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      this.bancoFile.set(input.files[0]);
      this.completed.set(false);
      this.errorMessage.set(undefined);
    }
  }

  onVentasSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      this.ventasFile.set(input.files[0]);
      this.completed.set(false);
      this.errorMessage.set(undefined);
    }
  }

  async comparar(): Promise<void> {
    const banco = this.bancoFile();
    const ventas = this.ventasFile();
    if (!banco || !ventas) {
      this.errorMessage.set('Selecciona ambos archivos antes de continuar.');
      return;
    }

    this.loading.set(true);
    this.progress.set(0);
    this.progressMessage.set('Subiendo archivos');
    this.errorMessage.set(undefined);
    this.completed.set(false);
    try {
      const blob = await this.compareService.compareData(
        banco,
        ventas,
        this.omitirPrimeraFila(),
        (state) => {
          this.progress.set(state.progress);
          this.progressMessage.set(state.message);
        },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resultado.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      this.progress.set(100);
      this.progressMessage.set('Conciliación completada');
      this.completed.set(true);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'No fue posible generar la conciliación.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}
