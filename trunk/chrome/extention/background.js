chrome.extension.onRequest.addListener(function(request) {
  chrome.tts.speak(request.text);
});