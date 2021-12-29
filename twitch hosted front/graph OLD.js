const socket = io('http://localhost:3001', {
    withCredentials: true,
    autoConnect: false
});

window.Twitch.ext.onAuthorized((auth) => {
    socket.connect();
    socket.emit("channel info", auth.channelId);
});

window.Twitch.ext.onError((error) => {
    console.error(err);
    console.error("window.Twitch.ext error, auto-reload in 2 seconds...");
    setTimeout(function () {
        location.reload();
    }, 2000);
});

socket.on("connect_error", (e) => {
    socket.disconnect();
    console.error('Socket.io connection error: ' + e);
});

socket.on("chart update", function (data) {
    chartUpdate(MyChart, data);
});

socket.on('TMI Failure', function () {
    socket.disconnect();
    window.location = './error?e=tmi';
});

function chartUpdate(chart, scoreData) {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(scoreData);
    chart.update();
}

const chartOptions = {
    color: "#E9E9E9",
    //events: [], //disables hover-over tooltips when active
    maintainAspectRatio: false,
    tooltips: {
        enabled: true
    },
    animation: {
        duration: 1999,
        easing: "linear"
    },
    hover: {
        animationDuration: 0,
    },
    legend: {
        display: false
    },
    scales: {
        xAxes: [{
            gridLines: {
                display: false
            },
            ticks: {
                fontColor: "#f1f1f1"
            }
        }],
        yAxes: [{
            ticks: {
                fontColor: "#f1f1f1",
                stepSize: 1
            }
        }]
    }
}
const ctx = document.getElementById('chart').getContext('2d');
const MyChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: ["20", "18", "16", "14", "12", "10", "8s", "6s", "4s", "2s"],
        datasets: [{
            pointBackgroundColor: "#6441a5",
            borderColor: "#6441a5",
            backgroundColor: "#27272b",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            lineTension: 0,
            hitRadius: 5
        }]
    },
    options: chartOptions
});