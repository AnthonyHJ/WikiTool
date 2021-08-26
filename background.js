/*
 *	A tool for saving a wiki to Local Storage
 */

'use strict';

//	Startup script
//chrome.runtime.onStartup.addListener(function() {});

chrome.browserAction.onClicked.addListener(function() {
	chrome.tabs.create({
      url: 'wiki.html'
    });
})
