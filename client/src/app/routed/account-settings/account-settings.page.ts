import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '$core/auth/auth.service';
import { CreditService } from '$core/services/credit.service';
import { rechargeAmountSchema } from '$core/validation/forms.schema';
import { usernameSchema, capSchema } from '$core/validation/auth.schema';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ModalComponent } from '$components/modal/modal.component';
import { LangSwitcherComponent } from '$components/lang-switcher/lang-switcher.component';
import { BreadcrumbsComponent } from '$components/breadcrumbs/breadcrumbs.component';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { walletOutline, starOutline, cameraOutline, trashOutline, logOutOutline, saveOutline } from 'ionicons/icons';

const PREMIUM_COST = 10;

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.page.html',
  styleUrls: ['./account-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonBadge,
    ModalComponent,
    LangSwitcherComponent,
    BreadcrumbsComponent,
    TranslocoModule,
  ],
})
export class AccountSettingsPage {
  private auth = inject(AuthService);
  private creditService = inject(CreditService);
  private transloco = inject(TranslocoService);

  private t(key: string): string {
    return this.transloco.translate(key);
  }

  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  avatarDataUrl: string | null = this.auth.currentUser()?.avatarDataUrl ?? null;

  deleteModalOpen = false;
  deleteBusy = false;
  deleteError: string | null = null;

  displayName = this.auth.currentUser()?.displayName ?? '';
  username = this.auth.currentUser()?.username ?? '';
  email = this.auth.currentUser()?.email ?? '';
  phone = this.auth.currentUser()?.phone ?? '';

  address = this.auth.currentUser()?.address ?? '';
  city = this.auth.currentUser()?.city ?? '';
  cap = this.auth.currentUser()?.postalCode ?? '';

  accountId = this.auth.currentUser()?.id ?? '';
  profileError: string | null = null;
  profileSaving = false;

  notificationsEnabled = true;

  darkTheme = this.theme.isDark();

  credit = 0;

  isPremium = this.auth.currentUser()?.isPremium ?? false;

  rechargeAmount: number | null = 20;
  rechargeError: string | null = null;

  rechargeModalOpen = false;
  rechargedAmount = 0;

  feedback: string | null = null;

  premiumModalOpen = false;
  premiumBusy = false;
  premiumError: string | null = null;
  readonly premiumPrice = PREMIUM_COST;

  constructor(private router: Router, private theme: ThemeService) {
    addIcons({ walletOutline, starOutline, cameraOutline, trashOutline, logOutOutline, saveOutline });
    this.creditService.getBalance().subscribe({
      next: (b) => (this.credit = b.credit),
      error: () => undefined,
    });
  }

  ricaricaCredito(): void {
    this.rechargeError = null;
    const parsed = rechargeAmountSchema.safeParse(this.rechargeAmount);
    if (!parsed.success) {
      this.rechargeError = this.t('account.rechargeInvalid');
      return;
    }
    const amount = parsed.data;

    if (this.auth.currentUser()?.id === 'offline-admin') {
      this.credit += amount;
      this.showRechargeDone(amount);
      return;
    }
    this.creditService.recharge(amount).subscribe({
      next: (res) => {
        this.credit = res.credit;
        this.showRechargeDone(amount);
      },
      error: () => {
        this.feedback = this.t('account.rechargeFailed');
      },
    });
  }

  private showRechargeDone(amount: number): void {
    this.rechargedAmount = amount;
    this.rechargeModalOpen = true;
    this.rechargeAmount = null;
  }

  closeRechargeModal(): void {
    this.rechargeModalOpen = false;
  }

  apriModalePremium(): void {
    if (this.isPremium) {
      return;
    }
    this.premiumError = null;
    this.premiumModalOpen = true;
    this.creditService.getBalance().subscribe({
      next: (b) => (this.credit = b.credit),
      error: () => undefined,
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
    this.premiumBusy = true;
    this.premiumError = null;
    this.creditService.purchasePremium().subscribe({
      next: () => {
        this.isPremium = true;
        this.premiumBusy = false;
        this.premiumModalOpen = false;
        this.auth.patchCurrentUser({ isPremium: true });
      },
      error: (err) => {
        this.premiumBusy = false;
        this.premiumError = err?.error?.error || this.t('account.premiumFailed');
      },
    });
  }

  saveProfile(): void {
    this.profileError = null;
    const uname = this.username.trim();
    if (!usernameSchema.safeParse(uname).success) {
      this.profileError = this.t('account.usernameInvalid');
      return;
    }
    const cap = this.cap.trim();
    if (cap && !capSchema.safeParse(cap).success) {
      this.profileError = this.t('auth.invalidCap');
      return;
    }
    const patch: {
      displayName?: string;
      username: string;
      phone?: string | null;
      address?: string;
      city?: string;
      postalCode?: string;
    } = {
      username: uname,
      phone: this.phone.trim() || null,
      address: this.address.trim(),
      city: this.city.trim(),
    };
    if (cap) {
      patch.postalCode = cap;
    }
    if (this.displayName.trim()) {
      patch.displayName = this.displayName.trim();
    }
    this.profileSaving = true;
    this.auth.updateMe(patch).subscribe({
      next: (user) => {
        this.displayName = user.displayName;
        this.username = user.username ?? '';
        this.phone = user.phone ?? '';
        this.address = user.address ?? '';
        this.city = user.city ?? '';
        this.cap = user.postalCode ?? '';
        this.profileSaving = false;
        this.feedback = this.t('account.profileSaved');
      },
      error: (err) => {
        this.profileSaving = false;
        this.profileError = err?.error?.error || this.t('account.profileSaveFailed');
      },
    });
  }

  onThemeToggle(): void {
    this.theme.set(this.darkTheme ? 'dark' : 'light');
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/dashboard']);
  }

  triggerAvatarPick(): void {
    this.avatarInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.feedback = this.t('account.avatarFailed');
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        this.saveAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => (this.feedback = this.t('account.avatarFailed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => (this.feedback = this.t('account.avatarFailed'));
    reader.readAsDataURL(file);
  }

  private saveAvatar(dataUrl: string): void {
    if (this.auth.currentUser()?.id === 'offline-admin') {
      this.avatarDataUrl = dataUrl;
      this.auth.patchCurrentUser({ avatarDataUrl: dataUrl });
      this.feedback = this.t('account.avatarUpdated');
      return;
    }
    this.auth.updateMe({ avatarDataUrl: dataUrl }).subscribe({
      next: (user) => {
        this.avatarDataUrl = user.avatarDataUrl ?? null;
        this.feedback = this.t('account.avatarUpdated');
      },
      error: () => (this.feedback = this.t('account.avatarFailed')),
    });
  }

  openDeleteModal(): void {
    this.deleteError = null;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.deleteBusy) {
      return;
    }
    this.deleteModalOpen = false;
  }

  confirmDeleteAccount(): void {
    if (this.deleteBusy) {
      return;
    }
    this.deleteBusy = true;
    this.deleteError = null;
    this.auth.deleteAccount().subscribe({
      next: () => {
        this.auth.logout();
        this.deleteBusy = false;
        this.deleteModalOpen = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.deleteBusy = false;
        this.deleteError = this.t('account.deleteFailed');
      },
    });
  }
}
