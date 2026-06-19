export const speakFeedback = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); //stops any ongoing speech before starting new one
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05; //speed of speech- 1 is normal, >1 is faster, <1 is slower
    utterance.pitch = 1.0; //pitch of speech- 1 is normal, >1 is higher, <1 is lower
    window.speechSynthesis.speak(utterance); //speak it- sends to browser voice engine
  }
};
