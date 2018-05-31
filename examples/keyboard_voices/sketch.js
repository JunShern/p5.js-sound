var keyMap = {};
var instNames;

var polySynth, sfSynth;
var baseNote = 60;
var key2keycode = {
  "0":"48","1":"49","2":"50","3":"51","4":"52","5":"53","6":"54","7":"55","8":"56",
  "9":"57","A":"65","B":"66","C":"67","D":"68","E":"69","F":"70","G":"71","H":"72",
  "I":"73","J":"74","K":"75","L":"76","M":"77","N":"78","O":"79","P":"80","Q":"81",
  "R":"82","S":"83","T":"84","U":"85","V":"86","W":"87","X":"88","Y":"89","Z":"90"
};

var keyWidth = 40;
var keyHeight = 40;

function preload() {
  // Prepare key-note mappings
  keyTable = loadTable('keymaps.csv', 'csv', x => {
    keyTable.getColumn(0).forEach((key, index) => keyMap[key] = index);
  });
  // Names of all possible soundfont instruments
  instNames = loadJSON('instrument_names.json');
}

function setup() {
  createCanvas(500, 500);

  // Create synth voices
  polySynth = new p5.PolySynth();
  sfSynth = new SoundfontSynth('acoustic_grand_piano');

  // UI
  voiceTypeSelector = select('#voice-select');
  voiceTypeSelector.changed(toggleVoiceSettings);

  instSelector = select('#inst-select');
  for (var index in instNames) {
    instSelector.option(instNames[index]);
  }
  instSelector.changed(_ => sfSynth = new SoundfontSynth(instSelector.value()));
  instSelector.value('acoustic_grand_piano'); // Default piano

  // Drawing
  textAlign(LEFT, TOP);
  stroke(255);
  strokeWeight(2);
}

function draw() {
  background(255);
  
  var xpos = 30;
  var ypos = 70;
  for (var character of "1234567890") {
    if (character in keyMap) drawKey(xpos, ypos, character);
    xpos = xpos + keyWidth;
  }

  ypos = ypos + keyHeight;
  xpos = 50;
  for (var character of "QWERTYUIOP") {
    if (character in keyMap) drawKey(xpos, ypos, character);
    xpos = xpos + keyWidth;
  }
  
  ypos = ypos + keyHeight;
  xpos = 60;
  for (var character of "ASDFGHJKL") {
    if (character in keyMap) drawKey(xpos, ypos, character);
    xpos = xpos + keyWidth;
  }

  ypos = ypos + keyHeight;
  xpos = 80;
  for (var character of "ZXCVBNM") {
    if (character in keyMap) drawKey(xpos, ypos, character);
    xpos = xpos + keyWidth;
  }
}

function drawKey(xpos, ypos, key) {
  var keyColor = color(100, 100, 255, 50);
  if (keyIsDown(key2keycode[key])) {
    keyColor = color(255, 100, 100);
  }
  fill(keyColor);
  rect(xpos, ypos, keyWidth, keyHeight);
  keyColor.setAlpha(255);
  fill(keyColor);
  text(key, xpos+5, ypos+5);
}

function toggleVoiceSettings() {
  instLabel = select('#inst-label');
  if (voiceTypeSelector.value() === 'template') instLabel.show();
  else instLabel.hide();
}

function keyPressed() {
  // Check if valid note key pressed
  if (key in keyMap) {
    midiNoteNumber = baseNote + keyMap[key]; // 0-127; 60 is Middle C (C4)
    velocity = 0.8; // From 0-1
    duration = 0.5; // Seconds

    if (voiceTypeSelector.value() === 'template') {
      sfSynth.noteAttack(midiNoteNumber, velocity, 0);
    } else {
      polySynth.noteAttack(midiToFreq(midiNoteNumber), velocity, 0);
    }
  }
}

function keyReleased() {
  // Check if valid note key pressed
  if (key in keyMap) {
    midiNoteNumber = baseNote + keyMap[key]; // 0-127; 60 is Middle C (C4)
   
    if (voiceTypeSelector.value() === 'template') {
      sfSynth.noteRelease(midiNoteNumber, 0);
    } else {
      polySynth.noteRelease(midiToFreq(midiNoteNumber), 0);
    }
  }
}

// SoundfontSynth class

SoundfontSynth = function(soundfont = 'acoustic_grand_piano') {
  this.audioContext = getAudioContext();
  this.inst = Soundfont.instrument(this.audioContext, soundfont);
  this.notes = {};
};

SoundfontSynth.prototype.play = function(note, velocity, secondsFromNow, duration) {
  this.inst.then(voice => {
    this.latest_note = voice
      .play(note, this.audioContext.currentTime + secondsFromNow, { 
        gain: velocity, 
        duration: duration
      });
  });
}

SoundfontSynth.prototype.noteAttack = function(note, velocity, secondsFromNow) {
  this.inst.then(voice => {
    this.notes[note] = voice
      .play(note, this.audioContext.currentTime + secondsFromNow, { 
        gain: velocity,
        loop: true // Need to set loopStart and loopEnd for smoother looping
      });
  });
}

SoundfontSynth.prototype.noteRelease = function(note, secondsFromNow) {
  this.notes[note].stop(this.audioContext.currentTime);
}