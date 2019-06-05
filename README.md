![MP3 to Waveform](/assets/images/mp3towaveform.png?raw=true "MP3 to Waveform")

# Introduction
This codebase is for a talk at [Prairie Dev Con](http://www.prairiedevcon.com/) in June 2019. Slides can be [found here](/slides/PrDC19%20-%20Google%20Cloud%20Functions.pdf?raw=true). The demo will take an MP3 file and generate a waveform png via ffmpeg up on Google Cloud Platform.

`prdc-generateUploadLink` - Generates a "signed URL" that a user will be able to POST an MP3 to. The MP3 is placed in a bucket called `prdc19-audio-upload`.

`prdc-generateWaveform` - Is triggered from MP3s being placed in the `prdc19-audio-upload` bucket and will generate a waveform png into the `prdc19-waveform` bucuket and will pass back a link to it.

# Running the demo

## Prerequisites

1. [Install gcloud SDK](https://cloud.google.com/sdk/docs/quickstarts) for your chosen platform
1. Google Cloud Platform Service account
   1. The service account must have the following IAM role:
      * `Service Account Token Creator`
1. Google Cloud Function & Google Cloud Storage must be enabled
1. Create two GCS buckets: `prdc-audio-upload` & `prdc-waveform`
   * The `prdc-waveform` bucket should have `allUsers` read-access such that the pngs being generated are accessible publically

## Clone this repository

`git clone git@github.com:ctataryn/prdc19-gcf-waveform.git`

## Deploy

`gcloud functions deploy prdc-generateUploadLink --entry-point generateUploadLink --memory 128MB --runtime nodejs8 --timeout 10s --trigger-http`
`gcloud functions deploy prdc-generateWaveform --entry-point generateWaveform --memory 1024MB --runtime nodejs8 --timeout 540s --trigger-bucket prdc19-audio-upload`

## Invoking

To generate an upload link for an MP3:
`https://us-central1-crowdscriber.cloudfunctions.net/prdc-generateUploadLink?id=this-is-a-test-id`

To upload the MP3 and generate a waveform png:
`curl -X put -H 'Content-Type: audio/mpeg' --upload-file ./mp3s/test000.mp3 <upload link>`

This will upload an MP3 to the `prdc-audio-upload` bucket. The `prdc-generateWaveform` function will
then be triggered, create the waveform png and then send a `POST` request to the url specified in the `lib/util.js`
If you don't have the ability to receive the notification, then just refresh the bucket in the Google Cloud
Platform Web Console until the png appears.

