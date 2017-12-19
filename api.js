const Bottleneck = require("bottleneck");
const request = require("request");

class PubgTracker {
  constructor(api_key) {
    this.api_key = api_key

    // Limit the API to ~1/sec as per the request of https://pubgtracker.com/site-api
    //this.limiter = new Bottleneck(1, 1000);

    const args = arguments[1] || {};
    this.args = args;
    const rate_limit_time = Math.max((args.rate_limit_time || 2000), 2000);
    this.limiter = new Bottleneck(1, rate_limit_time + 100);
  }

  /**
   * Retrieve the account of a player via their StreamID
   * @param {string} id The 64bit SteamID as a string
   */
  async getPlayerBySteamID64(id, retry) {
    if (!id || typeof id !== 'string') throw new Error('id is invalid')

    const options = {
      url: `https://api.pubgtracker.com/v2/search/steam?steamId=${id}`,
      headers: {
        'TRN-Api-Key': this.api_key
      },
      json: true
    };

    const result = await new Promise((resolve, reject) => {
      this.limiter.submit((callback) => {
        request.get(options, callback)
      }, (err, response, body) => {
        if (err) reject(err)
        else if (body.error) reject(new PubgTrackerError(body))
        else resolve(body)
      })
    })

    if (result.message == "API rate limit exceeded") {
      const maximum_retry = (this.args.maximum_retry || 5);
      if (retry >= maximum_retry) throw new PubgTrackerError(result);
      retry = (retry || 0) + 1;
      return await this.getPlayerBySteamID64(id, retry);
    } else return result;

  }

  async getStatsByNickname(nickname, retry) {
    if (!nickname || typeof nickname !== 'string') throw new Error('nickname is invalid')
    const options = {
      url: `https://api.pubgtracker.com/v2/profile/pc/${nickname}`,
      headers: {
        'TRN-Api-Key': this.api_key
      },
      json: true
    };

    const result = await new Promise((resolve, reject) => {
      this.limiter.submit((callback) => {
        request.get(options, callback)
      }, (err, response, body) => {
        if (err) reject(err)
        else if (body.error) reject(new PubgTrackerError(body))
        else resolve(body)
      })
    })

    if (result.message == "API rate limit exceeded") {
      const maximum_retry = (this.args.maximum_retry || 5);
      if (retry >= maximum_retry) throw new PubgTrackerError(result);
      retry = (retry || 0) + 1;
      return await this.getStatsByNickname(nickname, retry);
    } else return result;

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
