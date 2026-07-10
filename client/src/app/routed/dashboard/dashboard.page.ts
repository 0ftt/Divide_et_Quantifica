import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, closeOutline, trendingUpOutline, locateOutline,
  settingsOutline, notificationsOutline, bagOutline, shieldCheckmarkOutline,
  pulseOutline, gitNetworkOutline, statsChartOutline,
  analyticsOutline, barChartOutline, pieChartOutline, chevronUpOutline,
  chevronDownOutline, moonOutline, sunnyOutline, walletOutline, trophyOutline,
  optionsOutline, searchOutline, documentTextOutline, swapVerticalOutline, calculatorOutline,
  pricetagOutline, homeOutline, timeOutline, albumsOutline, documentOutline, createOutline,
} from 'ionicons/icons';

import { WidgetData, WidgetType } from '$core/models/widget.model';
import { WidgetService } from '$core/services/widget.service';
import { AuthService } from '$core/auth/auth.service';
import {
  loginSchema,
  registerSchema,
  emailSchema,
  passwordSchema,
  usernameSchema,
  addressSchema,
  citySchema,
  capSchema,
} from '$core/validation/auth.schema';
import { ThemeService } from '$core/theme/theme.service';
import { CreditService } from '$core/services/credit.service';
import { NotificationService } from '$core/services/notification.service';
import { BrokerCartService } from '$core/services/broker-cart.service';
import { LeaderboardService } from '$core/services/leaderboard.service';
import { AssetService } from '$core/services/asset.service';
import { WorkspaceService } from '$core/services/workspace.service';
import { Asset } from '$shared';
import { DuplicatePayload } from '$components/charts/chart-widget-base';

import { ModalComponent } from '$components/modal/modal.component';
import { WidgetComponent } from '$components/widget/widget.component';
import { InspectorComponent } from '$components/inspector/inspector.component';
import { LangSwitcherComponent } from '$components/lang-switcher/lang-switcher.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ConnectionHubComponent } from '$components/connection-hub/connection-hub.component';
import { CandlestickWidgetComponent } from '$components/charts/candlestick-widget/candlestick-widget.component';
import { LineWidgetComponent } from '$components/charts/line-widget/line-widget.component';
import { AreaWidgetComponent } from '$components/charts/area-widget/area-widget.component';
import { BarWidgetComponent } from '$components/charts/bar-widget/bar-widget.component';
import { PieWidgetComponent } from '$components/charts/pie-widget/pie-widget.component';
import { InventoryWidgetComponent } from '$components/inventory-widget/inventory-widget.component';
import { UtilityWidgetComponent } from '$components/utility-widget/utility-widget.component';

