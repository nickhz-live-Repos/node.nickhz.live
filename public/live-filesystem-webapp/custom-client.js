const liveFileSystem = document.getElementById('live-file-system');

const createItemMethods = {
	'write-file': (inputParent) => {
		inputParent.innerHTML = '';

		const fileNameInput = document.createElement('input');
		fileNameInput.type = 'text';
		fileNameInput.className = 'item-name';
		fileNameInput.placeholder = 'Enter filename here';
		fileNameInput.name = 'item-name';
		inputParent.appendChild(fileNameInput);

		inputParent.appendChild(document.createElement('br'));

		const fileContentInput = document.createElement('textarea');
		fileContentInput.className = 'item-content';
		fileContentInput.placeholder = 'Enter the contents of the file here';
		fileContentInput.name = 'item-content';
		inputParent.appendChild(fileContentInput);
	},
	'upload-file': (inputParent) => {
		inputParent.innerHTML = '';

		const fileContentInput = document.createElement('input');
		fileContentInput.type = 'file';
		fileContentInput.className = 'item-content';
		fileContentInput.placeholder = 'Enter filename here';
		fileContentInput.name = 'item-content';
		inputParent.appendChild(fileContentInput);
	},
	'create-folder': (inputParent) => {
		inputParent.innerHTML = '';

		const fileNameInput = document.createElement('input');
		fileNameInput.type = 'text';
		fileNameInput.className = 'item-name';
		fileNameInput.placeholder = 'Enter folder name here';
		fileNameInput.name = 'item-name';
		inputParent.appendChild(fileNameInput);
	}
}

const setupCreateItemSelector = (selector, inputParent) => {
	selector.addEventListener('change', event => {
		createItemMethods[event.target.value](inputParent);
	});

	createItemMethods['write-file'](inputParent);
};

const createItem = event => {
	event.preventDefault();

	const form = event.target;
	let requestBody;

	let itemName = form.getElementsByClassName('item-name')[0]?.value;
	const createItemType = form.getElementsByTagName('select')[0].value;

	if(!itemName && createItemType !== 'upload-file') {
		alert('Please enter a file or folder name.');
		return;
	}

	switch(createItemType) {
		case 'write-file':
			requestBody = form.getElementsByClassName('item-content')[0].value;
			break;
		case 'upload-file':
			requestBody = form.getElementsByClassName('item-content')[0].files[0];
			if(!requestBody) {
				alert('Please choose a file to upload.');
				return;
			}
			itemName = requestBody.name;
			break;
		default:
			break;
	}

	createItemMethods[createItemType](form.getElementsByClassName('create-item-input')[0]);

	(async () => {
		const options = Object.create(null);

		options.method = 'PUT';
		options.headers = { 
			'create-item-type': createItemType,
			'item-name': itemName
		};

		if(requestBody) {
			options.body = requestBody;
		}

		const response = await fetch(
			new URL(form.action).pathname, 
			options
		);

		form.getElementsByClassName('file-creation-message')[0].innerText = await response.text();
		loadFiles();
	})();
};

let fileCreationForms = document.getElementsByClassName('file-creation-form');
let formMap = new Map();
const refreshFileCreationForms = () => {
	for(const form of fileCreationForms) {
		if(formMap.has(form)) {
			continue;
		}

		const selector = form.getElementsByTagName('select')[0];
		const inputParent = form.getElementsByClassName('create-item-input')[0];

		setupCreateItemSelector(selector, inputParent);
		formMap.set(form);
	}
}

