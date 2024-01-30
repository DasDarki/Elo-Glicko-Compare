import type { GameOutcome } from "./shared";

export class GlickoRating {
    private _rating: number;
    private _rd: number;
    private static readonly INITIAL_RATING: number = 1500;
    private static readonly INITIAL_RD: number = 350;
    private static readonly Q: number = Math.log(10) / 400;

    public constructor(rating: number = GlickoRating.INITIAL_RATING, rd: number = GlickoRating.INITIAL_RD) {
        this._rating = rating;
        this._rd = rd;
    }

    public handleGameOutcome(opponent: GlickoRating, outcome: GameOutcome): void {
        const opponentRating = opponent.rating;
        const opponentRD = opponent.rd;

        const gRD = this.g(opponentRD);
        const e = this.E(this.rating, opponentRating, opponentRD);
        const dSquared = 1 / (GlickoRating.Q * GlickoRating.Q * gRD * gRD * e * (1 - e));

        const newRating = this.rating + GlickoRating.Q / (1 / (this.rd * this.rd) + 1 / dSquared) * gRD * (outcome - e);
        const newRD = Math.sqrt(1 / (1 / (this.rd * this.rd) + 1 / dSquared));

        this._rating = newRating;
        this._rd = newRD;
    }

    public get rating(): number {
        return this._rating;
    }

    public get rd(): number {
        return this._rd;
    }

    private g(rd: number): number {
        return 1 / Math.sqrt(1 + 3 * GlickoRating.Q * GlickoRating.Q * rd * rd / (Math.PI * Math.PI));
    }

    private E(rating: number, opponentRating: number, opponentRD: number): number {
        return 1 / (1 + Math.exp(-this.g(opponentRD) * (rating - opponentRating)));
    }
}