import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '$core/auth/auth.service';
import { passwordSchema } from '$core/validation/auth.schema';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonItem, IonInput, IonButton, TranslocoModule],
  template: `
    <ion-content [fullscreen]="true" class="account-bg">
      <div class="reset-wrap">
        <div class="reset-card widget-box">
          <h2>{{ 'reset.title' | transloco }}</h2>

          @if (!token) {
            <p class="reset-error">{{ 'reset.noToken' | transloco }}</p>
          } @else if (done) {
            <p class="reset-ok">{{ 'reset.done' | transloco }}</p>
            <ion-button expand="block" (click)="goLogin()">{{ 'reset.toLogin' | transloco }}</ion-button>
          } @else {
            <ion-item lines="full" class="custom-input">
              <ion-input type="password" [label]="'reset.newPassword' | transloco" labelPlacement="floating"
                         [(ngModel)]="password"></ion-input>
            </ion-item>
            @if (error) { <p class="reset-error">{{ error }}</p> }
            <ion-button expand="block" [disabled]="busy" (click)="submit()">
              {{ (busy ? 'reset.saving' : 'reset.confirm') | transloco }}
            </ion-button>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .reset-wrap { display: flex; align-items: center; justify-content: center; min-height: 100%; padding: 24px; }
      .reset-card { width: 100%; max-width: 380px; padding: 24px; }
      h2 { color: var(--deq-accent-neon); margin: 0 0 16px; font-size: 1.1rem; }
      .reset-error { color: var(--deq-error); font-size: 0.85rem; }
      .reset-ok { color: var(--deq-success); font-size: 0.9rem; margin-bottom: 16px; }
    `,
  ],
})
export class ResetPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private transloco = inject(TranslocoService);

  token = '';
  password = '';
  busy = false;
  done = false;
  error: string | null = null;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void {
    this.error = null;
    if (!passwordSchema.safeParse(this.password).success) {
      this.error = this.transloco.translate('auth.weakPassword');
      return;
    }
    this.busy = true;
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.busy = false;
        this.done = true;
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.error || this.transloco.translate('reset.failed');
      },
    });
  }

  goLogin(): void {
    this.router.navigate(['/dashboard']);
  }
}
