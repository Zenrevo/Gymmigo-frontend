/* eslint-disable @typescript-eslint/no-explicit-any -- /clubs/fitness-card/me is untyped */

export const pickFitnessCardCode = (card: any): string | undefined =>
  card?.share?.card_code ?? card?.fitness_card?.card_code ?? card?.fitcard?.card_code ?? undefined;

export const fitnessQrPayload = (card: any, code?: string | null) => card?.share?.qr_payload || `gymmigo:fitness-card:${code ?? 'pending'}`;

