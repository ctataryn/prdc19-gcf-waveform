const os = require('os');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const transcodedBucket = storage.bucket('prdc19-waveform');

exports.transcodeFile = async (id, mp3File) => {
  const transcodedFile = transcodedBucket.file(mp3File.name.replace('.mp3', '.png'));

  return new Promise((resolve, reject) => {
    // Open write stream to new bucket, modify the filename as needed.
    const remoteWriteStream = transcodedFile
    .createWriteStream({
      metadata: {
        contentType: 'image/png' // This could be whatever else you are transcoding to
      },
    });

    // Open read stream to our uploaded file
    const remoteReadStream = mp3File.createReadStream();
    console.log(`About to call ffmpeg with file: ${mp3File.name}`);
    const tempFile = path.join(os.tmpdir(), transcodedFile.name);
    // Transcode
    ffmpeg()
      .input(remoteReadStream)
      //.withOutputFormat('png')
      //.withAudioChannels(1)
      .withInputFormat('mp3')
      .audioFilters('aresample=8000')
      .complexFilter({
      	filter: "showwavespic",
        options: {s: "576x432", colors: "#2fa9e0", scale: "sqrt"}
       })
      .frames(1)
      .on('start', (cmdLine) => {
          console.log(`Started ffmpeg with command:' ${cmdLine}`);
      })
      .on('end', () => {
          console.log('Successfully transcoded audio.');
          //reportProgress(contentId, "done", undefined, undefined, data, attrs);
      	  transcodedBucket.upload(tempFile, { destination: transcodedFile.name }, (err, file) => {
	        if (!err) {
    	      console.log('Waveform uploaded!');
        	} else {
          		console.error('Waveform upload error: ' + err.message);
        	}
      	  });
          resolve();
      })
      .on('error', (err, stdout, stderr) => {
          console.error('An error occured during encoding', err.message);
          console.error('stdout:', stdout);
          console.error('stderr:', stderr);
          //reportProgress(contentId, "error", undefined, undefined, data, attrs);
          reject(err);
      })
      .save(tempFile); // end: true, emit end event when readable stream ends
  });
}

exports.notify = async(status, msg) => {
  const rp = require('request-promise-native');
  const progressUri = 'http://grindsoftware-38203.portmap.io:38203/progress';
  console.log(`Reporting progress to: ${progressUri}`);
  const reqObj = {status, msg};
  
  return rp.post({
    method: 'POST',
    url: progressUri,
    json: reqObj
  });

}