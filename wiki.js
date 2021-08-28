'use strict';

//	Page elements
var pageContent = document.querySelector("#wiki-page-view");
var pageEditPage = document.querySelector("#wiki-page-edit");
var pageEditName = pageEditPage.querySelector("h1");
var pageEditor = pageEditPage.querySelector("textarea");
var tagsEditor = pageEditPage.querySelector("#tags-list");

var wikiOptions = document.querySelector("#wiki-page-opts");
var homeLink = document.querySelector("#home-link");
var editLink = document.querySelector("#edit-link");
var searchBar = document.querySelector("#search-bar");
var searchSuggestions = document.querySelector("#search-suggestions");

//	fixed values
var defaultConfig = {
	'startupPage' : 'StartupPage'
};
var defaultPageVars = {
		'content' : '',
		'created' : '',
		'modified' : '',
		'tags' : [],
		'title' : ''
		};

//	Set at runtime
var config = {};
var pageVars = {
	'StartupPage' : {
		'content' : 'Test\n\nContent',
		'created' : 1,
		'modified' : 1,
		'tags' : ['default', 'startup', 'system'],
		'title' : ''}
};
var tagList = {};

var currentPage;
var currentTags = [];

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
		
		//	Load pages
		chrome.storage.local.get(['pageValues'], function(pageResult) {
			if (pageResult.pageValues)
				pageVars = pageResult.pageValues;
				
			//	Load tags
			chrome.storage.local.get(['tagList'], function(tagResult) {
				if (tagResult.tagList)
					tagList = tagResult.tagList;
				
				//	Load startup page
				if (location.hash)
					LoadPage(location.hash.substr(1));
				else
					LoadPage(config['startupPage']);
				});
			});
		
		homeLink.href = '#' + config['startupPage'];
		});
		
	//	Search bar functionality
	searchBar.addEventListener('input', function(e) {
		searchSuggestions.innerHTML = "";

		
		//	create and add a UL styled without dots
		let myUL = document.createElement('ul');
		searchSuggestions.appendChild(myUL);
		myUL.classList.add('search-bar');
		
		//	create and add a LI
		let myLI = document.createElement('li');
		myUL.appendChild(myLI);
		myLI.classList.add('search-bar');

			
		//	create and add an A linked to that
		let myLink = document.createElement('a');
		myLink.href = "#" + searchBar.value;
		myLink.innerText = searchBar.value;
		myLI.appendChild(myLink);
		myLink.classList.add('search-bar');
//		searchSuggestions.appendChild(myLink);
				
		//	Toss in a HR
		
		if (searchBar.value.length == 0)
			searchSuggestions.style.visibility = 'hidden';
		else
			searchSuggestions.style.visibility = 'visible';
		
		//	suggestions1 (starting with string)
		
		//	suggestions2 (including string somewhere other than the start)
		
		//	HR (if suggestions1 > 0)
		//	suggestions1
		
		//	HR (if suggestions2 > 0)
		//	suggestions2
	}, false);
	
	window.addEventListener('click', function(e) {
		if((e.target.classList.contains('search-bar'))&&(searchBar.value.length > 0))
			searchSuggestions.style.visibility = 'visible';
		else
			searchSuggestions.style.visibility = 'hidden';
	}, false);
}

function LoadPage(pageName)
{
	pageName = decodeURIComponent(pageName);
	
	searchBar.value = '';
	searchSuggestions.style.visibility = 'hidden';
	
	if (pageName == 'edit')
	{
		pageName = currentPage;
		
		//	Open the 'edit' pane
		pageContent.style.display = 'none';
		pageEditPage.style.display = 'block';
		
		//	Correct the URI
//		location.hash = pageName;
		
		return;
	}
	
	if (pageName == 'preview')
	{
		pageName = currentPage;
		
		//	re-parse the wiki page
		pageContent.innerHTML = "<h1>Previewing: " + pageName + " <a href='#save' class='material-icons' title='save'>save</a></h1>";
		pageContent.appendChild(TagsParse(currentTags));
		pageContent.appendChild(WikiParse(pageEditor.value));
		
		//	Open the 'view' pane
		pageContent.style.display = 'block';
		pageEditPage.style.display = 'none';
		
		//	Correct the URI
//		location.hash = pageName;
		
		return;
	}
		
	if (pageName == 'save')
	{
		pageName = currentPage;
		
		currentTags = tagsEditor.value.split(',');
		console.log(currentTags);
		
		//	process those tags
		let cleanedTags = [];
		
		for (let thisTag in currentTags)
		{
			console.log(thisTag);
			thisTag = currentTags[thisTag].trim();
			console.log(thisTag);
			
			cleanedTags.push(thisTag);
			
			if (!tagList[thisTag])
				tagList[thisTag] = [];
			
			if (!tagList[thisTag].includes(currentPage))
				tagList[thisTag].push(currentPage);
		}
		
		currentTags = cleanedTags;
		console.log(currentTags);
		
		if (!pageVars[pageName])
			pageVars[pageName] = Object.create(defaultPageVars);
		
		if (!pageVars[pageName]['created'])
			pageVars[pageName]['created'] = Date.now()
		
		if (!pageVars[pageName]['title'])
			pageVars[pageName]['title'] = pageName;
		
		//	save the page
		pageVars[pageName].content = pageEditor.value;
		pageVars[pageName].tags = currentTags;
		console.log(currentTags);
		pageVars[pageName]['modified'] = Date.now();
		
		//	add to the localStorage
		chrome.storage.local.set({'pageValues': pageVars}, function() {
			console.log('pageValues is set to wiki page values');
		});
		chrome.storage.local.set({'tagList': tagList}, function() {
			console.log('tagList is set to wiki tag values');
		});
		console.log(tagList);
		
		//	Open the 'view' pane
		location.hash = pageName;
		
		return;
	}
	
	if (pageName.substr(0,4) == 'tag:')
	{
		let tagName = pageName.substr(4);
		
		console.log('Loading tag: ' + tagName);
	
		//	Open the 'edit' pane
		pageContent.style.display = 'block';
		pageEditPage.style.display = 'none';
		
		pageContent.innerHTML = "<h1>Pages tagged with: " + tagName + "</h1>";
		
		let tagUL = document.createElement('ul');
		
		if(!tagList[tagName])
			tagList[tagName] = [];
		
		for (const thisPage of tagList[tagName])
		{
				//	Add it to the list
				let tagEntry = document.createElement('li');
//				tagEntry.classList.add('tag-list-entry');
				
				let tagLink = document.createElement('a');
				tagLink.innerText = thisPage;
				tagLink.href = "#" + thisPage;
				tagLink.classList.add('exist');
				tagEntry.appendChild(tagLink);
				
				tagUL.appendChild(tagEntry);
		}
		
		pageContent.appendChild(tagUL);
		
		return;
	}
	
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
	currentTags = FindOrPopulatePage(pageName).tags;
	
	//	set the content of 'wiki-page-view' to pageHTML
	pageContent.innerHTML = "<h1>" + pageName + "</h1>";
	pageContent.appendChild(TagsParse(currentTags));
	pageContent.appendChild(WikiParse(pageMkDn));
	
	//	set the content of 'wiki-page-edit' textarea to pageMkDn
	pageEditName.innerHTML = "Editing " + pageName;
	pageEditor.value = pageMkDn;
	tagsEditor.value = currentTags.join(",");
	
	//	Update the edit link
	editLink.href = '#edit/' + pageName;
}

