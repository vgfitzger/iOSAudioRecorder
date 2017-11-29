const crypto = require('crypto');
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
require("./recorder.scss")


if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('getUserMedia() must be run from a secure origin: https or localhost.\nChanging protocol to https.');
}
if (!navigator.mediaDevices && !navigator.getUserMedia) {
    console.warn('Your browser doesn\'t support navigator.mediaDevices.getUserMedia and navigator.getUserMedia.');
}

class Recorder extends Component {
    constructor(props)
    {
        super(props)
        this.state = {
            stream: null,
            recording:false,
            hasBlob:false
        };
        this.stream = null;
        this.recording = false;
        this.leftAudio = [];
        //only support mono
        this.rightAudio = [];
        this.recordingLength = 0;
        this.bufferSize = 2048;
        this.blobUrl = "";
        this.recorder = null;
        this.blob = "";
        this.ac = null;
        this.sampleRate = 44100/2;
        this.componentDidMount = this.componentDidMount.bind(this);
        this.render = this.render.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.createWAV = this.createWAV.bind(this);
        this.handleSuccess = this.handleSuccess.bind(this);
        this.download = this.download.bind(this);
        this.recorderProcess = this.recorderProcess.bind(this);
    }
    componentDidMount(){
        var self = this;
    }
    recorderProcess(e){
        function convertFloat32ToInt16(buffer) {
            var l = buffer.length;
            var buf = new Int16Array(l);
            while (l--) {
                buf[l] = Math.min(1, buffer[l])*0x7FFF;
            }
            return buf.buffer;
        }
        var left = e.inputBuffer.getChannelData(0);
        // we clone the samples
        this.leftAudio.push (new Float32Array (left));
        this.recordingLength += this.bufferSize;
        console.log("processed")
    }
    handleSuccess(stream){
        var self = this;
        self.stream = stream;
        var ac = this.ac;
        var recorder = this.recorder;
        var source = ac.createMediaStreamSource(stream)
        source.connect(recorder);
        recorder.connect(ac.destination);



    }
    start(){


        var self = this;
        if( this.recording ){
            return;
        }else{
            this.setState({recording:true})
            this.recording = true;
        }

        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var context = new AudioContext();

        var recorder = context.createScriptProcessor( self.bufferSize, 1, 1 );
        recorder.onaudioprocess = self.recorderProcess;
        self.recorder = recorder;


        this.ac = context;

        this.audioData = [];
        this.leftAudio = [];
        this.rightAudio = [];
        this.recordingLength = 0;
        this.blobUrl = null;
        this.blob = null;
        var constraints = { audio: true };

        //couldn't start stream
        var handleFailed = function( err ){
            console.log(err)
            alert("Audio Stream Failed"+err.name)
        }
        //Get the media devices for this browser
        if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia(constraints).then(this.handleSuccess).catch(handleFailed);
        } else if (navigator.getUserMedia) {
            navigator.getUserMedia(constraints, this.handleSuccess, handleFailed);
        } else {
            this.setState({errMessage : 'Browser doesn\'t support UserMedia API. Please try with another browser (Safari for mobile iOS).'});
        }
        return;

    }
    stop(){
        if( ! this.recording ){
            return;
        }else{
            this.setState({recording:false})
            this.recording = false;
        }
        if( this.stream ){
            this.stream.getAudioTracks().forEach(function (track) {
                console.log('test')
                track.stop();
            });
            this.stream = null;
        }
        if( this.ac ){
            this.ac.close();
        }
        var audio = this.refs.outputpreview;
        var left = this.mergeBuffers(this.leftAudio, this.recordingLength)
        //var right = this.mergeBuffers(this.rightAudio, this.recordingLength)
        //var interleaved = this.interleave( left, right );
        var blob = this.createWAV(left);
        var blobUrl = URL.createObjectURL(blob);

        var audio = this.refs.outputpreview;
        this.blob = blob;
        this.blobUrl = blobUrl;
        console.log("test",blobUrl)
        console.log("test blob",blob)
        var audioContext = new (window.AudioContext || window.webkitAudioContext);
        audioContext.close();
        audio.src = blobUrl;
        this.setState({hasBlob:true})

    }
    download(){
        var data = (window.URL || window.webkitURL).createObjectURL(this.blob);

        var downloadLink = document.createElement('a');
        downloadLink.setAttribute('href', data );
        downloadLink.setAttribute('download', 'audio.wav' );
        downloadLink.click();
    }

    mergeBuffers(channelBuffer, recordingLength){
        var result = new Float32Array(recordingLength);
        var offset = 0;
        var lng = channelBuffer.length;
        for (var i = 0; i < lng; i++){
            var buffer = channelBuffer[i];
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    createWAV(interleaved){
        function writeUTFBytes(view, offset, string){
            var lng = string.length;
            for (var i = 0; i < lng; i++){
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }
        // we create our wav file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, 2, true);
        view.setUint32(24, this.sampleRate, true);
        view.setUint32(28, this.sampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        // write the PCM samples
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++){
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }

        var blob = new Blob ( [ view ], { type : 'audio/wav' } );
        return blob;
    }
    render() {
        return (
            <div className="recorder" style={{padding:"10px"}}>
                <h2>iOS Audio Recorder</h2>
                <div className="recorderButtons">
                    <a onClick={this.start} data-active={! this.state.recording}>Record</a>
                    <a onClick={this.stop} data-active={this.state.recording}>Save</a>
                    <a onClick={this.download} data-active={this.state.hasBlob}>Download</a>
                </div>
                <br/>
                <br/>
                <br/>
                <div className="outputPreview">
                    <audio controls ref="outputpreview"></audio>
                </div>
                <div className="errorMessage">{this.state.errMessage}</div>
            </div>
        )
    }
}

module.exports = Recorder