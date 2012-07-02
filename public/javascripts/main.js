window.addEventListener("load", ready);
 
function ready() {
  if(window.File && window.FileReader){ //These are the relevant HTML5 objects that we are going to use
    document.getElementById('upload-file-button').addEventListener('click', startUpload, false);
    document.getElementById('file-box').addEventListener('change', fileChosen, false);
  }
  else {
    document.getElementById('file-upload-area').innerHTML = "Your Browser Doesn't Support The File API. Please Update Your Browser";
  }
}

/**
 * Select file
 */
var selectedFile;
function fileChosen(event) {
  console.log('fileChosen');
  selectedFile = event.target.files[0];
  // Add name of chosen file to form.
  document.getElementById('name').value = selectedFile.name;
}

/**
 * Upload file
 */
var socket = io.connect('http://localhost:3000');
var fReader;
var name;
function startUpload() {
  if (document.getElementById('file-box').value != "") {
    // FileReader is HTML5 object.
    fReader = new FileReader();
    // Get name of the file.
    name = document.getElementById('name').value;
    // Create ui content for uploading process.
    var content = "<span id='name-area'>Uploading " + selectedFile.name + " as " + name + "</span>";
    content += '<div id="progress-container"><div id="progress-bar"></div></div><span id="percent">0%</span>';
    content += "<span id='uploaded'> - <span id='MB'>0</span>/" + Math.round(selectedFile.size / 1048576) + "MB</span>";
    document.getElementById('upload-area').innerHTML = content;
    
    // The onload event is automatically called each time FileReader complete a 
    // file read. See https://developer.mozilla.org/en/DOM/FileReader   
    fReader.onload = function(event) {
      socket.emit('upload', { 
        'name': name, 
        data: event.target.result 
      });
    };
    // Create socket start event.
    socket.emit('start', { 
      'name': name, 
      'size': selectedFile.size 
    });
  }
  else {
    // Notify user to select a file to upload.
    alert("Please Select A File");
  }
}

/**
 * Send file to server
 */
socket.on('moreData', function (data) {
  updateBar(data['percent']);
  // Starting position of next block.
  var place = data['place'] * 524288; 
  // Create variable to hold new block of data.
  var newFile; 
  // Get next "slice" of the file to send to the server.
  if (selectedFile.webkitSlice) {
    newFile = selectedFile.webkitSlice(place, place + Math.min(524288, (selectedFile.size - place)));
  }
  else {
    newFile = selectedFile.mozSlice(place, place + Math.min(524288, (selectedFile.size - place)));
  }
  // fReader.onload event is automatically called after fReader has completed the read method.
  fReader.readAsBinaryString(newFile);
});

function updateBar(percent){
  document.getElementById('progress-bar').style.width = percent + '%';
  document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
  var MBDone = Math.round(((percent/100.0) * selectedFile.size) / 1048576);
  document.getElementById('MB').innerHTML = MBDone;
}

/**
 * Upload complete
 */
socket.on('done', function(data) {
  // Display upload completed content.
  var content = '<h3>Upload complete</h3>';
  content += '<div><img src="http://localhost/' + data['image'] + '"/></div>';
  content += '<div><button type="button" id="upload-another-button">Upload another movie</button></div>';
  document.getElementById('upload-area').innerHTML = content;
  document.getElementById('upload-another-button').addEventListener('click', function() {
    // Reload page.
    location.reload(true);
  });
});