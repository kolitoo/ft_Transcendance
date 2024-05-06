function gameLeftHistory(data) {
	let a = document.createElement("a");
	a.classList = "list-group-item list-group-item-action py-3 history-left";
	a.innerHTML = `
	    <div class="row">
	    <div class="col">
		<span class="fw-bold">${data['player1']}</span>
	    </div>
	    <div class="col text-center align-self-center">
		<h1 class="fw-bold" style="font-size: 20px;">${data['score1']} - ${data['score2']}</h1>
		<div class="small text-center">${data['time']}s</div>
	    </div>
	    <div class="col text-end">
		<span class="fw-bold">${data['player2']}</span>
	    </div>
	    </div>`;
	a.style.cursor = "pointer";
	a.setAttribute("onclick", `goToPage('game-history/${data['game_id']}/')`);
	if (a){
	    if (a.classList.contains('disabled')){
		a.classList.remove('disabled');
	    }
	}
	const history = document.getElementById("history");
	if (history)
	    history.prepend(a);
}

    function openGameHistory(data) {
	mainEl = document.getElementsByTagName('main')[0];
	let GameTime = 0;
	if (data['game_data']['skip'] != true)
	    GameTime = data['time'] + 's';
	else
	    GameTime = "Forfait";
    
	if (mainEl) {
	    mainEl.innerHTML = "";
	    mainEl.innerHTML = `
		<div class="p-3 h-100">
		    <div class="card h-100">
			<div class="card-header">
			    <div class="row align-items-center">
				<div class="col-md-auto">
				    <img class="rounded-circle" src="${data['player1_avatar']}" style="width: 80px; height: 80px; cursor: pointer;" onclick="checkFriendship(this, ${data['player1_id']}, ${data['user_ID']})" data-friendlist='${JSON.stringify(data['friend_list'])}'>
				    <span class="fw-bold" onclick="checkFriendship(this, ${data['player1_id']}, ${data['user_ID']})" style="cursor: pointer;">${data['player1_username']}</span>
				    ${data['score1'] >= 10 ? '<i class="fas fa-trophy"></i>' : ''}
				</div>
				<div class="col text-center">
				    <p style="font-size: 10px;">Game ID: ${data['game_id']}</p>
				    <h1 class="fw-bold">${data['score1']} - ${data['score2']}</h1>
				    <h1 class="fw-bold" style="font-size: 14px;">${GameTime}</h1>
				    <p style="font-size: 10px;">${data['time']}</p>
				</div>
				<div class="col-md-auto">
				    ${data['score2'] >= 10 ? '<i class="fas fa-trophy"></i>' : ''}
				    <img class="rounded-circle" src="${data['player2_avatar']}" style="width: 80px; height: 80px; cursor: pointer;" onclick="checkFriendship(this, ${data['player2_id']}, ${data['user_ID']})" data-friendlist='${JSON.stringify(data['friend_list'])}'>
				    <span class="fw-bold" onclick="checkFriendship(this, ${data['player2_id']}, ${data['user_ID']})" style="cursor: pointer;">${data['player2_username']}</span>
				</div>
			    </div>
			</div>
			${data['game_data']['skip'] === false ? `
			<div class="p-3 h-100">
			    <div class=" text-end" style="font-size: 15px;" data-innerText-translate="*En secondes">${getTranslation("*En secondes")}</div>
			    <div class="row">
				<div class="col-md-6">
				    <div class="card h-100">
					<div class="card-body">
					    <h5 class="card-title text-center fw-bold" data-innerText-translate="Ordre de victoire par round">${getTranslation("Ordre de victoire par round")}</h5>
					    <canvas id="points-chart" style="max-width: 100%; height: auto;"></canvas>
					</div>
				    </div>
				</div>
				<div class="col-md-6">
				    <div class="card h-100">
					<div class="card-body">
					    <h5 class="card-title text-center fw-bold" data-innerText-translate="Nombre de coups par round">${getTranslation("Nombre de coups par round")}</h5>
					    <canvas id="shots-chart" style="max-width: 100%; height: auto;"></canvas>
					</div>
				    </div>
				</div>
			    </div>
			</div>
			<div class="p-3 h-100">
			    <div class="row">
				<div class="col-md-6">
				    <div class="card h-100">
					<div class="card-body">
					    <h5 class="card-title text-center fw-bold" data-innerText-translate="Temps par round">${getTranslation("Temps par round")}</h5>
					    <canvas id="horizon-chart" width="400" height="400" style="max-width: 100%; height: auto;"></canvas>
					</div>
				    </div>
				</div>
				<div class="col-md-6">
				    <div class="card h-100">
					<div class="card-body">
					    <h5 class="card-title text-center fw-bold" data-innerText-translate="Stats globales">${getTranslation("Stats globales")}</h5>
					    <canvas id="radar-chart" width="400" height="400" style="max-width: 100%; height: auto;"></canvas>
					</div>
				    </div>
				</div>
			    </div>
			</div>
			` : `<div class="col-md-12 text-center">
				<h3 class="fw-bold text-black" data-innerText-translate="NO stats to display">${getTranslation("NO stats to display")}</h3>
			    </div>`}
		    </div>
		</div>
	    `;
let player1streak = data['player1'];
let player2streak = data['player2'];
const radarLabels = [getTranslation('Plus gros échange'), getTranslation('Plus petit échange'), getTranslation('Round le plus long*'), getTranslation('Round le plus cours*'), player1streak + getTranslation(' le + de points d\'affilés'), player2streak + getTranslation(' le + de points d\'affilés')];

const radarData = {
    labels: radarLabels,
    datasets: [{
        label: getTranslation('Stats globales'),
        data: [data['game_data']['max_hits'], data['game_data']['least_hits'], data['game_data']['longest_round'], data['game_data']['quickest_round'],  data['game_data']['player1_streak'],  data['game_data']['player2_streak']], // Données pour chaque dimension du radar chart
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
    }]
};

const radarConfig = {
    type: 'radar',
    data: radarData,
    options: {
        scales: {
            r: {
                suggestedMin: 0
            }
        }
    }
};

let radarChart = 0;
const radarChartCtx = document.getElementById('radar-chart');
if (radarChartCtx)
	radarChart = new Chart(radarChartCtx.getContext('2d'), radarConfig);

const labelstime = [];
const TimePerRound = data['game_data']['time_per_round'];

if (TimePerRound) {
	for (let i = 1; i <= TimePerRound.length; i++) {
		labelstime.push("Round " + i);
	}
}
const pieLabels = labelstime;
const pieData = {
    labels: pieLabels,
    datasets: [{
        label: getTranslation('Temps par round*'),
        data: data['game_data']['time_per_round'],
        backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
    }]
};

const pieConfig = {
    type: 'pie',
    data: pieData,
    options: {
        responsive: true,
    }
};

let horizonChart = 0;
const horizonChartCtx = document.getElementById('horizon-chart');
if (horizonChartCtx)
	horizonChart = new Chart(horizonChartCtx.getContext('2d'), pieConfig);
const labelswin = [];
const WinPerRound = data['game_data']['ordered_wins'];

if ( WinPerRound) {
for (let i = 1; i <= WinPerRound.length; i++) {
    if (data['game_data']['ordered_wins'][i - 1] == 1)
    	labelswin.push(data['player1'])
    else
    	labelswin.push(data['player2'])
}
}
	    const pointsData = {
		labels: labelswin,
		points: data['game_data']['ordered_wins']
	    };
	    if (!pointsData.points)
	    	return ;
	    const pointsConfig = {
		type: 'bar',
		data: {
		    labels: pointsData.labels,
		    datasets: [{
			label: getTranslation('Ordre de victoire par round'),
			data: pointsData.points,
			backgroundColor: pointsData.points.map(win => win === 1 ? 'rgba(54, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)'),
			borderColor: pointsData.points.map(win => win === 1 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)'),
			borderWidth: 1
		    }]
		},
		options: {
		    responsive: true,
		    layout: {
			padding: 20,
		    },
		    scales: {
			x: {
			    barThickness: 1,
			    grid: {
				display: false
			    }
			},
			y: {
			    beginAtZero: true,
			    max: 1,
			    grid: {
				display: true
			    }
			}
		    }
		}
	    };

	    let pointsChart = 0;
	    const pointsCtx = document.getElementById('points-chart');
	    if (pointsCtx)
	    	pointsChart = new Chart(pointsCtx.getContext('2d'), pointsConfig);
	    const labelspoints = [];
	    const hitsPerRound = data['game_data']['hits_per_round'];

	    for (let i = 1; i <= hitsPerRound.length; i++) {
		labelspoints.push(getTranslation("Point ") + i);
	    }
	    const shotsData = {
		labels: labelspoints,
		shots: data['game_data']['hits_per_round']
	    };

	    const shotsConfig = {
		type: 'line',
		data: {
		    labels: shotsData.labels,
		    datasets: [{
			label: getTranslation('Nombre de coups par round'),
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
    }

    function checkFriendship(element, playerId, username_ID) {
	const friendList = JSON.parse(element.getAttribute('data-friendlist'));
	const isFriend = friendList.some(friend => friend.id === playerId);
	if(playerId == username_ID)
		goToPage('accounts/username/' + username_ID + '/');
	else
		sendDataToSocket("check_if_friend", { friendId: playerId });
    }

    function notificationArea() {
	const chatMenu = document.getElementById('chatMenu');
	if (!chatMenu.classList.contains('show')) {
		const notification = document.createElement('div');
		notification.classList.add('alert', 'alert-info', 'p-2', 'fs-6', 'd-flex', 'justify-content-between', 'align-items-center');
		notification.innerHTML = `${getTranslation("Ce joueur n\'est pas dans votre liste d\'amis. ")}<button type="button" class="btn-close" aria-label="Close"></button>`;

		setTimeout(() => {
		notification.remove();
		}, 3000);

		const closeButton = notification.querySelector('.btn-close');
		closeButton.addEventListener('click', () => {
		notification.remove();
		});

		const notificationArea = document.getElementById('notificationArea');
		if (notificationArea)
			notificationArea.appendChild(notification);
	}
}