function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}function getRandomInt(e,t){return e=Math.ceil(e),t=Math.floor(t),Math.floor(Math.random()*(t-e))+e}function getRectColor(){if(colorful){const e=getRandomInt(0,127),t=getRandomInt(0,127),n=getRandomInt(0,127);return`${e}, ${t}, ${n}`}return"0, 127, 255"}function setRectColor(){[...visualizer.svg.children].forEach(e=>{const t=getRectColor();e.setAttribute("fill",`rgba(${t}, 1)`)})}function toggleRectColor(){colorful=!colorful,setRectColor()}function dropFileEvent(e){e.preventDefault();const t=e.dataTransfer.files[0],n=new DataTransfer;n.items.add(t);const s=document.getElementById("inputMIDIFile");s.files=n.files,loadMIDIFromBlob(t)}function loadMIDIFileEvent(e){loadMIDIFromBlob(e.target.files[0])}function loadMIDIUrlEvent(e){loadMIDIFromUrl(e.target.value)}async function loadMIDIFromUrlParams(){const e=new URLSearchParams(location.search);ns=await core.urlToNoteSequence(e.get("url")),convert(ns,e)}async function loadMIDIFromBlob(e,t){ns=await core.blobToNoteSequence(e),convert(ns,t)}async function loadMIDIFromUrl(e,t){ns=await core.urlToNoteSequence(e),convert(ns,t)}function setMIDIInfo(e){if(e instanceof URLSearchParams){const i=e.get("title"),n=e.get("composer"),t=e.get("maintainer"),s=e.get("web"),o=e.get("license");if(document.getElementById("midiTitle").textContent=i,n!=t&&(document.getElementById("composer").textContent=n),s){const e=document.createElement("a");e.href=s,e.textContent=t,document.getElementById("maintainer").replaceChildren(e)}else document.getElementById("maintainer").textContent=t;try{new URL(o)}catch{document.getElementById("license").textContent=o}}else document.getElementById("midiTitle").textContent="",document.getElementById("composer").textContent="",document.getElementById("maintainer").textContent="",document.getElementById("license").textContent=""}function convertGM(e){e.controlChanges=e.controlChanges.filter(e=>e.controlNumber==0||e.controlNumber==32)}function convert(e,t){convertGM(e);const n=3;longestDuration=-(1/0),e.totalTime+=n,e.notes.forEach(e=>{e.startTime+=n,e.endTime+=n;const t=e.endTime-e.startTime;longestDuration<t&&(longestDuration=t)}),e.controlChanges.forEach(e=>{e.time+=n}),e.tempos.slice(1).forEach(e=>{e.time+=n}),e.timeSignatures.slice(1).forEach(e=>{e.time+=n}),e.notes=e.notes.sort((e,t)=>e.startTime<t.startTime?-1:e.startTime>t.startTime?1:0),nsCache=core.sequences.clone(e),e.notes.forEach(e=>{e.velocity=1}),setMIDIInfo(t),initVisualizer(),setProgramsRadiobox(),initPlayer()}async function loadSoundFontFileEvent(e){if(player){document.getElementById("soundfonts").options[0].selected=!0;const n=e.target.files[0],t=await n.arrayBuffer();await player.loadSoundFontBuffer(t),await synthesizer.loadSoundFontBuffer(t)}}async function loadSoundFontUrlEvent(e){if(player){document.getElementById("soundfonts").options[0].selected=!0;const n=await fetch(e.target.value),t=await n.arrayBuffer();await player.loadSoundFontBuffer(t),await synthesizer.loadSoundFontBuffer(t)}}function styleToViewBox(e){const t=e.style,n=parseFloat(t.width),s=parseFloat(t.height),o=`0 0 ${n} ${s}`;e.setAttribute("viewBox",o),e.removeAttribute("style")}function searchNotePosition(e,t){let s=0,n=e.length-1;if(t<e[0].startTime)return-1;for(;s<=n;){const o=Math.floor((s+n)/2);if(e[o].startTime===t){const t=e[o].startTime-1e-8;return t<e[0].startTime?0:searchNotePosition(e,t)}else e[o].startTime<t?s=o+1:n=o-1}return n}const MIN_NOTE_LENGTH=1;class WaterfallSVGVisualizer extends core.BaseSVGVisualizer{NOTES_PER_OCTAVE=12;WHITE_NOTES_PER_OCTAVE=7;LOW_C=12;firstDrawnOctave=0;lastDrawnOctave=8;constructor(e,t,n={}){if(super(e,n),!(t instanceof HTMLDivElement))throw new Error("This visualizer requires a <div> element to display the visualization");this.config.whiteNoteWidth=n.whiteNoteWidth||20,this.config.blackNoteWidth=n.blackNoteWidth||this.config.whiteNoteWidth*2/3,this.config.whiteNoteHeight=n.whiteNoteHeight||70,this.config.blackNoteHeight=n.blackNoteHeight||2*70/3,this.config.showOnlyOctavesUsed=n.showOnlyOctavesUsed,this.setupDOM(t);const s=this.getSize();this.width=s.width,this.height=s.height,this.svg.style.width=`${this.width}px`,this.svg.style.height=`${this.height}px`,this.svgPiano.style.width=`${this.width}px`,this.svgPiano.style.height=`${this.config.whiteNoteHeight}px`,this.parentElement.style.width=`${this.width+this.config.whiteNoteWidth}px`,this.parentElement.scrollTop=this.parentElement.scrollHeight,this.clear(),this.drawPiano(),this.draw()}setupDOM(e){this.parentElement=document.createElement("div"),this.parentElement.classList.add("waterfall-notes-container");const t=Math.max(e.getBoundingClientRect().height,200);this.parentElement.style.paddingTop=`${t-this.config.whiteNoteHeight}px`,this.parentElement.style.height=`${t-this.config.whiteNoteHeight}px`,this.parentElement.style.boxSizing="border-box",this.parentElement.style.overflowX="hidden",this.parentElement.style.overflowY="auto",this.svg=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.svgPiano=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.svg.classList.add("waterfall-notes"),this.svgPiano.classList.add("waterfall-piano"),this.parentElement.appendChild(this.svg),e.innerHTML="",e.appendChild(this.parentElement),e.appendChild(this.svgPiano)}redraw(e,t){if(visualizer.drawn||visualizer.draw(),!e)return;this.clearActivePianoKeys();const n=visualizer.noteSequence.notes,i=visualizer.svg.children,a=[...visualizer.svgPiano.children].slice(1),o=e.startTime;t||(t=searchNotePosition(n,o));const r=n.slice(t);let s=r.findIndex(e=>o<e.startTime);s=s==-1?n.length:t+s;for(let e=t;e<s;e++){const o=n[e];visualizer.fillActiveRect(i[e],o);const r=pianoKeyIndex.get(o.pitch);visualizer.fillActiveRect(a[r],o)}}getSize(){this.updateMinMaxPitches(!0);let e=52;if(this.config.showOnlyOctavesUsed){let t=!1,n=!1;for(let e=1;e<7;e++){const s=this.LOW_C+this.NOTES_PER_OCTAVE*e;!t&&s>this.config.minPitch&&(this.firstDrawnOctave=e-1,t=!0),!n&&s>this.config.maxPitch&&(this.lastDrawnOctave=e-1,n=!0)}e=(this.lastDrawnOctave-this.firstDrawnOctave+1)*this.WHITE_NOTES_PER_OCTAVE}const n=e*this.config.whiteNoteWidth,t=this.noteSequence.totalTime;if(!t)throw new Error("The sequence you are using with the visualizer does not have a totalQuantizedSteps or totalTime field set, so the visualizer can't be horizontally sized correctly.");const s=Math.max(t*this.config.pixelsPerTimeStep,MIN_NOTE_LENGTH);return{width:n,height:s}}getNotePosition(e){const n=this.svgPiano.querySelector(`rect[data-pitch="${e.pitch}"]`);if(!n)return null;const o=this.getNoteEndTime(e)-this.getNoteStartTime(e),i=Number(n.getAttribute("x")),a=Number(n.getAttribute("width")),s=Math.max(this.config.pixelsPerTimeStep*o-this.config.noteSpacing,MIN_NOTE_LENGTH),r=this.height-this.getNoteStartTime(e)*this.config.pixelsPerTimeStep-s;return{x:i,y:r,w:a,h:s}}drawPiano(){this.svgPiano.innerHTML="";const n=this.config.whiteNoteWidth-this.config.blackNoteWidth/2,s=[1,3,6,8,10];let t=0,e=0;this.config.showOnlyOctavesUsed?e=this.firstDrawnOctave*this.NOTES_PER_OCTAVE+this.LOW_C:(e=this.LOW_C-3,this.drawWhiteKey(e,t),this.drawWhiteKey(e+2,this.config.whiteNoteWidth),e+=3,t=2*this.config.whiteNoteWidth);for(let n=this.firstDrawnOctave;n<=this.lastDrawnOctave;n++)for(let n=0;n<this.NOTES_PER_OCTAVE;n++)s.indexOf(n)===-1&&(this.drawWhiteKey(e,t),t+=this.config.whiteNoteWidth),e++;this.config.showOnlyOctavesUsed?(e=this.firstDrawnOctave*this.NOTES_PER_OCTAVE+this.LOW_C,t=-this.config.whiteNoteWidth):(this.drawWhiteKey(e,t),e=this.LOW_C-3,this.drawBlackKey(e+1,n),e+=3,t=this.config.whiteNoteWidth);for(let o=this.firstDrawnOctave;o<=this.lastDrawnOctave;o++)for(let o=0;o<this.NOTES_PER_OCTAVE;o++)s.indexOf(o)!==-1?this.drawBlackKey(e,t+n):t+=this.config.whiteNoteWidth,e++}drawWhiteKey(e,t){const n=document.createElementNS("http://www.w3.org/2000/svg","rect");return n.dataset.pitch=String(e),n.setAttribute("x",String(t)),n.setAttribute("y","0"),n.setAttribute("width",String(this.config.whiteNoteWidth)),n.setAttribute("height",String(this.config.whiteNoteHeight)),n.setAttribute("fill","white"),n.setAttribute("original-fill","white"),n.setAttribute("stroke","black"),n.setAttribute("stroke-width","3px"),n.classList.add("white"),this.svgPiano.appendChild(n),n}drawBlackKey(e,t){const n=document.createElementNS("http://www.w3.org/2000/svg","rect");return n.dataset.pitch=String(e),n.setAttribute("x",String(t)),n.setAttribute("y","0"),n.setAttribute("width",String(this.config.blackNoteWidth)),n.setAttribute("height",String(this.config.blackNoteHeight)),n.setAttribute("fill","black"),n.setAttribute("original-fill","black"),n.setAttribute("stroke","black"),n.setAttribute("stroke-width","3px"),n.classList.add("black"),this.svgPiano.appendChild(n),n}getNoteFillColor(e,t){const n=.2,s=e.velocity?e.velocity/100+n:1,o=t?this.config.activeNoteRGB:getRectColor(),i=`rgba(${o}, ${s})`;return i}unfillActiveRect(e){const t=e.querySelectorAll("rect.active");for(let e=0;e<t.length;++e){const n=t[e],s=this.getNoteFillColor(nsCache.notes[e],!1);n.setAttribute("fill",s),n.classList.remove("active")}}clearActiveNotes(){this.unfillActiveRect(this.svg),this.clearActivePianoKeys(),setRectOpacity()}clearActivePianoKeys(){const e=this.svgPiano.querySelectorAll("rect.active");for(let t=0;t<e.length;++t){const n=e[t];n.setAttribute("fill",n.getAttribute("original-fill")),n.classList.remove("active")}}}function initPianoKeyIndex(){[...visualizer.svgPiano.children].forEach((e,t)=>{const n=parseInt(e.dataset.pitch);pianoKeyIndex.set(n,t)})}function getMinMaxPitch(){let e=1/0,t=-(1/0);return ns.notes.forEach(n=>{n.pitch<e&&(e=n.pitch),t<n.pitch&&(t=n.pitch)}),[e,t]}function beautifyPianoKey(e){const t=e.getAttribute("class"),s=parseInt(e.getAttribute("x")),o=e.getAttribute("y"),n=parseInt(e.getAttribute("width")),i=parseInt(e.getAttribute("height")),a=e.getAttribute("data-pitch");return t=="white"?`
<g>
  <rect data-pitch="${a}"
    x="${s}" y="${o}" width="${n}" height="${i}"
    stroke="#666" stroke-width="1px" ry="3%" vector-effect="non-scaling-stroke"
    original-fill="${t}" class="${t}" fill="url(#${t})">
  </rect>
  <rect data-pitch="${a}"
    x="${s}" y="${o}" width="${n}" height="${i*.95}"
    stroke="#666" stroke-width="1px" ry="3%" vector-effect="non-scaling-stroke"
    original-fill="${t}" class="${t}" fill="url(#${t})">
  </rect>
</g>`:`
<g>
  <rect data-pitch="${a}"
    x="${s}" y="${o}" width="${n}" height="${i}"
    stroke="#666" stroke-width="1px" ry="2%" vector-effect="non-scaling-stroke"
    original-fill="${t}" class="${t}" fill="url(#${t})">
  </rect>
  <rect data-pitch="${a}"
    x="${s+n*.05}" y="${o}" width="${n*.9}" height="${i*.85}"
    stroke="#666" stroke-width="1px" ry="2%" vector-effect="non-scaling-stroke"
    original-fill="${t}" class="${t}" fill="url(#${t})">
  </rect>
</g>`}function beautifyPiano(e){let t=`
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
  `;[...e.children].forEach(e=>{t+=beautifyPianoKey(e)}),t+="</svg>";const n=new DOMParser,s=n.parseFromString(t,"image/svg+xml");e.replaceChildren(...s.documentElement.children)}function initVisualizer(){const t=document.getElementById("playPanel"),a=t.getBoundingClientRect(),[s,o]=getMinMaxPitch(ns),n=Math.round(a.width/(o-s+1)*12/7),i=Math.round(n*70/20),r=Math.round(i*2/3),c={showOnlyOctavesUsed:!0,whiteNoteWidth:n,whiteNoteHeight:i,blackNoteWidth:Math.round(n*2/3),blackNoteHeight:r,maxPitch:o,minPitch:s,noteRGB:"0, 127, 255"};visualizer=new WaterfallSVGVisualizer(nsCache,t,c),initPianoKeyIndex(),styleToViewBox(visualizer.svg),styleToViewBox(visualizer.svgPiano),setRectColor();const l=[...visualizer.svgPiano.children].filter(e=>e.getAttribute("class")=="white").length;t.style.width=l/14*100+"%",beautifyPiano(visualizer.svgPiano),visualizer.svgPiano.style.touchAction="none";const e=visualizer.parentElement;e.style.width="100%",e.style.height="40vh",e.style.paddingTop="40vh",e.style.overflowY="hidden",resize()}class MagentaPlayer extends core.SoundFontPlayer{constructor(e,t,n){const s="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus",o={run:e=>t(e),stop:()=>n()};super(s,void 0,void 0,void 0,o),this.ns=e,this.output.volume.value=20*Math.log(.5)/Math.log(10)}loadSamples(e){return super.loadSamples(e).then(()=>{this.synth=!0})}start(e){return super.start(e)}restart(e){return e?super.start(ns,void 0,e/ns.ticksPerQuarter):this.start(this.ns)}resume(e){super.resume(),this.seekTo(e)}changeVolume(e){e==0?e=-100:e=20*Math.log(e/100)/Math.log(10),this.output.volume.value=e}changeMute(e){this.output.mute=e}}class SoundFontPlayer{constructor(e){this.context=new AudioContext,this.state="stopped",this.noCallback=!1,this.stopCallback=e,this.prevGain=.5,this.cacheUrls=new Array(128),this.totalTicks=0}async loadSoundFontDir(e,t){const n=e.map(e=>{const s=e.toString().padStart(3,"0"),n=`${t}/${s}.sf3`;return this.cacheUrls[e]==n||(this.cacheUrls[e]=n,this.fetchBuffer(n))}),s=await Promise.all(n);for(const e of s)e instanceof ArrayBuffer&&await this.loadSoundFontBuffer(e)}async fetchBuffer(e){const t=await fetch(e);return t.status==200?await t.arrayBuffer():void 0}async loadSoundFontUrl(e){const t=await this.fetchBuffer(e),n=await this.loadSoundFontBuffer(t);return n}async loadSoundFontBuffer(e){if(!this.synth){await JSSynthPromise,await this.context.audioWorklet.addModule("https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/externals/libfluidsynth-2.3.0-with-libsndfile.min.js"),await this.context.audioWorklet.addModule("https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/dist/js-synthesizer.worklet.min.js"),this.synth=new JSSynth.AudioWorkletNodeSynthesizer,this.synth.init(this.context.sampleRate);const e=this.synth.createAudioNode(this.context);e.connect(this.context.destination)}const t=await this.synth.loadSFont(e);return t}async loadNoteSequence(e){await this.synth.resetPlayer(),this.ns=e;const t=core.sequenceProtoToMidi(e);return this.totalTicks=this.calcTick(e.totalTime),this.synth.addSMFDataToPlayer(t)}resumeContext(){this.context.resume()}async restart(e){this.state="started",await this.synth.playPlayer(),e&&this.seekTo(e),await this.synth.waitForPlayerStopped(),await this.synth.waitForVoicesStopped(),this.state="paused",this.noCallback||(player.seekTo(0),this.stopCallback()),this.noCallback=!1}async start(e,t,n){e&&await this.loadNoteSequence(e),n&&this.seekTo(n),this.restart()}stop(e){e&&(this.noCallback=!0),this.synth&&this.synth.stopPlayer()}pause(){this.state="paused",this.noCallback=!0,this.synth.stopPlayer()}resume(e){this.restart(e)}changeVolume(e){e=e/100,this.synth.setGain(e)}changeMute(e){e?(this.prevGain=this.synth.getGain(),this.synth.setGain(0)):this.synth.setGain(this.prevGain)}calcTick(e){let t=0,n=0,s=120;for(const i of this.ns.tempos){const o=i.time,a=i.qpm;if(o<e){const e=o-n;t+=s/60*e*this.ns.ticksPerQuarter}else{const o=e-n;return t+=s/60*o*this.ns.ticksPerQuarter,Math.round(t)}n=o,s=a}const o=e-n;return t+=s/60*o*this.ns.ticksPerQuarter,Math.floor(t)}seekTo(e){const t=this.calcTick(e);this.synth.seekPlayer(t)}isPlaying(){return!!this.synth&&this.synth.isPlaying()}getPlayState(){return this.synth?this.synth.isPlaying()?"started":this.state:"stopped"}}function stopCallback(){clearInterval(timer),currentTime=0,currentPos=0,initSeekbar(ns,0),visualizer.parentElement.scrollTop=visualizer.parentElement.scrollHeight,clearPlayer();const e=document.getElementById("repeat"),t=e.classList.contains("active");t&&play(),scoring(),scoreModal.show(),[...visualizer.svg.getElementsByClassName("fade")].forEach(e=>{e.classList.remove("fade")}),visualizer.clearActiveNotes()}function noteOffByElement(e){const t=e.children,n=parseInt(t[1].getAttribute("data-pitch")),s=parseInt(t[0].getAttribute("height"));synthesizer.resumeContext(),synthesizer.synth.midiNoteOff(0,n),countKeyPressOff(n);const o=t[0].getAttribute("class");o=="white"?t[1].setAttribute("height",s*.95):t[1].setAttribute("height",s*.85)}async function initPianoEvent(e){synthesizer=new SoundFontPlayer(stopCallback),await loadSoundFont(synthesizer,e),initSynthesizerProgram();const t=[...visualizer.svgPiano.children];t.forEach(e=>{const t=e.children,n=parseInt(t[1].getAttribute("data-pitch")),s=parseInt(t[0].getAttribute("height"));function o(){synthesizer.resumeContext(),synthesizer.synth.midiNoteOff(0,n),countKeyPressOff(n);const e=t[0].getAttribute("class");e=="white"?t[1].setAttribute("height",s*.95):t[1].setAttribute("height",s*.85)}function i(e){synthesizer.resumeContext();const o=e.pressure!==void 0?e.pressure:e.force!==void 0?e.force:1,i=Math.ceil(o*127);synthesizer.synth.midiNoteOn(0,n,i),countKeyPressOn(n),t[1].setAttribute("height",s*.975)}if("ontouchstart"in window){const t=new Map;e.addEventListener("touchmove",e=>{const n=e.changedTouches;for(let o=0;o<n.length;o++){const e=n[o],a=e.clientX,r=e.clientY,i=document.elementsFromPoint(a,r).find(e=>e.tagName=="rect"),s=t.get(e.identifier);if(i){const n=i.parentNode;s!=n&&(t.set(e.identifier,n),s&&(noteOffByElement(s),n.dispatchEvent(new Event("touchstart"))))}else s&&(t.delete(e.identifier),noteOffByElement(s))}}),e.addEventListener("touchstart",i),e.addEventListener("touchend",e=>{const n=e.changedTouches;for(let e=0;e<n.length;e++){const s=n[e].identifier,i=t.get(s);i?(noteOffByElement(i),t.delete(s)):o()}})}else e.addEventListener("mouseenter",e=>{mouseDowned&&i(e)}),e.addEventListener("mousedown",i),e.addEventListener("mouseleave",o),e.addEventListener("mouseup",o)}),"ontouchstart"in window||(document.addEventListener("mouseup",()=>{mouseDowned=!1}),document.addEventListener("mousedown",()=>{mouseDowned=!0}))}async function initPlayer(){disableController(),player&&player.stop(!0),clearPlayer(),currentTime=0,currentPos=0,initSeekbar(ns,0),player=new SoundFontPlayer(stopCallback),firstRun?(firstRun=!1,await loadSoundFont(player,"GeneralUser_GS_v1.471"),await player.loadNoteSequence(ns),await initPianoEvent("GeneralUser_GS_v1.471")):(await loadSoundFont(player),await player.loadNoteSequence(ns),await initPianoEvent()),enableController()}function getPrograms(e){const t=new Set;return e.notes.forEach(e=>t.add(e.program)),e.notes.some(e=>e.isDrum)&&t.add(128),[...t]}async function loadSoundFont(e,t,n){if(!t){const e=document.getElementById("soundfonts"),n=e.selectedIndex;if(n==0)return;t=e.options[n].value}const s=`https://soundfonts.pages.dev/${t}`;n||(n=getPrograms(ns)),await e.loadSoundFontDir(n,s)}function checkNoteEvent(){const e=ns.notes;if(e.length<=currentPos)return;const t=e[currentPos].startTime;if(t<=currentTime){let n=currentPos+1;for(;e.length<n&&t==e[n].startTime;)n+=1;visualizer.redraw(e[currentPos],currentPos),currentPos=n}}function setTimer(e){const n=1,s=Date.now()-e*1e3,t=ns.totalTime;clearInterval(timer),timer=setInterval(()=>{const e=(Date.now()-s)/1e3;if(Math.floor(currentTime)!=Math.floor(e)&&updateSeekbar(e),currentTime=e,currentTime<t){const e=1-currentTime/t;visualizer.parentElement.scrollTop=currentScrollHeight*e,player instanceof SoundFontPlayer&&checkNoteEvent()}else clearInterval(timer)},n)}function setLoadingTimer(e){const t=setInterval(()=>{player.isPlaying()&&(clearInterval(t),player.seekTo(e),setTimer(e),enableController())},10)}function disableController(){controllerDisabled=!0;const e=document.getElementById("controller").querySelectorAll("button, input");[...e].forEach(e=>{e.disabled=!0})}function enableController(){controllerDisabled=!1;const e=document.getElementById("controller").querySelectorAll("button, input");[...e].forEach(e=>{e.disabled=!1})}function unlockAudio(){if(!player)return;if(!player.synth)return;if(!synthesizer)return;if(!synthesizer.synth)return;player.resumeContext(),synthesizer.resumeContext(),document.removeEventListener("click",unlockAudio)}function play(){switch(tapCount=perfectCount=greatCount=0,disableController(),document.getElementById("play").classList.add("d-none"),document.getElementById("pause").classList.remove("d-none"),player.getPlayState()){case"stopped":initSeekbar(ns,currentTime),setLoadingTimer(currentTime),player.restart();break;case"started":case"paused":player.resume(currentTime),setTimer(currentTime),enableController();break}window.scrollTo({top:visualizer.svgPiano.getBoundingClientRect().top,behavior:"auto"})}function pause(){player.pause(),clearPlayer()}function clearPlayer(){clearInterval(timer),document.getElementById("play").classList.remove("d-none"),document.getElementById("pause").classList.add("d-none")}function getRadioboxString(e,t){return`
<div class="form-check form-check-inline">
  <label class="form-check-label">
    <input class="form-check-input" name="${e}" value="${t}" type="radio">
    ${t}
  </label>
</div>`}function getCheckboxString(e,t){return`
<div class="form-check form-check-inline">
  <label class="form-check-label">
    <input class="form-check-input" name="${e}" value="${t}" type="checkbox" checked>
    ${t}
  </label>
</div>`}function setInstrumentsCheckbox(e){const t=new Set;ns.notes.forEach(n=>{n.program==e&&t.add(n.instrument)});let n="";[...t].sort((e,t)=>e-t).forEach(e=>{n+=getCheckboxString("instrument",e)});const o=(new DOMParser).parseFromString(n,"text/html"),s=document.getElementById("filterInstruments");s.replaceChildren(...o.body.children),[...s.querySelectorAll("input")].forEach(e=>{e.addEventListener("change",changeInstrumentsCheckbox)})}function setRectOpacity(){const n=parseInt(document.forms.filterPrograms.elements.program.value),s=document.getElementById("filterInstruments").querySelectorAll("input"),t=new Map;[...s].forEach(e=>{t.set(parseInt(e.value),e.checked)});const e=visualizer.svg.children;ns.notes.forEach((s,o)=>{s.program!=n?(s.target=!1,s.velocity=nsCache.notes[o].velocity,e[o].setAttribute("opacity",.1)):t.get(s.instrument)?(s.target=!0,s.velocity=1,e[o].setAttribute("opacity",1)):(s.target=!1,s.velocity=nsCache.notes[o].velocity,e[o].setAttribute("opacity",.1))})}async function changeInstrumentsCheckbox(e){const s=e.target.checked,o=parseInt(e.target.value),t=visualizer.svg.children;ns.notes.forEach((e,n)=>{e.instrument==o&&(s?(e.target=!0,e.velocity=1,t[n].setAttribute("opacity",1)):(e.target=!1,e.velocity=nsCache.notes[n].velocity,t[n].setAttribute("opacity",.1)))});const n=currentTime,i=player.getPlayState();player.stop(!0),clearInterval(timer),i=="started"?(setLoadingTimer(n),player.start(ns)):player instanceof SoundFontPlayer&&(await player.loadNoteSequence(ns),player.seekTo(n))}function initSynthesizerProgram(){const e=document.getElementById("filterPrograms"),t=parseInt(e.querySelector("input").value);synthesizer.synth.midiProgramChange(0,t)}function setProgramsRadiobox(){const e=new Set;ns.notes.forEach(t=>e.add(t.program));let t="";[...e].sort().forEach(e=>{t+=getRadioboxString("program",e)});const s=(new DOMParser).parseFromString(t,"text/html"),n=document.getElementById("filterPrograms");n.replaceChildren(...s.body.children),[...n.querySelectorAll("input")].forEach((e,t)=>{e.addEventListener("change",changeProgramsRadiobox),t==0&&(e.checked=!0,e.dispatchEvent(new Event("change")))})}function changeProgramsRadiobox(e){const t=parseInt(e.target.value);synthesizer&&synthesizer.synth&&synthesizer.synth.midiProgramChange(0,t);const n=visualizer.svg.children;ns.notes.forEach((e,s)=>{e.program==t?(e.target=!0,e.velocity=1,n[s].setAttribute("opacity",1)):(e.target=!1,e.velocity=nsCache.notes[s].velocity,n[s].setAttribute("opacity",.1))}),setInstrumentsCheckbox(t)}function speedDown(){player.isPlaying()&&disableController();const e=document.getElementById("speed"),t=parseInt(e.value)-10,n=t<=0?1:t;e.value=n,changeSpeed(n)}function speedUp(){player.isPlaying()&&disableController();const e=document.getElementById("speed"),t=parseInt(e.value)+10;e.value=t,changeSpeed(t)}async function changeSpeed(e){if(perfectCount=greatCount=0,!ns)return;const n=player.getPlayState();player.stop(!0),clearInterval(timer);const s=nsCache.totalTime/ns.totalTime,o=s/(e/100),t=currentTime*o;setSpeed(ns,e),initSeekbar(ns,t),n=="started"?(setLoadingTimer(t),player.start(ns)):player instanceof SoundFontPlayer&&(await player.loadNoteSequence(ns),player.seekTo(t))}function changeSpeedEvent(e){player.isPlaying()&&disableController();const t=parseInt(e.target.value);changeSpeed(t)}function setSpeed(e,t){t<=0&&(t=1),t/=100;const o=nsCache.controlChanges;e.controlChanges.forEach((e,n)=>{e.time=o[n].time/t});const n=nsCache.tempos;e.tempos.forEach((e,s)=>{e.time=n[s].time/t,e.qpm=n[s].qpm*t});const i=nsCache.timeSignatures;e.timeSignatures.forEach((e,n)=>{e.time=i[n].time/t});const s=nsCache.notes;e.notes.forEach((e,n)=>{e.startTime=s[n].startTime/t,e.endTime=s[n].endTime/t}),e.totalTime=nsCache.totalTime/t}function repeat(){document.getElementById("repeat").classList.toggle("active")}function volumeOnOff(){const t=document.getElementById("volumeOnOff").firstElementChild,e=document.getElementById("volumebar");t.classList.contains("bi-volume-up-fill")?(t.className="bi bi-volume-mute-fill",e.dataset.value=e.value,e.value=0,player.changeMute(!0)):(t.className="bi bi-volume-up-fill",e.value=e.dataset.value,player.changeMute(!1))}function changeVolumebar(){const e=document.getElementById("volumebar"),t=parseInt(e.value);e.dataset.value=t,player.changeVolume(t)}function formatTime(e){e=Math.floor(e);const n=e%60,t=(e-n)/60,s=(e-n-60*t)/3600,o=String(n).padStart(2,"0"),i=t>9||!s?`${t}:`:`0${t}:`,a=s?`${s}:`:"";return`${a}${i}${o}`}function changeSeekbar(e){perfectCount=greatCount=0,clearInterval(timer),[...visualizer.svg.getElementsByClassName("fade")].forEach(e=>{e.classList.remove("fade")}),visualizer.clearActiveNotes(),currentTime=parseInt(e.target.value),currentTime==0?currentPos=0:currentPos=searchNotePosition(ns.notes,currentTime),document.getElementById("currentTime").textContent=formatTime(currentTime),seekScroll(currentTime),player.getPlayState()=="started"&&(player.seekTo(currentTime),setTimer(currentTime))}function updateSeekbar(e){const t=document.getElementById("seekbar");t.value=e;const n=formatTime(e);document.getElementById("currentTime").textContent=n}function initSeekbar(e,t){document.getElementById("seekbar").max=e.totalTime,document.getElementById("seekbar").value=t,document.getElementById("totalTime").textContent=formatTime(e.totalTime),document.getElementById("currentTime").textContent=formatTime(t)}function loadSoundFontList(){return fetch("https://soundfonts.pages.dev/list.json").then(e=>e.json()).then(e=>{const t=document.getElementById("soundfonts");e.forEach(e=>{const n=document.createElement("option");n.textContent=e.name,e.name=="GeneralUser_GS_v1.471"&&(n.selected=!0),t.appendChild(n)})})}async function changeConfig(){switch(player.getPlayState()){case"started":{player.stop(!0),player instanceof SoundFontPlayer&&(await loadSoundFont(player),await player.loadNoteSequence(ns),await loadSoundFont(synthesizer));const t=parseInt(document.getElementById("speed").value);setSpeed(ns,t);const e=parseInt(document.getElementById("seekbar").value);initSeekbar(ns,e),setLoadingTimer(e),player.start(ns);break}case"paused":configChanged=!0;break}}function resize(){const e=visualizer.parentElement,t=e.getBoundingClientRect().height;currentScrollHeight=e.scrollHeight-t,seekScroll(currentTime)}function seekScroll(e){const t=(ns.totalTime-e)/ns.totalTime;visualizer.parentElement.scrollTop=currentScrollHeight*t}function typeEvent(e){if(!player||!player.synth)return;if(controllerDisabled)return;switch(player.resumeContext(),e.code){case"Space":e.preventDefault(),player.getPlayState()=="started"?pause():play();break}}function countKeyPressOn(e){const t=currentTime,o=.1,i=t-longestDuration,a=t+o;let n=searchNotePosition(ns.notes,i);n<0&&(n=0);const r=searchNotePosition(ns.notes,a),s=ns.notes.slice(n,r+1).filter(t=>!!t.target&&t.pitch==e);s.length>0?s.slice(-1).forEach(e=>{e.pressed=t,tapCount+=1}):tapCount+=1}function countKeyPressOff(e){const t=currentTime,o=t-longestDuration;let n=searchNotePosition(ns.notes,o);n<0&&(n=0);const i=searchNotePosition(ns.notes,t),s=[];for(let t=n;t<=i;t++){const o=ns.notes[t];if(!o.target)continue;if(o.pitch!=e)continue;if(!o.pressed)continue;s.push(t)}s.forEach(e=>{const n=ns.notes[e],s=(t-n.pressed)/(n.endTime-n.startTime);n.pressed=!1,s>.5?perfectCount+=1:greatCount+=1})}function getAccuracy(){return tapCount==0?0:(perfectCount+greatCount)/tapCount}function scoring(){const a=getAccuracy(),t=tapCount-perfectCount-greatCount,r=Math.ceil(perfectCount/tapCount*1e4)/100,s=Math.ceil(greatCount/tapCount*1e4)/100,o=Math.ceil(t/tapCount*1e4)/100,i=perfectCount*2+greatCount,n=parseInt(document.getElementById("speed").value),e=parseInt(i*n*a);document.getElementById("perfectCount").textContent=perfectCount,document.getElementById("greatCount").textContent=greatCount,document.getElementById("missCount").textContent=t,document.getElementById("perfectRate").textContent=r+"%",document.getElementById("greatRate").textContent=s+"%",document.getElementById("missRate").textContent=o+"%",document.getElementById("score").textContent=e;const c=document.getElementById("midiTitle").textContent,l=document.getElementById("composer").textContent,d=`${c} ${l}`,u=encodeURIComponent(`Doremi Piano! ${d}: ${e}`),h="https://marmooo.github.com/doremi-piano/",m=`https://twitter.com/intent/tweet?text=${u}&url=${h}&hashtags=DoremiPiano`;document.getElementById("twitter").href=m}function initQuery(){const e=new URLSearchParams;return e.set("title","When the Swallows Homeward Fly (Agathe)"),e.set("composer","Franz Wilhelm Abt"),e.set("maintainer","Stan Sanderson"),e.set("license","Public Domain"),e}function changeInstrument(e){if(!synthesizer)return;if(!synthesizer.synth)return;const t=e.target.selectedIndex-1;if(t<0){const e=document.getElementById("filterPrograms"),t=parseInt(e.querySelector("input").value);synthesizer.synth.midiProgramChange(0,t)}else loadSoundFont(synthesizer,void 0,[t]),synthesizer.synth.midiProgramChange(0,t)}async function loadInstrumentList(){const e=await fetch(`instruments.lst`),t=await e.text(),n=document.getElementById("instruments");t.trimEnd().split(`
`).forEach(e=>{const t=document.createElement("option");t.textContent=e,n.appendChild(t)})}function loadLibraries(e){const t=e.map(e=>new Promise((t,n)=>{const s=document.createElement("script");s.src=e,s.async=!0,s.onload=t,s.onerror=n,document.body.appendChild(s)}));return Promise.all(t)}const pianoKeyIndex=new Map;let controllerDisabled,colorful=!0,currentTime=0,currentPos=0,currentScrollHeight,ns,nsCache,timer,player,visualizer,synthesizer,tapCount=0,perfectCount=0,greatCount=0,firstRun=!0,mouseDowned=!1;if(loadConfig(),location.search)loadMIDIFromUrlParams();else{const e=initQuery();loadMIDIFromUrl("abt.mid",e)}loadSoundFontList(),loadInstrumentList();const scoreModal=new bootstrap.Modal("#scorePanel",{backdrop:"static",keyboard:!1});Module={};const JSSynthPromise=loadLibraries(["https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/dist/js-synthesizer.min.js","https://cdn.jsdelivr.net/npm/js-synthesizer@1.8.5/externals/libfluidsynth-2.3.0-with-libsndfile.min.js"]);document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("toggleColor").onclick=toggleRectColor,document.ondragover=e=>{e.preventDefault()},document.ondrop=dropFileEvent,document.getElementById("play").onclick=play,document.getElementById("pause").onclick=pause,document.getElementById("speed").onchange=changeSpeedEvent,document.getElementById("speedDown").onclick=speedDown,document.getElementById("speedUp").onclick=speedUp,document.getElementById("repeat").onclick=repeat,document.getElementById("volumeOnOff").onclick=volumeOnOff,document.getElementById("volumebar").onchange=changeVolumebar,document.getElementById("seekbar").onchange=changeSeekbar,document.getElementById("inputMIDIFile").onchange=loadMIDIFileEvent,document.getElementById("inputMIDIUrl").onchange=loadMIDIUrlEvent,document.getElementById("inputSoundFontFile").onchange=loadSoundFontFileEvent,document.getElementById("inputSoundFontUrl").onchange=loadSoundFontUrlEvent,document.getElementById("soundfonts").onchange=changeConfig,document.getElementById("instruments").onchange=changeInstrument,document.addEventListener("keydown",typeEvent),window.addEventListener("resize",resize),document.addEventListener("click",unlockAudio)