/*
 *	Wikitool
 *	A tool for saving a wiki to Local Storage
 *	https://github.com/AnthonyHJ/WikiTool
 */

'use strict';

//	Set at runtime
var config = { 'startupPage' : 'StartupPage' };
var pageVars = {
	'StartupPage' : {
		'content' : 'Test\n\nContent',
		'created' : 1,
		'modified' : 1,
		'tags' : ['default', 'startup', 'system'],
		'title' : ''
		}
};
var tagList = {};

//	Startup script
chrome.runtime.onStartup.addListener(function() {
	//	Load configuration values
	chrome.storage.local.get(['config'], function(result) {
		if (result.config)
			config = result.config;
	});
		
	//	Load pages
	chrome.storage.local.get(['pageValues'], function(pageResult) {
		if (pageResult.pageValues)
			pageVars = pageResult.pageValues;
	});
		
	//	Load tags
	chrome.storage.local.get(['tagList'], function(tagResult) {
		if (tagResult.tagList)
			tagList = tagResult.tagList;
	});
});

chrome.browserAction.onClicked.addListener(function() {
	chrome.tabs.create({
      url: 'wiki.html'
    });
})

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "startUp")
      sendResponse({config: config, pageList: Object.keys(pageVars), tagList: tagList});
  }
);