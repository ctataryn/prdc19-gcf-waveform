const { Storage } = require('@google-cloud/storage');
const bucketName = 'prdc19-audio-upload';
const storage = new Storage();
const uploadBucket = storage.bucket(bucketName);
const { transcodeFile } = require('./lib/util');
const util = require('util');

exports.generateUploadLink = async (req, res) => {
  let id = req.query.id || req.body.id;

  console.log(`Request to create link for id ${id}`);

  let file = uploadBucket.file(`${id}.mp3`);

  try {
    let signedUrl = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + (30 * 1000),
      contentType: 'audio/mpeg'
    });
    res.status(200).json({ status: 'OK', url: signedUrl[0] });
  } catch(err) {
    console.log(`Error while getting signed url: ${err}`);
    res.status(500).json({ status: 'FAIL', message: `Could not generate signed upload url for: ${id}`, error: err});
  }
  return;
}

exports.generateWaveform = async (file, context) => {
  console.log(util.inspect(file, false, null));
  if (file.metageneration !== '1') {
    console.log(`Exiting because of file state: metageneration=${file.metageneration}`);
    return;
  }
  
  const id = file.name.substring(0, file.name.lastIndexOf('.mp3'));
  let mp3File = uploadBucket.file(file.name);
  if (id) {
    return await transcodeFile(id, mp3File).then( () => {
      console.log('waveform generated');
    });
  }
};


