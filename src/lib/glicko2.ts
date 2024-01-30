import type { GameOutcome } from "./shared";

export class Glicko2Rating {
    private static readonly TAU = 0.5;
    private static readonly EPSILON = 0.000001;
    private static readonly SCALE = 173.7178;
    private static readonly DEFAULT_RATING = 1500;
    private static readonly DEFAULT_RD = 350;
    private static readonly DEFAULT_VOL = 0.06;

    private __rating: number = 0;
    private __rd: number = 0;
    private vol: number;

    constructor(rating: number = Glicko2Rating.DEFAULT_RATING, rd: number = Glicko2Rating.DEFAULT_RD, vol: number = Glicko2Rating.DEFAULT_VOL) {
        this.rating = rating;
        this.rd = rd;
        this.vol = vol;
    }

    get rating(): number {
        return (this.__rating * Glicko2Rating.SCALE) + 1500;
    }

    set rating(value: number) {
        this.__rating = (value - 1500) / Glicko2Rating.SCALE;
    }

    get rd(): number {
        return this.__rd * Glicko2Rating.SCALE;
    }

    set rd(value: number) {
        this.__rd = value / Glicko2Rating.SCALE;
    }

    public handleGameOutcome(opponent: Glicko2Rating, outcome: GameOutcome): void {
        const opponentRating = (opponent.rating - 1500) / Glicko2Rating.SCALE;
        const opponentRD = opponent.rd / Glicko2Rating.SCALE;

        const v = this.v([opponentRating], [opponentRD]);
        this.vol = this.computeNewVol([opponentRating], [opponentRD], [outcome], v);
        this.preRatingRD();

        this.__rd = 1 / Math.sqrt((1 / Math.pow(this.__rd, 2)) + (1 / v));

        const tempSum = this.g(opponentRD) * (outcome - this.E(opponentRating, opponentRD));
        this.__rating += Math.pow(this.__rd, 2) * tempSum;
    }

    private preRatingRD(): void {
        this.__rd = Math.sqrt(Math.pow(this.__rd, 2) + Math.pow(this.vol, 2));
    }

    private g(RD: number): number {
        return 1 / Math.sqrt(1 + 3 * Math.pow(RD, 2) / Math.pow(Math.PI, 2));
    }

    private E(p2rating: number, p2RD: number): number {
        return 1 / (1 + Math.exp(-this.g(p2RD) * (this.__rating - p2rating)));
    }

    private v(rating_list: number[], RD_list: number[]): number {
        let tempSum = 0;
        for (let i = 0; i < rating_list.length; i++) {
            const tempE = this.E(rating_list[i], RD_list[i]);
            tempSum += Math.pow(this.g(RD_list[i]), 2) * tempE * (1 - tempE);
        }
        return 1 / tempSum;
    }

    private delta(rating_list: number[], RD_list: number[], outcome_list: number[], v: number): number {
        let tempSum = 0;
        for (let i = 0; i < rating_list.length; i++) {
            tempSum += this.g(RD_list[i]) * (outcome_list[i] - this.E(rating_list[i], RD_list[i]));
        }
        return v * tempSum;
    }

    private f(x: number, delta: number, v: number, a: number): number {
        const ex = Math.exp(x);
        const num1 = ex * (Math.pow(delta, 2) - Math.pow(this.__rd, 2) - v - ex);
        const denom1 = 2 * Math.pow((Math.pow(this.__rd, 2) + v + ex), 2);
        return (num1 / denom1) - ((x - a) / Math.pow(Glicko2Rating.TAU, 2));
    }

    private computeNewVol(rating_list: number[], RD_list: number[], outcome_list: number[], v: number): number {
        let a = Math.log(Math.pow(this.vol, 2));
        let A = a;
        let B: number;
        const delta = this.delta(rating_list, RD_list, outcome_list, v);

        if (Math.pow(delta, 2) > (Math.pow(this.__rd, 2) + v)) {
            B = Math.log(Math.pow(delta, 2) - Math.pow(this.__rd, 2) - v);
        } else {
            let k = 1;
            while (this.f(a - k * Math.sqrt(Math.pow(Glicko2Rating.TAU, 2)), delta, v, a) < 0) {
                k++;
            }
            B = a - k * Math.sqrt(Math.pow(Glicko2Rating.TAU, 2));
        }

        let fA = this.f(A, delta, v, a);
        let fB = this.f(B, delta, v, a);

        while (Math.abs(B - A) > Glicko2Rating.EPSILON) {
            const C = A + ((A - B) * fA) / (fB - fA);
            const fC = this.f(C, delta, v, a);

            if (fC * fB < 0) {
                A = B;
                fA = fB;
            } else {
                fA /= 2;
            }

            B = C;
            fB = fC;
        }

        return Math.exp(A / 2);
    }
}