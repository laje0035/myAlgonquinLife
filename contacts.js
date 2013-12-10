//	GLOBAL VARIABLES
var firstName;
var lastName;
var homeTel;
var mobileTel;
var homeEmail;
var schoolEmail;
var filepath;
var initials;
var description;
var contactID;
var db;
var selectedId;
var myContacts = [];
var currentDetailsArray = {};
var serviceID;
campusServices=[];

//	TOGGLE BACK AND FORTH BETWEEN CONTACT LIST DIV
//	AND ADD A CONTACT DIV
function showTab(id) {
	if (id == 'addContactDiv') {
		//	SOHW THE ADD A CONTACT DIV
		document.getElementById('addContactDiv').style.display = 'block';
		document.getElementById('listContactDiv').style.display = 'none';
	}else if (id == 'listContactDiv') {
		//	SHOW THE LIST OF CONTACTS DIV
		document.getElementById('listContactDiv').style.display = 'block';
		document.getElementById('addContactDiv').style.display = 'none';
	}
}

//	CREATE THE TABLE ONCE APP OPENS
function createDB() {
	db = dbNamespace.db;
	db.transaction(function(tx) {
		tx.executeSql(
			"CREATE TABLE IF NOT EXISTS contact (contact_id INTEGER PRIMARY KEY, meet_des VARCHAR, imagePath text)",
			[],
			function(trans, result) {
				//	HANDLE THE SUCCESS
			},
			function(trans, error) {
				//	HANDLE THE ERROR
				alert("Sorry cannot connect to the database. " + error);
			}
		)
	});
}

//	CONTACT VALIDATION ONCE CONTACT IS CREATED/SUBMITED
function createContact() {
	//	GRAB ALL INPUTS BY ID'S
	firstName = document.getElementById('firstName').value;
	lastName = document.getElementById('lastName').value;
	homeTel = document.getElementById('homeNum').value; 
	mobileTel = document.getElementById('mobileNum').value;
	homeEmail = document.getElementById('homeEmail').value;
	schoolEmail = document.getElementById('schoolEmail').value;
	description = document.getElementById('meetDes').value;

	//	VALIDATE INPUTS TO ASSURE
	//	ALL REQUIRED FIELDS ARE PROPERLY SUBMITED
	if(firstName.length != 0) {
		if(lastName.length != 0) {
			if(homeTel.length || mobileTel.length != 0) {
				if(homeEmail.length || schoolEmail.length != 0) {
					if(description.length != 0) {
						//	ONCE VALIDATION IS DONE WE FILL OUT THE 
						//	OBJECT THAT PIM REQUIRES
						var contacts = blackberry.pim.contacts,
						ContactField = contacts.ContactField,
						name = {},
						homePhone = { type: ContactField.HOME, value: homeTel }, 
						mobilePhone = { type: ContactField.MOBILE, value: mobileTel },
						hmEmail = { type: ContactField.HOME, value: homeEmail },
						schEmail = { type: ContactField.WORK, value: schoolEmail },
						contact;

						name.familyName = lastName;
						name.givenName = firstName;
						contact = contacts.create({
							"name": name,
							"phoneNumbers": [homePhone, mobilePhone],
							"emails": [hmEmail, schEmail]
						});
						//	ONCE THE OBJECT HAS BEEN FILLED OUT
						//	WE PUSH THE OBJECT TO THE BB PIM
						//	TO SAVE OUR CONTACT TO THE PIM
						contact.save(onSaveSuccess, onSaveError);
					}else{
						alert("Please fill out a description how you met " + firstName + ".");
					}
				}else{
					alert("Please enter a email address.");
				}
			}else{
				alert("Please enter a phone number.");
			}
		}else{
			alert("Please enter a last name.");
		}
	}else{
		alert("Please enter a first name.");
	}
}

