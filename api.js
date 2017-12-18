const Bottleneck = require("bottleneck");
const request = require("request");

class PubgTracker {
  constructor(api_key) {
    this.api_key = api_key

    // Limit the API to ~1/sec as per the request of https://pubgtracker.com/site-api
    //this.limiter = new Bottleneck(1, 1000);
    this.limiter = new Bottleneck(1, arguments[1] || 2000);
  }

  /**
   * Retrieve the account of a player via their StreamID
   * @param {string} id The 64bit SteamID as a string
   */
  getPlayerByStreamID64(id) {
	if(!id || typeof id !== 'string') throw new Error('id is invalid')

    const options = {
      url: `https://api.pubgtracker.com/v2/search/steam?steamId=${id}`,
      headers: {
        'TRN-Api-Key': this.api_key
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      this.limiter.submit((callback) => {
        request.get(options, callback)
      }, (err, response, body) => {
        if (err) reject(err)
        else if (body.error) reject(new PubgTrackerError(body))
        else resolve(body)
      })
    })

  }

  getStatsByNickname(nickname) {
	if(!nickname || typeof nickname !== 'string') throw new Error('nickname is invalid')
    const options = {
      url: `https://api.pubgtracker.com/v2/profile/pc/${nickname}`,
      headers: {
        'TRN-Api-Key': this.api_key
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      this.limiter.submit((callback) => {
        request.get(options, callback)
      }, (err, response, body) => {
        if (err) reject(err)
        else if (body.error) reject(new PubgTrackerError(body))
        else resolve(body)
      })
    })

  }

}

class PubgTrackerError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, PubgTrackerError)

    const [arg1] = args
    if (typeof arg1 === 'string') this.message = arg1;
    else if (typeof arg1 === 'object') {
      this.message = arg1.message;
      this.code = arg1.error;
    }


  }
}

module.exports = PubgTracker;
module.exports.PubgTrackerError = PubgTrackerError;