function linkMakerOne(match, p1, offset, string) {
	var myClass = 'new';

	if (pageVars[p1])
		myClass = 'exist';
		
  return '<a href=\"#' + p1 + '\" class=\"' + myClass + '\">' + p1 + '</a>';
}

function linkMakerTwo(match, p1, p2, offset, string) {
	var myClass = 'new';

	if (pageVars[p2])
		myClass = 'exist';
		
  return '<a href=\"#' + p2 + '\" class=\"' + myClass + '\">' + p1 + '</a>';
}

function transcluder(match, p1, offset, string) {
	var myClass = 'new';

	if (pageVars[p1])
	{
		let fragment = WikiParse(pageVars[p1].content);
		let container = document.createElement('div');
		
		container.appendChild(fragment);
		return container.innerHTML;
	}
		
  return '&lt;Missing content: [[' + p1 + ']]&gt;';
}

function TagsParse(tagArray)
{
	let tagDiv = document.createElement('div');
	tagDiv.classList.add('tag-list-view');
	
	if (tagArray.length == 0)
		return tagDiv;
	
	for (const thisTag of tagArray)
	{
		//	Add it to the list
		let tagEntry = document.createElement('span');
		tagEntry.classList.add('tag-list-entry');
		
		let tagLink = document.createElement('a');
		tagLink.innerText = thisTag;
		tagLink.href = "#tag:" + thisTag;
		tagEntry.appendChild(tagLink);
		
		tagDiv.appendChild(tagEntry);
	}
	
	return tagDiv;
}

function WikiParse(rawMarkDown)
{
	//	bold
	rawMarkDown = rawMarkDown.replaceAll(/\'\'(.+?)\'\'/gs, '<strong>$1</strong>');
	
	//	italic
	rawMarkDown = rawMarkDown.replaceAll(/\/\/(.+?)\/\//gs, '<em>$1</em>');
	
	//	strike
	rawMarkDown = rawMarkDown.replaceAll(/~~(.+?)~~/gs, '<strike>$1</strike>');
	
	//	underline
	rawMarkDown = rawMarkDown.replaceAll(/__(.+?)__/gs, '<u>$1</u>');
	
	let lines = rawMarkDown.split('\n');
	
	let htmlOutput = document.createDocumentFragment();
	
	let currentTag = document.createDocumentFragment();
	
	lines.forEach(myLine => {
		
		//	wiki transclusion
		myLine = myLine.replaceAll(/\{\{([^\}]+?)\}\}/g, transcluder);
		
		//	wiki link 2 (target and text do match)
		myLine = myLine.replaceAll(/\[\[([^\]|]+?)\]\]/g, linkMakerOne);
		
		//	wiki link 1 (target and text do NOT match)
		myLine = myLine.replaceAll(/\[\[([^\]|]+?)\|([\w \']+?)\]\]/g, linkMakerTwo);
		
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
				
				let cellAlign = 'justify';
				
				if ((myCell.startsWith(" "))&&(myCell.endsWith(" ")))
					cellAlign = 'center';
				else if (myCell.endsWith("  "))
					cellAlign = 'left';
				else if (myCell.startsWith("  "))
					cellAlign = 'right';
				
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
					
					if (!colSpan)
						colSpan = 1;
					
					tempTag.lastElementChild.setAttribute('colspan', parseInt(colSpan) + 1);
				}
				else
				{
					tempCell.innerHTML = myCell;
					tempCell.align = cellAlign;
					
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
		else if (myLine[0] == "#")
		{
			if (currentTag.tagName != "OL")
			{
				htmlOutput.appendChild(currentTag);
				currentTag = document.createElement('ol');
			}
			
			let tempTag = document.createElement('li');
			tempTag.innerHTML = myLine.substr(1);
			currentTag.appendChild(tempTag);
		}
		else if (myLine == "---")
		{
			htmlOutput.appendChild(currentTag);
			currentTag = document.createElement('hr');
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
	currentPage = pageName;
	
	if (!pageVars[pageName])
		return Object.create(defaultPageVars);
	
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