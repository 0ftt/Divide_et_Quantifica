import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonBadge,
  IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline,
  shareSocialOutline,
  statsChartOutline,
  chatbubbleOutline,
  cartOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { BreadcrumbsComponent } from '$components/breadcrumbs/breadcrumbs.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LeaderboardService } from '$core/services/leaderboard.service';
import { BrokerCartService } from '$core/services/broker-cart.service';
import { LeaderboardEntry, LeaderboardReview, LeaderboardHolding } from '$shared';
import { ModalComponent } from '$components/modal/modal.component';
import {
  MiniHistoryChartComponent,
  HistoryPoint,
} from '$components/charts/mini-history-chart/mini-history-chart.component';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonInput,
    ModalComponent,
    MiniHistoryChartComponent,
    BreadcrumbsComponent,
  ],
})
export class LeaderboardPage implements OnInit {
  private leaderboardService = inject(LeaderboardService);
  private transloco = inject(TranslocoService);
  private cart = inject(BrokerCartService);

  entries: LeaderboardEntry[] = [];

  loading = true;

  sharing = false;

  shareLabel = '';

  feedback: string | null = null;

  historyEntry: LeaderboardEntry | null = null;
  historyLoading = false;
  historyPoints: HistoryPoint[] = [];

  reviewsEntry: LeaderboardEntry | null = null;
  reviewsLoading = false;
  reviews: LeaderboardReview[] = [];
  newReviewBody = '';
  reviewError: string | null = null;

  cartEntry: LeaderboardEntry | null = null;
  cartHoldings: LeaderboardHolding[] = [];
  cartLoading = false;
  cartError: string | null = null;

  constructor(private router: Router) {
    addIcons({
      trophyOutline,
      shareSocialOutline,
      statsChartOutline,
      chatbubbleOutline,
      cartOutline,
      personCircleOutline,
    });
  }

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  private loadLeaderboard(): void {
    this.loading = true;
    this.leaderboardService.getLeaderboard().subscribe({
      next: (res) => {
        this.entries = res.entries;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  shareScore(): void {
    if (this.sharing) {
      return;
    }
    this.sharing = true;
    this.feedback = null;
    this.leaderboardService.shareScore(this.shareLabel.trim() || undefined).subscribe({
      next: (res) => {
        this.sharing = false;
        this.shareLabel = '';
        this.feedback = this.transloco.translate('leaderboard.shared', {
          rank: res.entry.rank,
        });
        this.loadLeaderboard();
      },
      error: () => {
        this.sharing = false;
        this.feedback = this.transloco.translate('leaderboard.shareError');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  openHistory(entry: LeaderboardEntry, event: MouseEvent): void {
    event.stopPropagation();
    this.historyEntry = entry;
    this.historyLoading = true;
    this.historyPoints = [];
    this.leaderboardService.getHistory(entry.userId).subscribe({
      next: (res) => {
        this.historyPoints = res.points.map((p) => ({
          label: new Date(p.sharedAt).toLocaleDateString(),
          value: p.score,
        }));
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
      },
    });
  }

  closeHistory(): void {
    this.historyEntry = null;
  }

  openReviews(entry: LeaderboardEntry, event: MouseEvent): void {
    event.stopPropagation();
    this.reviewsEntry = entry;
    this.reviewError = null;
    this.newReviewBody = '';
    this.loadReviews(entry.userId);
  }

  private loadReviews(userId: string): void {
    this.reviewsLoading = true;
    this.leaderboardService.getReviews(userId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.reviewsLoading = false;
      },
      error: () => {
        this.reviewsLoading = false;
      },
    });
  }

  submitReview(): void {
    const body = this.newReviewBody.trim();
    if (!body || !this.reviewsEntry) {
      return;
    }
    this.reviewError = null;
    this.leaderboardService.addReview(this.reviewsEntry.userId, body).subscribe({
      next: () => {
        this.newReviewBody = '';
        this.loadReviews(this.reviewsEntry!.userId);
      },
      error: () => {
        this.reviewError = this.transloco.translate('leaderboard.reviewFailed');
      },
    });
  }

  closeReviews(): void {
    this.reviewsEntry = null;
  }

  openAddToCart(entry: LeaderboardEntry, event: MouseEvent): void {
    event.stopPropagation();
    this.cartEntry = entry;
    this.cartLoading = true;
    this.cartError = null;
    this.cartHoldings = [];
    this.leaderboardService.getHoldings(entry.userId).subscribe({
      next: (holdings) => {
        this.cartHoldings = holdings;
        this.cartLoading = false;
        if (!holdings.length) {
          this.cartError = this.transloco.translate('leaderboard.noPositionsToAdd');
        }
      },
      error: () => {
        this.cartLoading = false;
        this.cartError = this.transloco.translate('leaderboard.packageFailed');
      },
    });
  }

  closeAddToCart(): void {
    this.cartEntry = null;
  }

  confirmAddToCart(): void {
    if (!this.cartHoldings.length) {
      return;
    }
    this.cart.addMany(this.cartHoldings);
    this.cartEntry = null;
  }
}
