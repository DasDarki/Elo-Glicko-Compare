<script setup lang="ts">
import { computed, ref } from 'vue';
import { LineChart } from 'vue-chart-3';
import { EloRating } from '@/lib/elo';
import { GlickoRating } from '@/lib/glicko1';
import { Glicko2Rating } from '@/lib/glicko2';
import { GameOutcome } from '@/lib/shared';

interface TrackedRating {
  change: number;
  current: number;
}

enum TrackAction {
  Better,
  Same,
  Worse,
}

const DEFAULT_TRACKED_RATING: TrackedRating = {
  change: 0,
  current: 1500,
};

const oppRatingChange = ref(100);

const eloRatings = ref<TrackedRating[]>([{...DEFAULT_TRACKED_RATING}]);
const glickoRatings = ref<TrackedRating[]>([{...DEFAULT_TRACKED_RATING}]);
const glicko2Ratings = ref<TrackedRating[]>([{...DEFAULT_TRACKED_RATING}]);

const isEloEnabled = ref(true);
const isGlickoEnabled = ref(true);
const isGlicko2Enabled = ref(true);

const eloPlayer = ref<EloRating>(new EloRating());
const glickoPlayer = ref<GlickoRating>(new GlickoRating());
const glicko2Player = ref<Glicko2Rating>(new Glicko2Rating());

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Ratingverlauf',
    },
    tooltip: {
      callbacks: {
        footer: (context: any) => {
          const eloChange = eloRatings.value[context[0].dataIndex].change;
          const glickoChange = glickoRatings.value[context[0].dataIndex].change;
          const glicko2Change = glicko2Ratings.value[context[0].dataIndex].change;

          return `Elo: ${eloChange.toFixed(2)} | Glicko: ${glickoChange.toFixed(2)} | Glicko2: ${glicko2Change.toFixed(2)}`;
        },
      },
    }
  }
}));

const chartData = computed(() => ({
      labels: eloRatings.value.map((_, index) => index),
      datasets: [
        {
          label: 'Elo',
          data: eloRatings.value.map((rating) => rating.current),
          borderColor: '#FF00FF',
          backgroundColor: '#FF00FF',
          fill: false,
          hidden: !isEloEnabled.value,
        },
        {
          label: 'Glicko',
          data: glickoRatings.value.map((rating) => rating.current),
          borderColor: '#ADFF2F',
          backgroundColor: '#ADFF2F',
          fill: false,
          hidden: !isGlickoEnabled.value,
        },
        {
          label: 'Glicko2',
          data: glicko2Ratings.value.map((rating) => rating.current),
          borderColor: '#87CEEB',
          backgroundColor: '#87CEEB',
          fill: false,
          hidden: !isGlicko2Enabled.value,
        },
      ],
}));

function trackOutcome(outcome: GameOutcome, action: TrackAction) {
  let eloOppRating = 0;
  let glickoOppRating = 0;
  let glicko2OppRating = 0;

  switch (action) {
    case TrackAction.Better:
      eloOppRating = eloPlayer.value.rating + oppRatingChange.value;
      glickoOppRating = glickoPlayer.value.rating + oppRatingChange.value;
      glicko2OppRating = glicko2Player.value.rating + oppRatingChange.value;
      break;
    case TrackAction.Same:
      eloOppRating = eloPlayer.value.rating;
      glickoOppRating = glickoPlayer.value.rating;
      glicko2OppRating = glicko2Player.value.rating;
      break;
    case TrackAction.Worse:
      eloOppRating = Math.max(eloPlayer.value.rating - oppRatingChange.value, 0);
      glickoOppRating = Math.max(glickoPlayer.value.rating - oppRatingChange.value, 0);
      glicko2OppRating = Math.max(glicko2Player.value.rating - oppRatingChange.value, 0);
      break;
  }

  const eloOpponent = new EloRating(eloOppRating);
  const glickoOpponent = new GlickoRating(glickoOppRating);
  const glicko2Opponent = new Glicko2Rating(glicko2OppRating);

  const currElo = eloPlayer.value.rating;
  const currGlicko1 = glickoPlayer.value.rating;
  const currGllicko2 = glicko2Player.value.rating;

  eloPlayer.value.handleGameOutcome(eloOpponent, outcome);
  glickoPlayer.value.handleGameOutcome(glickoOpponent, outcome);
  glicko2Player.value.handleGameOutcome(glicko2Opponent, outcome);

  eloRatings.value.push({
    change: eloPlayer.value.rating - currElo,
    current: eloPlayer.value.rating,
  });

  glickoRatings.value.push({
    change: glickoPlayer.value.rating - currGlicko1,
    current: glickoPlayer.value.rating,
  });

  glicko2Ratings.value.push({
    change: glicko2Player.value.rating - currGllicko2,
    current: glicko2Player.value.rating,
  });
}

function askReset() {
  if (confirm('Willst du wirklich alles zurücksetzen?')) {
    reset();
  }
}

function reset() {
  eloRatings.value = [{...DEFAULT_TRACKED_RATING}];
  glickoRatings.value = [{...DEFAULT_TRACKED_RATING}];
  glicko2Ratings.value = [{...DEFAULT_TRACKED_RATING}];

  eloPlayer.value = new EloRating();
  glickoPlayer.value = new GlickoRating();
  glicko2Player.value = new Glicko2Rating();
}
</script>

<template>
  <div class="page-wrapper">
    <div class="card" style="width: 50%;">
      <LineChart :options="chartOptions" :chart-data="chartData"/>
    </div>

    <div class="card" style="user-select: none;">
      <div class="grid-3x3">
        <button class="btn btn-danger" @click="trackOutcome(GameOutcome.Loss, TrackAction.Better)">Verloren gegen besseren Spieler</button>
        <button class="btn btn-primary" @click="trackOutcome(GameOutcome.Draw, TrackAction.Better)">Gleichstand gegen besserer Spieler</button>
        <button class="btn btn-success" @click="trackOutcome(GameOutcome.Win, TrackAction.Better)">Gewonnen gegen besseren Spieler</button>
        <button class="btn btn-danger" @click="trackOutcome(GameOutcome.Loss, TrackAction.Same)">Verloren gegen gleichstarken Spieler</button>
        <button class="btn btn-primary" @click="trackOutcome(GameOutcome.Draw, TrackAction.Same)">Gleichstand gegen gleichstarken Spieler</button>
        <button class="btn btn-success" @click="trackOutcome(GameOutcome.Win, TrackAction.Same)">Gewonnen gegen gleichstarken Spieler</button>
        <button class="btn btn-danger" @click="trackOutcome(GameOutcome.Loss, TrackAction.Worse)">Verloren gegen schlechteren Spieler</button>
        <button class="btn btn-primary" @click="trackOutcome(GameOutcome.Draw, TrackAction.Worse)">Gleichstand gegen schlechteren Spieler</button>
        <button class="btn btn-success" @click="trackOutcome(GameOutcome.Win, TrackAction.Worse)">Gewonnen gegen schlechteren Spieler</button>
      </div>

      <hr/>

      <div style="display: flex; justify-content: center; align-items: center; gap: 1rem;">
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <label>Gegner Rating Unterschied:</label>
          <input class="input" type="number" v-model.number="oppRatingChange" />
        </div>
        <div style="height: 100%; display: flex; justify-content: flex-end;">
          <button class="btn btn-text" @click="askReset">Alles zurücksetzen!</button>
        </div>
      </div>
    </div>
  </div>
</template>