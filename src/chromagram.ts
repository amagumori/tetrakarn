import FFT from 'fft.js'

export default class Chromagram {
  private referenceFreq: number
  private bufferSize: number
  private numHarmonics: number
  private numOctaves: number
  private numBinsToSearch: number

  private samplingFrequency: number
  private inputFrameSize: number
  private downsampledFrameSize: number
  private numSamplesSinceLastCalc: number
  private chromaCalcInterval: number
  private chromaReady: boolean 

  private buffer: Array<number>
  private window: Array<number>
  private noteFrequencies: Array<number>
  private magnitudeSpectrum: Array<number>
  private downsampledInputFrame: Array<number>
  private fft     // no typings
  private fftInput: Array<number>
  private fftOutput: Array<number>
  private chromagram: Array<number>

  constructor( frameSize: number, fs: number ) {
    this.referenceFreq = 130.81278265
    this.bufferSize = 8192
    this.numHarmonics = 2
    this.numOctaves = 2
    this.numBinsToSearch = 2

    let size = this.bufferSize

    this.noteFrequencies = new Array<number>()
    for ( let i=0; i < 12; i++ ) {
      // a cast is not required here since no int / float distinction
      this.noteFrequencies[i] = this.referenceFreq * Math.pow(2, ( i % 12 ) )
    }

    this.fft = new FFT(size)

    this.buffer = new Array(size)
    this.window = new Array(size)
    //this.buffer = resize( this.buffer, this.bufferSize, 0 )
    this.fftInput = new Array(size)
    this.fftOutput = this.fft.createComplexArray()
    this.chromagram = new Array(12)
    this.magnitudeSpectrum = new Array( (size / 2) + 1 ) 

    this.makeHammingWindow()

    // es6 getters / setters for these probably
    this.samplingFrequency = fs
    this.inputFrameSize = frameSize
    this.downsampledInputFrame = new Array( frameSize / 4 )
    this.downsampledFrameSize = this.downsampledInputFrame.length
    this.numSamplesSinceLastCalc = 0
    this.chromaCalcInterval = 4096
    this.chromaReady = false
  }

  chompFrame( inputFrame: Array<number> ) {
    this.chromaReady = false

    this.downsampleFrame( inputFrame ) 

    for ( let i=0; i < this.bufferSize - this.downsampledFrameSize; i++ ) {
      this.buffer[i] = this.buffer[i + this.downsampledFrameSize]
    }

    var n: number = 0

    for ( let i= ( this.bufferSize - this.downsampledFrameSize ); i < this.bufferSize; i++ ) {
      this.buffer[i] = this.downsampledInputFrame[n]  
      n++
    }

    this.numSamplesSinceLastCalc += this.inputFrameSize

    if ( this.numSamplesSinceLastCalc >= this.chromaCalcInterval ) {
      this.calculateChromagram()

      this.numSamplesSinceLastCalc = 0
    }
  }

  calculateChromagram() {

    this.calculateMagnitudeSpectrum()

    var divisorRatio: number = ( ( this.samplingFrequency / 4.0 ) / this.bufferSize ) 

    for ( let n=0; n < 12; n++ ) {
      var chromaSum: number = 0.0
      for ( let octave=1; octave <= this.numOctaves; octave++ ) {
        var noteSum: number = 0.0

        for ( let harmonic=1; harmonic <= this.numHarmonics; harmonic++ ) {
          var centerBin = Math.round( (this.noteFrequencies[n] * octave * harmonic) / divisorRatio )
          var minBin = centerBin - ( this.numBinsToSearch * harmonic)
          var maxBin = centerBin + ( this.numBinsToSearch * harmonic)

          var maxVal: number = 0.0

          for ( let k=minBin; k < maxBin; k++ ) {
            if ( this.magnitudeSpectrum[k] > maxVal ) {
              maxVal = this.magnitudeSpectrum[k]
            }
          }

          noteSum += ( maxVal / harmonic ) 
        }

        chromaSum += noteSum
      }
      this.chromagram[n] = chromaSum
    }

    this.chromaReady = true
  }

  calculateMagnitudeSpectrum() {

    // create real-valued input array
    for ( var i=0; i < this.bufferSize; i++ ) {
      this.fftInput[i] = this.buffer[i] * this.window[i]
    }

    // convert to complex
    // this is a weird function signature.
    this.fft.toComplexArray(this.fftInput, this.fftInput)

    // execute fft
    this.fft.transform(this.fftOutput, this.fftInput)

    // iterate every other index to hit real part, not imaginary part
    for ( let j=0; j < (this.bufferSize / 2) + 1; j+=2 ) {
      // now this is an ugly one liner
      this.magnitudeSpectrum[j] = Math.sqrt( Math.pow( this.fftOutput[j], 2 ) + Math.pow(this.fftOutput[j+1], 2) )  
      this.magnitudeSpectrum[j] = Math.sqrt( this.magnitudeSpectrum[j] ) 
    }
  }

  downsampleFrame( inputAudioFrame: Array<number> ) {
    var filteredFrame = new Array<number>()
    var b0: number = 0.2929
    var b1: number = 0.5858
    var b2: number = 0.2929
    var a1: number = -0.0000
    var a2: number = 0.1716

    var x1: number = 0 
    var x2: number = 0 
    var y1: number = 0 
    var y2: number = 0 

    for ( let i=0; i < this.inputFrameSize; i++ ) { 
      filteredFrame[i] = inputAudioFrame[i] * b0 + x1 * b1 + x2 * b2 - y1 * a1 - y2 * a2
      x2 = x1
      x1 = inputAudioFrame[i]
      y2 = y1
      y1 = filteredFrame[i]
    }

    for ( let i=0; i < this.inputFrameSize / 4; i++ ) {
      this.downsampledInputFrame[i] = filteredFrame[i * 4]
    }
  }

  makeHammingWindow() {
    for ( let i=0; i < this.bufferSize; i++ ) {
      this.window[i] = 0.54 - 0.46 * Math.cos( 2 * Math.PI * ( i / this.bufferSize ) )
    }
  }

  round( val: number ) {
    return Math.floor( val + 0.5 ) 
  }

}
