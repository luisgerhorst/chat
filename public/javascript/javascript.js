/* Build 1 */

function keyHandler(event) {
	console.log("key handler called");
	if (event && event.keyCode == 13) createChat($('#path-input').val());
}

function randomChat() {

	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 4;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	
	createChat(randomstring);
	
}

function createChat(path) {
	
	path = path.replace(/\s/g, '');
	
	if (path) {
		
		window.open(path, '_self', false);
		
	}
	
	else {
		$('#path-input').attr('placeholder', 'Invalid name.');
	}
	
}