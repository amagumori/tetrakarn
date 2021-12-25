

class ChordDetector { 
  private bias: number
  private chromagram: number[]
  private chordProfiles: number[][]
  private chord: number[]

  type: ChordType
  rootNote: number 
  intervals: number 

  constructor() { 
    this.bias = 1.06
    this.intervals = 0
    this.rootNote  = 0 
    this.chromagram = new Array<number>(12)
    this.chord = new Array<number>(108)
    // the typescript syntax REALLY gets in the way with shit like this
    this.chordProfiles = new Array<Array<number>>()
    for ( let i=0; i < 108; i++ ) { 
      let row: number[] = new Array<number>()
      for ( let j=0; j < 12; j++ ) {
        row.push(0)
      }
      this.chordProfiles.push(row)
    }
    this.type = ChordType.NONE
  }

  detectChord( chroma: Array<number> ) { 
    for ( let i=0; i < 12; i++ ) {
      this.chromagram[i] = chroma[i]
    }
    this.classify()
  }

  classify() { 
    var i: number
    var j: number
    var fifth: number
    var chordIndex: number

    for ( i=0; i < 12; i++ ) {
      fifth = ( i+7 ) % 12
      this.chromagram[fifth] = this.chromagram[fifth] - ( 0.1 * this.chromagram[i])

      if ( this.chromagram[fifth] < 0 ) { 
        this.chromagram[fifth] = 0 
      }
    }

    // MAJOR CHORD
    for ( j=0; j < 12; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 3 ) 
    }
    // MINOR CHORD
    for ( j=12; j < 24; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 3 ) 

    }
    // DIMINISHED 5TH
    for ( j=24; j < 36; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 3 ) 
    }
    // AUGMENTED 5TH
    for ( j=36; j < 48; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 3 ) 
    }
    // SUS2
    for ( j=48; j < 60; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], 1, 3 ) 

    }
    // SUS4
    for ( j=60; j < 72; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 3 ) 

    }
    // MAJOR 7TH
    for ( j=72; j < 84; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 4 ) 

    }
    // MINOR 7TH
    for ( j=84; j < 96; j++ ) { 
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 4 ) 

    }
    // DOMINANT 7TH
    for ( j=96; j < 108; j++ ) {
      this.chord[j] = this.calculateScore( this.chromagram, this.chordProfiles[j], this.bias, 4 ) 
    }

    chordIndex = this.minimumIndex( this.chord, 108 ) 

    // major
    if ( chordIndex < 12 ) {
      this.rootNote = chordIndex
      this.type = ChordType.MAJOR
      this.intervals = 0
    }

    // minor 
    if ( chordIndex >= 12 && chordIndex < 24 ) {
      this.rootNote = chordIndex - 12
      this.type = ChordType.MINOR
      this.intervals = 0
    }
    // dim5 
    if ( chordIndex >= 24 && chordIndex < 36 ) {
      this.rootNote = chordIndex - 24
      this.type = ChordType.DIM5
      this.intervals = 0
    }
    // dim5 
    if ( chordIndex >= 24 && chordIndex < 36 ) {
      this.rootNote = chordIndex - 24
      this.type = ChordType.DIM5
      this.intervals = 0
    }
    // aug5
    if ( chordIndex >= 36 && chordIndex < 48 ) {
      this.rootNote = chordIndex - 36
      this.type = ChordType.AUG5
      this.intervals = 0
    }
    // sus2
    if ( chordIndex >= 48 && chordIndex < 60 ) {
      this.rootNote = chordIndex - 48 
      this.type = ChordType.SUS
      this.intervals = 2 
    }
    // sus4 
    if ( chordIndex >= 60 && chordIndex < 72 ) {
      this.rootNote = chordIndex - 60
      this.type = ChordType.SUS
      this.intervals = 4  
    }
    // Maj7  
    if ( chordIndex >= 72 && chordIndex < 84 ) {
      this.rootNote = chordIndex - 72
      this.type = ChordType.MAJOR
      this.intervals = 7
    }
    // Min7 
    if ( chordIndex >= 84 && chordIndex < 96 ) {
      this.rootNote = chordIndex - 84 
      this.type = ChordType.MINOR
      this.intervals = 7  
    }
    // Dominant7
    if ( chordIndex >= 96 && chordIndex < 108 ) {
      this.rootNote = chordIndex - 96 
      this.type = ChordType.DOMINANT
      this.intervals = 7 
    }
  }

  calculateScore( chroma: Array<number>, chordProfile: Array<number>, bias: number, n: number ) {
    var sum: number = 0
    var delta: number

    for ( var i=0; i < 12; i++ ) {
      sum = sum + ( (1 - chordProfile[i]) * (chroma[i] * chroma[i]) )
    }
    delta = Math.sqrt(sum) / ( (12-n) * bias ) 

    return delta
  }

  minimumIndex( arr: Array<number>, length: number ) {
    var minValue: number = 100000
    var minIndex: number = 0

    for ( var i=0; i < length; i++ ) {
      if ( arr[i] < minValue ) { 
        minValue = arr[i]
        minIndex = i
      }
    }
    return minIndex
  }

  createChordProfiles() {
    var i: number
    var t: number
    var j: number = 0
    var root: number
    var third: number
    var fifth: number
    var seventh: number

    var v1: number = 1 
    var v2: number = 1 
    var v3: number = 1 

    for ( j=0; j < 108; j++ ) {
      for ( t=0; t < 12; t++ ) {
        this.chordProfiles[j][t] = 0
      }
    }

    j=0

    // maj
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+4) % 12
      fifth = (i+7) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3

      j++
    }
    // min
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+3) % 12
      fifth = (i+7) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3

      j++
    }
    // dim
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+3) % 12
      fifth = (i+6) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3

      j++
    }
    // aug
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+4) % 12
      fifth = (i+8) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3

      j++
    }
    // sus2 
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+2) % 12
      fifth = (i+7) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3

      j++
    }
    // sus4 
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+5) % 12
      fifth = (i+7) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3

      j++
    }
    // maj7 
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+4) % 12
      fifth = (i+7) % 12
      seventh = (i+11) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3
      this.chordProfiles[j][seventh] = v3

      j++
    }
    // min7 
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+3) % 12
      fifth = (i+7) % 12
      seventh = (i+10) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3
      this.chordProfiles[j][seventh] = v3

      j++
    }
    // dom7 
    for ( i=0; i < 12; i++ ) {
      root = i % 12
      third = (i+4) % 12
      fifth = (i+7) % 12
      seventh = (i+10) % 12

      this.chordProfiles[j][root] = v1
      this.chordProfiles[j][third] = v2
      this.chordProfiles[j][fifth] = v3
      this.chordProfiles[j][seventh] = v3

      j++
    }
  }

}

enum ChordType {
    MINOR = "minor",
    MAJOR = "major",
    SUS = "suspended",
    DOMINANT = "dominant",
    DIM5 = "diminished5th",
    AUG5 = "augmented5th",
    NONE = "none"
}

export default ChordDetector
