/*console.log('path...........');
console.log(window.location.pathname);*/

const generalError = "<div>Something went wrong with the extension.  If it's not fixed in a little while feel free to send an email to <a href=\"mailto:storjakdev@gmail.com\">StorjakDev@gmail.com</a>, or submit an issue on the <a target=\"_blank\" href=\"https://github.com/storjak/twitch-Chat-Score-Chart/issues\">GitHub page</a>.</div><button onclick=redir()>Reload</button>";


(() => {
    let rootHook = document.getElementById("root");
    let query = new URLSearchParams(document.location.search);
    let errCode = query.get('e');
    /*
    if (errCode === 'tmi') {
        rootHook.innerHTML = tmiError;
    } else if (!errCode) {
        rootHook.innerHTML = generalError;
    }
    */
   rootHook.innerHTML = generalError;
    rootHook.append(genElem);
})();

function redir() {
    window.location = './graph.html';
}