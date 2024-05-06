let fourplayersbutton = document.getElementById("four_players_button");
if (fourplayersbutton)
    fourplayersbutton.addEventListener("click", fourPlayers);

let fourplayersWebsocket;

function make_pong4_game(){
    const mainEl = document.getElementById("main");
    if (mainEl){
        mainEl.innerHTML=`
            <div class="p-3">
                <div id="score" class="bg-black w-100 row fs-1 fw-bold text-white text-center m-0">
                    <div class="row no--bs-gutter-x m-0">
                        <div id="player1" class="col-sm-5 overflow-hidden p-0">Player 1</div>
                        <div id="left_score" class="col-sm-1 overflow-hidden p-0">0</div>
                        <div id="right_score" class="col-sm-1 overflow-hidden p-0">0</div>
                        <div id="player2" class="col-sm-5 overflow-hidden p-0">Player 2</div>
                    </div>
                    <div class="row no--bs-gutter-x m-0">
                        <div id="player3" class="col-sm-5 overflow-hidden p-0">Player 3</div>
                        <div id="top_score" class="col-sm-1 overflow-hidden p-0">0</div>
                        <div id="bottom_score" class="col-sm-1 overflow-hidden p-0">0</div>
                        <div id="player4" class="col-sm-5 overflow-hidden p-0">Player 4</div>
                    </div>
                </div>
                <div id="pong" class="ratio ratio-1x1 bg-black shadow">
                    <div class="border-top border-bottom border-5 border-white row no--bs-gutter-x m-0">\
                        <div class="col no--bs-gutter-x p-2">
                            <div id="player_left" class="bg-white float-start rounded"></div>
                            <div id="ball4" class="nopadding bg-white rounded-circle float-start"></div>
                            <div id="player_right" class="bg-white float-end rounded"></div>
                            <div id="player_top" class="bg-white rounded"></div>
                            <div id="player_bottom" class="bg-white rounded mb-2 position-absolute" style="bottom:0;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `
        mainEl.classList.add("col-lg-5");
    }

    document.body.addEventListener("keydown", keydown4);
    document.body.addEventListener("keyup", keyup4);

    if (queuebutton)
        queuebutton.removeEventListener("click", addToQueue);
    if (tournamentbutton)
        tournamentbutton.removeEventListener("click", tournament);
    if (fourplayersbutton)
        fourplayersbutton.removeEventListener("click", fourPlayers);
}

function fourPlayers(){
    let jwtToken = encodeURIComponent(localStorage.getItem('jwtToken'));
    let id = encodeURIComponent(localStorage.getItem('userId'));
    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsPath = wsProtocol + window.location.host + "/ws/fourplayersqueue/?jwtToken=" + jwtToken + "&id=" + id;
    fourplayersWebsocket = new WebSocket(wsPath);

    fourplayersWebsocket.onopen = function(){
        console.log("fourplayersWebsocket opened !");
    }

    fourplayersWebsocket.onclose = function(){
        console.log("fourplayersWebsocket closed");
    }

    fourplayersWebsocket.onmessage = async function(event){
        const data = JSON.parse(event.data);

        if (data['in']){
            const msg = document.getElementById("play");
            str = getTranslation("You are in position");
            if (msg){
                msg.innerHTML= `
                ${str} ${data['pos']} / ${data['len']}<br>
                <button class="btn btn-danger m-1" onclick="leaveQueue()">
                    <i class="bi bi-box-arrow-left"></i>
                </button>
                `;
            }
        }
        else if (data['out']){
            setTimeout(function() {
                make_pong4_game();
                pong4(data['path']);
            }, 1000);
        }
        else if (data['close']){
            fourplayersWebsocket.close();
        }
        else{
            console.log("else");
            console.log(data);
        }
    }
}