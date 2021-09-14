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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action === "startUp")
		sendResponse({config: config, pageList: Object.keys(pageVars), tagList: tagList});
	
	if (request.pageRequest)
		sendResponse(loadPage(request.pageRequest));
	
	if (request.updatePage)
		sendResponse(savePage(request.updatePage));
});

function savePage (updatePage)
{
	if (pageVars[updatePage.title])
	{
		//	It's an update
		console.log(pageVars[updatePage.title]);
	}
	
	pageVars[updatePage.title] = updatePage;
	
	//	add to the localStorage
	chrome.storage.local.set({'pageValues': pageVars}, function() {
		console.log('Saving: page values');
	});
	
	chrome.storage.local.set({'tagList': tagList}, function() {
		console.log('Saving: tag values');
	});
}

function loadPage (pageName)
{
	if (!pageVars[pageName])
		return {
			pageVars: {
				pageName : {
					'content' : '',
					'created' : '',
					'modified' : '',
					'tags' : [],
					'title' : '',
					'transclusions' : []
				}
			},
			pageList: Object.keys(pageVars), 
			tagList: tagList,
			error: "no page"
		};
	
	let pageVarsPages = {};
	pageVarsPages[pageName] = pageVars[pageName];
	
	//	TODO: Any transcluded page should be linked and included
	if (pageVars[pageName].transclusions)
	{
		console.log(pageVars[pageName].transclusions);
		pageVars[pageName].transclusions.forEach(transcludedPage => {
			pageVarsPages[transcludedPage] = pageVars[transcludedPage];
		});
		console.log(pageVarsPages);
	}
	
	return {pageVars: pageVarsPages, pageList: Object.keys(pageVars), tagList: tagList};
}