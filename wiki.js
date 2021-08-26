'use strict';

//	Page elements
var pageContent = document.querySelector("#wiki-page-view");
var pageEditPage = document.querySelector("#wiki-page-edit");
var pageEditName = pageEditPage.querySelector("h1");
var pageEditor = pageEditPage.querySelector("textarea");

var wikiOptions = document.querySelector("#wiki-page-opts");
var homeLink = document.querySelector("#home-link");
var editLink = document.querySelector("#edit-link");

//	fixed values
var defaultConfig = {
	'startupPage' : 'StartupPage'
};
var defaultPageVars = {
		'content' : '',
		'tags' : []
		};

//	Set at runtime
var config = {};
var pageVars = {
	'StartupPage' : {
		'content' : 'Test\n\nContent',
		'tags' : ['default', 'startup', 'system']
	}
};
var tagList = {};

var template = document.querySelector('#wiki-page');

function Initialise()
{
	//	This is going to be a whole nested thing or a list of promises
	
	//	Load configuration values
	chrome.storage.local.get(['config'], function(result) {
		if (!result.config)
			config = defaultConfig;
		else
			config = result.config;
		
//		console.log(result);
//		console.log(config);
//		console.log(config['startupPage']);
		
		//	Load startup page
		if (location.hash)
			LoadPage(location.hash.substr(1));
		else
			LoadPage(config['startupPage']);
		
		homeLink.href = '#' + config['startupPage'];
		});
}

function LoadPage(pageName)
{
	pageName = decodeURIComponent(pageName);
	
	if (location.hash.substr(1) != pageName)
		location.hash = pageName;
	
	if ((!pageVars[pageName])&&(pageName.substr(0,5) != 'edit/'))
		pageName = 'edit/' + pageName;
	
	if (pageName.substr(0,5) == 'edit/')
	{
		pageName = pageName.substr(5);
		
		console.log('Loading page in \'edit\' mode: ' + pageName);
	
		//	Open the 'edit' pane
		pageContent.style.display = 'none';
		pageEditPage.style.display = 'block';
	}
	else
	{
		console.log('Loading page in \'view\' mode: ' + pageName);
	
		//	Open the 'view' pane
		pageContent.style.display = 'block';
		pageEditPage.style.display = 'none';
	}
	
	let pageMkDn = FindOrPopulatePage(pageName).content;
	
	//	set the content of 'wiki-page-view' to pageHTML
	pageContent.innerHTML = "<h1>" + pageName + "</h1>";
	pageContent.appendChild(WikiParse(pageMkDn));
//	console.log(pageHTML);
	
	//	set the content of 'wiki-page-edit' textarea to pageMkDn
	pageEditName.innerHTML = "Editing " + pageName;
	pageEditor.innerHTML = pageMkDn;
	console.log(pageMkDn);
	
	//	TODO: Update the edit link
	editLink.href = '#edit/' + pageName;
}

function WikiParse(rawMarkDown)
{
	let lines = rawMarkDown.split('\n');
	
	let htmlOutput = document.createDocumentFragment();
	
	let currentTag = document.createDocumentFragment();
	
	lines.forEach(myLine => {
		
		//	bold
		myLine = myLine.replaceAll(/\'\'(.+?)\'\'/g, '<strong>$1</strong>');
		
		//	italic
		myLine = myLine.replaceAll(/\/\/(.+?)\/\//g, '<em>$1</em>');
		
		//	strike
		myLine = myLine.replaceAll(/~~(.+?)~~/g, '<strike>$1</strike>');
		
		//	underline
		myLine = myLine.replaceAll(/__(.+?)__/g, '<u>$1</u>');
		
		//	wiki link 2 (target and text do match)
		myLine = myLine.replaceAll(/\[\[([\w ]+?)\]\]/g, '<a href=\'#$1\'>$1</a>');
		
		//	wiki link 1 (target and text do NOT match)
		myLine = myLine.replaceAll(/\[\[([\w ]+?)\|([\w ]+?)\]\]/g, '<a href=\'#$2\'>$1</a>');
		
		//	external link?
		
		myLine = myLine.trim();
		if (myLine[0] == "!")
		{
			//	This will always be a new tag
			htmlOutput.appendChild(currentTag);
			
			//	Get the number of '!' symbols
			if (myLine.substr(0,3) == '!!!')
			{
				currentTag = document.createElement('h4');
				currentTag.innerHTML = myLine.substr(3);
			}
			else if (myLine.substr(0,2) == '!!')
			{
				currentTag = document.createElement('h3');
				currentTag.innerHTML = myLine.substr(2);
			}
			else
			{
				currentTag = document.createElement('h2');
				currentTag.innerHTML = myLine.substr(1);
			}
		}
		else if (myLine[0] == "|")
		{
			if (currentTag.tagName != "TABLE")
			{
				htmlOutput.appendChild(currentTag);
				currentTag = document.createElement('table');
			}
			
			let tempTag = document.createElement('tr');
			
			myLine.substr(1, myLine.length-2).split('|').forEach(myCell => {
				myCell = myCell.trim();
				
				let tempCell = document.createElement('td');
				
				if (myCell[0] == "!")
				{
					tempCell = document.createElement('th');
					myCell = myCell.substr(1);
				}
				
				if (myCell == "<")
				{
					let colSpan = tempTag.lastElementChild.getAttribute('colspan');
					console.log(colSpan);
					
					if (!colSpan)
						colSpan = 1;
					
					tempTag.lastElementChild.setAttribute('colspan', parseInt(colSpan) + 1);
					
					console.log(tempTag.lastElementChild.getAttribute('colspan'));
				}
				else
				{
					tempCell.innerHTML = myCell;
					
					tempTag.appendChild(tempCell);
				}
			});
			
			currentTag.appendChild(tempTag);
		}
		else if (myLine[0] == "*")
		{
			if (currentTag.tagName != "UL")
			{
				htmlOutput.appendChild(currentTag);
				currentTag = document.createElement('ul');
			}
			
			let tempTag = document.createElement('li');
			tempTag.innerHTML = myLine.substr(1);
			currentTag.appendChild(tempTag);
		}
		else if (myLine == "")
		{
			htmlOutput.appendChild(currentTag);
			currentTag = document.createDocumentFragment();
		}
		else
		{
			if (currentTag.tagName != "P")
			{
				htmlOutput.appendChild(currentTag);
				currentTag = document.createElement('p');
			}
			
			currentTag.innerHTML += myLine + '\n';
		}
	});
	
	htmlOutput.appendChild(currentTag);
	
	return htmlOutput;
}

function FindOrPopulatePage(pageName)
{
	if (!pageVars[pageName])
		pageVars[pageName] = defaultPageVars;
	
	return pageVars[pageName];
}

function SaveConfig()
{
	chrome.storage.local.set({config: value}, function() {
	  console.log('Value is set to ' + value);
	});
}

function SaveAll()
{
	SaveConfig();
}

window.addEventListener('hashchange', function() {
	LoadPage(location.hash.substr(1));
}, false);

Initialise();