import { Router } from 'express';
import { asyncHandler } from '../middleware/error';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import * as auth from '../controllers/auth.controller';
import * as me from '../controllers/me.controller';
import * as credit from '../controllers/credit.controller';
import * as premium from '../controllers/premium.controller';
import * as assets from '../controllers/assets.controller';
import * as portfolio from '../controllers/portfolio.controller';
import * as leaderboard from '../controllers/leaderboard.controller';
import * as app from '../controllers/app.controller';
import * as transactions from '../controllers/transactions.controller';
import * as market from '../controllers/market.controller';
import * as workspace from '../controllers/workspace.controller';

export const api = Router();

api.post('/auth/register', asyncHandler(auth.register));
api.post('/auth/login', asyncHandler(auth.login));
api.post('/auth/recover', asyncHandler(auth.recover));
api.post('/auth/reset', asyncHandler(auth.reset));

api.get('/workspace', requireAuth, asyncHandler(workspace.getWorkspace));
api.put('/workspace', requireAuth, asyncHandler(workspace.saveWorkspace));

api.get('/me', requireAuth, asyncHandler(me.getMe));
api.patch('/me', requireAuth, asyncHandler(me.updateMe));
api.delete('/me', requireAuth, asyncHandler(me.deleteMe));

api.get('/credit', requireAuth, asyncHandler(credit.getBalance));
api.post('/credit/recharge', requireAuth, asyncHandler(credit.rechargeCredit));
api.post('/credit/trade-fee', requireAuth, asyncHandler(app.recordTradeFee));

api.post('/premium/purchase', requireAuth, asyncHandler(premium.purchasePremium));

api.get('/transactions', requireAuth, asyncHandler(transactions.listTransactions));

api.get('/admin/revenue', requireAuth, requireAdmin, asyncHandler(app.getRevenue));

api.get('/admin/asset-events', requireAuth, requireAdmin, asyncHandler(assets.listAssetEvents));

api.get('/market/status', requireAuth, market.marketStatus);
api.post('/admin/market/refresh', requireAuth, requireAdmin, asyncHandler(market.marketRefresh));

api.get('/assets', requireAuth, asyncHandler(assets.listAssets));
api.get('/assets/search', requireAuth, requireAdmin, asyncHandler(assets.searchAssets));
api.post('/assets/seed', requireAuth, requireAdmin, asyncHandler(assets.seedAssets));
api.post('/assets', requireAuth, requireAdmin, asyncHandler(assets.addAsset));
api.delete('/assets/:ticker', requireAuth, requireAdmin, asyncHandler(assets.removeAsset));
api.get('/assets/:ticker/quote', requireAuth, asyncHandler(assets.refreshQuote));
api.get('/assets/:ticker/history', requireAuth, asyncHandler(assets.assetHistory));

api.get('/portfolio', requireAuth, asyncHandler(portfolio.getPortfolio));
api.post('/portfolio/buy', requireAuth, asyncHandler(portfolio.buy));
api.post('/portfolio/sell', requireAuth, asyncHandler(portfolio.sell));

api.get('/leaderboard', requireAuth, asyncHandler(leaderboard.listLeaderboard));
api.post('/leaderboard/share', requireAuth, asyncHandler(leaderboard.shareScore));
api.delete('/leaderboard/share', requireAuth, asyncHandler(leaderboard.unshareScore));
api.get('/leaderboard/:userId/history', requireAuth, asyncHandler(leaderboard.getHistory));
api.get('/leaderboard/:userId/reviews', requireAuth, asyncHandler(leaderboard.listReviews));
api.post('/leaderboard/:userId/reviews', requireAuth, asyncHandler(leaderboard.addReview));
api.get('/leaderboard/:userId/holdings', requireAuth, asyncHandler(leaderboard.getHoldings));
