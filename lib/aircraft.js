'use strict'

const decodeCPR = require('./cpr')

module.exports = Aircraft

function Aircraft () {
  if (!(this instanceof Aircraft)) return new Aircraft(0)

  this.icao = 0
  this.count = 0
  this.seen = 0
  this.altitude = 0
  this.unit = 0
  this.verticalRate = 0
  this.speed = 0
  this.heading = 0
  this.lat = 0
  this.lng = 0
  this.callsign = ''

  this._oddCprLat = 0
  this._oddCprLng = 0
  this._oddCprTime = 0
  this._evenCprLat = 0
  this._evenCprLng = 0
  this._evenCprTime = 0
}

Aircraft.prototype.update = function (msg) {
  this.count++
  this.seen = Date.now()

  if (msg instanceof Array) {
    // This is a SBS message. See http://woodair.net/SBS/Article/Barebones42_Socket_Data.htm for structure
    this.icao = parseInt(msg[4], 16);
    if (msg[11]) {
      this.altitude = parseFloat(msg[11])
    }
    if (msg[16]) {
      this.verticalRate = parseFloat(msg[16])
    }
    if (msg[12]) {
      this.speed = parseFloat(msg[12])
    }
    if (msg[13]) {
      this.heading = parseFloat(msg[13])
    }
    if (msg[10]) {
      this.callsign = msg[10]
    }
    if (msg[14] && msg[15]) {
      this.lat = parseFloat(msg[14])
      this.lng = parseFloat(msg[15])
    }
  } else {
    this.icao = msg.icao

    if (msg.msgtype === 0 || msg.msgtype === 4 || msg.msgtype === 20) {
      this.altitude = msg.altitude
      this.unit = msg.unit
      this.verticalRate = Math.abs(msg.vertRate) * (msg.vertRateSign === 1 ? -1 : 1)
    } else if (msg.msgtype === 17) {
      if (msg.metype >= 1 && msg.metype <= 4) {
        this.callsign = msg.callsign
      } else if (msg.metype >= 9 && msg.metype <= 18) {
        this.altitude = msg.altitude
        this.unit = msg.unit
        this.verticalRate = Math.abs(msg.vertRate) * (msg.vertRateSign === 1 ? -1 : 1)
        if (msg.fflag) {
          this._oddCprLat = msg.rawLatitude
          this._oddCprLng = msg.rawLongitude
          this._oddCprTime = Date.now()
        } else {
          this._evenCprLat = msg.rawLatitude
          this._evenCprLng = msg.rawLongitude
          this._evenCprTime = Date.now()
        }

        // if the two messages are less than 10 seconds apart, compute the position
        if (Math.abs(this._evenCprTime - this._oddCprTime) <= 10000) {
          decodeCPR(this)
        }
      } else if (msg.metype === 19) {
        if (msg.mesub === 1 || msg.mesub === 2) {
          this.speed = msg.speed
          this.heading = msg.heading
        }
      }
    }
  }
}
