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
// @run-at       document-start
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js

// ==/UserScript==

// Works with Twitch.tv as of May 7, 2021

function appendButton() {
    let chartStatus = false;
    let removedElement;
    let root = document.getElementById("root");
    const newButton = document.createElement("div");
    newButton.innerHTML = '<button style="padding-left: 10px; padding-right: 10px; margin-right: 10px" class="ScCoreButton-sc-1qn4ixc-0 ScCoreButtonSecondary-sc-1qn4ixc-2 kMLrvA tw-core-button">Score Chart</button>';
    newButton.id = "score-graph-button";
    newButton.onclick = function scoreGraph() {
        if (chartStatus === false) {
            if (removedElement === undefined) {
                const src = "http://localhost:3000/userscript/" + location.pathname.slice(1);
                let newElement = document.createElement("div");
                newElement.style.cssText = "position: absolute; z-index: 9999; top: 100px; right: 10px; border: solid 1px black; border-radius: 8px; resize: both; overflow: hidden; width: 300px; height: 300px; display: flex; flex-direction: column;";
                newElement.id = "score-graph-container";
                newElement.innerHTML = '<div id="grab" style="background-color: #6441a5; border-bottom: solid 1px black; text-align: center; width: 100%; font-family: Arial, Helvetica, sans-serif; padding: 4px; cursor: move;">Drag Me!</div><div id="iframe-wrapper" style="height: 100%; width: 100%;"><iframe id="embed" style="height: 100%; width: 100%; border: none;" title="Score Graph" src=' + src + '></iframe></div>';
                root.append(newElement);
            } else {
                root.append(removedElement);
            }
            chartStatus = true;
        } else if (chartStatus === true) {
            removedElement = document.getElementById("score-graph-container").remove();
            chartStatus = false;
        }
    }
    const navBar = document.getElementsByClassName("tw-align-items-center tw-flex tw-flex-grow-1 tw-flex-shrink-1 tw-full-width tw-justify-content-end");
    navBar[0].append(newButton);
}

(function() {
    $(document).ready(function() {
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
