import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { WidgetService } from '$core/services/widget.service';
import { AssetService } from '$core/services/asset.service';
import { WidgetData, isChartWidget, TIMEFRAME_OPTIONS } from '$core/models/widget.model';
import { titleSchema, newsLimitSchema } from './inspector.schema';
import { Asset } from '$shared';

@Component({
  selector: 'app-inspector',
  templateUrl: './inspector.component.html',
  styleUrls: ['./inspector.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ColorPickerComponent, IonButton, IonIcon, IonSelect, IonSelectOption],
})
export class InspectorComponent {

  @Input() allWidgets: WidgetData[] = [];

  nuovoID = '';

  readonly timeframeOptions = TIMEFRAME_OPTIONS;

  @Output() closed = new EventEmitter<void>();

  assets: Asset[] = [];

  assetFilter = '';

  constructor(public widgetService: WidgetService, private assetService: AssetService) {
    addIcons({ closeOutline });
    this.assetService.list().subscribe({
      next: (list) => (this.assets = list),
      error: () => undefined,
    });
  }

  get filteredAssets(): Asset[] {
    const q = this.assetFilter.trim().toLowerCase();
    const list = q
      ? this.assets.filter(
          (a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
        )
      : this.assets;
    return list.slice(0, 60);
  }

  onTickerChange(ticker: string): void {
    if (!this.selectedWidget) {
      return;
    }
    this.selectedWidget.ticker = ticker;
    const asset = this.assets.find((a) => a.ticker === ticker);
    if (asset) {
      this.selectedWidget.company = asset.name;
      this.selectedWidget.price = asset.price;
    }
  }

  get selectedWidget(): WidgetData | null {
    return this.widgetService.selectedWidget;
  }

  get isStock(): boolean {
    return this.selectedWidget?.type === 'stockInfo';
  }

  get isUnlisted(): boolean {
    return this.selectedWidget?.type === 'unlistedStock';
  }

  get isChart(): boolean {
    return !!this.selectedWidget && isChartWidget(this.selectedWidget);
  }

  get isNews(): boolean {
    return this.selectedWidget?.type === 'newsFeed';
  }

  get isHub(): boolean {
    return this.selectedWidget?.type === 'connectionHub';
  }

  get titleError(): boolean {
    const title = this.selectedWidget?.title?.trim() ?? '';
    return title.length > 0 && !titleSchema.safeParse(title).success;
  }

  get limitError(): boolean {
    return !!this.selectedWidget && !newsLimitSchema.safeParse(this.selectedWidget.limit).success;
  }

  resetColor(): void {
    if (this.selectedWidget) {
      this.selectedWidget.color = undefined;
      this.selectedWidget.opacity = undefined;
    }
  }

  chiudiPannello(): void {
    this.widgetService.deselectWidget();
    this.closed.emit();
  }

  aggiungiID(): void {
    if (!this.selectedWidget) {
      return;
    }
    const idPulito = this.nuovoID.trim();
    if (!idPulito) {
      return;
    }

    const esiste = this.allWidgets.some((w) => w.id === idPulito);
    if (!esiste) {
      alert('Operazione annullata: nessun widget con ID "' + idPulito + '" sul canvas.');
      return;
    }

    this.selectedWidget.connectedIDs = this.selectedWidget.connectedIDs ?? [];
    if (!this.selectedWidget.connectedIDs.includes(idPulito)) {
      this.selectedWidget.connectedIDs.push(idPulito);
      this.nuovoID = '';
    }
  }

  rimuoviID(idDaRimuovere: string): void {
    if (this.selectedWidget?.connectedIDs) {
      this.selectedWidget.connectedIDs = this.selectedWidget.connectedIDs.filter(
        (id: string) => id !== idDaRimuovere,
      );
    }
  }
}