//	WHEN THE CONTACT IS SUCCESSFULY SAVED
//	TO THE PIM
function onSaveSuccess(contact) {
	//	ONCE THE CANTACT IS SAVED TO THE PIM 
	//	WE ARE RETURNED A UNIQUE ID
	//	FOR OUR APP WE WILL SAVE THIS ID
	//	ALONG WITH THE DESC TO OUR DB
	contactID = contact.id;
	db.transaction(function(tx) {
		tx.executeSql(
			"INSERT INTO contact (contact_id, meet_des) VALUES(?,?)", 
			[contactID, description],
			function(trans, result){
				//	HANDLE THE SUCCESS
				showOurList();
			},
			function(trans, error) {
				//	HANDLE THE ERROR
			}
		)
	});
}

//	IF THE PIM REJECTS OUR ENTRY
//	WHEN SAVING OUR CONTACT
//	WE WILL BE NOTIFY HERE
function onSaveError(error) {
	//	HANDLE THE ERROR
	alert("Error saving contact to database: " + error.message);
}

//	AFTER CREATING A NEW CONTACT
//	WE SAVE THE INFO TO THE DB
//	THEN WE NEED TO GRAB ALL OUR ENTRIES
//	IN THE DB TO DISPLAY ALL OF OUR CONTACTS
function showOurList(){
	db.transaction(function(tx) {
		tx.executeSql(
			"SELECT contact_id, meet_des, imagePath FROM contact",
			[],
			function(tx, result) {
				//	AFTER SELECTING THE INFO FROM OUR DB
				//	WE ARE UNSURE HOW MANY OR IF ANY
				//	CONTACTS ARE SAVED IN THE DB
				//	WE WILL INSERT THE DB RESULT IN A VAR
				var contactResult = result;
				var idInt;
				var desc;
				var imgPath;
				fasterArray = [];
				//	WE WILL CHECK TO SEE IF THERE WAS IN FACT 
				//	ANY USERS
				if(contactResult.rows){
					//	THERE WERE USERS THEREFORE WE WILL NOW LOOP 
					//	THROUGH EACH USER ONE BY ONE
					for(var i=0; i < contactResult.rows.length; i++){
						//	FIRST WE WILL STORE THE ID IN THIS VAR
						idInt = contactResult.rows.item(i).contact_id;
						//	NOW WE STORE THE DESC
						desc = contactResult.rows.item(i).meet_des;
						imgPath = contactResult.rows.item(i).imagePath;
						//	NOW THAT WE HAVE THE ID WE CAN CHECK THE PIM 
						//	TO SEE IF THE CONTACT STILL EXIST IN OUR CONTACT PIM APP
						grabContPIM(String(idInt), desc, imgPath);//	FOR SOME REASON TO CHECK THE BB PIM CONTACT BY ID, THE ID NEEDS TO BE A STRING!
					}
				//	ONCE WE ARE DON LOOPING AND SAVING EACH CONTACT
				//	IN AN ARRAY OF OBJECTS WE NEED TO CREATE THE HTML
				//	AND DISPLAY OUR CONTACT LIST
				createContactList();
				}
			},
			function(tx) {
				//	HANDLE THE ERROR
			}
		)
	});
}

