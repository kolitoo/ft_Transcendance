function openFriendProfile(data) {
	mainEl = document.getElementsByTagName('main')[0];
	if (mainEl) {
	    var winPercent = Math.round((data['games_won'] / data['games_played']) * 100);
	    mainEl.innerHTML = "";
	    mainEl.innerHTML = `
	    <div class="p-3 h-100">
		<div class="card h-100">
		    <div class="card-header">
			<div class="row overflow-hidden align-items-center">
			    <div class="col-md-auto">
				<img class="rounded-circle" src="${data['user']['avatar']}" style="width:80px; height: 80px;">
			    </div>
			    <div class="col" style="width:0;">
				<span class="align-middle fs-4 fw-bold text-nowrap">${data['user']['username']}</span>
			    </div>
			</div>
		    </div>
		    <div class="card-body overflow-hidden">
			<div id="friend-${data['id']}-stats" class="list-group "></div>
			<hr>
			<div id="friend-${data['id']}-games" class="list-group" style="justify-content:center;"></div>
		    </div>
		</div>
	    </div>
	    `;
	}
    }

function addGameToFriendProfile(data) {
	const gameDiv = document.getElementById(`friend-${data['id']}-games`);
	if (gameDiv) {
	    let isWinner = data['player1'] === data['friend_username'] ? data['score1'] > data['score2'] :
		data['player2'] === data['friend_username'] ? data['score2'] > data['score1'] : false;

	    let backgroundColor = isWinner ? '#6aa84f' : '#c44f4f';

	    let firstAvatar = data['friend_avatar'];
	    let secondAvatar = data['enemy_avatar'];
	    let firstPlayer = data['player1'];
	    let firstScore = data['score1'];
	    let secondPlayer = data['player2'];
	    let secondScore = data['score2'];
	    if (data['player1'] !== data['friend_username']) {
	    	firstAvatar = data['enemy_avatar'];
	    	secondAvatar = data['friend_avatar'];
	    }
	    else {
		firstAvatar = data['friend_avatar'];
	    	secondAvatar = data['enemy_avatar'];
	    }
	let GameTime = 0;
	if (data['game_data']['time'])
		GameTime = data['game_data']['time'].toFixed(2);
	let gameHtml = `
	<div class="game-content" style="padding: 10px; margin-bottom: 10px; cursor: pointer; border-radius: 20px; background-color: ${backgroundColor}; color: white; transition: transform 0.2s; border: 2px solid black; display: flex; justify-content: center; align-items: center;">
		<div class="container">
			<div class="row justify-content-between align-items-center">
				<div class="text-start" style="flex: 1;">
					<span class="fw-bold" style="font-size: 18px;">${firstPlayer}</span>
					<img class="rounded-circle" src="${firstAvatar}" style="width: 50px; height: 50px; border: 2px solid white;">
				</div>
				<div class="text-center" style="flex: 1;">
					<h1 class="fw-bold">${firstScore} - ${secondScore}</h1>
					<p style="font-size: 10px;">Game ID: ${data['game_id']}</p>
					<h1 class="fw-bold" style="font-size: 14px;">${GameTime}s</h1>
				</div>
				<div class="text-end" style="flex: 1;">
					<img class="rounded-circle" src="${secondAvatar}" style="width: 50px; height: 50px; border: 2px solid white;">
					<span class="fw-bold" style="font-size: 18px;">${secondPlayer}</span>
				</div>
			</div>
		</div>
	</div>`;

	let gameContent = document.createElement('div');
	gameContent.innerHTML = gameHtml;

	gameContent.style.marginBottom = '10px';

	if (gameDiv.firstChild) {
		gameDiv.insertBefore(gameContent, gameDiv.firstChild);
	} else {
		gameDiv.appendChild(gameContent);
	}

	gameContent.addEventListener("mouseover", function () {
		gameContent.style.transform = 'scale(1.02)';
	});

	gameContent.addEventListener("mouseout", function () {
		gameContent.style.transform = 'scale(1)';
	});

	gameContent.addEventListener("click", function () {
		goToPage(`game-history/${data['game_id']}/`);
	});
	}
    }


    function addStatsToFriendProfile(data) {
	const statsDiv = document.getElementById(`friend-${data['id']}-stats`);
	if (!statsDiv)
		return ;
	if (data['games_played'] == 0) {
		statsDiv.innerHTML += `
		<div class="container">
			<div class="row">
				<div class="col-md-12 text-center">
					<h3 class="fw-bold text-black" data-innerText-translate="NO stats to display">${getTranslation("NO stats to display")}</h3>
				</div>
			</div>
		</div>`;
	}
	const winPercent = Math.round((data['games_won'] / data['games_played']) * 100);
	let GameAverage = 0
	let GameAverageLabel = []
	let GameAverageTime = []
	let i = 0;
	let y = 0;
	// if (data['total_game_data'].length == 1 && data['total_game_data'][0]['game_data']['skip'] == true)
	// 	GameAverage = 0;
	// else {
	if (data['games_played'] > 0) {
		while (y < data['total_game_data'].length) {
		    if (data['total_game_data'][y]['game_data']['skip'] == false) {
			GameAverage += data['total_game_data'][y]['game_data']['time'];
			GameAverageLabel.push(data['total_game_data'][y]['player1'] + ' - ' + data['total_game_data'][i]['player2']);
			GameAverageTime.push(data['total_game_data'][y]['game_data']['time']);
			i++;
			}
			y++;
		}
	}
	if (GameAverage != 0)
	{
		GameAverage = GameAverage / i;
		GameAverage = GameAverage.toFixed(2);
	}
//}
	let streak;
	if (data['winstreak'] == 0) {
	    if (data['losestreak'] == 1)
			streak = data['losestreak'] + " lose";
	    else
			streak = data['losestreak'] + " loses";
	} else {
	    if (data['winstreak'] == 1)
			streak = data['winstreak'] + " win";
	    else
			streak = data['winstreak'] + " wins";
	}
	if (statsDiv && data['games_played'] != 0) {
		statsDiv.innerHTML += `
		<div class="container mx-auto">
		    <div class="row row-cols-4 justify-content-center">
			<!-- Global Winrate -->
			<div class="col-xl-3 col-md-auto mb-4">
			    <div class="card border rounded-lg border-info shadow h-100 py-2">
				<div class="card-body">
				    <div class="row no-gutters align-items-center">
					<div class="col mr-2">
					    <div class="text-xs font-weight-bold text-info text-uppercase mb-1" data-innerText-translate="Global Winrate">${getTranslation("Global Winrate")}</div>
					    <div class="row no-gutters align-items-center">
						<div class="col-auto">
						    <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">${winPercent}%</div>
						</div>
						<div class="col">
						    <div class="progress progress-sm mr-2">
							<div class="progress-bar bg-info" role="progressbar" style="width: ${winPercent}%" aria-valuenow="${winPercent}" aria-valuemin="0" aria-valuemax="100"></div>
						    </div>
						</div>
					    </div>
					</div>
					<div class="col-auto">
					    <i class="fas fa-trophy fa-2x text-info"></i>
					</div>
				    </div>
				</div>
			    </div>
			</div>
			<!-- Streak -->
			<div class="col-xl-3 col-md-auto mb-4">
			    <div class="card border rounded-lg border-primary shadow h-100 py-2">
				<div class="card-body">
				    <div class="row no-gutters align-items-center">
					<div class="col mr-2">
					    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1" data-innerText-translate="Actual Streak">${getTranslation("Actual Streak")}</div>
					    <div class="h5 mb-0 font-weight-bold text-gray-800" data-streak-translate="${streak}">${streak}</div>
					</div>
					<div class="col-auto">
					    <i class="fas fa-calendar fa-2x text-primary"></i>
					</div>
				    </div>
				</div>
			    </div>
			</div>
			<!-- Games Played -->
			<div class="col-xl-3 col-md-auto mb-4">
			    <div class="card border rounded-lg border-success shadow h-100 py-2">
				<div class="card-body">
				    <div class="row no-gutters align-items-center">
					<div class="col mr-2">
					    <div class="text-xs font-weight-bold text-success text-uppercase mb-1" data-innerText-translate="Games played">${getTranslation("Games played")}</div>
					    <div class="h5 mb-0 font-weight-bold text-gray-800">${data['games_played']}</div>
					</div>
					<div class="col-auto">
					    <i class="fas fa-gamepad fa-2x text-success"></i>
					</div>
				    </div>
				</div>
			    </div>
			</div>
			<!-- Average game time -->
			<div class="col-xl-3 col-md-auto mb-4">
			    <div class="card border rounded-lg border-warning shadow h-100 py-2">
				<div class="card-body">
				    <div class="row no-gutters align-items-center">
					<div class="col mr-2">
					    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1" data-innerText-translate="Average game time">${getTranslation("Average game time")}</div>
					    <div class="h5 mb-0 font-weight-bold text-gray-800">${GameAverage}s</div>
					</div>
					<div class="col-auto">
					    <i class="fas fa-clock fa-2x text-warning"></i>
					</div>
				    </div>
				</div>
			    </div>
			</div>
		    </div>
		    ${data['nbgame_vs_utilisateur'] === 0 &&  data['lose_vs_user'] === 0 && data['win_vs_user'] === 0 ? `
		    <div class="row">
		    	<div class="col-md-6 mx-auto text-center">
				<div class="card h-100">
			    		<div class="card-body">
						<h5 class="card-title fw-bold" data-innerText-translate="Durée des games">${getTranslation("Durée des games")}</h5>
						<canvas id="shots-chart" style="max-width: 100%; height: auto;"></canvas>
			    		</div>
				</div>
		    	</div>
		    </div>` : `
		    <div class="row">
			<div class="col-md-6">
				<div class="card h-100">
					<div class="card-body">
						<h5 class="card-title text-center fw-bold">Win versus Me</h5>
						<canvas id="friend-${data['id']}-bar-chart" style="max-width: 100%; height: auto;"></canvas>
					</div>
				</div>
			</div>
		    <div class="col-md-6">
			<div class="card h-100">
				<div class="card-body">
					<h5 class="card-title text-center fw-bold" data-innerText-translate="Durée des games">${getTranslation("Durée des games")}</h5>
					<canvas id="shots-chart" style="max-width: 100%; height: auto;"></canvas>
				</div>
			</div>
		    </div>
		</div>`}`;
	translateAll();

	const shotsData = {
		labels: GameAverageLabel,
		shots: GameAverageTime,
	    };

	    const shotsConfig = {
		type: 'line',
		data: {
		    labels: shotsData.labels,
		    datasets: [{
			label: getTranslation("Durée des games"),
			data: shotsData.shots,
			fill: false,
			borderColor: 'rgba(75, 192, 192, 1)',
			borderWidth: 2
		    }]
		},
		options: {
		    responsive: true,
		    scales: {
			y: {
			    beginAtZero: true
			}
		    }
		}
	    };
	    let shotsChart = 0;
	    const shotsCtx = document.getElementById('shots-chart');
	    if (shotsCtx)
		    shotsChart = new Chart(shotsCtx.getContext('2d'), shotsConfig);
	    }

	const barChartCanvas = document.getElementById(`friend-${data['id']}-bar-chart`);
	if (!barChartCanvas)
		return ;
	const barCtx = barChartCanvas.getContext('2d');
	const barChart = new Chart(barCtx, {
		type: 'bar',
		data: {
		    labels: ['Win', 'Lose'],
		    datasets: [{
			label: 'Versus me',
			data: [data['nbgame_vs_utilisateur'] - data['lose_vs_user'], data['lose_vs_user']],
			backgroundColor: [
			    'rgba(54, 162, 235, 0.2)',
			    'rgba(255, 99, 132, 0.2)'
			],
			borderColor: [
			    'rgba(54, 162, 235, 1)',
			    'rgba(255, 99, 132, 1)'
			],
			borderWidth: 2
		    }]
		},
		options: {
			responsive: true,
			scales: {
			    y: {
				beginAtZero: true
			    }
			}
		    }
	    });
	}
