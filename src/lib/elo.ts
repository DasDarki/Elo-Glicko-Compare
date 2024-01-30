import type { GameOutcome } from "./shared";

const RESET_DEFAULT_RATING = 1500;
const RESET_DEFAULT_K = 32;

/**
 * The configuration for the Elo system.
 */
export class EloConfig {
    /**
     * The default starting rating for new players
     */
    public static defaultRating = RESET_DEFAULT_RATING;

    /**
     * The default K factor for new players
     */
    public static defaultK = RESET_DEFAULT_K;

    /**
     * Resets all configuration values to their defaults.
     */
    public static reset() {
        this.defaultRating = RESET_DEFAULT_RATING;
        this.defaultK = RESET_DEFAULT_K;
    }
}

/**
 * Represents a player's rating state.
 */
export class EloRating {
    /**
     * The player's rating
     */
    public rating: number;

    /**
     * The player's K factor
     */
    public readonly k: number;

    /**
     * Creates a new rating state.
     * @param rating The player's rating
     * @param k The player's K factor
     */
    public constructor(rating?: number, k?: number) {
        this.rating = rating || EloConfig.defaultRating;
        this.k = k || EloConfig.defaultK;
    }

    public handleGameOutcome(opponent: EloRating, outcome: GameOutcome) {
        const ratingDifference = opponent.rating - this.rating;
        const expectedScore = 1 / (1 + Math.pow(10, ratingDifference / 400));
        this.rating += this.k * (outcome - expectedScore)
    }
}