let openStates = new Map();
const createFileCreationForm = (action) => {
	const result = document.createElement('form');
	result.className = 'file-creation-form';
	result.method = 'PUT';
	result.addEventListener('submit', createItem);
	result.action = action;

	const formPanel = document.createElement('details');

	if(openStates.has(action)) {
		formPanel.open = true;
	}

	const metadata = document.createElement('div');
	metadata.className = 'metadata';
	metadata.innerText = action;
	formPanel.appendChild(metadata);

	const formLabel = document.createElement('summary');
	formLabel.innerText = `Create a new file or folder within the ${action ? `"${action}"` : 'base'} directory`;
	formPanel.appendChild(formLabel);

	const fileCreateTypeSelector = document.createElement('select');
	fileCreateTypeSelector.name = 'create-type';

	const fileCreateTypeOptions = Array.from({length: 3}, item => document.createElement('option'));
	fileCreateTypeOptions[0].value = 'write-file';
	fileCreateTypeOptions[0].innerText = 'Write a new file';
	fileCreateTypeOptions[1].value = 'upload-file';
	fileCreateTypeOptions[1].innerText = 'Upload a file';
	fileCreateTypeOptions[2].value = 'create-folder';
	fileCreateTypeOptions[2].innerText = 'Create a folder';

	for(const option of fileCreateTypeOptions) {
		fileCreateTypeSelector.appendChild(option);
	}
	formPanel.appendChild(fileCreateTypeSelector);

	formPanel.appendChild(document.createElement('br'));
	formPanel.appendChild(document.createElement('br'));

	const itemInput = document.createElement('div');
	itemInput.className = 'create-item-input';
	formPanel.appendChild(itemInput);

	formPanel.appendChild(document.createElement('br'));

	const submitButton = document.createElement('button');
	submitButton.type = 'submit';
	submitButton.innerText = 'Create the requested item';
	formPanel.appendChild(submitButton);

	formPanel.appendChild(document.createElement('br'));

	const message = document.createElement('div');
	message.className = 'file-creation-message';
	formPanel.appendChild(message);

	result.appendChild(formPanel);

	return result;
};

const recordOpenStates = () => {
	openStates = new Map();

	// the file creation form within the current element
	const metadata = Array.from(document.querySelectorAll('#live-file-system details'))
		.filter(detail => detail.open === true)
		.map(detail => detail.querySelector('.metadata').innerText)
	;

	for(const datum of metadata) {
		openStates.set(datum);
	}
};

const makeDeleteButton = (action) => {
	const deleteButton = document.createElement('button');
	deleteButton.className = 'delete-button';
	deleteButton.innerText = 'Delete';
	deleteButton.addEventListener('click', async () => {
		const response = await fetch(new URL(action).pathname, {method: 'DELETE'});

		loadFiles();
	});

	return deleteButton;
}

const loadFiles = async () => {
	const managedFiles = await (await fetch('/?action=getfiles')).json();

	const populateFolder = (element, items, parentPath) => {
		const list = document.createElement('ul');
		for(const item in items) {
			const listItem = document.createElement('li');
			list.appendChild(listItem);

			const link = document.createElement('a');
			link.href = parentPath + item;
			link.innerText = item;

			const deleteButton = makeDeleteButton(link.href);

			if(items[item] === null) {
				listItem.appendChild(link);

				listItem.appendChild(deleteButton);
			} else {
				const folderPanel = document.createElement('details');
				folderPanel.className = 'subfolder';
				listItem.appendChild(folderPanel);

				const datum = parentPath + item;
				if(openStates.has(datum)) {
					folderPanel.open = true;
				}

				const metadata = document.createElement('div');
				metadata.className = 'metadata';
				metadata.innerText = datum;
				folderPanel.appendChild(metadata);

				const folderLabel = document.createElement('summary');
				folderLabel.innerText = item;
				folderPanel.appendChild(folderLabel);

				folderLabel.appendChild(deleteButton);

				const folderContents = document.createElement('div');
				folderPanel.appendChild(folderContents);

				populateFolder(folderContents, items[item], parentPath + item + '/');
			}
		}
		element.appendChild(list);
		element.appendChild(createFileCreationForm(parentPath.slice(1)));
	};

	recordOpenStates();
	liveFileSystem.innerHTML = '';
	populateFolder(liveFileSystem, managedFiles, '/');
	refreshFileCreationForms();
};

addEventListener('load', loadFiles);
