

export interface MockChargeResult {
  ok: boolean;
  amount: number;
  message: string;
}

export function processMockCharge(amount: number): MockChargeResult {
  return {
    ok: true,
    amount,
    message:
      `Ricarica di ${amount.toFixed(2)} € completata (SIMULAZIONE): ` +
      `nessun pagamento reale e' stato effettuato, il credito e' stato ` +
      `accreditato direttamente sull'account a scopo dimostrativo.`,
  };
}