//	WHILE STILL BEING IN THE LOOP
//	WE WILL CHECK TO SEE IF THE ID'S MATCH
function grabContPIM(id, desc, imgPath){
	//	GRAB THE CONTACTS FROM PIM
	var contacts = blackberry.pim.contacts;
	//	GRAB CONTACT WITH ID AND SAVE TO CONTACT
   	var contact = contacts.getContact(id);
   	//	IF CONTACT WITH ID MATCH GRAB ALL THE INFO
   	//	ELSE DELETE THE ID AND DESC FROM DB
    if (contact){
    	//	CLEAR OUR OBJECT SO WE DONT DUPLICATE
       	currentDetailsArray = {};
       	//	SAVE THE NAME, DESC, ID, INITIALS
       	//	AND PACKAGE IT ALL UP
       	currentDetailsArray.firstName = contact.name.givenName;
       	currentDetailsArray.lastName = contact.name.familyName;
		currentDetailsArray.howWeMet = desc;
		currentDetailsArray.Id = id;
		currentDetailsArray.imgFilePath = imgPath;
       	currentDetailsArray.initials = currentDetailsArray.lastName + ", " + currentDetailsArray.firstName.charAt(0).toUpperCase();
       	//	IF CONTACT HAS AN EMAIL SAVED WE NEED 
       	//	TO DETERMINE IF ITS A SCHOOL EMAIL
       	//	OR HOME EMAIL OR POSSIBLY BOTH
       	if(contact.emails){
       		//	LOOP THROUGH THE EMAILS
       		for(k=0; k<contact.emails.length; k++){
       			switch (contact.emails[k].type){
       				//	IF THE EMAIL WITH TYPE HOME IS SAVED
       				//	IN PIM WE WANT TO SAVE IT IN THE OBJECT AS
       				//	HOME EMAIL, SAME THING WITH TYPE WORK
       				case 'home':
       				currentDetailsArray.homeEmail = contact.emails[k].value;
       				break;
       				case 'work':
					currentDetailsArray.workEmail = contact.emails[k].value;
					break;
       			}
       		}
       	}
       	//	WE ALSO NEED TO FIGURE OUT OUR PHONE NUMBERS
       	//	SAME AS EMAILS
       	if(contact.phoneNumbers){
       		for(l=0; l<contact.phoneNumbers.length; l++){
       			switch (contact.phoneNumbers[l].type){
       				case "home":
       				currentDetailsArray.homePhone = contact.phoneNumbers[l].value;
       				break;
       				case "mobile":
       				currentDetailsArray.workPhone = contact.phoneNumbers[l].value;
       			}
       		}
       	}
       	fasterArray.push(currentDetailsArray);
    }else{
      	//	IF THE DB ID WAS NOT FOUND IN PIM WE DELETE THE ENTRY FROM OUR DB
      	db.transaction(function(tx) {
      		tx.executeSql(
      			"DELETE from contact WHERE contact_id = ?",
      			[id],
      			function(){
      				//	HANDLE THE SUCCESS
      			},
      			function(){
      				//	HANDLE THE ERROR
      			}
      		)
      	});
    }
}

function createContactList() {
	var getDivListHolder = document.getElementById("listContactDiv");
	var items = [];
	//	LOOP THROUGH EACH OBJECT IN THE ARRAY
	for(var j = 0; j < fasterArray.length; j++) {
		var itemL = document.createElement("div");
		itemL.setAttribute("data-bb-type","item");
		itemL.setAttribute("style", "color: #fff");
		itemL.setAttribute("id", fasterArray[j].Id);
		itemL.setAttribute("data-bb-title", fasterArray[j].initials);
		itemL.setAttribute("onclick", "contactDetails(" + fasterArray[j].Id + ")");
		if(fasterArray[j].imgFilePath){
			itemL.setAttribute("data-bb-img", fasterArray[j].imgFilePath);
		}else{
			itemL.setAttribute("data-bb-img", "images/icons/face.png");
		}
		items.push(itemL);
	}
	getDivListHolder.refresh(items);
	showTab('listContactDiv');
}

