// this file is a collection of functions that can be run from the command line,
// but do not currently have a place to display the computed stats
// these functions may have hardcoded constants due to the specificity of the stats.

// computes the win % of the team that wins the second objective phase
// on sky temple
function skyTempleSecondPhaseWin() {
  DB.getMatches({ map: 'Sky Temple' }, function(err, docs) {
    // aggregate
    const aggregate = {
      phase2WinnerGame: 0,
      nonDrawGames: 0,
      data: []
    };

    for (const match of docs) {
      const winner = match.winner;

      const shots = match.objective[0].events.concat(match.objective[1].events);
      shots.sort(function(a, b) {
        return a.loop - b.loop;
      });

      // count shots in range 90 - 135 (each tower is 45 shots)
      let blueCt = 0;
      let redCt = 0;
      for (let i = 0; i < 45; i++) {
        const idx = 90 + i;

        if (idx >= shots.length) break;

        if (shots[i].team === ReplayTypes.TeamType.Blue) blueCt += 1;
        else if (shots[i].team === ReplayTypes.TeamType.Red) redCt += 1;
      }

      let towerWinner =
        blueCt > redCt ? ReplayTypes.TeamType.Blue : ReplayTypes.TeamType.Red;

      if (blueCt === redCt) towerWinner = -1;

      let winnerProportion = 0;
      let winnerShots = 0;
      if (towerWinner === ReplayTypes.TeamType.Blue) {
        winnerShots = blueCt;
      } else if (towerWinner === ReplayTypes.TeamType.Red) {
        winnerShots = redCt;
      }
      winnerProportion = winnerShots / 45;

      aggregate.data.push({
        didPhase2WinnerWin: towerWinner === winner,
        didPhase2Draw: blueCt === redCt,
        winnerProportion,
        winnerShots
      });

      if (towerWinner === winner) {
        aggregate.phase2WinnerGame += 1;
      }

      if (towerWinner !== -1) {
        aggregate.nonDrawGames += 1;
      }
    }

    aggregate.phase2WinnerGamePct = aggregate.phase2WinnerGame / docs.length;
    aggregate.phase2WinnerGameNoDrawPct =
      aggregate.phase2WinnerGame / aggregate.nonDrawGames;

    console.log(aggregate);
  });
}