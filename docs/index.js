function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}function getRandomInt(a,b){return a=Math.ceil(a),b=Math.floor(b),Math.floor(Math.random()*(b-a))+a}function getRectColor(){if(colorful){const a=getRandomInt(0,127),b=getRandomInt(0,127),c=getRandomInt(0,127);return`${a}, ${b}, ${c}`}return"0, 127, 255"}function setRectColor(){[...visualizer.svg.children].forEach(a=>{const b=getRectColor();a.setAttribute("fill",`rgba(${b}, 1)`)})}function toggleRectColor(){colorful=!colorful,setRectColor()}function dropFileEvent(a){a.preventDefault();const b=a.dataTransfer.files[0],c=new DataTransfer;c.items.add(b);const d=document.getElementById("inputMIDIFile");d.files=c.files,loadMIDIFromBlob(b)}function loadMIDIFileEvent(a){loadMIDIFromBlob(a.target.files[0])}function loadMIDIUrlEvent(a){loadMIDIFromUrl(a.target.value)}async function loadMIDIFromUrlParams(){const a=new URLSearchParams(location.search);ns=await core.urlToNoteSequence(a.get("url")),convert(ns,a)}async function loadMIDIFromBlob(a,b){ns=await core.blobToNoteSequence(a),convert(ns,b)}async function loadMIDIFromUrl(a,b){ns=await core.urlToNoteSequence(a),convert(ns,b)}function setMIDIInfo(a){if(a instanceof URLSearchParams){const f=a.get("title"),c=a.get("composer"),b=a.get("maintainer"),d=a.get("web"),e=a.get("license");if(document.getElementById("midiTitle").textContent=f,c!=b&&(document.getElementById("composer").textContent=c),d){const a=document.createElement("a");a.href=d,a.textContent=b,document.getElementById("maintainer").replaceChildren(a)}else document.getElementById("maintainer").textContent=b;try{new URL(e)}catch{document.getElementById("license").textContent=e}}else document.getElementById("midiTitle").textContent="",document.getElementById("composer").textContent="",document.getElementById("maintainer").textContent="",document.getElementById("license").textContent=""}function convert(a,c){const b=3;longestDuration=-(1/0),a.totalTime+=b,a.notes.forEach(a=>{a.startTime+=b,a.endTime+=b;const c=a.endTime-a.startTime;longestDuration<c&&(longestDuration=c)}),a.controlChanges.forEach(a=>{a.time+=b}),a.tempos.slice(1).forEach(a=>{a.time+=b}),a.timeSignatures.slice(1).forEach(a=>{a.time+=b}),a.notes=a.notes.sort((a,b)=>a.startTime<b.startTime?-1:a.startTime>b.startTime?1:0),nsCache=core.sequences.clone(a),a.notes.forEach(a=>{a.velocity=1}),setMIDIInfo(c),initVisualizer(),setProgramsRadiobox(),initPlayer()}async function loadSoundFontFileEvent(a){if(player){document.getElementById("soundfonts").options[0].selected=!0;const c=a.target.files[0],b=await c.arrayBuffer();await player.loadSoundFontBuffer(b),await synthesizer.loadSoundFontBuffer(b)}}async function loadSoundFontUrlEvent(a){if(player){document.getElementById("soundfonts").options[0].selected=!0;const c=await fetch(a.target.value),b=await c.arrayBuffer();await player.loadSoundFontBuffer(b),await synthesizer.loadSoundFontBuffer(b)}}function styleToViewBox(a){const b=a.style,c=parseFloat(b.width),d=parseFloat(b.height),e=`0 0 ${c} ${d}`;a.setAttribute("viewBox",e),a.removeAttribute("style")}function searchNotePosition(a,c){let d=0,b=a.length-1;if(c<a[0].startTime)return-1;while(d<=b){const e=Math.floor((d+b)/2);if(a[e].startTime===c){const b=a[e].startTime-1e-8;return b<a[0].startTime?0:searchNotePosition(a,b)}else a[e].startTime<c?d=e+1:b=e-1}return b}const MIN_NOTE_LENGTH=1;class WaterfallSVGVisualizer extends core.BaseSVGVisualizer{NOTES_PER_OCTAVE=12;WHITE_NOTES_PER_OCTAVE=7;LOW_C=12;firstDrawnOctave=0;lastDrawnOctave=8;constructor(d,b,a={}){if(super(d,a),!(b instanceof HTMLDivElement))throw new Error("This visualizer requires a <div> element to display the visualization");this.config.whiteNoteWidth=a.whiteNoteWidth||20,this.config.blackNoteWidth=a.blackNoteWidth||this.config.whiteNoteWidth*2/3,this.config.whiteNoteHeight=a.whiteNoteHeight||70,this.config.blackNoteHeight=a.blackNoteHeight||2*70/3,this.config.showOnlyOctavesUsed=a.showOnlyOctavesUsed,this.setupDOM(b);const c=this.getSize();this.width=c.width,this.height=c.height,this.svg.style.width=`${this.width}px`,this.svg.style.height=`${this.height}px`,this.svgPiano.style.width=`${this.width}px`,this.svgPiano.style.height=`${this.config.whiteNoteHeight}px`,this.parentElement.style.width=`${this.width+this.config.whiteNoteWidth}px`,this.parentElement.scrollTop=this.parentElement.scrollHeight,this.clear(),this.drawPiano(),this.draw()}setupDOM(a){this.parentElement=document.createElement("div"),this.parentElement.classList.add("waterfall-notes-container");const b=Math.max(a.getBoundingClientRect().height,200);this.parentElement.style.paddingTop=`${b-this.config.whiteNoteHeight}px`,this.parentElement.style.height=`${b-this.config.whiteNoteHeight}px`,this.parentElement.style.boxSizing="border-box",this.parentElement.style.overflowX="hidden",this.parentElement.style.overflowY="auto",this.svg=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.svgPiano=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.svg.classList.add("waterfall-notes"),this.svgPiano.classList.add("waterfall-piano"),this.parentElement.appendChild(this.svg),a.innerHTML="",a.appendChild(this.parentElement),a.appendChild(this.svgPiano)}redraw(d,a){if(visualizer.drawn||visualizer.draw(),!d)return;this.clearActivePianoKeys();const b=visualizer.noteSequence.notes,f=visualizer.svg.children,g=[...visualizer.svgPiano.children].slice(1),e=d.startTime;a||(a=searchNotePosition(b,e));const h=b.slice(a);let c=h.findIndex(a=>e<a.startTime);c=c==-1?b.length:a+c;for(let d=a;d<c;d++){const e=b[d];visualizer.fillActiveRect(f[d],e);const h=pianoKeyIndex.get(e.pitch);visualizer.fillActiveRect(g[h],e)}}getSize(){this.updateMinMaxPitches(!0);let a=52;if(this.config.showOnlyOctavesUsed){let b=!1,c=!1;for(let a=1;a<7;a++){const d=this.LOW_C+this.NOTES_PER_OCTAVE*a;!b&&d>this.config.minPitch&&(this.firstDrawnOctave=a-1,b=!0),!c&&d>this.config.maxPitch&&(this.lastDrawnOctave=a-1,c=!0)}a=(this.lastDrawnOctave-this.firstDrawnOctave+1)*this.WHITE_NOTES_PER_OCTAVE}const c=a*this.config.whiteNoteWidth,b=this.noteSequence.totalTime;if(!b)throw new Error("The sequence you are using with the visualizer does not have a totalQuantizedSteps or totalTime field set, so the visualizer can't be horizontally sized correctly.");const d=Math.max(b*this.config.pixelsPerTimeStep,MIN_NOTE_LENGTH);return{width:c,height:d}}getNotePosition(a,h){const b=this.svgPiano.querySelector(`rect[data-pitch="${a.pitch}"]`);if(!b)return null;const e=this.getNoteEndTime(a)-this.getNoteStartTime(a),f=Number(b.getAttribute("x")),g=Number(b.getAttribute("width")),c=Math.max(this.config.pixelsPerTimeStep*e-this.config.noteSpacing,MIN_NOTE_LENGTH),d=this.height-this.getNoteStartTime(a)*this.config.pixelsPerTimeStep-c;return{x:f,y:d,w:g,h:c}}drawPiano(){this.svgPiano.innerHTML="";const c=this.config.whiteNoteWidth-this.config.blackNoteWidth/2,d=[1,3,6,8,10];let b=0,a=0;this.config.showOnlyOctavesUsed?a=this.firstDrawnOctave*this.NOTES_PER_OCTAVE+this.LOW_C:(a=this.LOW_C-3,this.drawWhiteKey(a,b),this.drawWhiteKey(a+2,this.config.whiteNoteWidth),a+=3,b=2*this.config.whiteNoteWidth);for(let c=this.firstDrawnOctave;c<=this.lastDrawnOctave;c++)for(let c=0;c<this.NOTES_PER_OCTAVE;c++)d.indexOf(c)===-1&&(this.drawWhiteKey(a,b),b+=this.config.whiteNoteWidth),a++;this.config.showOnlyOctavesUsed?(a=this.firstDrawnOctave*this.NOTES_PER_OCTAVE+this.LOW_C,b=-this.config.whiteNoteWidth):(this.drawWhiteKey(a,b),a=this.LOW_C-3,this.drawBlackKey(a+1,c),a+=3,b=this.config.whiteNoteWidth);for(let e=this.firstDrawnOctave;e<=this.lastDrawnOctave;e++)for(let e=0;e<this.NOTES_PER_OCTAVE;e++)d.indexOf(e)!==-1?this.drawBlackKey(a,b+c):b+=this.config.whiteNoteWidth,a++}drawWhiteKey(b,c){const a=document.createElementNS("http://www.w3.org/2000/svg","rect");return a.dataset.pitch=String(b),a.setAttribute("x",String(c)),a.setAttribute("y","0"),a.setAttribute("width",String(this.config.whiteNoteWidth)),a.setAttribute("height",String(this.config.whiteNoteHeight)),a.setAttribute("fill","white"),a.setAttribute("original-fill","white"),a.setAttribute("stroke","black"),a.setAttribute("stroke-width","3px"),a.classList.add("white"),this.svgPiano.appendChild(a),a}drawBlackKey(b,c){const a=document.createElementNS("http://www.w3.org/2000/svg","rect");return a.dataset.pitch=String(b),a.setAttribute("x",String(c)),a.setAttribute("y","0"),a.setAttribute("width",String(this.config.blackNoteWidth)),a.setAttribute("height",String(this.config.blackNoteHeight)),a.setAttribute("fill","black"),a.setAttribute("original-fill","black"),a.setAttribute("stroke","black"),a.setAttribute("stroke-width","3px"),a.classList.add("black"),this.svgPiano.appendChild(a),a}getNoteFillColor(a,b){const c=.2,d=a.velocity?a.velocity/100+c:1,e=b?this.config.activeNoteRGB:getRectColor(),f=`rgba(${e}, ${d})`;return f}unfillActiveRect(b){const a=b.querySelectorAll("rect.active");for(let b=0;b<a.length;++b){const c=a[b],d=this.getNoteFillColor(nsCache.notes[b],!1);c.setAttribute("fill",d),c.classList.remove("active")}}clearActiveNotes(){this.unfillActiveRect(this.svg),this.clearActivePianoKeys(),setRectOpacity()}clearActivePianoKeys(){const a=this.svgPiano.querySelectorAll("rect.active");for(let b=0;b<a.length;++b){const c=a[b];c.setAttribute("fill",c.getAttribute("original-fill")),c.classList.remove("active")}}}function initPianoKeyIndex(){[...visualizer.svgPiano.children].forEach((a,b)=>{const c=parseInt(a.dataset.pitch);pianoKeyIndex.set(c,b)})}function getMinMaxPitch(){let a=1/0,b=-(1/0);return ns.notes.forEach(c=>{c.pitch<a&&(a=c.pitch),b<c.pitch&&(b=c.pitch)}),[a,b]}function beautifyPianoKey(b){const a=b.getAttribute("class"),d=parseInt(b.getAttribute("x")),e=b.getAttribute("y"),c=parseInt(b.getAttribute("width")),f=parseInt(b.getAttribute("height")),g=b.getAttribute("data-pitch");return a=="white"?`
<g>
  <rect data-pitch="${g}"
    x="${d}" y="${e}" width="${c}" height="${f}"
    stroke="#666" stroke-width="1px" ry="3%" vector-effect="non-scaling-stroke"
    original-fill="${a}" class="${a}" fill="url(#${a})">
  </rect>
  <rect data-pitch="${g}"
    x="${d}" y="${e}" width="${c}" height="${f*.95}"
    stroke="#666" stroke-width="1px" ry="3%" vector-effect="non-scaling-stroke"
    original-fill="${a}" class="${a}" fill="url(#${a})">
  </rect>
</g>`:`
<g>
  <rect data-pitch="${g}"
    x="${d}" y="${e}" width="${c}" height="${f}"
    stroke="#666" stroke-width="1px" ry="2%" vector-effect="non-scaling-stroke"
    original-fill="${a}" class="${a}" fill="url(#${a})">
  </rect>
  <rect data-pitch="${g}"
    x="${d+c*.05}" y="${e}" width="${c*.9}" height="${f*.85}"
    stroke="#666" stroke-width="1px" ry="2%" vector-effect="non-scaling-stroke"
    original-fill="${a}" class="${a}" fill="url(#${a})">
  </rect>
</g>`}function beautifyPiano(b){let a=`
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="black" gradientTransform="rotate(-20)">
      <stop offset="0%" stop-color="#333"/>
      <stop offset="50%" stop-color="#000"/>
      <stop offset="100%" stop-color="#333"/>
    </linearGradient>
    <linearGradient id="white" gradientTransform="rotate(-30)">
      <stop offset="0%" stop-color="#fff"/>
      <stop offset="50%" stop-color="#f5f5f5"/>
      <stop offset="100%" stop-color="#fff  "/>
    </linearGradient>
  </defs>
  `;[...b.children].forEach(b=>{a+=beautifyPianoKey(b)}),a+="</svg>";const c=new DOMParser,d=c.parseFromString(a,"image/svg+xml");b.replaceChildren(...d.documentElement.children)}function initVisualizer(){const b=document.getElementById("playPanel"),g=b.getBoundingClientRect(),[d,f]=getMinMaxPitch(ns),c=Math.round(g.width/(f-d+1)*12/7),e=Math.round(c*70/20),h=Math.round(e*2/3),i={showOnlyOctavesUsed:!0,whiteNoteWidth:c,whiteNoteHeight:e,blackNoteWidth:Math.round(c*2/3),blackNoteHeight:h,maxPitch:f,minPitch:d,noteRGB:"0, 127, 255"};visualizer=new WaterfallSVGVisualizer(nsCache,b,i),initPianoKeyIndex(),styleToViewBox(visualizer.svg),styleToViewBox(visualizer.svgPiano),setRectColor();const j=[...visualizer.svgPiano.children].filter(a=>a.getAttribute("class")=="white").length;b.style.width=j/14*100+"%",beautifyPiano(visualizer.svgPiano),visualizer.svgPiano.style.touchAction="none";const a=visualizer.parentElement;a.style.width="100%",a.style.height="40vh",a.style.paddingTop="40vh",a.style.overflowY="hidden",resize()}class MagentaPlayer extends core.SoundFontPlayer{constructor(a,b,c){const d="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus",e={run:a=>b(a),stop:()=>c()};super(d,void 0,void 0,void 0,e),this.ns=a,this.output.volume.value=20*Math.log(.5)/Math.log(10)}loadSamples(a){return super.loadSamples(a).then(()=>{this.synth=!0})}start(a){return super.start(a)}restart(a){return a?super.start(ns,void 0,a/ns.ticksPerQuarter):this.start(this.ns)}resume(a){super.resume(),this.seekTo(a)}changeVolume(a){a==0?a=-100:a=20*Math.log(a/100)/Math.log(10),this.output.volume.value=a}changeMute(a){this.output.mute=a}}class SoundFontPlayer{constructor(a){this.context=new AudioContext,this.state="stopped",this.callStop=!1,this.stopCallback=a,this.prevGain=.5,this.cacheUrls=new Array(128),this.totalTicks=0}async loadSoundFontDir(a,b){const c=a.map(a=>{const d=a.toString().padStart(3,"0"),c=`${b}/${d}.sf3`;return this.cacheUrls[a]==c||(this.cacheUrls[a]=c,this.fetchBuffer(c))}),d=await Promise.all(c);for(const a of d)a instanceof ArrayBuffer&&await this.loadSoundFontBuffer(a)}async fetchBuffer(b){const a=await fetch(b);return a.status==200?await a.arrayBuffer():void 0}async loadSoundFontUrl(a){const b=await this.fetchBuffer(a),c=await this.loadSoundFontBuffer(b);return c}async loadSoundFontBuffer(a){if(!this.synth){await JSSynthPromise,await this.context.audioWorklet.addModule("https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/externals/libfluidsynth-2.3.0-with-libsndfile.min.js"),await this.context.audioWorklet.addModule("https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/dist/js-synthesizer.worklet.min.js"),this.synth=new JSSynth.AudioWorkletNodeSynthesizer,this.synth.init(this.context.sampleRate);const a=this.synth.createAudioNode(this.context);a.connect(this.context.destination)}const b=await this.synth.loadSFont(a);return b}async loadNoteSequence(a){await this.synth.resetPlayer(),this.ns=a;const b=core.sequenceProtoToMidi(a);return this.totalTicks=this.calcTick(a.totalTime),this.synth.addSMFDataToPlayer(b)}resumeContext(){this.context.resume()}async restart(a){this.state="started",await this.synth.playPlayer(),a&&this.seekTo(a),await this.synth.waitForPlayerStopped(),await this.synth.waitForVoicesStopped(),this.state="paused";const b=await this.synth.retrievePlayerCurrentTick();this.totalTicks<=b&&(player.seekTo(0),this.stopCallback())}async start(a,c,b){a&&await this.loadNoteSequence(a),b&&this.seekTo(b),this.restart()}stop(){this.isPlaying()&&this.synth.stopPlayer()}pause(){this.state="paused",this.synth.stopPlayer()}resume(a){this.restart(a)}changeVolume(a){a=a/100,this.synth.setGain(a)}changeMute(a){a?(this.prevGain=this.synth.getGain(),this.synth.setGain(0)):this.synth.setGain(this.prevGain)}calcTick(d){let a=0,b=0,c=120;for(const f of this.ns.tempos){const e=f.time,g=f.qpm;if(e<d){const d=e-b;a+=c/60*d*this.ns.ticksPerQuarter}else{const e=d-b;return a+=c/60*e*this.ns.ticksPerQuarter,Math.round(a)}b=e,c=g}const e=d-b;return a+=c/60*e*this.ns.ticksPerQuarter,Math.floor(a)}seekTo(a){const b=this.calcTick(a);this.synth.seekPlayer(b)}isPlaying(){return!!this.synth&&this.synth.isPlaying()}getPlayState(){return this.synth?this.synth.isPlaying()?"started":this.state:"stopped"}}function stopCallback(){clearInterval(timer),currentTime=0,currentPos=0,initSeekbar(ns,0),visualizer.parentElement.scrollTop=visualizer.parentElement.scrollHeight,clearPlayer();const a=document.getElementById("repeat"),b=a.classList.contains("active");b&&play(),scoring(),scoreModal.show(),[...visualizer.svg.getElementsByClassName("fade")].forEach(a=>{a.classList.remove("fade")}),visualizer.clearActiveNotes()}function noteOffByElement(d){const a=d.children,b=parseInt(a[1].getAttribute("data-pitch")),c=parseInt(a[0].getAttribute("height"));synthesizer.resumeContext(),synthesizer.synth.midiNoteOff(0,b),countKeyPressOff(b);const e=a[0].getAttribute("class");e=="white"?a[1].setAttribute("height",c*.95):a[1].setAttribute("height",c*.85)}async function initPianoEvent(a){synthesizer=new SoundFontPlayer(stopCallback),await loadSoundFont(synthesizer,a),initSynthesizerProgram();const b=[...visualizer.svgPiano.children];b.forEach(a=>{const b=a.children,c=parseInt(b[1].getAttribute("data-pitch")),d=parseInt(b[0].getAttribute("height"));function e(){synthesizer.resumeContext(),synthesizer.synth.midiNoteOff(0,c),countKeyPressOff(c);const a=b[0].getAttribute("class");a=="white"?b[1].setAttribute("height",d*.95):b[1].setAttribute("height",d*.85)}function f(a){synthesizer.resumeContext();const e=a.pressure!==void 0?a.pressure:a.force!==void 0?a.force:1,f=Math.ceil(e*127);synthesizer.synth.midiNoteOn(0,c,f),countKeyPressOn(c),b[1].setAttribute("height",d*.975)}if("ontouchstart"in window){const b=new Map;a.addEventListener("touchmove",c=>{const a=c.changedTouches;for(let e=0;e<a.length;e++){const c=a[e],g=c.clientX,h=c.clientY,f=document.elementsFromPoint(g,h).find(a=>a.tagName=="rect"),d=b.get(c.identifier);if(f){const a=f.parentNode;d!=a&&(b.set(c.identifier,a),d&&(noteOffByElement(d),a.dispatchEvent(new Event("touchstart"))))}else d&&(b.delete(c.identifier),noteOffByElement(d))}}),a.addEventListener("touchstart",f),a.addEventListener("touchend",c=>{const a=c.changedTouches;for(let c=0;c<a.length;c++){const d=a[c].identifier,f=b.get(d);f?(noteOffByElement(f),b.delete(d)):e()}})}else a.addEventListener("mouseenter",a=>{mouseDowned&&f(a)}),a.addEventListener("mousedown",f),a.addEventListener("mouseleave",e),a.addEventListener("mouseup",e)}),"ontouchstart"in window||(document.addEventListener("mouseup",()=>{mouseDowned=!1}),document.addEventListener("mousedown",()=>{mouseDowned=!0}))}async function initPlayer(){disableController(),player&&player.isPlaying()&&player.stop(),currentTime=0,currentPos=0,initSeekbar(ns,0),player=new SoundFontPlayer(stopCallback),firstRun?(firstRun=!1,await loadSoundFont(player,"GeneralUser_GS_v1.471"),await player.loadNoteSequence(ns),await initPianoEvent("GeneralUser_GS_v1.471")):(await loadSoundFont(player),await player.loadNoteSequence(ns),await initPianoEvent()),enableController()}function getPrograms(b){const a=new Set;return b.notes.forEach(b=>a.add(b.program)),b.notes.some(a=>a.isDrum)&&a.add(128),[...a]}async function loadSoundFont(c,a,b){if(!a){const b=document.getElementById("soundfonts"),c=b.selectedIndex;if(c==0)return;a=b.options[c].value}const d=`https://soundfonts.pages.dev/${a}`;b||(b=getPrograms(ns)),await c.loadSoundFontDir(b,d)}function checkNoteEvent(){const a=ns.notes;if(a.length<=currentPos)return;const b=a[currentPos].startTime;if(b<=currentTime){let c=currentPos+1;while(a.length<c&&b==a[c].startTime)c+=1;visualizer.redraw(a[currentPos],currentPos),currentPos=c}}function setTimer(b){const c=1,d=Date.now()-b*1e3,a=ns.totalTime;clearInterval(timer),timer=setInterval(()=>{const b=(Date.now()-d)/1e3;if(Math.floor(currentTime)!=Math.floor(b)&&updateSeekbar(b),currentTime=b,currentTime<a){const b=1-currentTime/a;visualizer.parentElement.scrollTop=currentScrollHeight*b,player instanceof SoundFontPlayer&&checkNoteEvent()}else clearInterval(timer)},c)}function setLoadingTimer(a){const b=setInterval(()=>{player.isPlaying()&&(clearInterval(b),player.seekTo(a),setTimer(a),enableController())},10)}function disableController(){controllerDisabled=!0;const a=document.getElementById("controller").querySelectorAll("button, input");[...a].forEach(a=>{a.disabled=!0})}function enableController(){controllerDisabled=!1;const a=document.getElementById("controller").querySelectorAll("button, input");[...a].forEach(a=>{a.disabled=!1})}function unlockAudio(){if(!player)return;if(!player.synth)return;if(!synthesizer)return;if(!synthesizer.synth)return;player.resumeContext(),synthesizer.resumeContext(),document.removeEventListener("click",unlockAudio)}function play(){switch(tapCount=perfectCount=greatCount=0,disableController(),document.getElementById("play").classList.add("d-none"),document.getElementById("pause").classList.remove("d-none"),player.getPlayState()){case"stopped":initSeekbar(ns,currentTime),setLoadingTimer(currentTime),player.restart();break;case"started":case"paused":player.resume(currentTime),setTimer(currentTime),enableController();break}window.scrollTo({top:visualizer.svgPiano.getBoundingClientRect().top,behavior:"auto"})}function pause(){player.pause(),clearPlayer()}function clearPlayer(){clearInterval(timer),document.getElementById("play").classList.remove("d-none"),document.getElementById("pause").classList.add("d-none")}function getRadioboxString(b,a){return`
<div class="form-check form-check-inline">
  <label class="form-check-label">
    <input class="form-check-input" name="${b}" value="${a}" type="radio">
    ${a}
  </label>
</div>`}function getCheckboxString(b,a){return`
<div class="form-check form-check-inline">
  <label class="form-check-label">
    <input class="form-check-input" name="${b}" value="${a}" type="checkbox" checked>
    ${a}
  </label>
</div>`}function setInstrumentsCheckbox(d){const a=new Set;ns.notes.forEach(b=>{b.program==d&&a.add(b.instrument)});let b="";[...a].sort((a,b)=>a-b).forEach(a=>{b+=getCheckboxString("instrument",a)});const e=(new DOMParser).parseFromString(b,"text/html"),c=document.getElementById("filterInstruments");c.replaceChildren(...e.body.children),[...c.querySelectorAll("input")].forEach(a=>{a.addEventListener("change",changeInstrumentsCheckbox)})}function setRectOpacity(){const c=parseInt(document.forms.filterPrograms.elements.program.value),d=document.getElementById("filterInstruments").querySelectorAll("input"),b=new Map;[...d].forEach(a=>{b.set(parseInt(a.value),a.checked)});const a=visualizer.svg.children;ns.notes.forEach((d,e)=>{d.program!=c?(d.target=!1,d.velocity=nsCache.notes[e].velocity,a[e].setAttribute("opacity",.1)):b.get(d.instrument)?(d.target=!0,d.velocity=1,a[e].setAttribute("opacity",1)):(d.target=!1,d.velocity=nsCache.notes[e].velocity,a[e].setAttribute("opacity",.1))})}async function changeInstrumentsCheckbox(a){const d=a.target.checked,e=parseInt(a.target.value),b=visualizer.svg.children;ns.notes.forEach((a,c)=>{a.instrument==e&&(d?(a.target=!0,a.velocity=1,b[c].setAttribute("opacity",1)):(a.target=!1,a.velocity=nsCache.notes[c].velocity,b[c].setAttribute("opacity",.1)))});const c=currentTime,f=player.getPlayState();player.stop(),clearInterval(timer),f=="started"?(setLoadingTimer(c),player.start(ns)):player instanceof SoundFontPlayer&&(await player.loadNoteSequence(ns),player.seekTo(c))}function initSynthesizerProgram(){const a=document.getElementById("filterPrograms"),b=parseInt(a.querySelector("input").value);synthesizer.synth.midiProgramChange(0,b)}function setProgramsRadiobox(){const a=new Set;ns.notes.forEach(b=>a.add(b.program));let b="";[...a].sort().forEach(a=>{b+=getRadioboxString("program",a)});const d=(new DOMParser).parseFromString(b,"text/html"),c=document.getElementById("filterPrograms");c.replaceChildren(...d.body.children),[...c.querySelectorAll("input")].forEach((a,b)=>{a.addEventListener("change",changeProgramsRadiobox),b==0&&(a.checked=!0,a.dispatchEvent(new Event("change")))})}function changeProgramsRadiobox(c){const a=parseInt(c.target.value);synthesizer&&synthesizer.synth&&synthesizer.synth.midiProgramChange(0,a);const b=visualizer.svg.children;ns.notes.forEach((c,d)=>{c.program==a?(c.target=!0,c.velocity=1,b[d].setAttribute("opacity",1)):(c.target=!1,c.velocity=nsCache.notes[d].velocity,b[d].setAttribute("opacity",.1))}),setInstrumentsCheckbox(a)}function speedDown(){player.isPlaying()&&disableController();const a=document.getElementById("speed"),b=parseInt(a.value)-10,c=b<=0?1:b;a.value=c,changeSpeed(c)}function speedUp(){player.isPlaying()&&disableController();const a=document.getElementById("speed"),b=parseInt(a.value)+10;a.value=b,changeSpeed(b)}async function changeSpeed(b){if(perfectCount=greatCount=0,!ns)return;const c=player.getPlayState();player.stop(),clearInterval(timer);const d=nsCache.totalTime/ns.totalTime,e=d/(b/100),a=currentTime*e;setSpeed(ns,b),initSeekbar(ns,a),c=="started"?(setLoadingTimer(a),player.start(ns)):player instanceof SoundFontPlayer&&(await player.loadNoteSequence(ns),player.seekTo(a))}function changeSpeedEvent(a){player.isPlaying()&&disableController();const b=parseInt(a.target.value);changeSpeed(b)}function setSpeed(b,a){a<=0&&(a=1),a/=100;const e=nsCache.controlChanges;b.controlChanges.forEach((b,c)=>{b.time=e[c].time/a});const c=nsCache.tempos;b.tempos.forEach((b,d)=>{b.time=c[d].time/a,b.qpm=c[d].qpm*a});const f=nsCache.timeSignatures;b.timeSignatures.forEach((b,c)=>{b.time=f[c].time/a});const d=nsCache.notes;b.notes.forEach((b,c)=>{b.startTime=d[c].startTime/a,b.endTime=d[c].endTime/a}),b.totalTime=nsCache.totalTime/a}function repeat(){document.getElementById("repeat").classList.toggle("active")}function volumeOnOff(){const b=document.getElementById("volumeOnOff").firstElementChild,a=document.getElementById("volumebar");b.classList.contains("bi-volume-up-fill")?(b.className="bi bi-volume-mute-fill",a.dataset.value=a.value,a.value=0,player.changeMute(!0)):(b.className="bi bi-volume-up-fill",a.value=a.dataset.value,player.changeMute(!1))}function changeVolumebar(){const a=document.getElementById("volumebar"),b=parseInt(a.value);a.dataset.value=b,player.changeVolume(b)}function formatTime(a){a=Math.floor(a);const c=a%60,b=(a-c)/60,d=(a-c-60*b)/3600,e=String(c).padStart(2,"0"),f=b>9||!d?`${b}:`:`0${b}:`,g=d?`${d}:`:"";return`${g}${f}${e}`}function changeSeekbar(a){perfectCount=greatCount=0,clearInterval(timer),[...visualizer.svg.getElementsByClassName("fade")].forEach(a=>{a.classList.remove("fade")}),visualizer.clearActiveNotes(),currentTime=parseInt(a.target.value),currentTime==0?currentPos=0:currentPos=searchNotePosition(ns.notes,currentTime),document.getElementById("currentTime").textContent=formatTime(currentTime),seekScroll(currentTime),player.getPlayState()=="started"&&(player.seekTo(currentTime),setTimer(currentTime))}function updateSeekbar(a){const b=document.getElementById("seekbar");b.value=a;const c=formatTime(a);document.getElementById("currentTime").textContent=c}function initSeekbar(a,b){document.getElementById("seekbar").max=a.totalTime,document.getElementById("seekbar").value=b,document.getElementById("totalTime").textContent=formatTime(a.totalTime),document.getElementById("currentTime").textContent=formatTime(b)}function loadSoundFontList(){return fetch("https://soundfonts.pages.dev/list.json").then(a=>a.json()).then(a=>{const b=document.getElementById("soundfonts");a.forEach(c=>{const a=document.createElement("option");a.textContent=c.name,c.name=="GeneralUser_GS_v1.471"&&(a.selected=!0),b.appendChild(a)})})}async function changeConfig(){switch(player.getPlayState()){case"started":{player.stop(),player instanceof SoundFontPlayer&&(await loadSoundFont(player),await player.loadNoteSequence(ns),await loadSoundFont(synthesizer));const b=parseInt(document.getElementById("speed").value);setSpeed(ns,b);const a=parseInt(document.getElementById("seekbar").value);initSeekbar(ns,a),setLoadingTimer(a),player.start(ns);break}case"paused":configChanged=!0;break}}function resize(){const a=visualizer.parentElement,b=a.getBoundingClientRect().height;currentScrollHeight=a.scrollHeight-b,seekScroll(currentTime)}function seekScroll(a){const b=(ns.totalTime-a)/ns.totalTime;visualizer.parentElement.scrollTop=currentScrollHeight*b}function typeEvent(a){if(!player||!player.synth)return;if(controllerDisabled)return;switch(player.resumeContext(),a.code){case"Space":a.preventDefault(),player.getPlayState()=="started"?pause():play();break}}function countKeyPressOn(d){const a=currentTime,e=.1,f=a-longestDuration,g=a+e;let b=searchNotePosition(ns.notes,f);b<0&&(b=0);const h=searchNotePosition(ns.notes,g),c=ns.notes.slice(b,h+1).filter(a=>!!a.target&&(a.pitch==d));c.length>0?c.slice(-1).forEach(b=>{b.pressed=a,tapCount+=1}):tapCount+=1}function countKeyPressOff(d){const a=currentTime,e=a-longestDuration;let b=searchNotePosition(ns.notes,e);b<0&&(b=0);const f=searchNotePosition(ns.notes,a),c=[];for(let a=b;a<=f;a++){const e=ns.notes[a];if(!e.target)continue;if(e.pitch!=d)continue;if(!e.pressed)continue;c.push(a)}c.forEach(c=>{const b=ns.notes[c],d=(a-b.pressed)/(b.endTime-b.startTime);b.pressed=!1,d>.5?perfectCount+=1:greatCount+=1})}function getAccuracy(){return tapCount==0?0:(perfectCount+greatCount)/tapCount}function scoring(){const c=getAccuracy(),b=tapCount-perfectCount-greatCount,h=Math.ceil(perfectCount/tapCount*1e4)/100,d=Math.ceil(greatCount/tapCount*1e4)/100,e=Math.ceil(b/tapCount*1e4)/100,f=perfectCount*2+greatCount,g=parseInt(document.getElementById("speed").value),a=parseInt(f*g*c);document.getElementById("perfectCount").textContent=perfectCount,document.getElementById("greatCount").textContent=greatCount,document.getElementById("missCount").textContent=b,document.getElementById("perfectRate").textContent=h+"%",document.getElementById("greatRate").textContent=d+"%",document.getElementById("missRate").textContent=e+"%",document.getElementById("score").textContent=a;const i=document.getElementById("midiTitle").textContent,j=document.getElementById("composer").textContent,k=`${i} ${j}`,l=encodeURIComponent(`Doremi Piano! ${k}: ${a}`),m="https://marmooo.github.com/doremi-piano/",n=`https://twitter.com/intent/tweet?text=${l}&url=${m}&hashtags=DoremiPiano`;document.getElementById("twitter").href=n}function initQuery(){const a=new URLSearchParams;return a.set("title","When the Swallows Homeward Fly (Agathe)"),a.set("composer","Franz Wilhelm Abt"),a.set("maintainer","Stan Sanderson"),a.set("license","Public Domain"),a}function changeInstrument(b){if(!synthesizer)return;if(!synthesizer.synth)return;const a=b.target.selectedIndex-1;if(a<0){const a=document.getElementById("filterPrograms"),b=parseInt(a.querySelector("input").value);synthesizer.synth.midiProgramChange(0,b)}else loadSoundFont(synthesizer,void 0,[a]),synthesizer.synth.midiProgramChange(0,a)}async function loadInstrumentList(){const a=await fetch(`instruments.lst`),b=await a.text(),c=document.getElementById("instruments");b.trimEnd().split("\n").forEach(b=>{const a=document.createElement("option");a.textContent=b,c.appendChild(a)})}function loadLibraries(a){const b=a.map(a=>new Promise((c,d)=>{const b=document.createElement("script");b.src=a,b.async=!0,b.onload=c,b.onerror=d,document.body.appendChild(b)}));return Promise.all(b)}const pianoKeyIndex=new Map;let controllerDisabled,colorful=!0,currentTime=0,currentPos=0,currentScrollHeight,ns,nsCache,timer,player,visualizer,synthesizer,tapCount=0,perfectCount=0,greatCount=0,firstRun=!0,mouseDowned=!1;if(loadConfig(),location.search)loadMIDIFromUrlParams();else{const a=initQuery();loadMIDIFromUrl("abt.mid",a)}loadSoundFontList(),loadInstrumentList();const scoreModal=new bootstrap.Modal("#scorePanel",{backdrop:"static",keyboard:!1});Module={};const JSSynthPromise=loadLibraries(["https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/dist/js-synthesizer.min.js","https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/externals/libfluidsynth-2.3.0-with-libsndfile.min.js"]);document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("toggleColor").onclick=toggleRectColor,document.ondragover=a=>{a.preventDefault()},document.ondrop=dropFileEvent,document.getElementById("play").onclick=play,document.getElementById("pause").onclick=pause,document.getElementById("speed").onchange=changeSpeedEvent,document.getElementById("speedDown").onclick=speedDown,document.getElementById("speedUp").onclick=speedUp,document.getElementById("repeat").onclick=repeat,document.getElementById("volumeOnOff").onclick=volumeOnOff,document.getElementById("volumebar").onchange=changeVolumebar,document.getElementById("seekbar").onchange=changeSeekbar,document.getElementById("inputMIDIFile").onchange=loadMIDIFileEvent,document.getElementById("inputMIDIUrl").onchange=loadMIDIUrlEvent,document.getElementById("inputSoundFontFile").onchange=loadSoundFontFileEvent,document.getElementById("inputSoundFontUrl").onchange=loadSoundFontUrlEvent,document.getElementById("soundfonts").onchange=changeConfig,document.getElementById("instruments").onchange=changeInstrument,document.addEventListener("keydown",typeEvent),window.addEventListener("resize",resize),document.addEventListener("click",unlockAudio)