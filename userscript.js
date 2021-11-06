// ==UserScript==
// @name         Score Graph
// @namespace    https://github.com/storjak
// @version      1.0
// @description  Score Graph
// @author       storjak
// @match        https://www.twitch.tv/*
// @exclude      *://*.twitch.tv/directory/*
// @exclude      *://*.twitch.tv/directory/
// @exclude      *://*.twitch.tv/*/*
// @grant        none
// @run-at       document-idle
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js

// ==/UserScript==

"use strict";
function appendButton() {
    let chartStatus = false,
        removedElement,
        liveCheck,
        root = document.getElementById("root");
    const newButton = document.createElement("div"),
        navBarHook = document.querySelector("#root > div > div.Layout-sc-nxg1ff-0.ldZtqr > nav > div > div.Layout-sc-nxg1ff-0.dRSNDF"),
        callback = (mutList, observer) => {
            observer.disconnect();
            close();
        },
        observer = new MutationObserver(callback);

    if (navBarHook === null) {
        throw 'Button embedding at the nav bar failed, likely a HTML change.';
    } else {
        navBarHook.append(newButton);
    }

    newButton.innerHTML = '<button style="padding-left: 10px; padding-right: 10px; margin-right: 10px" class="ScCoreButton-sc-1qn4ixc-0 ScCoreButtonSecondary-sc-1qn4ixc-2 jGqsfG fSetzA">Score Chart</button>';
    newButton.id = "score-graph-button";
    newButton.onclick = scoreGraph;

    function close() {
        removedElement = document.getElementById("score-graph-container").remove();
        observer.disconnect();
        chartStatus = false;
    }

    function scoreGraph() {
        if (!chartStatus) {
            if (removedElement === undefined) {
                let src,
                    liveElement = document.getElementsByTagName('video');
                if (liveElement[0].readyState === 0) {
                    src = "http://localhost:3000/offline";
                } else if (liveElement[0].src.substr(0, 27) === 'blob:https://www.twitch.tv/') {
                    src = "http://localhost:3000/userscript/" + location.pathname.slice(1);
                    observer.observe(liveElement[0], { attributes: true });
                } else {
                    src = "http://localhost:3000/offline";
                }
                let newElement = document.createElement("div");
                newElement.style.cssText = "position: absolute; z-index: 9999; top: 100px; right: 10px; border: solid 1px black; border-radius: 8px; resize: both; overflow: hidden; width: 300px; height: 300px; display: flex; flex-direction: column;";
                newElement.id = "score-graph-container";
                newElement.innerHTML = '<div id="grab" style="background-color: #6441a5; border-bottom: solid 1px black; text-align: center; width: 100%; font-family: Arial, Helvetica, sans-serif; padding: 4px; cursor: move;">Score Chart</div><div id="iframe-wrapper" style="height: 100%; width: 100%;"><iframe id="embed" style="height: 100%; width: 100%; border: none;" title="Score Graph" src=' + src + '></iframe></div>';
                root.append(newElement);
            } else {
                root.append(removedElement);
            }
            chartStatus = true;
        } else if (chartStatus) {
            close();
        }
    }
}

(function () {
    $(document).ready(function () {
        appendButton();
        $('body').on('click', '#grab', () => {
            $('#score-graph-container').draggable({
                handle: '#grab',
                iframeFix: true,
                containment: 'document'
            });
        });
    });
})();