function buildContactDetails(){
	if(fasterArray.length>0){
		var items=[];
		for(var j = 0; j < fasterArray.length; j++) {
			if(fasterArray[j].Id == selectedId){
				document.getElementById('nameHeader').setCaption(fasterArray[j].firstName + " " + fasterArray[j].lastName);
				if(fasterArray[j].homePhone || fasterArray[j].homeEmail){
					var item;
					item=document.createElement('div');
					item.setAttribute('data-bb-type', 'header');
					item.innerHTML='Home';
					item.setAttribute('style', 'color: #fff;');
					items.push(item);

					if(fasterArray[j].homePhone){
						item=document.createElement('div');
						item.setAttribute('data-bb-type', 'item');
						item.setAttribute('data-bb-title', fasterArray[j].homePhone);
						item.setAttribute('data-bb-img', 'images/icons/phone.png');
						item.setAttribute('style', 'color: #fff;');
						items.push(item);
					}
					if(fasterArray[j].homeEmail){
						item=document.createElement('div');
						item.setAttribute('data-bb-type', 'item');
						item.setAttribute('data-bb-title', fasterArray[j].homeEmail);
						item.setAttribute('data-bb-img', 'images/icons/email.png');
						item.setAttribute('style', 'color: #fff;');
						items.push(item);
					}
				}

				if(fasterArray[j].imgFilePath){
					document.getElementById("testimage").src = fasterArray[j].imgFilePath;
				}else{
					document.getElementById("testimage").src = "images/icons/face.png";
				}

				if(fasterArray[j].workPhone){
					var item;
					item=document.createElement('div');
					item.setAttribute('data-bb-type', 'header');
					item.innerHTML='Mobile';
					item.setAttribute('style', 'color: #fff;');
					items.push(item);

					item=document.createElement('div');
					item.setAttribute('data-bb-type', 'item');
					item.setAttribute('data-bb-title', fasterArray[j].workPhone);
					item.setAttribute('data-bb-img', 'images/icons/phone.png');
					item.setAttribute('style', 'color: #fff;');
					items.push(item);
				}

				if(fasterArray[j].workEmail){
					var item;
					item=document.createElement('div');
					item.setAttribute('data-bb-type', 'header');
					item.innerHTML='School';
					item.setAttribute('style', 'color: #fff;');
					items.push(item);
					item=document.createElement('div');
					item.setAttribute('data-bb-type', 'item');
					item.setAttribute('data-bb-title', fasterArray[j].workEmail);
					item.setAttribute('data-bb-img', 'images/icons/email.png');
					item.setAttribute('style', 'color: #fff;');
					items.push(item);
				}
				var item;
				item=document.createElement('div');
				item.setAttribute('data-bb-type', 'header');
				item.innerHTML='How I Met ' + fasterArray[j].firstName;
				item.setAttribute('style', 'color: #fff;');
				items.push(item);
				document.getElementById('desC').innerHTML=fasterArray[j].howWeMet;
			}
		}
		document.getElementById('detailsPart').refresh(items);
	}
}

function contactDetails(id){
	selectedId = id;
	bb.pushScreen('contactInfo.htm', 'contactInfo');
}



/**************
*
* camera card
*
***************/

function invokeCameraCard(){
	var mode = blackberry.invoke.card.CAMERA_MODE_PHOTO;
	blackberry.invoke.card.invokeCamera(mode, function (path) {
		alert("saved "+ path);
		filepath = 'file://' + path;
		db.transaction(function(tx) {
			tx.executeSql(
				"UPDATE contact SET imagePath = ? WHERE contact_id = ?",
				[filepath, selectedId],
				function(tx, result) {
					alert("working");
					document.getElementById("testimage").src = filepath;
				},
				function(tx, result) {

				}
			)
		});
	},
	function (reason) {
		alert("cancelled " + reason);
	},
	function (error) {
		if (error) {
			alert("invoke error "+ error);
		} else {
			console.log("invoke success " );
		}
	});
}

function getJsonServices() {
	$.getJSON("servicesData.json", function(data) {
		campusServices = data.Services;
		listItems=[]
		var item;
		for(i=0;i<campusServices.length;i++){
			item=document.createElement('div');
			item.setAttribute('data-bb-type', 'item');
			item.setAttribute('data-bb-title', campusServices[i].service );
			item.innerHTML = campusServices[i].desc;
			item.setAttribute('onclick', 'showServicePage(' + i + ')');
			item.setAttribute('style', 'color: #fff; margin-left:-100px;');
			listItems.push(item);
		}
		document.getElementById("servicesList").refresh(listItems);
	});
}


function showServicePage(id) {
	serviceID = id;
	bb.pushScreen("serviceDetails.htm", "serviceDetails");
}

function showServiceDetails() {
listItems=[]
	var item;
	for(i=0;i<campusServices[serviceID].items.length;i++){
		item=document.createElement('div');
		item.setAttribute('data-bb-type', 'item');
		item.setAttribute('data-bb-title', campusServices[serviceID].items[i].name );
		item.innerHTML = campusServices[serviceID].items[i].location;
		item.setAttribute('style', 'color: #fff; margin-left:-100px;');
		listItems.push(item);
	}
	document.getElementById("servicesItems").refresh(listItems);
}