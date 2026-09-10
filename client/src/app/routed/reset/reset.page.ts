import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '$core/auth/auth.service';
import { passwordSchema } from '$core/validation/auth.schema';
import { serverError } from '$core/errors/server-error';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonItem, IonInput, IonButton, TranslocoModule],
  templateUrl: './reset.page.html',
  styleUrls: ['./reset.page.scss'],
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
        this.error = serverError(this.transloco, err, 'reset.failed');
      },
    });
  }

  goLogin(): void {
    this.router.navigate(['/dashboard']);
  }
}
