 let matchData = {
    currentTeam: 'Team A',
    totalRuns: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    currentOver: [],
    striker: { runs: 0, balls: 0, fours: 0, sixes: 0 },
    nonStriker: { runs: 0, balls: 0, fours: 0, sixes: 0 },
    bowler: { overs: 0, balls: 0, runs: 0, wickets: 0 },
    extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
    innings: 1,
    target: null
};

function updateDisplay() {

    document.getElementById('runs').textContent = matchData.totalRuns;
    document.getElementById('wickets').textContent = matchData.wickets;
    document.getElementById('overs').textContent = `${matchData.overs}.${matchData.balls}`;

    let totalBalls = matchData.overs * 6 + matchData.balls;
    let crr = totalBalls > 0 ? (matchData.totalRuns / totalBalls * 6).toFixed(2) : '0.00';
    document.getElementById('currentRR').textContent = crr;

    updateBatsmanStats('striker', matchData.striker);
    updateBatsmanStats('nonStriker', matchData.nonStriker);

    updateBowlerStats();

    checkMatchResult();
}

function updateBatsmanStats(type, batsman) {

    let prefix = type === 'striker' ? 'striker' : 'nonStriker';

    document.getElementById(`${prefix}Runs`).textContent = batsman.runs;
    document.getElementById(`${prefix}Balls`).textContent = batsman.balls;
    document.getElementById(`${prefix}4s`).textContent = batsman.fours;
    document.getElementById(`${prefix}6s`).textContent = batsman.sixes;

    let sr = batsman.balls > 0 ? (batsman.runs / batsman.balls * 100).toFixed(2) : '0.00';
    document.getElementById(`${prefix}SR`).textContent = sr;
}

function updateBowlerStats() {

    document.getElementById('bowlerOvers').textContent =
        `${matchData.bowler.overs}.${matchData.bowler.balls}`;

    document.getElementById('bowlerRuns').textContent = matchData.bowler.runs;
    document.getElementById('bowlerWickets').textContent = matchData.bowler.wickets;

    let totalBalls = matchData.bowler.overs * 6 + matchData.bowler.balls;
    let economy = totalBalls > 0 ? (matchData.bowler.runs / totalBalls * 6).toFixed(2) : '0.00';

    document.getElementById('bowlerEconomy').textContent = economy;
}

function addRuns(runs) {

    matchData.totalRuns += runs;

    matchData.striker.runs += runs;
    matchData.striker.balls += 1;

    matchData.bowler.runs += runs;
    matchData.bowler.balls += 1;

    matchData.balls += 1;

    if (runs === 4) matchData.striker.fours += 1;
    if (runs === 6) matchData.striker.sixes += 1;

    addBallToOver(runs === 0 ? '•' : runs.toString());

    if (runs % 2 === 1) switchStrike();

    if (matchData.balls === 6) {

        matchData.balls = 0;
        matchData.overs += 1;

        matchData.bowler.overs += 1;
        matchData.bowler.balls = 0;

        switchStrike();

        alert("Over finished! Please change the bowler.");

        matchData.bowler = { overs: 0, balls: 0, runs: 0, wickets: 0 };
        document.getElementById('bowler').value = '';
    }

    updateDisplay();
}

function addExtras(type) {

    let extraRuns = 1;

    if (type === 'wide' || type === 'noball') {

        matchData.totalRuns += extraRuns;
        matchData.bowler.runs += extraRuns;

        addBallToOver(type === 'wide' ? 'Wd' : 'Nb');

    } else {

        matchData.totalRuns += 1;
        matchData.balls += 1;

        addBallToOver(type === 'bye' ? 'B' : 'Lb');

        if (matchData.balls === 6) {

            matchData.balls = 0;
            matchData.overs += 1;
            switchStrike();

            alert("Over finished! Please change the bowler.");

            matchData.bowler = { overs: 0, balls: 0, runs: 0, wickets: 0 };
            document.getElementById('bowler').value = '';
        }
    }

    matchData.extras[type] += extraRuns;

    updateDisplay();
}

function wicket() {

    matchData.wickets += 1;

    matchData.bowler.wickets += 1;

    matchData.balls += 1;
    matchData.bowler.balls += 1;

    addBallToOver('W');

    matchData.striker = { runs: 0, balls: 0, fours: 0, sixes: 0 };

    document.getElementById('striker').value = '';

    if (matchData.balls === 6) {

        matchData.balls = 0;
        matchData.overs += 1;

        matchData.bowler.overs += 1;
        matchData.bowler.balls = 0;

        alert("Over finished! Please change the bowler.");

        matchData.bowler = { overs: 0, balls: 0, runs: 0, wickets: 0 };
        document.getElementById('bowler').value = '';
    }

    updateDisplay();
}

function switchStrike() {

    let temp = matchData.striker;
    matchData.striker = matchData.nonStriker;
    matchData.nonStriker = temp;

    let strikerName = document.getElementById('striker').value;
    let nonStrikerName = document.getElementById('nonStriker').value;

    document.getElementById('striker').value = nonStrikerName;
    document.getElementById('nonStriker').value = strikerName;

    updateDisplay();
}

function addBallToOver(ball) {

    matchData.currentOver.push(ball);

    let ballDiv = document.createElement('div');
    ballDiv.className = 'ball';

    if (ball === 'W') ballDiv.classList.add('wicket');
    else if (ball === '•' || ball === '0') ballDiv.classList.add('dot');
    else if (ball === 'Wd' || ball === 'Nb') ballDiv.classList.add('wide');
    else ballDiv.classList.add('run');

    ballDiv.textContent = ball;

    document.getElementById('currentOver').appendChild(ballDiv);
}

function switchInnings() {

    let firstInnings = {
        team: document.getElementById('team1Name').value,
        runs: matchData.totalRuns,
        wickets: matchData.wickets,
        overs: `${matchData.overs}.${matchData.balls}`
    };

    matchData.target = matchData.totalRuns + 1;

    document.getElementById('target').textContent = matchData.target;

    document.getElementById('battingTeam').textContent =
        document.getElementById('team2Name').value;

    matchData.totalRuns = 0;
    matchData.wickets = 0;
    matchData.overs = 0;
    matchData.balls = 0;

    matchData.currentOver = [];

    matchData.striker = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    matchData.nonStriker = { runs: 0, balls: 0, fours: 0, sixes: 0 };

    matchData.bowler = { overs: 0, balls: 0, runs: 0, wickets: 0 };

    matchData.innings = 2;

    document.getElementById('striker').value = '';
    document.getElementById('nonStriker').value = '';
    document.getElementById('bowler').value = '';
    document.getElementById('currentOver').innerHTML = '';

    document.getElementById('fullScorecard').innerHTML =
        `<div style="padding:10px;background:white;border-radius:5px;margin-bottom:10px;">
        <strong>${firstInnings.team}:</strong> 
        ${firstInnings.runs}/${firstInnings.wickets} (${firstInnings.overs} overs)
        </div>`;

    updateDisplay();
}

function checkMatchResult() {

    if (matchData.innings === 2) {

        if (matchData.totalRuns >= matchData.target) {

            let winner = document.getElementById('team2Name').value;

            alert(winner + " won the match by " +
                (10 - matchData.wickets) + " wickets!");

            resetMatch();
        }

        if (matchData.wickets === 10) {

            let winner = document.getElementById('team1Name').value;

            alert(winner + " defended the target and won!");

            resetMatch();
        }
    }
}

function resetMatch() {

    if (confirm('Reset Match?')) {

        location.reload();
    }
}

updateDisplay();