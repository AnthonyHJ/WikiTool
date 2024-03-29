/*
 *	Wikitool
 *	A tool for saving a wiki to Local Storage
 *	https://github.com/AnthonyHJ/WikiTool
 */

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
var pageListOptions = document.querySelector("#page-list");

//	Set at runtime
var config = {};
var tagList = {};
var pageList;
var pageVars = {};

var currentPage;
var currentTags = [];

var template = document.querySelector('#wiki-page');

function Initialise()
{
	//	This is going to be a whole nested thing or a list of promises
	
	chrome.runtime.sendMessage({action: "startUp"}, function(response) {
		console.log(response);
		
		config = response.config;
		tagList = response.tagList;
		pageList = response.pageList;
		populateSearch(pageList)
		homeLink.href = '#' + config['startupPage'];
		
			//	Load startup page
			if (location.hash)
				LoadPage(location.hash.substr(1));
			else
				location.hash = "#" + config['startupPage'];
	});
		
	//	Search bar functionality
	searchBar.addEventListener('change', function(e) {
		console.log(searchBar.value);
		location.hash = "#" + searchBar.value;
	}, false);
}

function LoadPage(pageName)
{
	pageName = decodeURIComponent(pageName);
	
	searchBar.value = '';
	
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
		//	TODO: tags change...
		//	currentTags was the old list of tags
		//	id = tagList[lostTag].indexOf(pageName)
		//	tagList[lostTag].splice(id, 1)
		//		where 'lostTag' is the removed tag
		//	iterate through the old tags to find lost tags?
		
		currentTags = tagsEditor.value.split(',');
		
		//	process those tags
		let cleanedTags = [];
		
		for (let thisTag in currentTags)
		{
			thisTag = currentTags[thisTag].trim();
			
			cleanedTags.push(thisTag);
			
			if (!tagList[thisTag])
				tagList[thisTag] = [];
			
			if (!tagList[thisTag].includes(currentPage))
				tagList[thisTag].push(currentPage);
		}
		
		currentTags = cleanedTags;
		
		if (!pageVars[pageName])
			pageVars[pageName] = {
				'content' : '',
				'created' : '',
				'modified' : '',
				'tags' : [],
				'title' : ''
			};
		
		if (!pageVars[pageName]['created'])
			pageVars[pageName]['created'] = Date.now()
		
		//	save the page
		pageVars[pageName].content = pageEditor.value;
		pageVars[pageName].tags = currentTags;
		pageVars[pageName]['modified'] = Date.now();
		pageVars[pageName]['title'] = pageName;
		
		//	send these things to the background page
		chrome.runtime.sendMessage({updatePage: pageVars[pageName]}, function(response) {
			
		});
		
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
		
		tagList[tagName].sort();
		
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
	
	pageName = pageName[0].toUpperCase() + pageName.slice(1).toLowerCase();
	
	if ((!pageList.includes(pageName))&&(pageName.substr(0,5) != 'edit/'))
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
	
	FindOrPopulatePage(pageName);
	
	//	Update the edit link
	editLink.href = '#edit/' + pageName;
}

function linkMakerOne(match, p1, offset, string) {
	var myClass = 'new';

	if (pageList.includes(p1))
		myClass = 'exist';
		
  return '<a href=\"#' + p1 + '\" class=\"' + myClass + '\">' + p1 + '</a>';
}

function linkMakerTwo(match, p1, p2, offset, string) {
	var myClass = 'new';

	if (pageList.includes(p2))
		myClass = 'exist';
		
  return '<a href=\"#' + p2 + '\" class=\"' + myClass + '\">' + p1 + '</a>';
}

function transcluder(match, p1, offset, string) {
	var myClass = 'new';

	if (pageList.includes(p1))
	{
		console.log("Transcluded page: " + p1);
		
		let fragment;
		
		if (pageVars[p1])
			fragment = WikiParse(pageVars[p1].content);
		else 
		{
			if (!pageVars[currentPage].transclusions)
				pageVars[currentPage].transclusions = [];
			
			pageVars[currentPage].transclusions.push(p1)
			 
			return '&lt;Failed to load content: [[' + p1 + ']]&gt;';
		}
		
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
		myLine = myLine.replaceAll(/\[\[([^\]|]+?)\|([^\]]+?)\]\]/g, linkMakerTwo);
		
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
	pageVars = {};
	
	currentPage = pageName;
	
	chrome.runtime.sendMessage({pageRequest: pageName}, function(response) {
		if (response.error)
			console.log ("FindOrPopulatePage error: " + response.error);
		
		console.log(response);
		
		//	{pageVars: pageVars[pageRequest], pageList: Object.keys(pageVars), tagList: tagList}
		
		pageVars = response.pageVars;
		
		let pageMkDn = pageVars[pageName].content;
		currentTags = pageVars[pageName].tags;
		
		//	set the content of 'wiki-page-view' to pageHTML
		pageContent.innerHTML = "<h1>" + pageName + "</h1>";
		pageContent.appendChild(TagsParse(currentTags));
		pageContent.appendChild(WikiParse(pageMkDn));
		
		//	set the content of 'wiki-page-edit' textarea to pageMkDn
		pageEditName.innerHTML = "Editing " + pageName;
		pageEditor.value = pageMkDn;
		tagsEditor.value = currentTags.join(",");
		
		config = response.config;
		tagList = response.tagList;
		pageList = response.pageList;
		populateSearch(pageList);
	});
}

function populateSearch(pageArray)
{
	pageArray.sort();	
	pageListOptions.innerHTML = "";
	
	pageArray.forEach((pageOption) => {
		let pageOptionTag = document.createElement('option');
		pageOptionTag.value = pageOption;
		pageListOptions.appendChild(pageOptionTag);
	});
}

window.addEventListener('hashchange', function() {
	LoadPage(location.hash.substr(1));
}, false);

Initialise();