interface TabData {
  id: string;
  name: string;
  active: boolean;
  widgets: WidgetData[];
  deletedWidgets: WidgetData[];
  maxZIndex: number;
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InspectorComponent,
    LangSwitcherComponent,
    TranslocoModule,
    WidgetComponent,
    ConnectionHubComponent,
    CandlestickWidgetComponent,
    LineWidgetComponent,
    AreaWidgetComponent,
    BarWidgetComponent,
    PieWidgetComponent,
    InventoryWidgetComponent,
    UtilityWidgetComponent,
    ModalComponent,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
  ],
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {

  email = '';
  password = '';
  confirmPassword = '';
  nomeUtente = 'Giovanni Luca';
  passwordErrata = false;
  isUserPremium = false;

  get isUserAdmin(): boolean {
    return this.auth.currentUser()?.role === 'admin';
  }

  authMode: 'login' | 'register' | 'recover' = 'login';
  displayName = '';
  username = '';
  phone = '';

  address = '';
  city = '';
  cap = '';
  authError: string | null = null;
  authLoading = false;
  recoverSent = false;

  isDrawerOpen = false;
  linkFeedback: string | null = null;

  inspectorOpen = false;

  tabsMenuOpen = false;
  renamingTabId: string | null = null;
  tabModalOpen = false;
  newTabName = '';

  marqueeAddModalOpen = false;
  marqueeAddTicker: string | null = null;

  premiumModalOpen = false;
  premiumBusy = false;
  premiumError: string | null = null;
  premiumCredit: number | null = null;
  readonly premiumPrice = 10;

  notificationsOpen = false;

  searchOpen = false;
  searchQuery = '';
  private highlightTimeout: ReturnType<typeof setTimeout> | null = null;

  marqueeTickers = [
    { name: 'UNH', price: 495.2, change: 1.2 },
    { name: 'AAPL', price: 189.3, change: -0.5 },
    { name: 'MSFT', price: 420.15, change: 2.1 },
    { name: 'NVDA', price: 850.1, change: 2.8 },
    { name: 'TSLA', price: 244.5, change: -1.1 },
    { name: 'AMZN', price: 178.9, change: 0.9 },
    { name: 'META', price: 505.4, change: 1.5 },
    { name: 'GOOG', price: 176.2, change: -0.3 },
    { name: 'JPM', price: 198.6, change: 0.6 },
    { name: 'V', price: 275.1, change: -0.4 },
    { name: 'DIS', price: 101.8, change: 1.1 },
    { name: 'NFLX', price: 628.3, change: -0.8 },
  ];

  tabsList: TabData[] = [
    {
      id: 'tab-1',
      name: 'Board 1',
      active: true,
      maxZIndex: 10,
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1,
      deletedWidgets: [],

      widgets: [],
    },
  ];

  get activeTab(): TabData {
    return this.tabsList.find((t) => t.active) ?? this.tabsList[0];
  }

  get widgetList(): WidgetData[] {
    return this.activeTab.widgets;
  }

  canvasX = 0;
  canvasY = 0;
  canvasZoom = 1.0;
  private targetX = 0;
  private targetY = 0;
  private targetZoom = 1.0;
  private readonly minZoom = 0.15;
  private readonly maxZoom = 3.0;
  private readonly easeFactor = 0.12;
  private isPanning = false;
  private startMouseX = 0;
  private startMouseY = 0;

  @ViewChild('bgCanvas', { static: false }) bgCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D | null;
  private animationFrameId!: number;
  private mouseX = 0;
  private mouseY = 0;
  private shadowRadius = 200;

  private auth = inject(AuthService);
  private transloco = inject(TranslocoService);
  private theme = inject(ThemeService);
  private credit = inject(CreditService);
  public notifications = inject(NotificationService);
  public cart = inject(BrokerCartService);
  private leaderboardService = inject(LeaderboardService);
  private assetService = inject(AssetService);
  private workspaceService = inject(WorkspaceService);

  private assetPool: Asset[] = [];

  private lastSavedJson = '';
  private autosaveTimer?: ReturnType<typeof setInterval>;
  private marqueeTimer?: ReturnType<typeof setInterval>;

  constructor(public widgetService: WidgetService, private router: Router) {
    addIcons({
      addOutline, closeOutline, trendingUpOutline, locateOutline,
      settingsOutline, notificationsOutline, bagOutline, shieldCheckmarkOutline,
      pulseOutline, gitNetworkOutline, statsChartOutline,
      analyticsOutline, barChartOutline, pieChartOutline, chevronUpOutline,
      chevronDownOutline, moonOutline, sunnyOutline, walletOutline, trophyOutline,
      optionsOutline, searchOutline, documentTextOutline, swapVerticalOutline, calculatorOutline,
      pricetagOutline, homeOutline, timeOutline, albumsOutline, documentOutline, createOutline,
    });
  }

  get themeIcon(): string {
    return this.theme.isDark() ? 'moon-outline' : 'sunny-outline';
  }

  get loginCompletato(): boolean {
    return this.auth.isAuthenticated();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  ngOnInit(): void {
    this.auth.restoreSession().subscribe((ok) => {
      if (ok) {
        this.onAuthSuccess();
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initGridSimulation(), 50);
  }

  ionViewWillEnter(): void {
    const ticker = this.widgetService.pendingStockTicker;
    if (ticker && this.auth.isAuthenticated()) {
      this.widgetService.pendingStockTicker = null;
      this.spawnNewWidget(ticker, 'stockInfo', '', ticker);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }

    this.flushWorkspace();
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }
    if (this.marqueeTimer) {
      clearInterval(this.marqueeTimer);
    }
  }

  setAuthMode(mode: 'login' | 'register' | 'recover'): void {
    this.authMode = mode;
    this.authError = null;
    this.recoverSent = false;
    this.confirmPassword = '';
  }

  submitAuth(): void {
    this.authError = null;
    if (this.authMode === 'register') {
      this.doRegister();
    } else if (this.authMode === 'recover') {
      this.doRecover();
    } else {
      this.doLogin();
    }
  }

    fieldError(field: 'email' | 'password' | 'username' | 'address' | 'city' | 'cap'): string | null {
    const value = (
      {
        email: this.email,
        password: this.password,
        username: this.username,
        address: this.address,
        city: this.city,
        cap: this.cap,
      } as Record<string, string>
    )[field] ?? '';
    if (!value.trim()) {
      return null;
    }
    switch (field) {
      case 'email':
        return emailSchema.safeParse(value).success ? null : 'auth.invalidEmail';
      case 'password':

        if (this.authMode !== 'register') {
          return null;
        }
        return passwordSchema.safeParse(value).success ? null : 'auth.weakPassword';
      case 'username':
        return usernameSchema.safeParse(value).success ? null : 'auth.invalidUsername';
      case 'address':
        return addressSchema.safeParse(value).success ? null : 'auth.invalidAddress';
      case 'city':
        return citySchema.safeParse(value).success ? null : 'auth.invalidCity';
      case 'cap':
        return capSchema.safeParse(value).success ? null : 'auth.invalidCap';
      default:
        return null;
    }
  }

  private doLogin(): void {
    if (!this.email || !this.password) {
      return;
    }

    const parsed = loginSchema.safeParse({ email: this.email, password: this.password });
    if (!parsed.success) {
      this.authError = this.transloco.translate('auth.invalidEmail');
      return;
    }
    this.authLoading = true;
    this.auth.login(parsed.data).subscribe({
      next: () => this.onAuthSuccess(),
      error: (err) => this.onAuthError(err),
    });
  }

  private doRegister(): void {
    if (!this.email || !this.password) {
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.authError = this.transloco.translate('auth.passwordMismatch');
      return;
    }
    const parsed = registerSchema.safeParse({
      email: this.email,
      password: this.password,
      displayName: this.displayName,
      username: this.username,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0].path[0];
      const keys: Record<string, string> = {
        password: 'auth.weakPassword',
        username: 'auth.invalidUsername',
      };
      this.authError = this.transloco.translate(keys[field as string] ?? 'auth.invalidEmail');
      return;
    }
    this.authLoading = true;
    this.auth
      .register(parsed.data)
      .subscribe({
        next: () => this.onAuthSuccess(),
        error: (err) => this.onAuthError(err),
      });
  }

  private doRecover(): void {
    const email = this.email.trim();
    if (!email) {
      return;
    }
    this.auth.recover(email).subscribe({
      next: () => (this.recoverSent = true),
      error: () => (this.recoverSent = true),
    });
  }

  private onAuthSuccess(): void {
    this.authLoading = false;
    this.passwordErrata = false;

    const user = this.auth.currentUser();
    if (user) {
      this.nomeUtente = user.username || user.displayName || 'Utente';
      this.isUserPremium = user.isPremium;
    }
    this.loadAssetPool();
    this.loadWorkspace();
    this.syncReviewNotifications();
  }

  private isOfflineSession(): boolean {
    return this.auth.currentUser()?.id === 'offline-admin';
  }

  private serializeWorkspace(): unknown {
    this.saveCameraToTab(this.activeTab);
    return {
      activeTabId: this.activeTab.id,
      tabs: this.tabsList.map((t) => ({
        id: t.id,
        name: t.name,
        cameraX: t.cameraX,
        cameraY: t.cameraY,
        cameraZoom: t.cameraZoom,
        maxZIndex: t.maxZIndex,
        widgets: t.widgets,
      })),
    };
  }

  private restoreWorkspace(state: unknown): void {
    const s = state as {
      activeTabId?: string;
      tabs?: Array<Partial<TabData> & { widgets?: WidgetData[] }>;
    };
    if (!s || !Array.isArray(s.tabs) || !s.tabs.length) {
      this.resetWorkspaceToDefault();
      return;
    }
    this.tabsList = s.tabs.map((t) => ({
      id: t.id ?? `tab-${Date.now()}`,
      name: t.name ?? 'Board',
      active: t.id === s.activeTabId,
      widgets: Array.isArray(t.widgets) ? t.widgets : [],
      deletedWidgets: [],
      maxZIndex: t.maxZIndex ?? 10,
      cameraX: t.cameraX ?? 0,
      cameraY: t.cameraY ?? 0,
      cameraZoom: t.cameraZoom ?? 1,
    }));
    if (!this.tabsList.some((t) => t.active)) {
      this.tabsList[0].active = true;
    }
    this.loadCameraFromTab(this.activeTab);
  }

  private resetWorkspaceToDefault(): void {
    this.tabsMenuOpen = false;
    this.renamingTabId = null;
    this.inspectorOpen = false;
    this.isDrawerOpen = false;
    this.widgetService.deselectWidget();
    this.tabsList = [
      {
        id: `tab-${Date.now()}`,
        name: 'Board 1',
        active: true,
        maxZIndex: 10,
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1,
        deletedWidgets: [],
        widgets: [],
      },
    ];
    this.loadCameraFromTab(this.activeTab);
  }

  private loadWorkspace(): void {
    this.stopAutosave();
    this.resetWorkspaceToDefault();
    this.workspaceService.get().subscribe({
      next: (res) => {
        this.restoreWorkspace(res.state);
        this.lastSavedJson = JSON.stringify(this.serializeWorkspace());
        this.startAutosave();
      },
      error: () => {
        this.lastSavedJson = JSON.stringify(this.serializeWorkspace());
        this.startAutosave();
      },
    });
  }

  private startAutosave(): void {
    if (this.autosaveTimer) {
      return;
    }
    this.autosaveTimer = setInterval(() => this.flushWorkspace(), 5000);
  }

  private stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = undefined;
    }
  }

  private flushWorkspace(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    const state = this.serializeWorkspace();
    const json = JSON.stringify(state);
    if (json === this.lastSavedJson) {
      return;
    }
    this.lastSavedJson = json;
    if (this.isOfflineSession()) {
      localStorage.setItem('deq-workspace', json);
      return;
    }
    this.workspaceService.save(state).subscribe({ error: () => undefined });
  }

  private loadAssetPool(): void {
    this.assetService.list().subscribe({
      next: (list) => {
        this.assetPool = list;
        this.buildMarquee(list);
      },
      error: () => undefined,
    });

    if (!this.marqueeTimer) {
      this.marqueeTimer = setInterval(() => {
        this.assetService.list().subscribe({
          next: (list) => {
            this.assetPool = list;
            this.buildMarquee(list);
          },
          error: () => undefined,
        });
      }, 120_000);
    }
  }

  private buildMarquee(list: Asset[]): void {
    if (!list.length) {
      return;
    }
    this.marqueeTickers = list.map((a) => ({
      name: a.ticker,
      price: a.price,
      change: a.change ?? 0,
    }));
  }

  private syncReviewNotifications(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      return;
    }
    this.leaderboardService.getReviews(userId).subscribe({
      next: (reviews) => this.notifications.syncReviews(reviews),
      error: () => undefined,
    });
  }

  private onAuthError(err: { error?: { error?: string } }): void {
    this.authLoading = false;
    this.passwordErrata = true;
    setTimeout(() => (this.passwordErrata = false), 800);
    this.authError = err?.error?.error || this.transloco.translate('auth.failed');
  }

  private initGridSimulation(): void {
    if (!this.bgCanvas) {
      return;
    }
    this.ctx = this.bgCanvas.nativeElement.getContext('2d');
    this.resizeCanvas();
    this.startGridLoop();
  }

  private resizeCanvas(): void {
    if (this.bgCanvas) {
      this.bgCanvas.nativeElement.width = window.innerWidth;
      this.bgCanvas.nativeElement.height = window.innerHeight;
    }
  }

  private startGridLoop(): void {
    let time = 0;
    const gridStep = 11;

    const loop = () => {
      this.syncWidgetSizes();
      this.canvasX += (this.targetX - this.canvasX) * this.easeFactor;
      this.canvasY += (this.targetY - this.canvasY) * this.easeFactor;
      this.canvasZoom += (this.targetZoom - this.canvasZoom) * this.easeFactor;

      time += 0.025;

      if (this.ctx && this.bgCanvas) {
        const canvas = this.bgCanvas.nativeElement;
        const width = canvas.width;
        const height = canvas.height;

        const light = document.body.classList.contains('deq-light');
        if (light) {

          const gradient = this.ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#eee2c8');
          gradient.addColorStop(0.55, '#d6d2ac');
          gradient.addColorStop(1, '#a9cdc0');
          this.ctx.fillStyle = gradient;
        } else {
          this.ctx.fillStyle = '#020617';
        }
        this.ctx.fillRect(0, 0, width, height);

        for (let screenX = 0; screenX < width; screenX += gridStep) {
          for (let screenY = 0; screenY < height; screenY += gridStep) {
            const nX = screenX * 0.002;
            const nY = screenY * 0.002;

            const wave1 = Math.sin(nX + nY - time * 0.5);
            const wave2 = Math.cos(nX * 2.5 - nY * 1.5 + time * 1.0);
            const wave3 = Math.sin(nX * 2.0 + time);
            const combinedWave = (wave1 + wave2 * 0.6 + wave3 * 0.3) / 1.9;

            let noiseAlpha = 0;
            if (combinedWave > -0.1) {
              const normalized = (combinedWave + 0.1) / 1.1;
              noiseAlpha = Math.pow(normalized, 1.8) * 0.85;
            } else {
              noiseAlpha = 0.01;
            }

            const dxM = screenX - this.mouseX;
            const dyM = screenY - this.mouseY;
            const distM = Math.sqrt(dxM * dxM + dyM * dyM);

            let combinedAlpha = noiseAlpha;
            if (distM < this.shadowRadius) {
              combinedAlpha *= distM / this.shadowRadius;
            }

            for (const w of this.widgetList) {
              const cx = w.posX * this.canvasZoom + this.canvasX + w.width * this.canvasZoom;
              const cy = w.posY * this.canvasZoom + this.canvasY + (w.height / 4) * this.canvasZoom;
              const dxW = screenX - cx;
              const dyW = screenY - cy;
              const distW = Math.sqrt(dxW * dxW + dyW * dyW);
              const dynamicShadow = this.shadowRadius * Math.max(0.6, this.canvasZoom) * 1.5;
              if (distW < dynamicShadow) {
                combinedAlpha *= distW / dynamicShadow;
              }
            }

            if (combinedAlpha > 0.008) {
              this.ctx.beginPath();
              this.ctx.arc(screenX, screenY, 1.8, 0, Math.PI * 2);
              this.ctx.fillStyle = light
                ? `rgba(42, 157, 143, ${Math.min(1, combinedAlpha)})`
                : `rgba(0, 242, 254, ${Math.min(1, combinedAlpha)})`;
              this.ctx.fill();
            }
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private syncWidgetSizes(): void {

  }

  goToBroker(event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/broker']);
  }

  goToLeaderboard(event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/leaderboard']);
  }

  goToAdmin(event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/admin-panel']);
  }

    onWidgetClick(widget: WidgetData): void {
    if (this.widgetService.isLinking()) {
      const result = this.widgetService.completeLinking(widget, this.widgetList);
      this.showLinkFeedback(
        result.ok
          ? this.transloco.translate('link.created')
          : this.transloco.translate('link.warning', {
              reason: this.transloco.translate(result.reason ?? 'link.invalidPair'),
            }),
      );
      return;
    }
    this.widgetService.selectWidget(widget);
  }

  startLink(sourceId: string): void {
    this.widgetService.startLinking(sourceId);
    this.showLinkFeedback(this.transloco.translate('link.mode'));
  }

  private showLinkFeedback(message: string): void {
    this.linkFeedback = message;
    setTimeout(() => (this.linkFeedback = null), 2500);
  }

  goTarget(widget: WidgetData | undefined): void {
    if (!widget) {
      return;
    }
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const widgetCenterX = widget.posX + widget.width / 2;
    const widgetCenterY = widget.posY + widget.height / 2;
    this.targetX = screenWidth / 2 - widgetCenterX;
    this.targetY = screenHeight / 2 - widgetCenterY;
    this.targetZoom = 1.0;
  }

  centerView(): void {
    this.targetX = 0;
    this.targetY = 0;
    this.targetZoom = 1.0;
  }

  toggleSearch(event?: Event): void {
    event?.stopPropagation();
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
    }
  }

  get searchResults(): WidgetData[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return this.widgetList.filter((w) => w.title?.toLowerCase().includes(q));
  }

  selectSearchResult(widget: WidgetData): void {
    this.goTarget(widget);
    this.bringToFront(widget.id);
    this.highlightWidget(widget.id);
    this.searchOpen = false;
    this.searchQuery = '';
  }

  private highlightWidget(id: string): void {
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }
    const el = document.querySelector(`[data-wid="${id}"]`);
    el?.classList.add('search-highlight');
    this.highlightTimeout = setTimeout(() => el?.classList.remove('search-highlight'), 1200);
  }

  private saveCameraToTab(tab: TabData): void {
    tab.cameraX = this.targetX;
    tab.cameraY = this.targetY;
    tab.cameraZoom = this.targetZoom;
  }

  private loadCameraFromTab(tab: TabData): void {
    this.canvasX = this.targetX = tab.cameraX;
    this.canvasY = this.targetY = tab.cameraY;
    this.canvasZoom = this.targetZoom = tab.cameraZoom;
  }

  selectTab(tabId: string): void {
    if (this.activeTab.id === tabId) {
      return;
    }
    this.saveCameraToTab(this.activeTab);
    this.tabsList.forEach((t) => (t.active = t.id === tabId));
    this.loadCameraFromTab(this.activeTab);
  }

  toggleTabsMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.tabsMenuOpen = !this.tabsMenuOpen;
    this.renamingTabId = null;
  }

  startRenameTab(tabId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.renamingTabId = tabId;
  }

  createTabSilent(): void {
    if (!this.isUserPremium && this.tabsList.length >= 2) {
      this.showLinkFeedback(this.transloco.translate('dashboard.premiumTabGate'));
      return;
    }
    this.saveCameraToTab(this.activeTab);
    this.tabsList.forEach((t) => (t.active = false));
    const nuovaTab: TabData = {
      id: `tab-${Date.now()}`,
      name: `Scheda ${this.tabsList.length + 1}`,
      active: true,
      widgets: [],
      deletedWidgets: [],
      maxZIndex: 10,
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1,
    };
    this.tabsList.push(nuovaTab);
    this.loadCameraFromTab(nuovaTab);
    this.tabsMenuOpen = false;
  }

  triggerTabCreation(): void {
    if (!this.isUserPremium && this.tabsList.length >= 2) {
      this.showLinkFeedback(this.transloco.translate('dashboard.premiumTabGate'));
      return;
    }
    this.newTabName = '';
    this.tabModalOpen = true;
  }

  closeTabModal(): void {
    this.tabModalOpen = false;
  }

  confirmCreateTab(): void {
    const nome = this.newTabName.trim();
    if (!nome) {
      return;
    }
    this.saveCameraToTab(this.activeTab);
    this.tabsList.forEach((t) => (t.active = false));
    const nuovaTab: TabData = {
      id: `tab-${Date.now()}`,
      name: nome,
      active: true,
      widgets: [],
      deletedWidgets: [],
      maxZIndex: 10,
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1,
    };
    this.tabsList.push(nuovaTab);
    this.loadCameraFromTab(nuovaTab);
    this.tabModalOpen = false;
  }

  closeTab(tabId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.tabsList.length <= 1) {
      return;
    }
    const index = this.tabsList.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      const eraAttiva = this.tabsList[index].active;
      this.tabsList.splice(index, 1);
      if (eraAttiva) {
        this.tabsList[0].active = true;
        this.loadCameraFromTab(this.tabsList[0]);
      }
    }
  }

  activateFreePremium(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isUserPremium) {
      return;
    }
    this.premiumError = null;
    this.premiumCredit = null;
    this.premiumModalOpen = true;
    this.credit.getBalance().subscribe({
      next: (b) => (this.premiumCredit = b.credit),
      error: () => (this.premiumCredit = null),
    });
  }

  closePremiumModal(): void {
    if (this.premiumBusy) {
      return;
    }
    this.premiumModalOpen = false;
  }

  confirmPremiumPurchase(): void {
    if (this.premiumBusy) {
      return;
    }

    if (this.auth.currentUser()?.id === 'offline-admin') {
      this.isUserPremium = true;
      this.auth.patchCurrentUser({ isPremium: true });
      this.premiumModalOpen = false;
      return;
    }
    this.premiumBusy = true;
    this.premiumError = null;
    this.credit.purchasePremium().subscribe({
      next: () => {
        this.isUserPremium = true;
        this.premiumBusy = false;
        this.premiumModalOpen = false;
        this.auth.patchCurrentUser({ isPremium: true });
      },
      error: (err) => {
        this.premiumBusy = false;
        this.premiumError = err?.error?.error || this.transloco.translate('dashboard.premiumFailed');
      },
    });
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      this.inspectorOpen = false;
    }
  }

  toggleInspector(): void {
    this.inspectorOpen = !this.inspectorOpen;
    if (this.inspectorOpen) {
      this.isDrawerOpen = false;
    }
  }

  onInspectorClosed(): void {
    this.inspectorOpen = false;
  }

  openSettings(event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/account-settings']);
  }

  openNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen = true;
    this.notifications.markAllRead();
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  addTickerToCart(ticker: string, event: MouseEvent): void {
    event.stopPropagation();
    this.marqueeAddTicker = ticker;
    this.marqueeAddModalOpen = true;
  }

  closeMarqueeAddModal(): void {
    this.marqueeAddModalOpen = false;
    this.marqueeAddTicker = null;
  }

  confirmMarqueeAdd(): void {
    if (!this.marqueeAddTicker) {
      return;
    }
    this.cart.add(this.marqueeAddTicker, 1);
    this.showLinkFeedback(`${this.marqueeAddTicker} aggiunto al carrello broker.`);
    this.closeMarqueeAddModal();
  }

  private sizeForType(tipo: WidgetType): { width: number; height: number } {
    if (tipo === 'connectionHub') {
      return { width: 260, height: 180 };
    }
    if (tipo === 'stockInfo' || tipo === 'newsFeed') {
      return { width: 300, height: 220 };
    }
    if (tipo === 'inventory') {
      return { width: 280, height: 240 };
    }
    if (tipo === 'clock') {
      return { width: 240, height: 140 };
    }
    return { width: 380, height: 300 };
  }

  spawnNewWidget(ticker: string, tipo: WidgetType, azienda = '', preferTicker?: string): void {
    this.activeTab.maxZIndex++;
    const spawnX = (window.innerWidth / 2 - this.canvasX) / this.canvasZoom;
    const spawnY = (window.innerHeight / 2 - this.canvasY) / this.canvasZoom;

    let stockTicker = ticker;
    let stockName = azienda;
    let stockPrice: number | undefined;
    if (tipo === 'stockInfo' && this.assetPool.length) {
      const chosen =
        (preferTicker && this.assetPool.find((a) => a.ticker === preferTicker)) ||
        this.assetPool[Math.floor(Math.random() * this.assetPool.length)];
      stockTicker = chosen.ticker;
      stockName = chosen.name;
      stockPrice = chosen.price;
    } else if (tipo === 'stockInfo' && preferTicker) {
      stockTicker = preferTicker;
    }

    const size = this.sizeForType(tipo);

    this.widgetList.push({
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      connectionID: '',
      title: '',
      type: tipo,
      company: tipo === 'unlistedStock' ? '' : stockName,
      ticker: tipo === 'stockInfo' ? stockTicker : undefined,
      price: tipo === 'unlistedStock' ? 100 : stockPrice,
      posX: spawnX,
      posY: spawnY,
      width: size.width,

      height: tipo.startsWith('chart') ? size.height : 0,
      zIndex: this.activeTab.maxZIndex,
      minimize: false,
      visible: true,
    });
  }

  bringToFront(id: string): void {
    const widget = this.widgetList.find((w) => w.id === id);
    if (widget) {
      this.activeTab.maxZIndex++;
      widget.zIndex = this.activeTab.maxZIndex;
    }
  }

  updateWidgetPosition(eventData: { id: string; x: number; y: number }): void {
    const widget = this.widgetList.find((w) => w.id === eventData.id);
    if (widget) {
      widget.posX = eventData.x;
      widget.posY = eventData.y;
    }
  }

  removeWidgetFromMemory(idToRemove: string): void {
    const index = this.widgetList.findIndex((w) => w.id === idToRemove);
    if (index !== -1) {
      this.activeTab.deletedWidgets.push(this.widgetList[index]);
      this.widgetList.splice(index, 1);
    }
  }

  duplicateWidget(eventData: DuplicatePayload): void {
    const source = this.widgetList.find((w) => w.id === eventData.id);
    if (source) {
      this.activeTab.maxZIndex++;
      const clone: WidgetData = {
        ...source,
        id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        posX: eventData.currentX + 20,
        posY: eventData.currentY + 20,
        zIndex: this.activeTab.maxZIndex,
      };
      this.widgetList.push(clone);
    }
  }

  get connectionLines() {
    return this.widgetService.calculateConnections(this.widgetList);
  }

  handleZoom(event: WheelEvent): void {
    event.preventDefault();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const virtualX = (mouseX - this.targetX) / this.targetZoom;
    const virtualY = (mouseY - this.targetY) / this.targetZoom;
    const zoomFactor = 0.1;

    let nextZoom =
      event.deltaY < 0 ? this.targetZoom + zoomFactor : this.targetZoom - zoomFactor;
    nextZoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));

    this.targetX = mouseX - virtualX * nextZoom;
    this.targetY = mouseY - virtualY * nextZoom;
    this.targetZoom = nextZoom;
  }

  private activePointers = new Map<number, { x: number; y: number }>();
  private pinchStartDist = 0;
  private pinchStartZoom = 1;

  startPan(event: PointerEvent): void {
    if (event.button === 2) {
      return;
    }
    if (this.widgetService.isLinking()) {
      this.widgetService.cancelLinking();
      this.showLinkFeedback(this.transloco.translate('link.cancelled'));
    }
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size >= 2) {

      this.isPanning = false;
      const pts = [...this.activePointers.values()];
      this.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      this.pinchStartZoom = this.targetZoom;
    } else {

      this.isPanning = true;
      this.startMouseX = event.clientX - this.targetX;
      this.startMouseY = event.clientY - this.targetY;
    }
  }

  @HostListener('window:pointermove', ['$event'])
  onCanvasMouseMove(event: PointerEvent): void {
    if (this.activePointers.has(event.pointerId)) {
      this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (this.activePointers.size >= 2) {

      const pts = [...this.activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const virtualX = (midX - this.targetX) / this.targetZoom;
      const virtualY = (midY - this.targetY) / this.targetZoom;
      let nextZoom = this.pinchStartZoom * (dist / this.pinchStartDist);
      nextZoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));
      this.targetX = midX - virtualX * nextZoom;
      this.targetY = midY - virtualY * nextZoom;
      this.targetZoom = nextZoom;
    } else if (this.isPanning) {
      this.targetX = event.clientX - this.startMouseX;
      this.targetY = event.clientY - this.startMouseY;
    }

    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  onCanvasMouseUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size < 2) {
      this.pinchStartDist = 0;
    }
    if (this.activePointers.size === 0) {
      this.isPanning = false;
    } else if (this.activePointers.size === 1) {

      const remaining = [...this.activePointers.values()][0];
      this.isPanning = true;
      this.startMouseX = remaining.x - this.targetX;
      this.startMouseY = remaining.y - this.targetY;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.resizeCanvas();
  }

  @HostListener('window:keydown', ['$event'])
  controllerKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      const widgetToRecover = this.activeTab.deletedWidgets.pop();
      if (widgetToRecover) {
        this.widgetList.push(widgetToRecover);
      }
    }
  }
}
